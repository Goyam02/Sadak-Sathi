import random
import uuid
import os
from datetime import datetime, timedelta

import osmnx as ox
from faker import Faker
from shapely.geometry import Point, LineString

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.contractor import Contractor, RoadSegment, RepairClaim, ClaimStatus
from app.models.pothole import Pothole, PotholeReport, Severity, PotholeStatus
from app.models.rider import Rider
from app.models.alert import Alert, AlertType, AlertPriority

from app.models import *
from dotenv import load_dotenv
load_dotenv()

fake = Faker()

# -----------------------------
# CONFIG
# -----------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set. Export it before running the script.")

# convert async → sync
DATABASE_URL = DATABASE_URL.replace("postgresql+asyncpg", "postgresql")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

NUM_CONTRACTORS = 5
NUM_RIDERS = 50
POTHOLES_PER_SEGMENT = (2, 6)
REPORTS_PER_POTHOLE = (1, 8)

# -----------------------------
# UTIL
# -----------------------------

def random_date(days_back=60):
    return datetime.utcnow() - timedelta(days=random.randint(0, days_back))


def point_to_wkt(point: Point):
    return f"POINT({point.x} {point.y})"


# -----------------------------
# LOAD ROAD GRAPH (FAST)
# -----------------------------

def get_road_segments():
    print("Fetching OSM road data (Nangloi)...")

    west, south, east, north = 77.06, 28.66, 77.10, 28.70

    G = ox.graph_from_bbox(
        bbox=(west, south, east, north),
        network_type="drive"
    )

    edges = ox.graph_to_gdfs(G, nodes=False)

    segments = []
    for _, row in edges.iterrows():
        geom = row.geometry
        if geom.geom_type == "LineString":
            segments.append(geom)

    print(f"Loaded {len(segments)} road segments")
    return segments


# -----------------------------
# MAIN SEED
# -----------------------------

def seed():
    session = SessionLocal()

    # -------------------------
    # Contractors
    # -------------------------
    contractors = []
    for _ in range(NUM_CONTRACTORS):
        c = Contractor(
            name=fake.company(),
            registration_number=str(uuid.uuid4())[:10],
            contact_email=fake.email(),
            contact_phone=f"+91{random.randint(6000000000, 9999999999)}",
            performance_score=random.uniform(60, 100),
            verified_repairs=random.randint(0, 50),
        )
        session.add(c)
        contractors.append(c)

    # -------------------------
    # Riders
    # -------------------------
    riders = []
    for _ in range(NUM_RIDERS):
        r = Rider(
            email=fake.unique.email(),
            hashed_password="hashed_password",
            full_name=fake.name(),
            phone=f"+91{random.randint(6000000000, 9999999999)}",
            total_reports=random.randint(0, 100),
            confirmed_reports=random.randint(0, 80),
            accuracy_score=random.uniform(60, 100),
        )
        session.add(r)
        riders.append(r)

    session.flush()  # instead of commit

    # -------------------------
    # Road Segments
    # -------------------------
    road_geoms = get_road_segments()
    road_segments = []

    for geom in road_geoms[:100]:
        contractor = random.choice(contractors)

        rs = RoadSegment(
            name=fake.street_name(),
            boundary=geom.buffer(0.0001).wkt,
            contractor_id=contractor.id,
            construction_date=random_date(1000),
            warranty_expiry=datetime.utcnow() + timedelta(days=365),
            road_type=random.choice(["highway", "city", "residential"]),
        )

        session.add(rs)
        road_segments.append((rs, geom))

    session.flush()

    # -------------------------
    # Potholes
    # -------------------------
    potholes = []

    for rs, geom in road_segments:
        for _ in range(random.randint(*POTHOLES_PER_SEGMENT)):

            point = geom.interpolate(random.random(), normalized=True)
            report_count = random.randint(*REPORTS_PER_POTHOLE)

            severity = random.choices(
                [Severity.S1, Severity.S2, Severity.S3],
                weights=[0.3, 0.4, 0.3]
            )[0]

            status = (
                PotholeStatus.CONFIRMED
                if report_count >= 5
                else PotholeStatus.CANDIDATE
            )

            pothole = Pothole(
                avg_lat=point.y,
                avg_lon=point.x,
                location=point_to_wkt(point),
                severity=severity,
                status=status,
                report_count=report_count,
                camera_confirmed=random.randint(0, report_count),
                sensor_confirmed=random.randint(0, report_count),
                water_filled=random.randint(0, 2),
                pothole_type=random.choice(["dry", "water_filled"]),
                high_confidence_count=random.randint(0, report_count),
                contractor_id=rs.contractor_id,
                road_segment_id=rs.id,
                estimated_damage_inr=random.uniform(500, 10000),
                city="Delhi",
                address=fake.address(),
                created_at=random_date(),
            )

            session.add(pothole)
            potholes.append(pothole)

    session.flush()

    # -------------------------
    # Reports
    # -------------------------
    for pothole in potholes:
        for _ in range(pothole.report_count):
            rider = random.choice(riders)

            report = PotholeReport(
                pothole_id=pothole.id,
                rider_id=rider.id,
                latitude=pothole.avg_lat + random.uniform(-0.0001, 0.0001),
                longitude=pothole.avg_lon + random.uniform(-0.0001, 0.0001),
                severity=pothole.severity,
                detection_method=random.choice(["yolo", "sensor", "manual"]),
                confidence=random.uniform(0.6, 0.99),
                pothole_type=pothole.pothole_type,
                speed_kmh=random.uniform(10, 60),
                accel_x=random.uniform(-3, 3),
                accel_y=random.uniform(-3, 3),
                accel_z=random.uniform(-3, 3),
                created_at=random_date(),
            )

            session.add(report)

    session.flush()

    # -------------------------
    # Repair Claims
    # -------------------------
    for pothole in random.sample(potholes, int(len(potholes) * 0.4)):
        claim = RepairClaim(
            pothole_id=pothole.id,
            contractor_id=pothole.contractor_id,
            status=random.choice(list(ClaimStatus)),
            claimed_at=random_date(),
            verification_confidence=random.uniform(0.5, 0.99),
        )
        session.add(claim)

    session.flush()

    # -------------------------
    # Alerts
    # -------------------------
    for pothole in random.sample(potholes, int(len(potholes) * 0.5)):
        alert = Alert(
            rider_id=random.choice(riders).id,
            pothole_id=pothole.id,
            contractor_id=pothole.contractor_id,
            alert_type=random.choice(list(AlertType)),
            priority=random.choice(list(AlertPriority)),
            title="Pothole Update",
            message=f"Pothole at {pothole.address} requires attention",
            is_read=random.choice([True, False]),
            created_at=random_date(),
        )
        session.add(alert)

    # FINAL COMMIT
    session.commit()
    session.close()

    print("✅ Seeding complete!")


if __name__ == "__main__":
    seed()