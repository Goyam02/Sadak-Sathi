# 📦 Documentation Index

Welcome to Sadak Saathi's comprehensive documentation. This index helps you find what you need quickly.

---

## 🚀 Quick Start

**New to the project?** Start here:
1. Read [README_FULL.md](../README_FULL.md) — Complete project overview
2. Run [quickstart.sh](../quickstart.sh) — Automated setup script
3. Follow setup guides below

---

## 📚 Documentation Files

### Essential Docs

| Document | Description | Audience |
|----------|-------------|----------|
| [README_FULL.md](../README_FULL.md) | Complete project documentation | Everyone |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute code | Developers |
| [LICENSE](../LICENSE) | MIT License | Legal/Developers |

### Technical Docs

| Document | Description | Audience |
|----------|-------------|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design & data flow | Engineers/Architects |
| [API.md](API.md) | REST API documentation | Backend devs/Integrators |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment guide | DevOps/SRE |

### Guides & References

| Document | Description | Audience |
|----------|-------------|----------|
| [screenshots/README.md](screenshots/README.md) | Screenshot guidelines | Designers/Marketers |
| Backend [README.md](../sadak-saathi-backend/README.md) | Backend-specific docs | Backend devs |
| Mobile [runMe.md](../SadakSaathi/runMe.md) | Mobile app setup | Mobile devs |

---

## 🎯 Documentation by Role

### I'm a **Backend Developer**

Start with:
1. [README_FULL.md](../README_FULL.md) — Section: Backend Setup
2. [ARCHITECTURE.md](ARCHITECTURE.md) — Database schema, API design
3. [API.md](API.md) — Endpoint specifications
4. [CONTRIBUTING.md](../CONTRIBUTING.md) — Coding standards (Python)

Key files to explore:
- `sadak-saathi-backend/app/main.py` — FastAPI app entry
- `sadak-saathi-backend/app/api/` — API endpoints
- `sadak-saathi-backend/app/models/` — SQLAlchemy models
- `sadak-saathi-backend/app/services/` — Business logic

### I'm a **Mobile Developer**

Start with:
1. [README_FULL.md](../README_FULL.md) — Section: Mobile App Setup
2. [CONTRIBUTING.md](../CONTRIBUTING.md) — Coding standards (TypeScript)
3. [API.md](API.md) — Backend API you'll call

Key files to explore:
- `SadakSaathi/App.tsx` — App entry point
- `SadakSaathi/src/screens/` — UI screens
- `SadakSaathi/src/services/` — Sensor services (LSTM, YOLO)
- `SadakSaathi/src/api/` — API client

### I'm a **Data Scientist / ML Engineer**

Start with:
1. [ARCHITECTURE.md](ARCHITECTURE.md) — Section: Machine Learning Models
2. Backend YOLO training docs: `sadak-saathi-backend/yolo_training/README.md`

Key files to explore:
- `sadak-saathi-backend/yolo_training/train.py` — YOLO training script
- `runs/detect/` — Training runs and model weights
- `SadakSaathi/src/services/AccelerometerService.ts` — LSTM inference

### I'm a **DevOps / SRE**

Start with:
1. [DEPLOYMENT.md](DEPLOYMENT.md) — Complete deployment guide
2. [ARCHITECTURE.md](ARCHITECTURE.md) — Section: Scalability & DR
3. `sadak-saathi-backend/docker-compose.yml` — Local services

Key topics:
- Railway deployment (easiest)
- AWS deployment (production scale)
- Monitoring & observability
- Database backups & migrations
- Security checklist

### I'm a **Designer / Product Manager**

Start with:
1. [README_FULL.md](../README_FULL.md) — Section: Overview & Features
2. [screenshots/README.md](screenshots/README.md) — Screenshot requirements
3. [README_FULL.md](../README_FULL.md) — Section: Demo Guide (3 acts)

Key screens to design:
- Morning Brief
- Route Selection (Fastest vs Safe)
- Live Navigation + Hazard Alert
- Pothole Detail / Accountability
- Community Map

### I'm a **QA / Tester**

Start with:
1. [README_FULL.md](../README_FULL.md) — Section: Running Tests
2. [API.md](API.md) — API endpoints to test
3. Backend test files: `sadak-saathi-backend/tests/`

Test coverage areas:
- Accelerometer detection accuracy
- YOLO camera detection
- API endpoints (CRUD operations)
- Route scoring algorithm
- Damage claim flow

---

## 📖 Reading Paths by Goal

