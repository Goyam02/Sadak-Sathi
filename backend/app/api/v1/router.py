from fastapi import APIRouter
import app.api.v1.auth as auth
import app.api.v1.detection as detection
import app.api.v1.alerts as alerts
import app.api.v1.routes as routes
import app.api.v1.hazards as hazards

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(detection.router)
api_router.include_router(alerts.router)
api_router.include_router(routes.router)
api_router.include_router(hazards.router)

