# Deployment Guide

Complete guide to deploying Sadak Saathi to production.

---

## 🎯 Deployment Overview

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRODUCTION STACK                         │
└─────────────────────────────────────────────────────────────────┘

                          USERS (Mobile App)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   CDN (CloudFlare)     │
                    │   - Static assets      │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Load Balancer        │
                    │   (Railway / Nginx)    │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐
         │  FastAPI         │      │  FastAPI         │
         │  Instance 1      │      │  Instance 2      │
         └──────────────────┘      └──────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 ▼
                    ┌────────────────────────┐
                    │  PostgreSQL + PostGIS  │
                    │  (NeonDB / AWS RDS)    │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
         ┌──────────────────┐      ┌──────────────────┐
         │  Redis           │      │  Object Storage  │
         │  (Upstash)       │      │  (S3 / R2)       │
         └──────────────────┘      └──────────────────┘
```

---

## 🚀 Backend Deployment

### Option 1: Railway (Recommended)

**Why Railway:**
- Easy PostgreSQL + Redis setup
- Auto-scaling
- Free tier: $5/month credit
- Git-based deployments

**Steps:**

1. **Sign up at railway.app**

2. **Create new project:**
   ```bash
   railway login
   cd sadak-saathi-backend
   railway init
   ```

3. **Add PostgreSQL:**
   ```bash
   railway add
   # Select: PostgreSQL
   ```

4. **Add Redis:**
   ```bash
   railway add
   # Select: Redis
   ```

5. **Set environment variables:**
   ```bash
   railway variables set GOOGLE_MAPS_API_KEY=your_key
   railway variables set AZURE_VISION_KEY=your_key
   ```

   Railway auto-provides:
   - `DATABASE_URL` (PostgreSQL)
   - `REDIS_URL`

6. **Enable PostGIS:**
   ```bash
   railway connect PostgreSQL
   # In psql:
   CREATE EXTENSION IF NOT EXISTS postgis;
   \q
   ```

7. **Deploy:**
   ```bash
   railway up
   ```

8. **Run migrations:**
   ```bash
   railway run alembic upgrade head
   ```

9. **Get public URL:**
   ```bash
   railway domain
   # Outputs: https://sadak-saathi-production.up.railway.app
   ```

**Auto-deploy on git push:**
```bash
# Link to GitHub repo
railway link

# Now every push to main auto-deploys
git push origin main
```

---

### Option 2: AWS (Production Scale)

**Stack:**
- **Compute:** ECS Fargate (Docker containers)
- **Database:** RDS PostgreSQL with PostGIS
- **Cache:** ElastiCache Redis
- **Storage:** S3
- **CDN:** CloudFront

**Architecture:**
```
ALB → ECS Fargate (2+ tasks) → RDS PostgreSQL
                              → ElastiCache Redis
                              → S3 (for YOLO model weights)
```

**Deployment steps:**

1. **Create RDS PostgreSQL:**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier sadak-saathi-db \
     --db-instance-class db.t3.medium \
     --engine postgres \
     --engine-version 16.1 \
     --master-username admin \
     --master-user-password YourSecurePassword \
     --allocated-storage 100 \
     --publicly-accessible false \
     --vpc-security-group-ids sg-xxxxxxxx
   ```

2. **Enable PostGIS:**
   ```sql
   -- Connect to RDS
   psql -h your-rds-endpoint.rds.amazonaws.com -U admin -d postgres
   CREATE EXTENSION postgis;
   ```

3. **Create ECR repository:**
   ```bash
   aws ecr create-repository --repository-name sadak-saathi-backend
   ```

4. **Build and push Docker image:**
   ```bash
   cd sadak-saathi-backend
   
   # Build
   docker build -t sadak-saathi-backend .
   
   # Tag
   docker tag sadak-saathi-backend:latest \
     123456789.dkr.ecr.ap-south-1.amazonaws.com/sadak-saathi-backend:latest
   
   # Push
   docker push 123456789.dkr.ecr.ap-south-1.amazonaws.com/sadak-saathi-backend:latest
   ```

5. **Create ECS task definition:**
   ```json
   {
     "family": "sadak-saathi-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "123456789.dkr.ecr.ap-south-1.amazonaws.com/sadak-saathi-backend:latest",
         "portMappings": [
           {
             "containerPort": 8000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           { "name": "DATABASE_URL", "value": "postgresql://..." },
           { "name": "REDIS_URL", "value": "redis://..." }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/sadak-saathi",
             "awslogs-region": "ap-south-1",
             "awslogs-stream-prefix": "backend"
           }
         }
       }
     ]
   }
   ```

