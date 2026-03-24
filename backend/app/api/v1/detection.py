"""
Detection Router
POST /api/v1/detect/report   — submit a pothole detection (sensor + optional image)
POST /api/v1/detect/batch    — batch submit multiple sensor readings
GET  /api/v1/detect/status/{pothole_id} — check pothole confirmation status
"""

import uuid
import json
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies import get_db, get_current_rider
from app.schemas.schemas import DetectionResponse
from app.models.rider import Rider
from app.models.pothole import Pothole, PotholeReport, PotholeStatus, Severity, PotholeType
from app.services.clustering import find_nearby_pothole, create_candidate, update_confirmation, deduplicate_nearby_candidates
from app.services.alert_service import trigger_nearby_alerts, update_rider_location
from app.services.ml_inference import run_yolo_inference, run_lstm_inference
from app.config import get_settings

router = APIRouter(prefix="/detect", tags=["detection"])
settings = get_settings()


@router.post("/report", response_model=DetectionResponse, status_code=202)
async def submit_detection(
    background_tasks: BackgroundTasks,
    # Core fields as form data (supports multipart with image)
    rider_id: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    detection_method: str = Form(...),   # camera | sensor | both
    confidence: float = Form(...),
    severity: str = Form(...),           # S1 | S2 | S3
    pothole_type: str = Form("dry"),
    speed_kmh: Optional[float] = Form(None),
    # Raw sensor data (JSON string)
    sensor_json: Optional[str] = Form(None),
    # Optional camera image
    image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Main detection ingestion endpoint.
    Called by rider app passively as they ride.
    Handles ML inference, clustering, confirmation, and alert dispatch.
    """

    # ── 1. Run YOLO inference if image provided ───────────────────────────────
    yolo_result = None
    image_s3_key = None
    yolo_bbox_json = None

    if image and image.content_type and image.content_type.startswith("image/"):
        image_bytes = await image.read()
        yolo_result = await run_yolo_inference(image_bytes)

        # If YOLO disagrees strongly with reported confidence, reconcile
        if yolo_result.detected:
            # Camera confirmed — take max confidence
            confidence = max(confidence, yolo_result.confidence)
            severity = _max_severity(severity, yolo_result.severity)
            if yolo_result.water_filled:
                pothole_type = "water_filled"
            if yolo_result.bbox:
                yolo_bbox_json = json.dumps(yolo_result.bbox)
        elif detection_method == "camera" and not yolo_result.detected:
            # Camera-only report rejected by YOLO — discard
            return DetectionResponse(
                pothole_id="",
                status="rejected",
                report_count=0,
                severity=severity,
                message="Image analysis did not confirm pothole. Report discarded.",
            )

        # Upload image to S3 in background
        if image_bytes:
            image_s3_key = f"reports/{rider_id}/{uuid.uuid4()}.jpg"
            background_tasks.add_task(_upload_to_s3, image_bytes, image_s3_key)

    # ── 2. Run LSTM inference if sensor data provided ─────────────────────────
    if sensor_json and detection_method in ("sensor", "both"):
        try:
            sensor_window = json.loads(sensor_json)
            lstm_result = await run_lstm_inference(sensor_window)
            if lstm_result.detected:
                severity = _max_severity(severity, lstm_result.severity)
                confidence = max(confidence, lstm_result.confidence)
            elif detection_method == "sensor" and not lstm_result.detected:
                return DetectionResponse(
                    pothole_id="",
                    status="rejected",
                    report_count=0,
                    severity=severity,
                    message="Sensor analysis did not confirm pothole impact.",
                )
        except (json.JSONDecodeError, Exception):
            pass  # sensor parsing failure — proceed with reported confidence

    # ── 3. Get rider weight for weighted clustering ───────────────────────────
    rider_result = await db.execute(
        text("SELECT accuracy_score FROM riders WHERE id = :id"),
        {"id": rider_id}
    )
    rider_row = rider_result.fetchone()
    rider_weight = float(rider_row[0]) if rider_row else 1.0

    # ── 4. Find existing nearby pothole or create candidate ───────────────────
    pothole = await find_nearby_pothole(latitude, longitude, db)

    if not pothole:
        city = await _reverse_geocode_city(latitude, longitude)
        pothole = await create_candidate(
            lat=latitude, lon=longitude,
            severity=severity, pothole_type=pothole_type,
            city=city, db=db,
        )

    # ── 5. Record the individual report ──────────────────────────────────────
    report = PotholeReport(
        id=str(uuid.uuid4()),
        pothole_id=pothole.id,
        rider_id=rider_id,
        latitude=latitude,
        longitude=longitude,
        severity=severity,
        detection_method=detection_method,
        confidence=confidence,
        pothole_type=pothole_type,
        image_s3_key=image_s3_key,
        yolo_bbox=yolo_bbox_json,
        rider_weight=rider_weight,
        speed_kmh=speed_kmh,
    )
    db.add(report)
    await db.flush()

    # ── 6. Update confirmation state ──────────────────────────────────────────
    pothole, just_confirmed = await update_confirmation(pothole, report, db)
    await db.commit()

    # ── 7. Post-confirmation side effects ─────────────────────────────────────
    if just_confirmed:
        # Merge duplicate nearby candidates
        background_tasks.add_task(_run_dedup, pothole.id, latitude, longitude)
        # Push real-time alerts to nearby riders
        background_tasks.add_task(trigger_nearby_alerts, pothole.id, latitude, longitude)
        # Link to contractor + calculate damage
        background_tasks.add_task(_run_accountability, pothole.id)
        # Update best image
        if image_s3_key:
            background_tasks.add_task(_set_best_image, pothole.id, image_s3_key)

    # ── 8. Update rider location ──────────────────────────────────────────────
    background_tasks.add_task(update_rider_location, rider_id, latitude, longitude, db)

    # ── 9. Update rider report count ─────────────────────────────────────────
    background_tasks.add_task(_increment_rider_reports, rider_id)

    status_msg = {
        PotholeStatus.CANDIDATE: f"Candidate logged. {settings.CONFIRMED_THRESHOLD - pothole.report_count} more reports to confirm.",
        PotholeStatus.CONFIRMED: "Pothole confirmed! Alerts dispatched to nearby riders.",
        PotholeStatus.REPAIR_CLAIMED: "Pothole under repair claim.",
        PotholeStatus.REPAIRED: "This pothole is marked repaired.",
        PotholeStatus.FRAUD: "Repair claim under investigation.",
    }

    return DetectionResponse(
        pothole_id=pothole.id,
        status=pothole.status,
        report_count=pothole.report_count,
        severity=pothole.severity,
        message=status_msg.get(pothole.status, "Report recorded."),
    )


@router.get("/status/{pothole_id}")
async def get_detection_status(pothole_id: str, db: AsyncSession = Depends(get_db)):
    pothole = await db.get(Pothole, pothole_id)
    if not pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    return {
        "id": pothole.id,
        "status": pothole.status,
        "severity": pothole.severity,
        "report_count": pothole.report_count,
        "camera_confirmed": pothole.camera_confirmed,
        "sensor_confirmed": pothole.sensor_confirmed,
        "contractor_id": pothole.contractor_id,
        "estimated_damage_inr": pothole.estimated_damage_inr,
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _max_severity(a: str, b: str) -> str:
    rank = {"S1": 1, "S2": 2, "S3": 3}
    return a if rank.get(a, 0) >= rank.get(b, 0) else b


async def _reverse_geocode_city(lat: float, lon: float) -> Optional[str]:
    """Best-effort city extraction. Returns None if unavailable."""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=3) as client:
            r = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lon, "format": "json"},
                headers={"User-Agent": "SadakSathi/1.0"},
            )
            data = r.json()
            return data.get("address", {}).get("city") or data.get("address", {}).get("town")
    except Exception:
        return None


async def _upload_to_s3(image_bytes: bytes, s3_key: str):
    try:
        import boto3
        from app.config import get_settings
        s = get_settings()
        client = boto3.client("s3", region_name=s.AWS_REGION)
        client.put_object(Bucket=s.S3_BUCKET, Key=s3_key, Body=image_bytes, ContentType="image/jpeg")
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"S3 upload failed for {s3_key}: {e}")


async def _run_dedup(pothole_id: str, lat: float, lon: float):
    from app.db.session import AsyncSessionLocal
    from app.services.clustering import deduplicate_nearby_candidates
    async with AsyncSessionLocal() as db:
        pothole = await db.get(Pothole, pothole_id)
        if pothole:
            await deduplicate_nearby_candidates(pothole, db)
            await db.commit()


async def _run_accountability(pothole_id: str):
    from app.services.accountability import link_pothole_to_contractor
    await link_pothole_to_contractor(pothole_id)


async def _set_best_image(pothole_id: str, s3_key: str):
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await db.execute(
            text("UPDATE potholes SET best_image_s3_key=:key WHERE id=:id AND best_image_s3_key IS NULL"),
            {"key": s3_key, "id": pothole_id}
        )
        await db.commit()


async def _increment_rider_reports(rider_id: str):
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await db.execute(
            text("UPDATE riders SET total_reports = total_reports + 1 WHERE id = :id"),
            {"id": rider_id}
        )
        await db.commit()