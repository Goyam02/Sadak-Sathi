"""
Alerts Router — WebSocket + REST
WS   /api/v1/alerts/ws/{rider_id}    — real-time alert stream for rider app
GET  /api/v1/alerts/active           — REST fallback: confirmed potholes nearby
POST /api/v1/alerts/location         — update rider location (non-WS alternative)
GET  /api/v1/alerts/stats            — connected rider count (admin)
"""

import json
import asyncio
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.dependencies import get_db, get_current_admin
from app.core.websocket_manager import manager
from app.services.alert_service import send_proximity_check, update_rider_location
from app.core.geospatial import find_potholes_within_radius
from app.config import get_settings

router = APIRouter(prefix="/alerts", tags=["alerts"])
settings = get_settings()
logger = logging.getLogger(__name__)


@router.websocket("/ws/{rider_id}")
async def rider_alert_stream(websocket: WebSocket, rider_id: str):
    """
    Persistent WebSocket connection for a rider.

    Message types FROM server → client:
      pothole_alert  — confirmed pothole nearby
      hazard_update  — map state change (new confirm, repair, fraud)
      ping           — keepalive

    Message types FROM client → server:
      location_update  — { lat, lon, speed_kmh }
      ack              — { pothole_id }
    """
    await manager.connect(rider_id, websocket)

    # Send initial nearby potholes on connect
    loc = manager.get_location(rider_id)
    if loc:
        lat, lon, _ = loc
        await _send_initial_hazards(rider_id, lat, lon)

    # Keepalive task
    keepalive_task = asyncio.create_task(_keepalive(rider_id))

    try:
        while True:
            try:
                raw = await asyncio.wait_for(websocket.receive_text(), timeout=60.0)
                msg = json.loads(raw)
            except asyncio.TimeoutError:
                # Client silent for 60s — send ping
                alive = await manager.send_to_rider(rider_id, {"event": "ping"})
                if not alive:
                    break
                continue
            except (json.JSONDecodeError, Exception):
                continue

            event = msg.get("event")

            if event == "location_update":
                lat = msg.get("lat") or msg.get("latitude")
                lon = msg.get("lon") or msg.get("longitude")
                speed = msg.get("speed_kmh", 0.0)

                if lat is not None and lon is not None:
                    manager.update_location(rider_id, lat, lon, speed)
                    # Check for nearby hazards
                    asyncio.create_task(
                        send_proximity_check(rider_id, lat, lon)
                    )

            elif event == "ack":
                # Rider acknowledged an alert — log for analytics
                pothole_id = msg.get("pothole_id")
                if pothole_id:
                    logger.debug(f"Rider {rider_id} acknowledged alert for {pothole_id}")

            elif event == "pong":
                pass  # keepalive response

    except WebSocketDisconnect:
        logger.info(f"Rider {rider_id} disconnected normally")
    except Exception as e:
        logger.warning(f"WebSocket error for rider {rider_id}: {e}")
    finally:
        keepalive_task.cancel()
        await manager.disconnect(rider_id)


@router.get("/active")
async def get_active_alerts(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_meters: float = Query(400, le=2000),
    db: AsyncSession = Depends(get_db),
):
    """
    REST fallback for riders without persistent WS connection.
    Returns confirmed potholes within radius sorted by distance.
    """
    nearby = await find_potholes_within_radius(
        db, lat, lon, radius_meters,
        status_filter=["confirmed"],
    )
    return [
        {
            "pothole_id": r[0],
            "latitude": r[1],
            "longitude": r[2],
            "severity": r[3],
            "pothole_type": r[5],
            "distance_meters": round(r[8]),
            "report_count": r[6],
        }
        for r in nearby
    ]


@router.post("/location")
async def update_location_rest(
    rider_id: str,
    lat: float,
    lon: float,
    speed_kmh: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    """Non-WebSocket location update endpoint."""
    manager.update_location(rider_id, lat, lon, speed_kmh or 0.0)
    await update_rider_location(rider_id, lat, lon, db)
    return {"status": "ok", "active_riders": manager.active_rider_count}


@router.get("/stats")
async def get_alert_stats(db: AsyncSession = Depends(get_db)):
    """Active connection stats — public for transparency."""
    result = await db.execute(
        text("SELECT COUNT(*) FROM potholes WHERE status='confirmed'")
    )
    confirmed_count = result.scalar() or 0
    return {
        "connected_riders": manager.active_rider_count,
        "confirmed_potholes": confirmed_count,
        "alert_radius_meters": settings.ALERT_RADIUS_METERS,
    }


# ── Internal helpers ──────────────────────────────────────────────────────────

async def _send_initial_hazards(rider_id: str, lat: float, lon: float):
    """On connection, send all confirmed potholes within alert radius."""
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        nearby = await find_potholes_within_radius(
            db, lat, lon,
            radius_meters=settings.ALERT_RADIUS_METERS,
            status_filter=["confirmed"],
        )
    for row in nearby:
        alert = {
            "event": "pothole_alert",
            "pothole_id": row[0],
            "latitude": row[1],
            "longitude": row[2],
            "severity": row[3],
            "pothole_type": row[5],
            "distance_meters": round(row[8]),
            "message": "Pothole in your area",
            "priority": "HIGH" if row[3] == "S3" else "NORMAL",
        }
        await manager.send_to_rider(rider_id, alert)


async def _keepalive(rider_id: str):
    """Send ping every 30 seconds to keep connection alive."""
    while True:
        await asyncio.sleep(30)
        if not manager.is_connected(rider_id):
            break
        alive = await manager.send_to_rider(rider_id, {"event": "ping"})
        if not alive:
            break