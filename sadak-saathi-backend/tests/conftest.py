
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
from app.main import app

import pytest

import os

@pytest.fixture(scope='session', autouse=True)
def initialize_database():
    # Safety: fail if test DB is not set!
    if not os.getenv("TEST_DATABASE_URL"):
        raise RuntimeError("TEST_DATABASE_URL must be set in .env when running tests.")
    from app.db.database import engine, Base
    with engine.connect() as conn:
        from sqlalchemy import text
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
    # Import all models before creating tables
    from app.models import hazard, report
    Base.metadata.create_all(bind=engine)
    yield
    # Optionally, drop tables afterwards
    # Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope='module')
def test_app():
    return app
