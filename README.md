# 🛵 Sadak Saathi

**Delhi's Two-Wheeler Safety, Road Intelligence & Accountability Network**

> One app. Every pothole. Every rupee of damage — named.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React Native](https://img.shields.io/badge/react--native-0.83-61dafb.svg)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688.svg)](https://fastapi.tiangolo.com/)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Goyam02/Sadak-Sathi.git
cd Sadak-Sathi

# Run automated setup
./quickstart.sh

# Or manual setup:
# Backend
cd sadak-saathi-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
docker-compose up -d  # Start PostgreSQL + Redis
uvicorn app.main:app --reload

# Mobile (in another terminal)
cd SadakSaathi
npm install
npx expo start
```

**📖 Complete Documentation:** See [README_FULL.md](README_FULL.md) for comprehensive setup, features, and architecture details.

---

## 📊 The Problem

| Impact | Numbers |
|--------|---------|
| Two-wheeler deaths (potholes, 5 years) | **50** |
| Annual vehicle damage | **₹3,000 Cr** |
| Annual traffic delay cost | **₹450 Cr** |

Every rupee is traceable. Every pothole has a contractor responsible. Nobody was watching — until now.

---

## 💡 The Solution

**Sadak Saathi turns 3 lakh delivery riders into a passive road-intelligence network.**

- **Zomato, Swiggy, Zepto, Blinkit riders** cover every Delhi road multiple times daily
- **Zero behavior change** — app runs in background during deliveries
- **Dual detection:** Accelerometer LSTM (always-on) + YOLOv8-nano camera (mounted mode)
- **Automatic accountability** — contractor name + ₹ damage cost for every unrepaired pothole

---

## ✨ Key Features

🚨 **Live Hazard Alerts** — Voice warning 400m before every pothole (works over any app)  
🗺️ **Safe Route Navigation** — Combines road condition + live traffic  
🌅 **Morning Brief** — 15-second commute summary with recommended departure time  
💰 **Damage Recovery** — Auto-generate legal notice + evidence pack in 3 minutes  
📊 **Public Accountability** — Every pothole links to contractor + economic damage  

**The accountability weapon:** Pothole #4471 → 31 confirmations → ₹2.58 Cr damage → Contractor named → Warranty breached → Payment on hold.

---

## 🏗️ Architecture

```
Mobile App (React Native + Expo)
    ↓
On-Device ML (LSTM + YOLO)
    ↓
FastAPI Backend
    ↓
PostgreSQL + PostGIS + Redis
    ↓
Accountability Engine (Contractor tracking + Satellite fraud detection)
```

**Tech Stack:** Python 3.11 • FastAPI • PostgreSQL + PostGIS • React Native • Expo • TensorFlow Lite • YOLOv8-nano

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 README_FULL.md](README_FULL.md) | **Complete documentation** (start here!) |
| [🤝 CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design & data flow |
| [🔌 API.md](docs/API.md) | REST API documentation |
| [🚀 DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment guide |
| [📇 INDEX.md](docs/INDEX.md) | Documentation index |

---

## 🎬 Demo (5-Minute Script)

**Act 1 — The Map (90s)**  
847 active potholes. Every dot detected by a delivery rider. YOLO detects water-filled pothole at 94% confidence.

**Act 2 — Navigation (2 min)**  
Fastest route: 28 min, 1× S3 water-filled pothole. Safe route: 32 min, zero hazards. Voice alert fires 280m before impact.

**Act 3 — Accountability (90s)**  
Pothole #4471: ₹2.58 Cr economic damage. Contractor named. Warranty breached. Satellite fraud detected. Payment on hold.

**Closing:** "That number is not a feeling. It's a calculation that 31 delivery riders produced by just navigating to work."

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Code style guidelines
- How to submit PRs
- Areas we need help (LSTM accuracy, offline mode, multilingual support)

**Good first issues:** [GitHub Issues](https://github.com/Goyam02/Sadak-Sathi/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)

---

## 📊 Impact (Targets)

| Metric | 6 Months | 1 Year |
|--------|----------|--------|
| Active Users | 50,000 | 500,000 |
| Potholes Detected | 10,000 | 100,000 |
| Lives Saved (est.) | 5 | 50 |
| Damage Recovered | ₹10L | ₹1Cr |

---

## 📞 Contact

- **GitHub:** [Goyam02/Sadak-Sathi](https://github.com/Goyam02/Sadak-Sathi)
- **Issues:** [Report bugs](https://github.com/Goyam02/Sadak-Sathi/issues)
- **Discussions:** [Ask questions](https://github.com/Goyam02/Sadak-Sathi/discussions)
- **Email:** contact@sadaksaathi.in _(placeholder)_

**For Partnerships:**
- Delivery companies: partnerships@sadaksaathi.in
- Government agencies: govt@sadaksaathi.in
- Investors: invest@sadaksaathi.in

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file.

Free to use, modify, and distribute. Attribution appreciated.

---

<div align="center">

**Built with ❤️ for every two-wheeler rider in India**

⭐ Star this repo if you believe Delhi's roads can be safer!

[📱 Download App](#) | [🌐 Web Dashboard](#) | [📖 Full Docs](README_FULL.md)

</div>
