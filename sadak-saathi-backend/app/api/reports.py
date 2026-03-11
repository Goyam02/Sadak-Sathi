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

CLUSTER_RADIUS = 8  # meters

@router.post("/report")
def create_report(data: ReportRequest, db = Depends(get_db)):
    # 1️⃣ Find if hazard exists within CLUSTER_RADIUS
    find_query = text("""
        SELECT id, report_count, confidence
        FROM hazards
        WHERE ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography,
            :radius
        )
        LIMIT 1
    """)
    result = db.execute(find_query, {
        "lat": data.lat,
        "lon": data.lon,
        "radius": CLUSTER_RADIUS
    })
    hazard = result.fetchone()
    clustered = hazard is not None

    if clustered:
        hazard_id = hazard[0]
        current_reports = hazard[1] if hazard[1] is not None else 0
        current_conf = hazard[2] if hazard[2] is not None else 0.0

        # Compute updated status
        next_count = current_reports + 1
        if next_count >= 15:
            status = "critical"
        elif next_count >= 5:
            status = "confirmed"
        else:
            status = "candidate"

        update_query = text("""
            UPDATE hazards
            SET report_count = report_count + 1,
                confidence = confidence + :confidence * 0.1,
                status = :status,
                updated_at = NOW()
            WHERE id = :hazard_id
        """)
        db.execute(update_query, {
            "hazard_id": hazard_id,
            "confidence": data.confidence,
            "status": status
        })
    else:
        # If no cluster found, create new hazard
        insert_query = text("""
            INSERT INTO hazards (type, location, confidence, report_count, status)
            VALUES (
                :type,
                ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography,
                :confidence,
                1,
                'candidate'
            )
            RETURNING id
        """)
        result = db.execute(insert_query, {
            "type": data.type,
            "lat": data.lat,
            "lon": data.lon,
            "confidence": data.confidence
        })
        hazard_id = result.fetchone()[0]

    # 4️⃣ Insert report
    report_query = text("""
        INSERT INTO hazard_reports (
            hazard_id,
            source,
            confidence,
            location
        )
        VALUES (
            :hazard_id,
            :source,
            :confidence,
            ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography
        )
    """)
    db.execute(report_query, {
        "hazard_id": hazard_id,
        "source": data.source,
        "confidence": data.confidence,
        "lat": data.lat,
        "lon": data.lon
    })
    db.commit()

    return {
        "hazard_id": hazard_id,
        "clustered": clustered
    }

