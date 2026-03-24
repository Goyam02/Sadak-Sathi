"""
Route Scoring Service
Scores road segments by pothole density + severity.
Returns fastest route vs safest route for a given origin-destination pair.
Integrates with OSRM (open-source routing) or Google Maps Directions API.
"""
import logging
import httpx
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# Severity penalty weights for route scoring
SEVERITY_PENALTY = {"S1": 1, "S2": 3, "S3": 8}
WATER_FILLED_EXTRA_PENALTY = 5


async def get_route_options(
    origin_lat: float,
    origin_lon: float,
    dest_lat: float,
    dest_lon: float,
    db: AsyncSession,
) -> dict:
    """
    Returns two routes:
    - fastest: minimal travel time (standard routing)
    - safest:  minimal pothole exposure, may be longer
    """
    # Fetch multiple route alternatives from routing engine
    routes = await _fetch_route_alternatives(origin_lat, origin_lon, dest_lat, dest_lon)

    if not routes:
        return {"error": "No routes found"}

    # Score each route
    scored = []
    for route in routes:
        score = await _score_route(route, db)
        scored.append({"route": route, "hazard_score": score})

    # Fastest = minimum duration
    fastest = min(scored, key=lambda r: r["route"]["duration_seconds"])
    # Safest = minimum hazard score (ties broken by duration)
    safest = min(scored, key=lambda r: (r["hazard_score"], r["route"]["duration_seconds"]))

    return {
        "fastest": _format_route(fastest, label="fastest"),
        "safest": _format_route(safest, label="safest"),
        "same_route": fastest["route"]["geometry"] == safest["route"]["geometry"],
    }


async def _fetch_route_alternatives(
    o_lat: float, o_lon: float,
    d_lat: float, d_lon: float,
) -> list:
    """
    Fetch route alternatives from OSRM (self-hosted) or Google Maps.
    Returns list of route dicts with: geometry (encoded polyline), duration_seconds, distance_meters.
    """
    osrm_url = getattr(settings, "OSRM_BASE_URL", None)

    if osrm_url:
        return await _fetch_from_osrm(o_lat, o_lon, d_lat, d_lon, osrm_url)

    gmaps_key = getattr(settings, "GOOGLE_MAPS_API_KEY", None)
    if gmaps_key:
        return await _fetch_from_gmaps(o_lat, o_lon, d_lat, d_lon, gmaps_key)

    logger.warning("No routing engine configured. Returning straight-line mock route.")
    return [_mock_route(o_lat, o_lon, d_lat, d_lon)]


async def _fetch_from_osrm(o_lat, o_lon, d_lat, d_lon, base_url: str) -> list:
    url = (
        f"{base_url}/route/v1/driving/"
        f"{o_lon},{o_lat};{d_lon},{d_lat}"
        f"?alternatives=3&geometries=geojson&overview=full&steps=false"
    )
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url)
            data = resp.json()

        routes = []
        for r in data.get("routes", []):
            routes.append({
                "geometry": r["geometry"]["coordinates"],
                "duration_seconds": r["duration"],
                "distance_meters": r["distance"],
            })
        return routes
    except Exception as e:
        logger.error(f"OSRM request failed: {e}")
        return []


async def _fetch_from_gmaps(o_lat, o_lon, d_lat, d_lon, api_key: str) -> list:
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        "origin": f"{o_lat},{o_lon}",
        "destination": f"{d_lat},{d_lon}",
        "alternatives": "true",
        "mode": "driving",
        "key": api_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            data = resp.json()

        routes = []
        for r in data.get("routes", []):
            leg = r["legs"][0]
            routes.append({
                "geometry": r["overview_polyline"]["points"],  # encoded polyline
                "duration_seconds": leg["duration"]["value"],
                "distance_meters": leg["distance"]["value"],
            })
        return routes
    except Exception as e:
        logger.error(f"Google Maps request failed: {e}")
        return []


async def _score_route(route_data: dict, db: AsyncSession) -> float:
    """
    Score a route based on potholes along its path.
    Higher score = more dangerous.
    """
    geometry = route_data["route"]["geometry"]

    # Build a linestring from coordinates for PostGIS query
    if isinstance(geometry, list):
        # GeoJSON coordinates [[lon, lat], ...]
        coord_str = ", ".join(f"{pt[0]} {pt[1]}" for pt in geometry)
        linestring_wkt = f"LINESTRING({coord_str})"
    else:
        # Encoded polyline — decode first
        try:
            coords = _decode_polyline(geometry)
            coord_str = ", ".join(f"{lon} {lat}" for lat, lon in coords)
            linestring_wkt = f"LINESTRING({coord_str})"
        except Exception:
            return 0.0

    # Query potholes within 25m of route
    result = await db.execute(
        text("""
            SELECT severity, water_filled, report_count
            FROM potholes
            WHERE status IN ('candidate', 'confirmed')
            AND ST_DWithin(
                location::geography,
                ST_GeomFromText(:line, 4326)::geography,
                25
            )
        """),
        {"line": linestring_wkt},
    )
    potholes = result.mappings().fetchall()

    total_penalty = 0.0
    for p in potholes:
        base = SEVERITY_PENALTY.get(p["severity"], 1)
        water_bonus = WATER_FILLED_EXTRA_PENALTY if p.get("water_filled") else 0
        # Weight by confirmation level
        confirmation_weight = min(p["report_count"] / 5.0, 2.0)
        total_penalty += (base + water_bonus) * confirmation_weight

    return total_penalty


def _format_route(scored_route: dict, label: str) -> dict:
    route = scored_route["route"]
    duration_mins = round(route["duration_seconds"] / 60, 1)
    distance_km = round(route["distance_meters"] / 1000, 2)
    hazard_score = scored_route["hazard_score"]

    # Human-readable safety rating
    if hazard_score == 0:
        safety_rating = "Excellent"
    elif hazard_score < 5:
        safety_rating = "Good"
    elif hazard_score < 15:
        safety_rating = "Fair"
    elif hazard_score < 30:
        safety_rating = "Poor"
    else:
        safety_rating = "Dangerous"

    return {
        "label": label,
        "duration_minutes": duration_mins,
        "distance_km": distance_km,
        "hazard_score": round(hazard_score, 2),
        "safety_rating": safety_rating,
        "geometry": route["geometry"],
    }


def _mock_route(o_lat, o_lon, d_lat, d_lon) -> dict:
    """Straight-line mock when no routing engine is configured."""
    return {
        "geometry": [[o_lon, o_lat], [d_lon, d_lat]],
        "duration_seconds": 600,
        "distance_meters": 3000,
    }


def _decode_polyline(encoded: str) -> list:
    """Decode a Google-encoded polyline into [(lat, lon)] pairs."""
    result = []
    index = 0
    lat = 0
    lng = 0
    while index < len(encoded):
        for is_lng in (False, True):
            shift = 0
            result_val = 0
            while True:
                b = ord(encoded[index]) - 63
                index += 1
                result_val |= (b & 0x1F) << shift
                shift += 5
                if b < 0x20:
                    break
            d = ~(result_val >> 1) if result_val & 1 else result_val >> 1
            if is_lng:
                lng += d
            else:
                lat += d
        result.append((lat / 1e5, lng / 1e5))
    return result