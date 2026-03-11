import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_sensor_fusion_camera():
    resp = client.post("/report", json={
        "lat": 19.07,
        "lon": 72.87,
        "type": "pothole",
        "confidence": 0.85,
        "source": "camera"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["confidence"] == pytest.approx(0.85) or data["confidence"] > 0  # camera, initial
    assert data["severity"] in [1, 2, 3, 4, 5]

    # Add another sensor fusion report
    resp2 = client.post("/report", json={
        "lat": 19.07,
        "lon": 72.87001,
        "type": "pothole",
        "confidence": 0.7,
        "source": "accelerometer"
    })
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["confidence"] > data["confidence"]
    assert data2["severity"] >= data["severity"]
    assert data2["clustered"] is True
    assert isinstance(data2["status"], str)

def test_report_invalid_payload():
    resp = client.post("/report", json={})
    assert resp.status_code == 422
