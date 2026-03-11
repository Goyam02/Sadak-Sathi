import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_hazards_location ON hazards USING GIST (location);
    """))
    conn.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_hazard_reports_location ON hazard_reports USING GIST (location);
    """))
    conn.commit()
print("Spatial indexes ensured on hazards.location and hazard_reports.location")
