from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from app.models.pothole import Pothole, PotholeReport, PotholeStatus
from app.config import get_settings

settings = get_settings()

async def find_nearby_pothole(lat: float, lon: float, db: AsyncSession) -> Pothole | None:
    """Find an existing pothole within CLUSTER_RADIUS_METERS using PostGIS."""
    radius = settings.CLUSTER_RADIUS_METERS
    result = await db.execute(
        text("""
            SELECT id FROM potholes
            WHERE ST_DWithin(
                location::geography,
                ST_MakePoint(:lon, :lat)::geography,
                :radius
            )
            AND status != 'repaired'
            ORDER BY location <-> ST_MakePoint(:lon, :lat)::geography
            LIMIT 1
        """),
        {"lat": lat, "lon": lon, "radius": radius}
    )
    row = result.fetchone()
    if row:
        return await db.get(Pothole, row[0])
    return None

async def update_confirmation(pothole: Pothole, report: PotholeReport, db: AsyncSession):
    """Update confirmation state and severity based on accumulated reports."""
    pothole.report_count += 1

    if report.detection_method == "camera":
        pothole.camera_confirmed += 1
    elif report.detection_method == "sensor":
        pothole.sensor_confirmed += 1
    else:
        pothole.camera_confirmed += 1
        pothole.sensor_confirmed += 1

    # Severity escalation: take the max reported
    severity_rank = {"S1": 1, "S2": 2, "S3": 3}
    if severity_rank.get(report.severity, 0) > severity_rank.get(pothole.severity, 0):
        pothole.severity = report.severity

    # Status promotion
    if pothole.report_count >= settings.CONFIRMED_THRESHOLD:
        pothole.status = PotholeStatus.CONFIRMED
    elif pothole.report_count >= settings.CANDIDATE_THRESHOLD:
        pothole.status = PotholeStatus.CANDIDATE   # already set, no-op mostly

    db.add(pothole)
    await db.commit()
    await db.refresh(pothole)
    return pothole