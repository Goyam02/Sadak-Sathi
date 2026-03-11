from fastapi import FastAPI
from app.api.routing import router

app = FastAPI(title="Sadak Saathi Backend")
app.include_router(router)

# Optionally: Uvicorn can be configured via Docker
