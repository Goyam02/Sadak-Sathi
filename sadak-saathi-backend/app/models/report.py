from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from app.db.database import Base

class HazardReport(Base):
    __tablename__ = "hazard_reports"
    id = Column(Integer, primary_key=True)
    hazard_id = Column(Integer, ForeignKey('hazards.id'))
    source = Column(String)
    confidence = Column(Float)
    location = Column(Geography(geometry_type="POINT", srid=4326))
    image_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
