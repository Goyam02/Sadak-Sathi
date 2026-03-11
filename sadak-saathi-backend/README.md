# Sadak Saathi Backend

## Overview
Backend service for Sadak Saathi using FastAPI, PostgreSQL (PostGIS), Redis, and Docker.

## Getting Started

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed.

### 2. Running the Services

1. Clone this repo
2. Run:

```
docker-compose up --build
```

- This starts backend (FastAPI), PostGIS DB, and Redis.

### 3. Health Check

- Once running, check health endpoint:

```
curl http://localhost:8000/health
```
Expected output:
```
{"status": "ok"}
```

## Environment Variables

### NeonDB (Cloud PostgreSQL)
To use NeonDB for your backend database, set the environment variable `NEONDB_URL` in your `.env` file (or export it before running).

Example `.env` entry:
```
NEONDB_URL='postgresql://neondb_owner:***REMOVED***@ep-autumn-cherry-a18ij12x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

If `NEONDB_URL` is set, the backend will use it automatically. Otherwise, local PostGIS settings from docker-compose or individual environment variables are used.

### Redis
Defaults are set for Redis in `docker-compose.yml`, but can be overridden with `REDIS_HOST` and `REDIS_PORT` in `.env`.

(See app/db/database.py for all supported variables.)


## Project Structure

- `app/main.py` : FastAPI app entrypoint
- `app/api/routing.py` : API endpoints
- `app/db/database.py` : DB & Redis config
- `requirements.txt` : Python dependencies
- `docker-compose.yml` : Container definitions

## Next Steps
- Implement more endpoints and services in app/api and app/services
- Add DB models in app/models

---
