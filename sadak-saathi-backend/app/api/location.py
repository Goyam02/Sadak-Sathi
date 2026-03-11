from fastapi import APIRouter, Depends
from sqlalchemy import text
from app.db.database import get_db
from pydantic import BaseModel

router = APIRouter()

ALERT_RADIUS = 30
MIN_DISTANCE = 5
RELEVANT_TYPES = ["pothole", "speed_bump", "road_damage"]

from typing import Optional

class LocationUpdate(BaseModel):
    lat: float
    lon: float
    speed: Optional[float] = None

@router.post("/location")
def update_location(data: LocationUpdate, db = Depends(get_db)):
    query = text("""
        SELECT id,
               type,
               severity,
               ST_Distance(
                   location,
                   ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography
               ) AS distance
        FROM hazards
        WHERE ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography,
            :radius
        )
        AND severity >= 3
        AND type = ANY(:types)
        ORDER BY distance
        LIMIT 5
    """)
    result = db.execute(query, {
        "lat": data.lat,
        "lon": data.lon,
        "radius": ALERT_RADIUS,
        "types": RELEVANT_TYPES
    })
    hazards = result.fetchall()
    alerts = []
    for h in hazards:
        if h.distance < MIN_DISTANCE:
            continue
        alerts.append({
            "hazard_id": h.id,
            "type": h.type,
            "severity": h.severity,
            "distance": round(h.distance)
        })
    return {"alerts": alerts}
