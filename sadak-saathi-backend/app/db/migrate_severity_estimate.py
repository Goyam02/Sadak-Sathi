import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE hazard_reports ADD COLUMN severity_estimate INTEGER;"))
    conn.commit()
print("Migration applied: severity_estimate column added.")
