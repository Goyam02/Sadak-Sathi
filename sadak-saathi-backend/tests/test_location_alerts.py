import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_location_alerts():
    # Insert a confirmed pothole hazard for testing
    resp = client.post("/report", json={
        "lat": 19.076,
        "lon": 72.877,
        "type": "pothole",
        "confidence": 10,
        "source": "human"
    })
    assert resp.status_code == 200
    hazard_id = resp.json()["hazard_id"]

    # Simulate user driving near hazard (10m away)
    resp2 = client.post("/location", json={
        "lat": 19.07609,  # ~10m north
        "lon": 72.877,
        "speed": 36
    })
    assert resp2.status_code == 200
    alerts = resp2.json()["alerts"]
    # Should contain at least one alert for pothole, severity >= 3
    found = False
    for alert in alerts:
        if alert["hazard_id"] == hazard_id and alert["type"] == "pothole" and alert["severity"] >= 3:
            found = True
    assert found

    # User right on top (distance < 5m) should not get alert
    resp3 = client.post("/location", json={
        "lat": 19.076,
        "lon": 72.877,
        "speed": 36
    })
    assert resp3.status_code == 200
    for alert in resp3.json()["alerts"]:
        assert alert["distance"] >= 5