6. **Create ECS service:**
   ```bash
   aws ecs create-service \
     --cluster sadak-saathi-cluster \
     --service-name backend \
     --task-definition sadak-saathi-backend \
     --desired-count 2 \
     --launch-type FARGATE \
     --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=backend,containerPort=8000
   ```

**Cost estimate (Mumbai region):**
- RDS db.t3.medium: ~$60/month
- ECS Fargate (2 tasks): ~$40/month
- ElastiCache Redis: ~$15/month
- ALB: ~$20/month
- **Total: ~$135/month**

---

### Option 3: DigitalOcean App Platform

**Why DigitalOcean:**
- Simple, affordable
- Managed PostgreSQL + Redis
- $12/month for basic setup

**Steps:**

1. **Create account at digitalocean.com**

2. **Create App:**
   - Select GitHub repo
   - Choose branch: `main`
   - Autodeploy: ON

3. **Configure services:**
   - **Web Service:**
     - Run command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
     - HTTP port: 8080
     - Instance size: Basic ($12/month)
   
   - **Database:**
     - PostgreSQL 16
     - Size: Basic ($15/month)
   
   - **Redis:**
     - Managed Redis ($15/month)

4. **Set environment variables:**
   ```
   DATABASE_URL=${db.DATABASE_URL}
   REDIS_URL=${redis.REDIS_URL}
   GOOGLE_MAPS_API_KEY=your_key
   ```

5. **Enable PostGIS:**
   ```bash
   # Connect via connection string
   psql "${db.DATABASE_URL}"
   CREATE EXTENSION postgis;
   ```

6. **Deploy:**
   - DigitalOcean auto-deploys on git push

**Cost:** ~$42/month (Basic + DB + Redis)

---

## 📱 Mobile App Deployment

### Build with Expo EAS

**Prerequisites:**
```bash
npm install -g eas-cli
eas login
```

### Step 1: Configure EAS Build

```bash
cd SadakSaathi
eas build:configure
```

This creates `eas.json`:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "BACKEND_URL": "https://api.sadaksaathi.in",
        "GOOGLE_MAPS_API_KEY": "your_production_key"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./service-account.json"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      }
    }
  }
}
```

### Step 2: Build for Android

```bash
# Preview build (APK for testing)
eas build --platform android --profile preview

# Production build (AAB for Play Store)
eas build --platform android --profile production
```

**Download APK:**
```bash
# EAS provides download link after build completes
# Share APK link for internal testing
```

### Step 3: Build for iOS

**Requirements:**
- Apple Developer account ($99/year)
- App Store Connect access

```bash
# Register devices for internal testing
eas device:create

# Build for TestFlight
eas build --platform ios --profile production
```

### Step 4: Submit to Stores

**Android (Google Play):**
```bash
eas submit --platform android --profile production
```

**Manual steps:**
1. Create app listing in Play Console
2. Add screenshots (use `docs/screenshots/`)
3. Write app description (see below)
4. Set content rating: PEGI 3
5. Submit for review (usually 3-5 days)

**iOS (App Store):**
```bash
eas submit --platform ios --profile production
```

**Manual steps:**
1. Create app in App Store Connect
2. Add screenshots for all device sizes
3. Write app description
4. Privacy policy URL (required)
5. Submit for review (usually 24-48 hours)

---

### App Store Listing

**Name:** Sadak Saathi - Road Safety  
**Subtitle:** Delhi's Two-Wheeler Safety Network  
**Keywords:** pothole, road safety, navigation, motorcycle, scooter, delivery, traffic

**Description:**

```
Sadak Saathi protects two-wheeler riders from potholes and road hazards across Delhi.

WHY SADAK SAATHI?
• Voice alerts 400m before every pothole
• Water-filled pothole detection (AI camera)
• Safe route recommendations
• Morning brief with road conditions
• Damage recovery assistance

HOW IT WORKS
Your phone detects potholes automatically using motion sensors and camera (optional). No manual reporting needed. The more riders use it, the safer everyone becomes.

FEATURES
✓ Live hazard alerts over any app
✓ Fastest vs Safe route comparison
✓ Community map (847+ potholes detected)
✓ Contractor accountability with damage costs
✓ Works in background for delivery riders

