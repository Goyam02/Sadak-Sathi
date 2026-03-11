import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
def test_report_creation():
    resp = client.post("/report", json={
        "lat": 19.07,
        "lon": 72.87,
        "type": "pothole",
        "confidence": 0.9,
        "source": "camera"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "hazard_id" in data
    assert isinstance(data["hazard_id"], int)
def test_report_invalid_payload():
    resp = client.post("/report", json={})
    assert resp.status_code == 422
