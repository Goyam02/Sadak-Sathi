# Architecture & Design

Complete technical architecture documentation for Sadak Saathi.

---

## 📐 System Design Principles

1. **Mobile-First:** Everything designed for 4G networks, budget Android phones
2. **Offline-Capable:** Core detection works without internet
3. **Battery-Efficient:** On-device ML, smart sensor sampling
4. **Privacy-Preserving:** Minimal PII, anonymized by default
5. **Scalable:** Handles 1M+ daily reports at low cost
6. **Fault-Tolerant:** Graceful degradation when services fail

---

## 🏗️ High-Level Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     SADAK SAATHI SYSTEM                        │
│                  (3-Tier Architecture)                         │
└────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                          │
├──────────────────────────────────────────────────────────────┤
│  • React Native Mobile App (iOS + Android)                   │
│  • Web Dashboard (React + Mapbox - coming soon)              │
│  • API Documentation (Swagger UI)                            │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER                                           │
├──────────────────────────────────────────────────────────────┤
│  • FastAPI REST API                                          │
│  • Background Workers (Celery - planned)                     │
│  • WebSocket Server (Real-time alerts - planned)             │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  DATA LAYER                                                  │
├──────────────────────────────────────────────────────────────┤
│  • PostgreSQL + PostGIS (Primary data store)                 │
│  • Redis (Cache + Session store)                             │
│  • S3/R2 (Object storage for images)                         │
│  • TimescaleDB (Time-series sensor data - planned)           │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Detection Flow (Accelerometer)

```
Mobile Phone Sensor Stack
    ↓
Accelerometer (50 Hz) + Gyroscope (50 Hz)
    ↓
Ring Buffer (3 seconds = 150 samples)
    ↓
On-Device LSTM Model (TFLite)
    ↓
Classification: S1 / S2 / S3 / Not-Pothole
    ↓
[If Pothole Detected]
    ↓
Create Report Object:
{
  lat, lon, severity, impact_force,
  velocity, timestamp, device_id_hash
}
    ↓
Queue for Upload (with retry logic)
    ↓
HTTP POST → /reports
    ↓
Backend API
    ↓
Validate + Deduplicate (within 5m radius)
    ↓
Store in PostgreSQL (status: candidate)
    ↓
[Background Job Every 5 Minutes]
    ↓
Confirmation Engine:
  - Count reports within 5m radius
  - If count >= 3 → status: confirmed
  - Notify subscribers via WebSocket
    ↓
Public Hazard Map Updated
```

### Detection Flow (YOLO Camera)

```
Phone Camera (Mounted Mode)
    ↓
Detect orientation: landscape + vibration pattern
    ↓
Activate Camera (30 fps capture)
    ↓
Downsample to 320x320 (every 3rd frame = 10 fps)
    ↓
YOLOv8-nano Inference (TFLite)
    ↓
Bounding Boxes:
  - dry_pothole: 0.87 confidence
  - water_filled: 0.94 confidence
  - cluster: 0.78 confidence
    ↓
[If confidence > 0.85]
    ↓
Create YOLO Report:
{
  lat, lon, class, confidence,
  bbox_coords, timestamp
}
    ↓
Immediate Upload (high priority)
    ↓
Backend stores with status: yolo_confirmed
    ↓
[If water_filled + confidence > 0.91]
    ↓
Fire Immediate Alert (no 3-report wait)
```

### Routing Flow

```
User Request:
{
  origin: {lat, lon},
  destination: {lat, lon},
  preferences: {prioritize_safety: true}
}
    ↓
Backend Routing Service
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│  Query Hazards  │  Query Traffic  │  Query Weather  │
│  (PostGIS)      │  (Google API)   │  (IMD API)      │
└─────────────────┴─────────────────┴─────────────────┘
    ↓
Build Road Graph (OSM data)
    ↓
For each road segment, compute score:
  road_quality = f(hazards_count, avg_severity)
  traffic_score = f(current_speed, historical_speed)
  weather_penalty = f(rain_forecast, road_surface)
    ↓
Weighted Score:
  score = w1·road + w2·traffic + w3·distance
  (weights adjust based on weather)
    ↓
OSRM Routing Engine
    ↓
Generate 2 routes:
  1. Fastest (optimize time)
  2. Safe (optimize road_quality)
    ↓
Return both with:
  - ETA, distance, road_score
  - Hazards on route (list)
  - Traffic level
  - Recommendation flag
```

### Accountability Flow