FOR DELIVERY RIDERS
Zomato, Swiggy, Zepto, Blinkit riders: Install once, runs automatically while you deliver. Zero behavior change needed.

PRIVACY
We don't collect personal data. Only anonymized location when hazards are detected. No tracking, no ads, no data selling.

Join 50,000+ riders making Delhi's roads safer.
```

**Screenshots required:** 6 (see `docs/screenshots/README.md`)

---

## 🔐 Security Checklist

Before production:

- [ ] Change all default passwords
- [ ] Use environment variables (never commit secrets)
- [ ] Enable SSL/TLS (HTTPS only)
- [ ] Set up API rate limiting
- [ ] Enable CORS with specific origins
- [ ] Add API authentication (API keys for partners)
- [ ] Set up WAF (Web Application Firewall)
- [ ] Enable database encryption at rest
- [ ] Set up automated backups
- [ ] Configure secrets management (AWS Secrets Manager / Vault)
- [ ] Add security headers (HSTS, CSP, X-Frame-Options)
- [ ] Set up DDoS protection (CloudFlare)
- [ ] Enable audit logging
- [ ] Conduct security audit / pen test

---

## 📊 Monitoring & Observability

### Application Monitoring (Sentry)

```bash
pip install sentry-sdk[fastapi]
```

```python
# app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn="https://your-sentry-dsn",
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment="production"
)
```

### Infrastructure Monitoring (Grafana + Prometheus)

**Docker Compose addition:**
```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

**Prometheus config:**
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sadak-saathi-backend'
    static_configs:
      - targets: ['backend:8000']
```

### Logging (CloudWatch / ELK Stack)

**CloudWatch (AWS):**
```python
import watchtower
import logging

logger = logging.getLogger(__name__)
logger.addHandler(watchtower.CloudWatchLogHandler())
```

**ELK Stack (self-hosted):**
```yaml
# docker-compose.yml
  elasticsearch:
    image: elasticsearch:8.11.0
  
  logstash:
    image: logstash:8.11.0
  
  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd sadak-saathi-backend
          pip install -r requirements.txt
          pip install pytest
      
      - name: Run tests
        run: |
          cd sadak-saathi-backend
          pytest tests/ -v
  
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up
  
  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install EAS CLI
        run: npm install -g eas-cli
      
      - name: Build and submit
        run: |
          cd SadakSaathi
          eas build --platform android --non-interactive --no-wait
```

---

## 📦 Database Migrations

**Production migration strategy:**

1. **Test migrations locally:**
   ```bash
   alembic upgrade head
   alembic downgrade -1
   alembic upgrade head
   ```

2. **Backup production database:**
   ```bash
   pg_dump -h prod-db.example.com -U admin sadak_saathi > backup_$(date +%Y%m%d).sql
   ```

3. **Run migration in maintenance window:**
   ```bash
   railway run alembic upgrade head
   # or
   kubectl exec -it backend-pod -- alembic upgrade head
   ```

4. **Verify migration:**
   ```sql
   SELECT version_num FROM alembic_version;
   -- Should match latest migration
   ```

---

## 🌍 Multi-Region Deployment (Future)

For scaling to multiple cities:

```
Mumbai → AWS Mumbai (ap-south-1)
Bangalore → AWS Mumbai (ap-south-1)
Delhi → AWS Mumbai (ap-south-1)

Global:
- Primary: ap-south-1 (Mumbai)
- DR: ap-southeast-1 (Singapore)
- CDN: CloudFront with edge locations across India
```

---

## 💰 Cost Optimization

1. **Use serverless where possible:** Lambda for infrequent tasks
2. **Auto-scaling:** Scale down during night hours (2 AM - 6 AM)
3. **Cache aggressively:** Redis for hazard queries
4. **Compress images:** Use WebP for YOLO images
5. **CDN for static assets:** CloudFlare R2 (free tier)
6. **Reserved instances:** 40% discount for 1-year commitment
7. **Spot instances:** For ML training (not production API)

**Estimated monthly cost (5000 MAU):**
- Railway (backend + DB + Redis): $25
- AWS S3 (images): $5
- CloudFlare CDN: $0 (free tier)
- Sentry: $26 (Team plan)
- **Total: ~$56/month**

---

## 📞 Support

Deployment issues? Contact devops@sadaksaathi.in
