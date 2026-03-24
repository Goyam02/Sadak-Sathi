from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class DetectionMethod(str, Enum):
    camera = "camera"
    sensor = "sensor"
    both = "both"

class SensorReading(BaseModel):
    accel_x: float
    accel_y: float
    accel_z: float
    timestamp: float    # Unix ms

class DetectionPayload(BaseModel):
    rider_id: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    detection_method: DetectionMethod
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: str = Field(..., pattern="^S[123]$")
    water_filled: bool = False
    sensor_data: Optional[SensorReading] = None
    # image is sent as multipart — handled separately

class HazardMapItem(BaseModel):
    id: str
    latitude: float
    longitude: float
    severity: str
    status: str
    report_count: int
    water_filled: bool
    contractor_name: Optional[str]
    estimated_damage_inr: float

    class Config:
        from_attributes = True