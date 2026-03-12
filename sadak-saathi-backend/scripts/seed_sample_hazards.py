import requests

BASE_URL = "http://localhost:8000"

# Sample hazards for Mumbai coordinates
sample_hazards = [
    {"lat": 19.076, "lon": 72.877, "type": "pothole", "confidence": 9, "source": "human"},
    {"lat": 19.0764, "lon": 72.8773, "type": "speed_bump", "confidence": 7, "source": "app"},
    {"lat": 19.0758, "lon": 72.8768, "type": "road_damage", "confidence": 8, "source": "sensor"},
    {"lat": 19.077, "lon": 72.878, "type": "pothole", "confidence": 6, "source": "human"},
    {"lat": 19.078, "lon": 72.880, "type": "pothole", "confidence": 10, "source": "app"},
    {"lat": 19.074, "lon": 72.876, "type": "road_damage", "confidence": 5, "source": "sensor"},
    {"lat": 19.079, "lon": 72.882, "type": "speed_bump", "confidence": 8, "source": "human"}
]

for hazard in sample_hazards:
    resp = requests.post(f"{BASE_URL}/report", json=hazard)
    print(f"Inserted: {hazard['type']} at ({hazard['lat']}, {hazard['lon']}), status code {resp.status_code}, response: {resp.text}")
