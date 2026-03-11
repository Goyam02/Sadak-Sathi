from fastapi import FastAPI
from app.api.routing import router
from app.api import reports, hazards

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sadak Saathi Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
app.include_router(reports.router)
app.include_router(hazards.router)

# Optionally: Uvicorn can be configured via Docker
