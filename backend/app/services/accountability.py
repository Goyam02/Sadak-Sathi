"""
Accountability Engine
- Links confirmed potholes to road segments and contractors
- Calculates economic damage in INR
- Updates contractor performance scores
- Handles repair claim verification outcomes
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, update
from typing import Optional

from app.models.pothole import Pothole, PotholeStatus
from app.models.contractor import Contractor, RoadSegment, RepairClaim, ClaimStatus
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)


# ─── Damage estimation constants ─────────────────────────────────────────────
# Based on Indian road damage studies (CRRI, MoRTH data)
BASE_DAMAGE_PER_VEHICLE_INR = {
    "S1": 850,      # Minor: tyre wear, suspension strain
    "S2": 4200,     # Moderate: alignment, tyre damage
    "S3": 12500,    # Severe: suspension, rim, potential accident
}
DAILY_VEHICLE_PASS_ESTIMATE = 2000   # conservative urban arterial
WARRANTY_PERIOD_DAYS = 365 * 5       # 5-year standard road warranty in India


async def link_pothole_to_contractor(pothole_id: str):
    """
    Main entry point called after a pothole is confirmed.
    1. Find the road segment containing this pothole
    2. Find the contractor responsible (active warranty)
    3. Calculate economic damage
    4. Update contractor score
    """
    async with AsyncSessionLocal() as db:
        pothole = await db.get(Pothole, pothole_id)
        if not pothole:
            return

        segment = await _find_road_segment(pothole, db)
        if not segment:
            logger.info(f"No road segment found for pothole {pothole_id}. Not linked.")
            return

        contractor = await db.get(Contractor, segment.contractor_id)
        if not contractor:
            return

        # Check if still within warranty period
        in_warranty = _is_in_warranty(segment)

        # Calculate damage
        damage_inr = _estimate_damage(pothole.severity, pothole.report_count)

        # Update pothole record
        pothole.contractor_id = contractor.id
        pothole.road_segment_id = segment.id
        pothole.estimated_damage_inr = damage_inr
        db.add(pothole)

        # Update contractor stats
        contractor.total_potholes_on_record += 1
        contractor.total_estimated_damage_inr += damage_inr

        if in_warranty:
            contractor.warranty_violations += 1
            contractor.performance_score = _recalculate_score(contractor)
            logger.info(
                f"WARRANTY VIOLATION: Contractor {contractor.name} | "
                f"Pothole {pothole_id} | Damage ₹{damage_inr:,.0f}"
            )

        db.add(contractor)
        await db.commit()
        logger.info(
            f"Pothole {pothole_id} linked to contractor {contractor.name} "
            f"(segment {segment.id}), damage ₹{damage_inr:,.0f}"
        )


async def process_repair_claim(claim_id: str, satellite_verified: bool, confidence: float):
    """
    Called by the satellite verification worker after imagery analysis.
    Updates claim status, unblocks or blocks payment, adjusts contractor score.
    """
    async with AsyncSessionLocal() as db:
        claim = await db.get(RepairClaim, claim_id)
        if not claim:
            return

        pothole = await db.get(Pothole, claim.pothole_id)
        contractor = await db.get(Contractor, claim.contractor_id)

        if satellite_verified and confidence >= 0.70:
            # Repair confirmed
            claim.status = ClaimStatus.VERIFIED
            claim.verified_at = datetime.utcnow()
            claim.verification_confidence = confidence

            if pothole:
                pothole.status = PotholeStatus.REPAIRED
                pothole.repaired_at = datetime.utcnow()
                db.add(pothole)

            if contractor:
                contractor.verified_repairs += 1
                contractor.performance_score = _recalculate_score(contractor)
                db.add(contractor)

            logger.info(f"Repair claim {claim_id} VERIFIED (conf={confidence:.2f})")

        else:
            # Fraud detected — repair not confirmed by satellite
            claim.status = ClaimStatus.FRAUD_DETECTED
            claim.verified_at = datetime.utcnow()
            claim.verification_confidence = confidence

            if pothole:
                pothole.status = PotholeStatus.FRAUD
                db.add(pothole)

            if contractor:
                contractor.fraud_claims += 1
                contractor.performance_score = _recalculate_score(contractor)
                # Block payment: handled by finance system via webhook
                db.add(contractor)
                logger.warning(
                    f"FRAUD DETECTED: Contractor {contractor.name} | "
                    f"Claim {claim_id} | conf={confidence:.2f}"
                )

        db.add(claim)
        await db.commit()


def _estimate_damage(severity: str, report_count: int) -> float:
    """
    Estimate total economic damage in INR.
    Formula: base_damage × daily_vehicles × days_since_appeared
    We use report_count as a proxy for days exposed (conservative).
    """
    base = BASE_DAMAGE_PER_VEHICLE_INR.get(severity, BASE_DAMAGE_PER_VEHICLE_INR["S1"])
    # Each report roughly represents a day of exposure (conservative)
    exposure_days = max(report_count, 1)
    return base * DAILY_VEHICLE_PASS_ESTIMATE * exposure_days / 1000  # in thousands INR


def _recalculate_score(contractor: "Contractor") -> float:
    """
    Performance score 0–100.
    Starts at 100, penalised for warranty violations and fraud,
    rewarded for verified repairs.
    """
    score = 100.0
    score -= contractor.warranty_violations * 3.0
    score -= contractor.fraud_claims * 8.0
    score += contractor.verified_repairs * 1.5
    return max(0.0, min(100.0, score))


def _is_in_warranty(segment: "RoadSegment") -> bool:
    if not segment.construction_date:
        return False
    warranty_end = segment.construction_date + timedelta(days=WARRANTY_PERIOD_DAYS)
    return datetime.utcnow() < warranty_end


async def _find_road_segment(pothole: Pothole, db: AsyncSession) -> Optional["RoadSegment"]:
    """Find the road segment that spatially contains this pothole."""
    result = await db.execute(
        text("""
            SELECT id, contractor_id, construction_date
            FROM road_segments
            WHERE ST_Contains(
                boundary::geometry,
                :location::geometry
            )
            LIMIT 1
        """),
        {"location": pothole.location},
    )
    row = result.mappings().fetchone()
    if not row:
        return None

    from app.models.contractor import RoadSegment as RS
    return await db.get(RS, row["id"])


async def get_contractor_dashboard(contractor_id: str, db: AsyncSession) -> dict:
    """Return full accountability stats for a contractor (admin view)."""
    contractor = await db.get(Contractor, contractor_id)
    if not contractor:
        return {}

    result = await db.execute(
        text("""
            SELECT
                COUNT(*) FILTER (WHERE status = 'candidate') as candidates,
                COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
                COUNT(*) FILTER (WHERE status = 'repaired') as repaired,
                COUNT(*) FILTER (WHERE status = 'fraud') as fraud,
                SUM(estimated_damage_inr) as total_damage
            FROM potholes
            WHERE contractor_id = :cid
        """),
        {"cid": contractor_id},
    )
    stats = result.mappings().fetchone()

    return {
        "contractor_id": contractor_id,
        "name": contractor.name,
        "performance_score": round(contractor.performance_score, 2),
        "warranty_violations": contractor.warranty_violations,
        "fraud_claims": contractor.fraud_claims,
        "verified_repairs": contractor.verified_repairs,
        "total_estimated_damage_inr": contractor.total_estimated_damage_inr,
        "potholes": dict(stats) if stats else {},
    }