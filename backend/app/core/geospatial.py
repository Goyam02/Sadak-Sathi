"""
PostGIS helper utilities used across services.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional


async def potholes_in_bbox(
    min_lat: float, min_lon: float,
    max_lat: float, max_lon: float,
    db: AsyncSession,
    status_filter: Optional[list] = None,
    limit: int = 500,
) -> list:
    statuses = status_filter or ["candidate", "confirmed"]
    placeholders = ", ".join(f"'{s}'" for s in statuses)

    result = await db.execute(
        text(f"""
            SELECT
                id,
                ST_Y(location::geometry) as latitude,
                ST_X(location::geometry) as longitude,
                severity,
                status,
                report_count,
                water_filled,
                estimated_damage_inr,
                contractor_id,
                created_at
            FROM potholes
            WHERE status IN ({placeholders})
              AND ST_Within(
                    location::geometry,
                    ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326)
                  )
            ORDER BY report_count DESC
            LIMIT :limit
        """),
        {
            "min_lat": min_lat, "min_lon": min_lon,
            "max_lat": max_lat, "max_lon": max_lon,
            "limit": limit,
        },
    )
    return result.mappings().fetchall()


async def count_potholes_near(lat: float, lon: float, radius_meters: float, db: AsyncSession) -> int:
    result = await db.execute(
        text("""
            SELECT COUNT(*) FROM potholes
            WHERE ST_DWithin(
                location::geography,
                ST_MakePoint(:lon, :lat)::geography,
                :radius
            ) AND status IN ('candidate', 'confirmed')
        """),
        {"lat": lat, "lon": lon, "radius": radius_meters},
    )
    return result.scalar() or 0
