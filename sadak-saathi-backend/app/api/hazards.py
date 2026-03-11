from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db

router = APIRouter()

@router.get("/hazards")
def get_hazards(lat: float, lon: float, radius: int = 500, db = Depends(get_db)):
    query = text("""
    SELECT id, type, severity,
           ST_Y(location::geometry) AS lat,
           ST_X(location::geometry) AS lon
    FROM hazards
    WHERE ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography,
        :radius
    )
    """
    )
    result = db.execute(query, {
        "lat": lat,
        "lon": lon,
        "radius": radius
    })
    hazards = result.fetchall()
    # Serialize rows to dicts for FastAPI JSON response
    serialized = [
        {"id": row.id, "type": row.type, "severity": row.severity, "lat": row.lat, "lon": row.lon}
        for row in hazards
    ]
    return serialized
