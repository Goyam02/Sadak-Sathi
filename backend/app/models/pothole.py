from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
import enum
import uuid

from app.models.base import Base

class Severity(str, enum.Enum):
    S1 = "S1"   # Minor
    S2 = "S2"   # Moderate
    S3 = "S3"   # Severe

class PotholeStatus(str, enum.Enum):
    CANDIDATE = "candidate"
    CONFIRMED = "confirmed"
    REPAIRED = "repaired"
    FRAUD = "fraud"          # Claimed repaired but not verified

class Pothole(Base):
    __tablename__ = "potholes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    severity = Column(Enum(Severity), default=Severity.S1)
    status = Column(Enum(PotholeStatus), default=PotholeStatus.CANDIDATE)
    report_count = Column(Integer, default=1)
    camera_confirmed = Column(Integer, default=0)    # YOLO detections
    sensor_confirmed = Column(Integer, default=0)    # LSTM detections
    water_filled = Column(Integer, default=0)        # boolean-like count

    contractor_id = Column(String, ForeignKey("contractors.id"), nullable=True)
    road_segment_id = Column(String, ForeignKey("road_segments.id"), nullable=True)

    estimated_damage_inr = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    repaired_at = Column(DateTime, nullable=True)

    reports = relationship("PotholeReport", back_populates="pothole")

class PotholeReport(Base):
    __tablename__ = "pothole_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pothole_id = Column(String, ForeignKey("potholes.id"), nullable=True)  # null until clustered
    rider_id = Column(String, ForeignKey("riders.id"), nullable=False)

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(Enum(Severity))
    detection_method = Column(String)   # "camera", "sensor", "both"
    confidence = Column(Float)
    image_s3_key = Column(String, nullable=True)

    # Raw sensor data (stored for ML retraining)
    accel_x = Column(Float, nullable=True)
    accel_y = Column(Float, nullable=True)
    accel_z = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    pothole = relationship("Pothole", back_populates="reports")