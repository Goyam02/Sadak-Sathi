from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
import uuid

from app.dependencies import get_db, get_current_rider
from app.schemas.schemas import RiderCreate, RiderLogin, TokenResponse, RiderOut
from app.models.rider import Rider
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RiderCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Rider).where(Rider.phone == payload.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    rider = Rider(
        id=str(uuid.uuid4()),
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        platform=payload.platform,
        city=payload.city,
    )
    db.add(rider)
    await db.commit()
    await db.refresh(rider)

    token = create_access_token({"sub": rider.id, "role": rider.role})
    return TokenResponse(access_token=token, rider=RiderOut.model_validate(rider))


@router.post("/login", response_model=TokenResponse)
async def login(payload: RiderLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Rider).where(Rider.phone == payload.phone))
    rider = result.scalar_one_or_none()
    if not rider or not verify_password(payload.password, rider.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid phone or password")
    if not rider.is_active:
        raise HTTPException(status_code=403, detail="Account suspended")

    token = create_access_token({"sub": rider.id, "role": rider.role})
    return TokenResponse(access_token=token, rider=RiderOut.model_validate(rider))


@router.get("/me", response_model=RiderOut)
async def get_me(rider: Rider = Depends(get_current_rider)):
    return RiderOut.model_validate(rider)


@router.patch("/me/location")
async def update_location(
    lat: float, lon: float,
    rider: Rider = Depends(get_current_rider),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        text("UPDATE riders SET last_lat=:lat, last_lon=:lon, last_seen_at=NOW() WHERE id=:id"),
        {"lat": lat, "lon": lon, "id": rider.id},
    )
    await db.commit()
    from app.core.websocket_manager import manager
    manager.update_location(rider.id, lat, lon)
    return {"status": "ok"}