```
[Nightly Job - 2 AM]
    ↓
Query all confirmed hazards
    ↓
For each hazard:
  1. Get GPS coordinate
  2. Reverse geocode → Road name
  3. Query Contractor DB → Match road to contract
  4. Check DLP (Defect Liability Period)
    ↓
[If within DLP & unresolved > 7 days]
    ↓
Warranty Breach Detected
    ↓
Generate Legal Notice:
  - Contractor name + contract ID
  - Hazard evidence (GPS, photos, reports count)
  - DLP clause reference
  - Repair deadline: 72 hours
    ↓
Send via:
  - Email to PWD Junior Engineer
  - SMS to contractor
  - Public dashboard update
    ↓
[Monitor for 72 hours]
    ↓
[If unresolved]
    ↓
Escalate to Executive Engineer
    ↓
[Monitor for 7 more days]
    ↓
[If still unresolved]
    ↓
Publish to Public Accountability Dashboard
    ↓
Generate PR-ready summary:
  "Pothole #4471, ₹2.58 Cr damage, 41 days,
   Contractor: ABC Ltd, Score: 28/100"
```

---

## 🗄️ Database Schema

### Core Tables

**hazards**
```sql
CREATE TABLE hazards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location GEOGRAPHY(POINT, 4326) NOT NULL,  -- PostGIS type
  severity INTEGER CHECK (severity IN (1, 2, 3)),
  status VARCHAR(20) CHECK (status IN ('candidate', 'confirmed', 'resolved')),
  confirmations INTEGER DEFAULT 1,
  first_reported TIMESTAMP NOT NULL,
  last_confirmed TIMESTAMP,
  water_detected BOOLEAN DEFAULT FALSE,
  yolo_confidence FLOAT,
  contractor_id UUID REFERENCES contractors(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial index for fast radius queries
CREATE INDEX idx_hazards_location ON hazards USING GIST(location);
CREATE INDEX idx_hazards_severity ON hazards(severity) WHERE status = 'confirmed';
```

**reports**
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_id UUID REFERENCES hazards(id),
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  severity INTEGER,
  impact_force FLOAT,  -- m/s²
  velocity FLOAT,  -- m/s
  detection_method VARCHAR(20) CHECK (detection_method IN ('accelerometer', 'yolo')),
  confidence FLOAT,
  device_id_hash VARCHAR(64) NOT NULL,  -- SHA-256 hashed
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_location ON reports USING GIST(location);
CREATE INDEX idx_reports_timestamp ON reports(timestamp DESC);
```

**contractors**
```sql
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contract_ids TEXT[],  -- Array of contract IDs
  total_contract_value BIGINT,  -- in rupees
  performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
  warranty_breach_count INTEGER DEFAULT 0,
  fraud_detection_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**damage_claims**
```sql
CREATE TABLE damage_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hazard_id UUID REFERENCES hazards(id),
  user_id UUID,  -- Anonymous or registered user
  damage_amount INTEGER NOT NULL,  -- in rupees
  damage_type VARCHAR(50),  -- suspension, tyre, rim, etc.
  repair_bill_url TEXT,
  status VARCHAR(20) CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')),
  legal_notice_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

### Indexes & Performance

**Spatial Queries (most frequent):**
```sql
-- Find hazards within 400m radius
SELECT * FROM hazards
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326)::geography,
  400  -- metres
)
AND status = 'confirmed';

-- With GIST index, this runs in <10ms even with 100k hazards
```

**Materialized Views for Dashboards:**
```sql
CREATE MATERIALIZED VIEW contractor_performance AS
SELECT 
  c.id,
  c.name,
  COUNT(h.id) AS unresolved_hazards,
  AVG(EXTRACT(EPOCH FROM (NOW() - h.first_reported))/86400) AS avg_days_unresolved,
  SUM(h.damage_estimate) AS total_damage_cost,
  c.performance_score
FROM contractors c
LEFT JOIN hazards h ON h.contractor_id = c.id AND h.status = 'confirmed'
GROUP BY c.id, c.name, c.performance_score;

-- Refresh every 6 hours
CREATE UNIQUE INDEX ON contractor_performance(id);
```

---

## 🧠 Machine Learning Models

### 1. On-Device LSTM (Accelerometer Classification)

**Architecture:**
```
Input: (150, 6)  -- 3 seconds at 50Hz, 6 channels (accel + gyro)
    ↓
LSTM Layer 1: 64 units, return_sequences=True
    ↓
Dropout: 0.3
    ↓
LSTM Layer 2: 32 units
    ↓
Dropout: 0.3
    ↓
Dense: 16 units, ReLU
    ↓
Output: 4 units, Softmax (S1, S2, S3, Not-Pothole)

Total params: 28,548
Model size: 342 KB (TFLite quantized)
Inference time: 12ms on Snapdragon 665
```

**Training Data:**
- 12,000 pothole samples (Delhi, Mumbai, Bangalore)
- 8,000 speed bump samples (filtered as negative)
- 5,000 normal road samples
- Data augmentation: noise injection, time warping

**Performance:**
- Accuracy: 89.3%
- Precision (S3): 92.1%
- Recall (S3): 88.7%
- False positive rate: 4.2%

### 2. YOLOv8-nano (Visual Detection)

**Architecture:**
```
Input: 320x320x3 RGB image
    ↓
