# Sadak Saathi Backend API Documentation

## Base URL
`http://localhost:8000/`

---

## 1. Hazard Reporting: `POST /report`

### Description
Report a new hazard to the backend. This endpoint ingests data from mobile sensors, users, or other sources.

### Request
**Content-Type:** `application/json`

**Body Parameters:**
```json
{
  "lat": 19.076,          // Latitude (float, required)
  "lon": 72.877,          // Longitude (float, required)
  "type": "pothole",      // Hazard type [pothole, speed_bump, road_damage] (string, required)
  "confidence": 9,        // Confidence score [0-10] (float, required)
  "source": "human"       // Data source [human, sensor, app] (string, required)
}
```

### Response
**Content-Type:** `application/json`

```json
{
  "hazard_id": 3,         // Unique hazard ID (integer)
  "clustered": true,      // Has this hazard been merged/clustered with others? (boolean)
  "confidence": 25.2,     // Clustered confidence score (float)
  "severity": 5,          // Calculated severity [1-5] (integer)
  "status": "critical"    // Status [critical, confirmed, etc.] (string)
}
```

---

## 2. Real-Time Hazard Alerts: `POST /location`

### Description
Submit user’s live location to fetch dangerous hazard alerts within a 30-meter radius.

### Request
**Content-Type:** `application/json`

**Body Parameters:**
```json
{
  "lat": 19.0761,       // Latitude of user/vehicle (float, required)
  "lon": 72.877,        // Longitude of user/vehicle (float, required)
  "speed": 36           // Current speed (float, optional)
}
```

### Response
**Content-Type:** `application/json`

```json
{
  "alerts": [
    {
      "hazard_id": 3,        // Unique hazard ID (integer)
      "type": "pothole",     // Hazard type (string)
      "severity": 5,         // Severity [1-5] (integer)
      "distance": 10         // Distance from user in meters (rounded, integer)
    }
    // ... more alerts if relevant hazards nearby
  ]
}
```

#### Alert Filtering & Logic
- Only hazards within a 30-meter radius.
- Only relevant hazard types: `"pothole"`, `"speed_bump"`, `"road_damage"`.
- Only severity `>= 3`.
- Hazards closer than 5 meters are not alerted (spam prevention).
- Alerts are ordered by proximity.

---

## 3. OpenAPI Documentation and Other Endpoints

- **Interactive API docs:**
  Open in browser:
  ```
  http://localhost:8000/docs
  ```
  (if FastAPI default enabled; gives schemas, sample calls, try-it-now interface)

---

## 4. Frontend Integration

### How to use from mobile/web app

#### A. Reporting Hazards
- When user or sensors detect a hazard, send a POST request to `/report`.
- Use the geolocation from the device, fill hazard type, confidence (if available), and source.

**Example (JS/fetch):**
```javascript
fetch("http://localhost:8000/report", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    lat: userLat,
    lon: userLon,
    type: "pothole",
    confidence: 8,    // or sensor value
    source: "app"
  })
})
  .then(res => res.json())
  .then(data => {
    // Do something: show confirmation, update map
  });
```

#### B. Receiving Alerts
- Periodically (e.g. every 3 seconds) send the vehicle/user’s current location to `/location`.
- Parse the returned `alerts` array, display warnings on map, provide audio/visual notifications.

**Example (JS/fetch):**
```javascript
fetch("http://localhost:8000/location", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    lat: userLat,
    lon: userLon,
    speed: userSpeed   // optional
  })
})
  .then(res => res.json())
  .then(data => {
    if(data.alerts.length > 0){
      data.alerts.forEach(alert => {
        // Display notification, highlight nearest hazard
        showHazardAlert(alert);
      });
    }
  });
```

#### C. UX Considerations
- Only show alerts for hazards matching `type` and `severity` as filtered by backend.
- Don't spam user for hazards closer than 5 meters (backend suppresses those).
- Use secure HTTPS in production, set proper API base URL.
- Display alert distance and severity for user clarity.

---

## 5. Testing & Troubleshooting

- Use tools like Postman, curl, or browser to test endpoints.
- Seed hazards via `/report`, trigger alerts via `/location`.
- Debug with logs, check backend/network responses.

---

## 6. Example Scenarios
- Report a pothole at user’s current GPS.
- Periodically poll `/location` as vehicle moves; get alerts as hazards come within range.
- Visualize hazards and alerts on map UI.

---

## 7. Summary Table

| Endpoint        | Method | Purpose                      | Request Body                        | Response Body                                           |
|-----------------|--------|------------------------------|-------------------------------------|--------------------------------------------------------|
| `/report`       | POST   | Submit new hazard            | lat, lon, type, confidence, source  | hazard_id, clustered, confidence, severity, status     |
| `/location`     | POST   | Fetch real-time hazard alerts| lat, lon, speed (optional)          | alerts array: hazard_id, type, severity, distance      |

---

For further extensions (OpenAPI .yaml/.json, push integrations, or advanced queries), please ask!
