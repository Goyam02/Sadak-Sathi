# API Documentation

## Base URL

**Development:** `http://localhost:8000`  
**Production:** `https://api.sadaksaathi.in` _(TBD)_

## Authentication

Currently, the API is open for development. Production deployment will include:
- API key authentication for fleet partners
- OAuth 2.0 for user-facing features
- Rate limiting: 100 requests/minute per IP

---

## Endpoints

### 1. Health Check

```http
GET /
```

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

### 2. Submit Hazard Report

```http
POST /reports
```

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "severity": 2,
  "impact_force": 14.5,
  "velocity": 12.3,
  "timestamp": "2026-03-12T08:30:00Z",
  "device_id": "hashed_device_id_abc123",
  "detection_method": "accelerometer",
  "confidence": 0.92
}
```

**Response (201 Created):**
```json
{
  "report_id": "rpt_12345",
  "status": "candidate",
  "message": "Report submitted. Awaiting confirmation from other users.",
  "confirmations_needed": 2
}
```

---

### 3. Get Hazards in Bounding Box

```http
GET /hazards?min_lat=28.5&max_lat=28.7&min_lon=77.1&max_lon=77.3&severity=2,3
```

**Query Parameters:**
- `min_lat` (required): Minimum latitude
- `max_lat` (required): Maximum latitude
- `min_lon` (required): Minimum longitude
- `max_lon` (required): Maximum longitude
- `severity` (optional): Comma-separated severity levels (1,2,3)
- `status` (optional): `confirmed`, `candidate`, `resolved`

**Response (200 OK):**
```json
{
  "hazards": [
    {
      "id": "hzd_4471",
      "latitude": 28.6139,
      "longitude": 77.2090,
      "severity": 3,
      "status": "confirmed",
      "confirmations": 31,
      "first_reported": "2026-01-30T10:15:00Z",
      "last_confirmed": "2026-03-12T08:20:00Z",
      "water_detected": true,
      "yolo_confidence": 0.94,
      "contractor": {
        "name": "ABC Construction Ltd",
        "contract_id": "PWD/2023/456",
        "contract_value": 120000000
      },
      "damage_estimate": {
        "vehicle_damage": 840000,
        "traffic_cost_per_day": 630000,
        "total_cost": 25800000,
        "days_unresolved": 41
      }
    }
  ],
  "count": 1,
  "bbox": {
    "min_lat": 28.5,
    "max_lat": 28.7,
    "min_lon": 77.1,
    "max_lon": 77.3
  }
}
```

---

### 4. Get Hazard Detail

```http
GET /hazards/{hazard_id}
```

**Response (200 OK):**
```json
{
  "id": "hzd_4471",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "severity": 3,
  "status": "confirmed",
  "confirmations": 31,
  "first_reported": "2026-01-30T10:15:00Z",
  "last_confirmed": "2026-03-12T08:20:00Z",
  "water_detected": true,
  "yolo_detections": 8,
  "yolo_confidence": 0.94,
  "reports": [
    {
      "report_id": "rpt_1001",
      "timestamp": "2026-01-30T10:15:00Z",
      "severity": 3,
      "detection_method": "accelerometer"
    }
  ],
  "contractor": {
    "name": "ABC Construction Ltd",
    "contract_id": "PWD/2023/456",
    "contract_value": 120000000,
    "dlp_end_date": "2027-06-30",
    "warranty_breached": true,
    "performance_score": 28
  },
  "damage_estimate": {
    "vehicle_damage": 840000,
    "traffic_cost_per_day": 630000,
    "total_cost": 25800000,
    "days_unresolved": 41,
    "vehicles_affected_daily": 4200
  },
  "satellite_check": {
    "last_checked": "2026-03-10T12:00:00Z",
    "fraud_detected": true,
    "reason": "Claimed repair not visible in Sentinel-2 imagery"
  }
}
```

---

### 5. Get Safe Route

```http
POST /routing/safe-route
```

**Request Body:**
```json
{
  "origin": {
    "latitude": 28.5355,
    "longitude": 77.3910
  },
  "destination": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "preferences": {
    "prioritize_safety": true,
    "max_time_addition": 10
  }
}
```

**Response (200 OK):**
```json
{
  "routes": [
    {
      "id": "route_fastest",
      "type": "fastest",
      "duration_minutes": 28,
      "distance_km": 15.3,
      "road_score": 3.8,
      "traffic_level": "moderate",
      "hazards_on_route": 3,
      "severity_breakdown": {
        "s1": 2,
        "s2": 0,
        "s3": 1
      },
      "polyline": "encoded_polyline_string",
      "warnings": [
        "Severity 3 water-filled pothole at 8.2km"
      ]
    },
    {
      "id": "route_safe",
      "type": "safe",
      "duration_minutes": 32,
      "distance_km": 16.8,
      "road_score": 9.1,
      "traffic_level": "light",
      "hazards_on_route": 0,
      "severity_breakdown": {
        "s1": 0,
        "s2": 0,
        "s3": 0
      },
      "polyline": "encoded_polyline_string",
      "recommended": true
    }
  ],
  "weather_alert": {
    "rain_expected": true,
    "time": "09:00-11:00",
    "severity": "moderate"
  }
}
```

---

### 6. Get Location Alerts

```http
GET /location/alerts?lat=28.6139&lon=77.2090&radius=500
```

**Query Parameters:**
- `lat` (required): User latitude
- `lon` (required): User longitude
- `radius` (optional): Alert radius in metres (default: 400)

**Response (200 OK):**
```json
{
  "alerts": [
    {
      "hazard_id": "hzd_4471",
      "distance_metres": 280,
      "bearing": 45,
      "direction": "northeast",
      "severity": 2,
      "water_detected": false,
      "lane_position": "centre",
      "alert_level": "warning",
      "message": "Pothole ahead — 280 metres. Severity 2. Centre lane. Confirmed by 14 riders. Move left."
    }
  ],
  "count": 1
}
```

---

### 7. Get Contractor Performance

```http
GET /contractors/{contractor_id}/score
```

**Response (200 OK):**
```json
{
  "contractor_id": "cnt_123",
  "name": "ABC Construction Ltd",
  "overall_score": 28,
  "components": {
    "warranty_breach_rate": 45,
    "mean_time_to_reappear_days": 180,
    "satellite_fraud_rate": 35,
    "resolution_speed_hours": 120
  },
  "active_contracts": 3,
  "total_contract_value": 310000000,
  "roads_managed": 47,
  "unresolved_hazards": 23,
  "status": "ineligible_for_new_contracts",
  "audit_required": true
}
```

---

### 8. File Damage Claim

```http
POST /claims
```

**Request Body:**
```json
{
  "hazard_id": "hzd_4471",
  "user_id": "usr_789",
  "damage_amount": 6000,
  "damage_type": "suspension",
  "repair_bill_url": "https://s3.amazonaws.com/bills/bill_789.jpg",
  "vehicle_details": {
    "make": "Honda",
    "model": "Activa",
    "registration": "DL-8C-XX-1234"
  }
}
```

**Response (201 Created):**
```json
{
  "claim_id": "clm_456",
  "status": "submitted",
  "legal_notice_generated": true,
  "notice_sent_to": "PWD Junior Engineer - Mehrauli Division",
  "expected_resolution_days": 15,
  "next_steps": [
    "Notice delivered to PWD within 24 hours",
    "Response expected within 7 days",
    "Auto-escalation after 15 days if unresolved"
  ],
  "evidence_package_url": "https://api.sadaksaathi.in/claims/clm_456/evidence"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid latitude value",
  "details": {
    "field": "latitude",
    "value": 91.5,
    "constraint": "must be between -90 and 90"
  }
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Hazard with ID hzd_99999 not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "rate_limit_exceeded",
  "message": "API rate limit exceeded. Try again in 60 seconds.",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred. Please try again later.",
  "request_id": "req_abc123"
}
```

---

## Rate Limits

| Tier | Limit | Usage |
|------|-------|-------|
| Free | 100 req/min | Individual developers |
| Partner | 1000 req/min | Delivery companies |
| Enterprise | Custom | Government agencies |

---

## Webhooks (Coming Soon)

Subscribe to events:
- `hazard.confirmed` — New hazard confirmed (3+ reports)
- `hazard.resolved` — Hazard marked as resolved
- `contractor.breach` — Warranty breach detected
- `fraud.detected` — Satellite fraud detection triggered

---

## SDKs

### Python
```bash
pip install sadaksaathi
```

```python
from sadaksaathi import SadakSaathiClient

client = SadakSaathiClient(api_key="your_api_key")

# Get hazards
hazards = client.get_hazards(
    bbox=(28.5, 28.7, 77.1, 77.3),
    severity=[2, 3]
)

# Submit report
client.submit_report(
    lat=28.6139,
    lon=77.2090,
    severity=2,
    impact_force=14.5
)
```

### JavaScript/TypeScript
```bash
npm install sadaksaathi-js
```

```javascript
import { SadakSaathiClient } from 'sadaksaathi-js';

const client = new SadakSaathiClient({ apiKey: 'your_api_key' });

// Get hazards
const hazards = await client.getHazards({
  bbox: [28.5, 28.7, 77.1, 77.3],
  severity: [2, 3]
});

// Submit report
await client.submitReport({
  lat: 28.6139,
  lon: 77.2090,
  severity: 2,
  impactForce: 14.5
});
```

---

## Support

- **Interactive Docs:** `http://localhost:8000/docs` (Swagger UI)
- **API Issues:** [GitHub Issues](https://github.com/Goyam02/Sadak-Sathi/issues)
- **Email:** api@sadaksaathi.in
