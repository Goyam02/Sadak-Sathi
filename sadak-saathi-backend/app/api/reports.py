from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from pydantic import BaseModel
from app.services.scoring import calculate_confidence, calculate_severity

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

        # Sensor fusion: update confidence and severity
        new_conf = calculate_confidence(current_conf, data.confidence, data.source)
        severity, status = calculate_severity(new_conf)

        update_query = text("""
            UPDATE hazards
            SET report_count = report_count + 1,
                confidence = :new_conf,
                severity = :severity,
                status = :status,
                updated_at = NOW()
            WHERE id = :hazard_id
        """)
        db.execute(update_query, {
            "hazard_id": hazard_id,
            "new_conf": new_conf,
            "severity": severity,
            "status": status
        })
    else:
        # If no cluster found, initialize confidence and severity
        severity, status = calculate_severity(data.confidence)
        insert_query = text("""
            INSERT INTO hazards (type, location, confidence, report_count, severity, status)
            VALUES (
                :type,
                ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography,
                :confidence,
                1,
                :severity,
                :status
            )
            RETURNING id
        """)
        result = db.execute(insert_query, {
            "type": data.type,
            "lat": data.lat,
            "lon": data.lon,
            "confidence": data.confidence,
            "severity": severity,
            "status": status
        })
        hazard_id = result.fetchone()[0]

    # 4️⃣ Insert report with severity_estimate
    if data.source == "camera":
        severity_estimate = int(data.confidence * 10)
    elif data.source == "accelerometer":
        severity_estimate = int(data.confidence * 7)
    elif data.source == "human":
        severity_estimate = int(data.confidence * 10)
    else:
        severity_estimate = int(data.confidence * 7)

    report_query = text("""
        INSERT INTO hazard_reports (
            hazard_id,
            source,
            confidence,
            location,
            severity_estimate
        )
        VALUES (
            :hazard_id,
            :source,
            :confidence,
            ST_SetSRID(ST_MakePoint(:lon, :lat),4326)::geography,
            :severity_estimate
        )
    """)
    db.execute(report_query, {
        "hazard_id": hazard_id,
        "source": data.source,
        "confidence": data.confidence,
        "lat": data.lat,
        "lon": data.lon,
        "severity_estimate": severity_estimate
    })
    db.commit()

    # Compose full response with updated info
    resp_confidence = new_conf if clustered else data.confidence
    return {
        "hazard_id": hazard_id,
        "clustered": clustered,
        "confidence": resp_confidence,
        "severity": severity,
        "status": status
    }

