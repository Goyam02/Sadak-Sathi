from sqlalchemy import Column, String, Float, Boolean, DateTime, Integer
from datetime import datetime
import uuid
from app.models.base import Base


class Rider(Base):
    __tablename__ = "riders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(256), unique=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    full_name = Column(String(256))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    platform = Column(String(100), nullable=True)

    last_lat = Column(Float, nullable=True)
    last_lon = Column(Float, nullable=True)
    last_seen = Column(DateTime, nullable=True)

    total_reports = Column(Integer, default=0)
    confirmed_reports = Column(Integer, default=0)
    accuracy_score = Column(Float, default=100.0)

    created_at = Column(DateTime, default=datetime.utcnow)