### Goal: Get the App Running Locally (30 minutes)

1. ✅ Check prerequisites (Python 3.11+, Node 18+, Docker)
2. ✅ Run `./quickstart.sh` (automated setup)
3. ✅ Edit `.env` files with API keys
4. ✅ Start backend: `uvicorn app.main:app --reload`
5. ✅ Start mobile: `npx expo start`
6. ✅ Scan QR code with Expo Go

### Goal: Understand the Architecture (45 minutes)

1. Read [ARCHITECTURE.md](ARCHITECTURE.md) — Section: High-Level Architecture
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) — Section: Data Flow
3. Read [ARCHITECTURE.md](ARCHITECTURE.md) — Section: Database Schema
4. Explore backend code: `app/models/`, `app/services/`

### Goal: Deploy to Production (2 hours)

1. Read [DEPLOYMENT.md](DEPLOYMENT.md) — Section: Backend Deployment (Railway)
2. Set up NeonDB (PostgreSQL with PostGIS)
3. Deploy backend to Railway
4. Read [DEPLOYMENT.md](DEPLOYMENT.md) — Section: Mobile App Deployment
5. Build with EAS: `eas build --platform android`
6. Read [DEPLOYMENT.md](DEPLOYMENT.md) — Section: Security Checklist

### Goal: Contribute Code (Ongoing)

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md) — Complete guide
2. Pick an issue: [GitHub Issues](https://github.com/Goyam02/Sadak-Sathi/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
3. Fork repo & create branch
4. Make changes following coding standards
5. Add tests
6. Submit PR with clear description

---

## 🔍 Find Documentation by Topic

### Detection & ML
- LSTM model: [ARCHITECTURE.md](ARCHITECTURE.md#machine-learning-models)
- YOLO training: `sadak-saathi-backend/yolo_training/README.md`
- Sensor fusion: [ARCHITECTURE.md](ARCHITECTURE.md#detection-flow-accelerometer)

### API & Backend
- API endpoints: [API.md](API.md)
- Database schema: [ARCHITECTURE.md](ARCHITECTURE.md#database-schema)
- Routing algorithm: [ARCHITECTURE.md](ARCHITECTURE.md#routing-flow)

### Mobile App
- Setup guide: [README_FULL.md](../README_FULL.md#-mobile-app-setup)
- State management: `SadakSaathi/src/store/`
- Navigation: `SadakSaathi/src/navigation/`

### Deployment & DevOps
- Railway: [DEPLOYMENT.md](DEPLOYMENT.md#option-1-railway-recommended)
- AWS: [DEPLOYMENT.md](DEPLOYMENT.md#option-2-aws-production-scale)
- Docker: `sadak-saathi-backend/docker-compose.yml`
- CI/CD: [DEPLOYMENT.md](DEPLOYMENT.md#cicd-pipeline)

### Accountability & Legal
- Warranty tracking: [README_FULL.md](../README_FULL.md#warranty-breach-tracker)
- Damage claims: [API.md](API.md#8-file-damage-claim)
- Contractor scoring: [ARCHITECTURE.md](ARCHITECTURE.md#accountability-flow)

---

## 🆘 Getting Help

**General questions:**
- [GitHub Discussions](https://github.com/Goyam02/Sadak-Sathi/discussions)

**Bug reports:**
- [GitHub Issues](https://github.com/Goyam02/Sadak-Sathi/issues)

**Security issues:**
- Email: security@sadaksaathi.in (private disclosure)

**Partnership inquiries:**
- Email: partnerships@sadaksaathi.in

---

## 🔄 Documentation Updates

This documentation is actively maintained. Last major update: March 2026.

**Found an error?**
- File an issue: [Documentation Issue](https://github.com/Goyam02/Sadak-Sathi/issues/new?labels=documentation)
- Or submit a PR with the fix!

**Want to improve docs?**
See [CONTRIBUTING.md](../CONTRIBUTING.md) — Documentation contributions are highly valued!

---

## 📊 Documentation Coverage

| Area | Coverage | Status |
|------|----------|--------|
| Getting Started | ✅✅✅✅✅ | Excellent |
| API Reference | ✅✅✅✅✅ | Complete |
| Architecture | ✅✅✅✅✅ | Comprehensive |
| Deployment | ✅✅✅✅⬜ | Good (AWS section needs expansion) |
| Contributing | ✅✅✅✅✅ | Excellent |
| Troubleshooting | ✅✅✅⬜⬜ | Needs expansion |

---

**Happy building! 🛵💨**
