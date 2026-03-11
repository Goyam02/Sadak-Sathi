from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from pydantic import BaseModel

router = APIRouter()

class ReportRequest(BaseModel):
    lat: float
    lon: float
    type: str
    confidence: float
    source: str

@router.post("/report")
async def create_report(data: ReportRequest, db: AsyncSession = Depends(get_db)):
    query = text("""
    INSERT INTO hazards (type, location)
    VALUES (
        :type,
        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography
    )
    RETURNING id
    """)
    result = await db.execute(query, {
        "type": data.type,
        "lat": data.lat,
        "lon": data.lon
    })
    hazard_id = result.fetchone()[0]
    await db.commit()
    return {"hazard_id": hazard_id}
