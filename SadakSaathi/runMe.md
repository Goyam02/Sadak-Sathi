# SadakSaathi — Run on Android

## Prerequisites
- Node.js 18+
- Android phone with **USB debugging ON** or same WiFi as your Mac
- Expo account at [expo.dev](https://expo.dev)

---

## 1. Install dependencies
```bash
cd SadakSaathi
npm install
```

## 2. Configure `.env`
Edit `.env` in the root — only change these:
```
BACKEND_URL=http://<your-mac-ip>:8000
OPENROUTE_API_KEY=<get free key at openrouteservice.org>
```
Find your Mac IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 3. Start the backend (separate terminal)
```bash
cd ../sadak-saathi-backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 4. Install the dev client on your phone (first time only)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile development
```
Scan the QR it gives you → installs **SadakSaathi Dev Client** APK on your phone.

## 5. Run
```bash
npx expo start --dev-client --scheme sadaksaathi
```
Open the SadakSaathi app on your phone → tap **Fetch development servers** or scan the QR.

---

## Repeat runs (after first-time setup)
```bash
# Terminal 1 — backend
cd sadak-saathi-backend && source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
cd SadakSaathi
npx expo start --dev-client --scheme sadaksaathi
```

---

## Troubleshooting
| Problem | Fix |
|---|---|
| `Network Error` on app | Check `BACKEND_URL` in `.env` matches your Mac IP |
| Can't connect to Metro | Phone and Mac must be on same WiFi |
| Tunnel fails | Use local network instead (no `--tunnel` flag) |
| Module not linked | That package needs a new EAS build |