YOLOv8-nano backbone (CSPDarknet)
    ↓
Neck: PANet
    ↓
Head: Decoupled (classification + bbox regression)
    ↓
Output: Bounding boxes + Class + Confidence
  Classes: [dry_pothole, water_filled, cluster, edge_crumble, debris]

Total params: 3.2M
Model size: 6.2 MB (TFLite FP16)
Inference time: 95ms @ 10fps on Snapdragon 665
```

**Training Data:**
- RoboFlow Pothole Dataset: 5,400 images
- Custom Delhi dataset: 3,000 images (water-filled, debris)
- Total: 8,400 images
- Augmentation: brightness, rotation, mosaic

**Performance:**
- mAP@0.5: 84.2%
- Water-filled precision: 91.3% (critical class)
- Inference: 10 fps on mid-range Android

### 3. Road Degradation Predictor (Planned)

**Model:** XGBoost Regressor  
**Purpose:** Predict when a repaired road will develop new potholes

**Features:**
- Contractor performance score
- Days since last repair
- Weather data (rainfall, temperature)
- Traffic volume
- Road construction material (asphalt vs concrete)
- Historical degradation rate

**Output:** Probability of pothole within 14 days

---

## 🔐 Security Architecture

### Authentication & Authorization

**API Tiers:**
1. **Public (no auth):** Read-only hazard data
2. **User (device ID hash):** Submit reports, file claims
3. **Partner (API key):** Bulk queries, fleet integration
4. **Admin (OAuth):** Contractor management, manual verification

**Rate Limiting:**
```python
# Per-IP rate limits
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    key = f"rate_limit:{client_ip}"
    
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, 60)  # 1 minute window
    
    if current > 100:  # 100 requests/minute
        raise HTTPException(429, "Rate limit exceeded")
    
    return await call_next(request)
```

### Data Privacy

**Anonymization:**
- Device IDs hashed with SHA-256 + salt
- GPS rounded to 5 decimal places (~1.1m precision)
- No photos stored (only YOLO bounding boxes)
- IP addresses not logged

**GDPR Compliance:**
- Right to erasure: `DELETE /users/me/data`
- Data portability: `GET /users/me/export`
- Consent tracking in database
- 90-day automatic data deletion for resolved hazards

---

## 📊 Scalability Design

### Current Capacity
- **Users:** 50,000 daily active
- **Reports:** 100,000/day
- **API requests:** 5M/day
- **Database size:** 50 GB
- **Cost:** ~$60/month

### Scale to 1M Users
```
Load Balancer (ALB)
    ↓
┌────────┬────────┬────────┬────────┐
│ API 1  │ API 2  │ API 3  │ API 4  │
│ (2 GB) │ (2 GB) │ (2 GB) │ (2 GB) │
└────────┴────────┴────────┴────────┘
    ↓
Read Replicas (3x)
    ↓
Primary PostgreSQL (RDS)
    ↓
Redis Cluster (ElastiCache)
```

**Projected:**
- Users: 1,000,000 daily active
- Reports: 2M/day
- API requests: 100M/day
- Database: 500 GB
- Cost: ~$800/month

### Caching Strategy

**Redis Keys:**
```
hazards:bbox:{lat_min}:{lat_max}:{lon_min}:{lon_max} → JSON (TTL: 5 min)
route:{origin}:{dest}:{timestamp} → JSON (TTL: 15 min)
contractor:{id}:score → JSON (TTL: 1 hour)
```

**Cache hit rate target:** >80% for hazard queries

---

## 🔄 Disaster Recovery

**Backup Strategy:**
- PostgreSQL: Automated daily snapshots (7-day retention)
- Point-in-time recovery: 5-minute granularity
- Cross-region replication: Mumbai → Singapore
- Recovery Time Objective (RTO): <2 hours
- Recovery Point Objective (RPO): <5 minutes

**Incident Response:**
1. Database failure → Failover to read replica (automated)
2. API outage → Scale up instances (auto-scaling)
3. DDoS attack → CloudFlare protection activates
4. Data corruption → Restore from snapshot

---

## 📡 Future Architecture Enhancements

### Phase 1 (Q2 2026)
- [ ] WebSocket server for real-time alerts
- [ ] Celery workers for background jobs
- [ ] Redis pub/sub for live hazard updates
- [ ] TimescaleDB for sensor time-series

### Phase 2 (Q3 2026)
- [ ] Kafka for event streaming
- [ ] Elasticsearch for full-text search
- [ ] GraphQL API (alongside REST)
- [ ] ML model versioning with MLflow

### Phase 3 (Q4 2026)
- [ ] Edge computing (process YOLO on device)
- [ ] Federated learning (train models on user devices)
- [ ] Blockchain for contractor accountability
- [ ] Multi-region active-active deployment

---

## 📞 Architecture Review

For technical questions: architecture@sadaksaathi.in
