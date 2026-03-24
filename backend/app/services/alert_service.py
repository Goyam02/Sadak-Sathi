"""
Alert Service
- Finds all connected riders within ALERT_RADIUS_METERS of a new confirmed pothole
- Pushes real-time voice-alert payloads over WebSocket
- Handles priority scoring (water-filled potholes get priority=HIGH)
"""
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.websocket_manager import manager
from app.config import get_settings
from app.db.session import AsyncSessionLocal

logger = logging.getLogger(__name__)
settings = get_settings()


PRIORITY_HIGH = "HIGH"
PRIORITY_NORMAL = "NORMAL"


def _compute_priority(severity: str, water_filled: bool) -> str:
    if water_filled or severity == "S3":
        return PRIORITY_HIGH
    return PRIORITY_NORMAL


async def trigger_nearby_alerts(pothole_id: str, lat: float, lon: float):
    """
    Background task: called after a pothole is confirmed.
    Queries active riders within ALERT_RADIUS_METERS and pushes alert.
    """
    async with AsyncSessionLocal() as db:
        pothole = await _get_pothole_summary(pothole_id, db)
        if not pothole:
            return

        rider_ids = await _find_riders_in_radius(lat, lon, db)
        if not rider_ids:
            logger.debug(f"No active riders near pothole {pothole_id}")
            return

        priority = _compute_priority(pothole["severity"], pothole["water_filled"])

        alert_payload = {
            "type": "pothole_alert",
            "pothole_id": pothole_id,
            "latitude": lat,
            "longitude": lon,
            "severity": pothole["severity"],
            "water_filled": pothole["water_filled"],
            "priority": priority,
            "distance_meters": None,  # filled per-rider below
            "message": _build_voice_message(pothole["severity"], pothole["water_filled"]),
            "report_count": pothole["report_count"],
        }

        sent = 0
        for row in rider_ids:
            rider_id = row["rider_id"]
            distance = row["distance_meters"]

            payload = {**alert_payload, "distance_meters": round(distance)}
            await manager.send_alert(rider_id, payload)
            sent += 1

        logger.info(f"Sent pothole alert for {pothole_id} to {sent} nearby riders")


async def push_hazard_update(pothole_id: str, update_type: str, extra: Optional[dict] = None):
    """
    Broadcast a map-update event to all connected clients.
    Used when a pothole changes status (candidate→confirmed, confirmed→repaired, etc.)
    """
    payload = {
        "type": "hazard_update",
        "pothole_id": pothole_id,
        "update_type": update_type,  # "new_candidate", "confirmed", "repaired", "fraud_detected"
        **(extra or {}),
    }
    await manager.broadcast_all(payload)


def _build_voice_message(severity: str, water_filled: bool) -> str:
    base = "Pothole ahead"
    if water_filled:
        return f"Warning! Water-filled pothole ahead. Slow down immediately."
    if severity == "S3":
        return f"Danger! Severe pothole ahead in 400 metres. Reduce speed."
    if severity == "S2":
        return f"Caution! Moderate pothole ahead in 400 metres."
    return f"{base} in 400 metres. Ride carefully."


async def _get_pothole_summary(pothole_id: str, db: AsyncSession) -> Optional[dict]:
    result = await db.execute(
        text("""
            SELECT severity, water_filled, report_count,
                   ST_Y(location::geometry) as lat,
                   ST_X(location::geometry) as lon
            FROM potholes WHERE id = :id
        """),
        {"id": pothole_id}
    )
    row = result.mappings().fetchone()
    return dict(row) if row else None


async def _find_riders_in_radius(lat: float, lon: float, db: AsyncSession) -> list:
    """
    Find riders with an active WebSocket connection within ALERT_RADIUS_METERS.
    Uses the riders.last_lat / last_lon columns updated on each detection report.
    """
    connected_rider_ids = list(manager.active.keys())
    if not connected_rider_ids:
        return []

    # Build parameterised IN clause
    placeholders = ", ".join(f":r{i}" for i in range(len(connected_rider_ids)))
    params = {"lat": lat, "lon": lon, "radius": settings.ALERT_RADIUS_METERS}
    params.update({f"r{i}": rid for i, rid in enumerate(connected_rider_ids)})

    result = await db.execute(
        text(f"""
            SELECT id as rider_id,
                   ST_Distance(
                       ST_MakePoint(last_lon, last_lat)::geography,
                       ST_MakePoint(:lon, :lat)::geography
                   ) AS distance_meters
            FROM riders
            WHERE id IN ({placeholders})
              AND last_lat IS NOT NULL
              AND ST_DWithin(
                    ST_MakePoint(last_lon, last_lat)::geography,
                    ST_MakePoint(:lon, :lat)::geography,
                    :radius
                  )
            ORDER BY distance_meters
        """),
        params,
    )
    return result.mappings().fetchall()


async def update_rider_location(rider_id: str, lat: float, lon: float, db: AsyncSession):
    """Update rider's last known position (called on every detection report)."""
    await db.execute(
        text("UPDATE riders SET last_lat = :lat, last_lon = :lon WHERE id = :id"),
        {"lat": lat, "lon": lon, "id": rider_id},
    )
    await db.commit()