import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
def test_query_hazards():
    resp = client.get("/hazards", params={"lat": 19.07, "lon": 72.87, "radius": 1000})
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
def test_query_hazards_invalid():
    resp = client.get("/hazards", params={"lat": "foo", "lon": "bar", "radius": 1000})
    assert resp.status_code == 422
