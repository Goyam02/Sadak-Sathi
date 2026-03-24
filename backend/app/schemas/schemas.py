from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class DetectionMethod(str, Enum):
    camera = "camera"
    sensor = "sensor"
    both = "both"

class SeverityEnum(str, Enum):
    S1 = "S1"
    S2 = "S2"
    S3 = "S3"

class PotholeTypeEnum(str, Enum):
    dry = "dry"
    water_filled = "water_filled"
    debris = "debris"


# ─── Detection ────────────────────────────────────────────────────────────────

class SensorReading(BaseModel):
    accel_x: float
    accel_y: float
    accel_z: float
    timestamp_ms: float
    speed_kmh: Optional[float] = None


class DetectionPayload(BaseModel):
    rider_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    detection_method: DetectionMethod
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: SeverityEnum
    pothole_type: PotholeTypeEnum = PotholeTypeEnum.dry
    sensor_data: Optional[SensorReading] = None


class DetectionResponse(BaseModel):
    pothole_id: str
    status: str
    report_count: int
    severity: str
    message: str


# ─── Pothole ──────────────────────────────────────────────────────────────────

class HazardMapItem(BaseModel):
    id: str
    latitude: float
    longitude: float
    severity: str
    status: str
    pothole_type: str
    report_count: int
    camera_confirmed: int
    sensor_confirmed: int
    estimated_damage_inr: float
    contractor_name: Optional[str] = None
    days_unrepaired: int
    created_at: datetime

    class Config:
        from_attributes = True


class PotholeDetail(HazardMapItem):
    address: Optional[str]
    high_confidence_count: int
    best_image_url: Optional[str] = None
    road_segment_name: Optional[str] = None


# ─── Rider ────────────────────────────────────────────────────────────────────

class RiderCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    platform: Optional[str] = None
    city: Optional[str] = None


class RiderLogin(BaseModel):
    phone: str
    password: str


class RiderOut(BaseModel):
    id: str
    name: str
    phone: str
    platform: Optional[str]
    city: Optional[str]
    total_reports: float
    accuracy_score: float
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rider: RiderOut


# ─── Alerts ──────────────────────────────────────────────────────────────────

class AlertMessage(BaseModel):
    event: str = "pothole_alert"
    pothole_id: str
    latitude: float
    longitude: float
    severity: str
    pothole_type: str
    distance_meters: float
    message: str


class LocationUpdate(BaseModel):
    rider_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    speed_kmh: Optional[float] = None


# ─── Routes ──────────────────────────────────────────────────────────────────

class RoutePoint(BaseModel):
    latitude: float
    longitude: float


class RouteRequest(BaseModel):
    origin: RoutePoint
    destination: RoutePoint
    rider_id: Optional[str] = None


class RouteOption(BaseModel):
    type: str                       # "fastest" | "safest"
    distance_km: float
    estimated_time_minutes: float
    pothole_count: int
    pothole_severity_score: float   # 0-100, lower is better
    waypoints: List[RoutePoint]
    description: str


class RouteResponse(BaseModel):
    fastest: RouteOption
    safest: RouteOption
    recommended: str                # "fastest" | "safest"


# ─── Contractor ──────────────────────────────────────────────────────────────

class ContractorCreate(BaseModel):
    name: str
    registration_number: str
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    city: str


class ContractorOut(BaseModel):
    id: str
    name: str
    registration_number: str
    city: str
    status: str
    performance_score: float
    total_potholes_caused: int
    total_potholes_repaired: int
    total_damage_inr: float
    payment_withheld_inr: float
    fraud_attempts: int
    created_at: datetime

    class Config:
        from_attributes = True


class DamageReport(BaseModel):
    pothole_id: str
    contractor_id: Optional[str]
    contractor_name: Optional[str]
    road_segment: Optional[str]
    under_warranty: bool
    days_unrepaired: int
    estimated_damage_inr: float
    severity: str
    report_count: int


class RepairClaimCreate(BaseModel):
    pothole_id: str
    contractor_id: str
    notes: Optional[str] = None


class RepairClaimOut(BaseModel):
    id: str
    pothole_id: str
    contractor_id: str
    claimed_at: datetime
    is_verified: Optional[bool]
    payment_released: bool
    satellite_confidence: Optional[float]
    verification_notes: Optional[str]

    class Config:
        from_attributes = True


# ─── Stats / Dashboard ────────────────────────────────────────────────────────

class CityStats(BaseModel):
    city: str
    total_potholes: int
    confirmed_potholes: int
    repaired_potholes: int
    total_damage_inr: float
    active_riders: int
    top_problematic_road: Optional[str]


class LeaderboardEntry(BaseModel):
    rank: int
    contractor_id: str
    contractor_name: str
    performance_score: float
    total_damage_inr: float
    potholes_caused: int
    potholes_repaired: int
    fraud_attempts: int