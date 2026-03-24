from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "Sadak Sathi"
    DEBUG: bool = False
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    DATABASE_URL: str          # postgresql+asyncpg://user:pass@host/db
    REDIS_URL: str             # redis://localhost:6379/0
    CELERY_BROKER_URL: str     # redis://localhost:6379/1

    S3_BUCKET: str = "sadak-sathi-images"
    AWS_REGION: str = "ap-south-1"

    # Confirmation thresholds
    CANDIDATE_THRESHOLD: int = 2    # reports → candidate
    CONFIRMED_THRESHOLD: int = 5    # reports → confirmed
    CLUSTER_RADIUS_METERS: float = 15.0
    ALERT_RADIUS_METERS: float = 400.0

    # ML model paths
    YOLO_MODEL_PATH: str = "ml_models/yolov8_pothole.pt"
    LSTM_MODEL_PATH: str = "ml_models/lstm_accelerometer.pt"

    class Config:
        env_file = ".env"

@lru_cache
def get_settings() -> Settings:
    return Settings()