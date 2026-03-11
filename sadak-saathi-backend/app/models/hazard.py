from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func
from geoalchemy2 import Geography
from app.db.database import Base

class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    severity = Column(Integer, default=1)
    confidence = Column(Float, default=0)
    report_count = Column(Integer, default=1)
    status = Column(String, default="candidate")

    location = Column(Geography(geometry_type="POINT", srid=4326))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
