import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import redis

from dotenv import load_dotenv

load_dotenv()

# Database setup
NEONDB_URL = os.getenv("NEONDB_URL")
if NEONDB_URL:
    # Use NeonDB URL directly (include sslmode/channel_binding if present)
    DATABASE_URL = f"postgresql+psycopg2://{NEONDB_URL.split('://')[1]}"
else:
    POSTGRES_USER = os.getenv("POSTGRES_USER", "sadak_saathi")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "password")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "sadak_saathi")
    POSTGRES_HOST = os.getenv("POSTGRES_HOST", "db")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URL = f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Redis setup
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# Example function to test DB connection

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Example function to test Redis

def redis_ping():
    try:
        pong = redis_client.ping()
        return pong
    except Exception as e:
        return str(e)
