from sqlalchemy import Column, String, Float, Integer, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from datetime import datetime
import enum
import uuid

from app.models.base import Base


class ClaimStatus(str, enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    FRAUD_DETECTED = "fraud_detected"
    REJECTED = "rejected"


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(256), nullable=False)
    registration_number = Column(String(100), unique=True, nullable=False)
    contact_email = Column(String(256))
    contact_phone = Column(String(20))

    # Accountability metrics
    performance_score = Column(Float, default=100.0)
    warranty_violations = Column(Integer, default=0)
    fraud_claims = Column(Integer, default=0)
    verified_repairs = Column(Integer, default=0)
    total_potholes_on_record = Column(Integer, default=0)
    total_estimated_damage_inr = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    road_segments = relationship("RoadSegment", back_populates="contractor")
    repair_claims = relationship("RepairClaim", back_populates="contractor")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(512))
    boundary = Column(Geometry("POLYGON", srid=4326), nullable=False)
    contractor_id = Column(String, ForeignKey("contractors.id"), nullable=False)
    construction_date = Column(DateTime, nullable=True)
    warranty_expiry = Column(DateTime, nullable=True)
    road_type = Column(String(50))

    contractor = relationship("Contractor", back_populates="road_segments")


class RepairClaim(Base):
    __tablename__ = "repair_claims"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    pothole_id = Column(String, ForeignKey("potholes.id"), nullable=False)
    contractor_id = Column(String, ForeignKey("contractors.id"), nullable=False)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.PENDING)
    claimed_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    verification_confidence = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    proof_image_s3_key = Column(String, nullable=True)

    contractor = relationship("Contractor", back_populates="repair_claims")