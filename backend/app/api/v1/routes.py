"""
Routes Router
POST /api/v1/routes/options   — get fastest + safest route options
GET  /api/v1/routes/score     — score a specific route geometry
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.schemas.schemas import RouteRequest, RouteResponse
from app.services.route_service import get_route_options

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/options", response_model=RouteResponse)
async def get_route(payload: RouteRequest, db: AsyncSession = Depends(get_db)):
    """
    Returns two route options for a given origin→destination:
    - fastest: minimum travel time
    - safest:  minimum pothole exposure (may be slightly longer)

    The response includes a 'recommended' field indicating which to show first
    based on whether the hazard difference is significant.
    """
    result = await get_route_options(
        origin_lat=payload.origin.latitude,
        origin_lon=payload.origin.longitude,
        dest_lat=payload.destination.latitude,
        dest_lon=payload.destination.longitude,
        db=db,
    )

    if "error" in result:
        raise HTTPException(status_code=503, detail=result["error"])

    fastest = result["fastest"]
    safest = result["safest"]
    same = result.get("same_route", False)

    # Recommend safest if hazard score differs by more than 20%
    hazard_diff = safest["hazard_score"] - fastest["hazard_score"]
    time_diff_mins = safest["duration_minutes"] - fastest["duration_minutes"]
    recommended = "safest" if (not same and abs(hazard_diff) > 2 and time_diff_mins < 10) else "fastest"

    return RouteResponse(
        fastest=_to_route_option(fastest, "fastest"),
        safest=_to_route_option(safest, "safest"),
        recommended=recommended,
    )


def _to_route_option(route_data: dict, route_type: str):
    from app.schemas.schemas import RouteOption, RoutePoint

    # Convert geometry to RoutePoint list
    geometry = route_data.get("geometry", [])
    waypoints = []
    if isinstance(geometry, list):
        for pt in geometry:
            if isinstance(pt, (list, tuple)) and len(pt) == 2:
                waypoints.append(RoutePoint(latitude=pt[1], longitude=pt[0]))

    safety_descriptions = {
        "Excellent": "No known potholes on this route.",
        "Good": "Minor road hazards only.",
        "Fair": "Some potholes — ride with moderate caution.",
        "Poor": "Multiple potholes — significantly reduce speed.",
        "Dangerous": "Severe potholes detected — strongly consider alternate route.",
    }
    rating = route_data.get("safety_rating", "Fair")
    description = safety_descriptions.get(rating, "Road condition unknown.")

    return RouteOption(
        type=route_type,
        distance_km=route_data.get("distance_km", 0),
        estimated_time_minutes=route_data.get("duration_minutes", 0),
        pothole_count=0,   # TODO: count from route score details
        pothole_severity_score=route_data.get("hazard_score", 0),
        waypoints=waypoints,
        description=description,
    )