"""
Hazards Router
GET  /api/v1/hazards/          — paginated hazard map feed (with bbox filter)
GET  /api/v1/hazards/{id}      — single pothole detail
GET  /api/v1/hazards/nearby    — potholes near a GPS point
GET  /api/v1/hazards/stats     — city-level summary stats
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, func

from app.dependencies import get_db
from app.schemas.schemas import HazardMapItem, PotholeDetail, CityStats
from app.models.pothole import Pothole
from app.core.geospatial import find_potholes_within_radius

router = APIRouter(prefix="/hazards", tags=["hazards"])


@router.get("/", response_model=List[HazardMapItem])
async def list_hazards(
    # Bounding box filter for map viewport
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lon: Optional[float] = Query(None),
    max_lon: Optional[float] = Query(None),
    # Status filter
    status: Optional[str] = Query(None, description="candidate|confirmed|repaired|fraud"),
    severity: Optional[str] = Query(None, description="S1|S2|S3"),
    city: Optional[str] = Query(None),
    # Pagination
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns potholes for the live hazard map.
    Supports viewport bounding box for efficient map tile loading.
    """
    filters = ["1=1"]
    params: dict = {"limit": limit, "offset": offset}

    if min_lat is not None:
        filters.append("avg_lat >= :min_lat"); params["min_lat"] = min_lat
    if max_lat is not None:
        filters.append("avg_lat <= :max_lat"); params["max_lat"] = max_lat
    if min_lon is not None:
        filters.append("avg_lon >= :min_lon"); params["min_lon"] = min_lon
    if max_lon is not None:
        filters.append("avg_lon <= :max_lon"); params["max_lon"] = max_lon
    if status:
        filters.append("p.status = :status"); params["status"] = status
    else:
        # Default: show candidate + confirmed (not repaired clutter)
        filters.append("p.status IN ('candidate','confirmed','repair_claimed','fraud')")
    if severity:
        filters.append("p.severity = :severity"); params["severity"] = severity
    if city:
        filters.append("p.city ILIKE :city"); params["city"] = f"%{city}%"

    where_clause = " AND ".join(filters)
    result = await db.execute(
        text(f"""
            SELECT
                p.id, p.avg_lat as latitude, p.avg_lon as longitude,
                p.severity, p.status, p.pothole_type,
                p.report_count, p.camera_confirmed, p.sensor_confirmed,
                p.estimated_damage_inr, p.days_unrepaired, p.created_at,
                c.name as contractor_name
            FROM potholes p
            LEFT JOIN contractors c ON c.id = p.contractor_id
            WHERE {where_clause}
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params,
    )
    rows = result.mappings().fetchall()
    return [HazardMapItem(**dict(r)) for r in rows]


@router.get("/nearby", response_model=List[HazardMapItem])
async def get_nearby_hazards(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_meters: float = Query(500, le=5000),
    db: AsyncSession = Depends(get_db),
):
    """Returns potholes within radius of a GPS point. Used by rider app for ahead-alerts."""
    rows = await find_potholes_within_radius(
        db, lat, lon, radius_meters,
        status_filter=["confirmed", "candidate"],
    )
    return [
        HazardMapItem(
            id=r[0], latitude=r[1], longitude=r[2],
            severity=r[3], status=r[4], pothole_type=r[5],
            report_count=r[6], camera_confirmed=0, sensor_confirmed=0,
            estimated_damage_inr=r[7], days_unrepaired=0,
            created_at=None, contractor_name=None,
        )
        for r in rows
    ]


@router.get("/stats", response_model=CityStats)
async def get_city_stats(
    city: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Aggregate stats for dashboard / city health view."""
    params = {}
    city_filter = ""
    if city:
        city_filter = "WHERE city ILIKE :city"
        params["city"] = f"%{city}%"

    result = await db.execute(
        text(f"""
            SELECT
                COALESCE(:city_name, 'All Cities') as city,
                COUNT(*) as total_potholes,
                COUNT(*) FILTER (WHERE status='confirmed') as confirmed_potholes,
                COUNT(*) FILTER (WHERE status='repaired') as repaired_potholes,
                COALESCE(SUM(estimated_damage_inr), 0) as total_damage_inr
            FROM potholes
            {city_filter}
        """),
        {"city_name": city, **params},
    )
    stats = result.mappings().fetchone()

    # Active riders (seen in last 30 min)
    riders_result = await db.execute(
        text("SELECT COUNT(*) FROM riders WHERE last_seen_at > NOW() - INTERVAL '30 minutes'")
    )
    active_riders = riders_result.scalar() or 0

    return CityStats(
        city=stats["city"] or "All Cities",
        total_potholes=stats["total_potholes"] or 0,
        confirmed_potholes=stats["confirmed_potholes"] or 0,
        repaired_potholes=stats["repaired_potholes"] or 0,
        total_damage_inr=float(stats["total_damage_inr"] or 0),
        active_riders=active_riders,
        top_problematic_road=None,
    )


@router.get("/{pothole_id}", response_model=PotholeDetail)
async def get_pothole_detail(pothole_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            SELECT
                p.id, p.avg_lat as latitude, p.avg_lon as longitude,
                p.severity, p.status, p.pothole_type,
                p.report_count, p.camera_confirmed, p.sensor_confirmed,
                p.high_confidence_count, p.estimated_damage_inr,
                p.days_unrepaired, p.created_at, p.address,
                p.best_image_s3_key,
                c.name as contractor_name,
                rs.name as road_segment_name
            FROM potholes p
            LEFT JOIN contractors c ON c.id = p.contractor_id
            LEFT JOIN road_segments rs ON rs.id = p.road_segment_id
            WHERE p.id = :id
        """),
        {"id": pothole_id},
    )
    row = result.mappings().fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pothole not found")

    row_dict = dict(row)

    # Build pre-signed S3 URL if image exists
    if row_dict.get("best_image_s3_key"):
        row_dict["best_image_url"] = _get_s3_url(row_dict["best_image_s3_key"])

    return PotholeDetail(**row_dict)


def _get_s3_url(s3_key: str) -> Optional[str]:
    try:
        import boto3
        from app.config import get_settings
        s = get_settings()
        client = boto3.client("s3", region_name=s.AWS_REGION)
        return client.generate_presigned_url(
            "get_object",
            Params={"Bucket": s.S3_BUCKET, "Key": s3_key},
            ExpiresIn=3600,
        )
    except Exception:
        return None