"""
Delhi Pothole Database Seeding Script
=====================================
Generates realistic synthetic data for potholes on actual Delhi roads.

Usage:
    python db_seed/seed_data.py

This script:
1. Seeds riders, contractors, road_segments
2. Seeds potholes on real Delhi roads with random placement
3. Seeds pothole_reports with multiple confirmations
4. Seeds repair_claims and alerts
"""

import asyncio
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import json

# Delhi Roads with actual GPS coordinates (approx start/end points)
# Format: (road_name, [(lat1, lon1), (lat2, lon2), ...])

DELHI_ROADS = {
    # Old Delhi / Central Delhi
    "Chandni Chowk Main Road": [
        (28.6500, 77.2300), (28.6510, 77.2320), (28.6520, 77.2340),
        (28.6530, 77.2360), (28.6540, 77.2380), (28.6550, 77.2400)
    ],
    "Nai Sadak": [
        (28.6480, 77.2280), (28.6500, 77.2300), (28.6520, 77.2320), (28.6540, 77.2340)
    ],
    "Netaji Subhash Marg": [
        (28.6450, 77.2350), (28.6470, 77.2370), (28.6490, 77.2390), (28.6510, 77.2410)
    ],
    "Kashmiri Gate Road": [
        (28.6680, 77.2280), (28.6700, 77.2300), (28.6720, 77.2320), (28.6740, 77.2340)
    ],
    "Paharganj Main Bazaar": [
        (28.6400, 77.2120), (28.6420, 77.2140), (28.6440, 77.2160), (28.6460, 77.2180)
    ],
    
    # Karol Bagh Area
    "Ajmal Khan Road": [
        (28.6400, 77.1850), (28.6420, 77.1870), (28.6440, 77.1890),
        (28.6460, 77.1910), (28.6480, 77.1930)
    ],
    "Bank Street": [
        (28.6380, 77.1880), (28.6400, 77.1900), (28.6420, 77.1920)
    ],
    "Rajinder Nagar": [
        (28.6350, 77.1800), (28.6370, 77.1820), (28.6390, 77.1840)
    ],
    
    # Sarojini Nagar Area
    "Sarojini Nagar Market Road": [
        (28.5800, 77.2070), (28.5820, 77.2090), (28.5840, 77.2110),
        (28.5860, 77.2130), (28.5880, 77.2150)
    ],
    "Sadiq Nagar Road": [
        (28.5750, 77.2100), (28.5770, 77.2120), (28.5790, 77.2140)
    ],
    "Bhagat Singh Market": [
        (28.5700, 77.2050), (28.5720, 77.2070), (28.5740, 77.2090)
    ],
    
    # Lajpat Nagar Area
    "Lajpat Nagar Central Market": [
        (28.5670, 77.2400), (28.5690, 77.2420), (28.5710, 77.2440),
        (28.5730, 77.2460), (28.5750, 77.2480)
    ],
    "Ring Road Junction": [
        (28.5650, 77.2500), (28.5670, 77.2520), (28.5690, 77.2540)
    ],
    "M Block Market": [
        (28.5600, 77.2350), (28.5620, 77.2370), (28.5640, 77.2390)
    ],
    
    # Mayur Vihar / Laxmi Nagar
    "Mayur Vihar Phase 1": [
        (28.5980, 77.3050), (28.6000, 77.3070), (28.6020, 77.3090),
        (28.6040, 77.3110), (28.6060, 77.3130)
    ],
    "Laxmi Nagar Main Road": [
        (28.6250, 77.2650), (28.6270, 77.2670), (28.6290, 77.2690),
        (28.6310, 77.2710), (28.6330, 77.2730)
    ],
    "Vivek Vihar Road": [
        (28.6470, 77.3070), (28.6490, 77.3090), (28.6510, 77.3110)
    ],
    "Shahdara Bridge Road": [
        (28.6650, 77.2950), (28.6670, 77.2970), (28.6690, 77.2990)
    ],
    
    # Rohini Area
    "Rohini Sector 3 Main Road": [
        (28.7380, 77.0820), (28.7400, 77.0840), (28.7420, 77.0860),
        (28.7440, 77.0880), (28.7460, 77.0900)
    ],
    "Rohini Sector 15": [
        (28.7250, 77.0750), (28.7270, 77.0770), (28.7290, 77.0790)
    ],
    "Siraspur Road": [
        (28.7350, 77.0650), (28.7370, 77.0670), (28.7390, 77.0690)
    ],
    
    # Dwarka Area
    "Dwarka Sector 12 Main Road": [
        (28.5900, 77.0430), (28.5920, 77.0450), (28.5940, 77.0470),
        (28.5960, 77.0490), (28.5980, 77.0510)
    ],
    "Dwarka Sector 6": [
        (28.5850, 77.0350), (28.5870, 77.0370), (28.5890, 77.0390)
    ],
    "Najafgarh Road": [
        (28.6050, 76.9850), (28.6070, 76.9870), (28.6090, 76.9890)
    ],
    
    # West Delhi
    "Rajouri Garden Main Market": [
        (28.6470, 77.1170), (28.6490, 77.1190), (28.6510, 77.1210),
        (28.6530, 77.1230), (28.6550, 77.1250)
    ],
    "Pitampura Neel Colony": [
        (28.6870, 77.1270), (28.6890, 77.1290), (28.6910, 77.1310)
    ],
    "Shalimar Bagh Main Road": [
        (28.7070, 77.1470), (28.7090, 77.1490), (28.7110, 77.1510)
    ],
    
    # North Delhi
    "Civil Lines Metro Station Road": [
        (28.6870, 77.2070), (28.6890, 77.2090), (28.6910, 77.2110)
    ],
    "Kamla Nagar Market": [
        (28.6570, 77.1970), (28.6590, 77.1990), (28.6610, 77.2010)
    ],
    "Model Town Phase 2": [
        (28.6670, 77.1650), (28.6690, 77.1670), (28.6710, 77.1690)
    ],
    
    # East Delhi
    "Anand Vihar ISBT Road": [
        (28.6450, 77.2850), (28.6470, 77.2870), (28.6490, 77.2890)
    ],
    "Preet Vihar Metro Road": [
        (28.6520, 77.2850), (28.6540, 77.2870), (28.6560, 77.2890)
    ],
    "Krishna Nagar Road": [
        (28.6350, 77.2750), (28.6370, 77.2770), (28.6390, 77.2790)
    ],
    
    # South Delhi
    "Hauz Khas Village Road": [
        (28.5530, 77.1930), (28.5550, 77.1950), (28.5570, 77.1970)
    ],
    "Greater Kailash M Block": [
        (28.5580, 77.2430), (28.5600, 77.2450), (28.5620, 77.2470)
    ],
    "Kalkaji Mandir Road": [
        (28.5450, 77.2550), (28.5470, 77.2570), (28.5490, 77.2590)
    ],
}

# Road types for context
ROAD_TYPES = {
    "market": ["Chandni Chowk Main Road", "Sarojini Nagar Market Road", "Lajpat Nagar Central Market",
               "Ajmal Khan Road", "Kamla Nagar Market", "Rajouri Garden Main Market"],
    "residential": ["Rajinder Nagar", "Mayur Vihar Phase 1", "Vivek Vihar Road", "Rohini Sector 3 Main Road",
                    "Dwarka Sector 12 Main Road", "Shalimar Bagh Main Road", "Civil Lines Metro Station Road"],
    "arterial": ["Ring Road Junction", "Najafgarh Road", "Kashmiri Gate Road", "Netaji Subhash Marg"],
    "local": ["Bank Street", "Sadiq Nagar Road", "M Block Market", "Rohini Sector 15", "Anand Vihar ISBT Road"]
}

# Delhi Areas for reference
DELHI_AREAS = [
    ("Chandni Chowk", 28.6500, 77.2300),
    ("Karol Bagh", 28.6431, 77.1900),
    ("Sarojini Nagar", 28.5820, 77.2100),
    ("Lajpat Nagar", 28.5693, 77.2441),
    ("Mayur Vihar", 28.6018, 77.3089),
    ("Paharganj", 28.6427, 77.2150),
    ("Kamla Nagar", 28.6600, 77.2000),
    ("Rohini", 28.7409, 77.0848),
    ("Dwarka", 28.5921, 77.0465),
    ("Shahdara", 28.6700, 77.3000),
    ("Vivek Vihar", 28.6500, 77.3100),
    ("Bhajanpura", 28.6800, 77.2800),
    ("Laxmi Nagar", 28.6300, 77.2700),
    ("Preet Vihar", 28.6500, 77.2900),
    ("Janpath", 28.6300, 77.2300),
    ("Rajouri Garden", 28.6500, 77.1200),
    ("Pitampura", 28.6900, 77.1300),
    ("Shalimar Bagh", 28.7100, 77.1500),
    ("Model Town", 28.6700, 77.1700),
    ("Civil Lines", 28.6900, 77.2100),
    ("Kashmiri Gate", 28.6700, 77.2300),
    ("Narela", 28.8200, 77.0800),
    ("Najafgarh", 28.6100, 76.9800),
]


def get_random_point_on_road(road_coords: List[Tuple[float, float]]) -> Tuple[float, float]:
    """Get a random point along a road path (interpolated between waypoints)."""
    if len(road_coords) < 2:
        return road_coords[0] if road_coords else (28.6, 77.2)
    
    # Pick two random waypoints and interpolate
    idx = random.randint(0, len(road_coords) - 2)
    p1 = road_coords[idx]
    p2 = road_coords[idx + 1]
    
    # Random position along the segment (0.0 to 1.0)
    t = random.random()
    
    lat = p1[0] + t * (p2[0] - p1[0])
    lon = p1[1] + t * (p2[1] - p1[1])
    
    # Add small random offset perpendicular to road (simulating road width ~10m)
    offset = (random.random() - 0.5) * 0.0002  # ~10m
    lat += offset
    
    return (round(lat, 6), round(lon, 6))


def get_road_type(road_name: str) -> str:
    """Get road type from road name."""
    for rtype, roads in ROAD_TYPES.items():
        if road_name in roads:
            return rtype
    return "local"


def generate_uuid() -> str:
    """Generate a UUID string."""
    return str(uuid.uuid4())


def generate_phone() -> str:
    """Generate a random Indian phone number."""
    prefixes = ["98100", "98110", "98730", "99990", "95550", "97000"]
    return random.choice(prefixes) + f"{random.randint(1000000, 9999999)}"


def generate_email(name: str) -> str:
    """Generate email from name."""
    name_part = name.lower().replace(" ", ".")
    domains = ["gmail.com", "yahoo.com", "outlook.com"]
    return f"{name_part}@{random.choice(domains)}"


# ==================== DATA GENERATION FUNCTIONS ====================

def generate_riders(count: int = 15) -> List[Dict]:
    """Generate rider data."""
    first_names = ["Rahul", "Vikram", "Amit", "Sanjay", "Deepak", "Ravi", "Priya", 
                   "Neha", "Sonia", "Kiran", "Arjun", "Mohit", "Punit", "Gaurav", "Rohit"]
    last_names = ["Kumar", "Singh", "Sharma", "Patel", "Gupta", "Verma", "Jain", 
                  "Chopra", "Mehta", "Khanna", "Bhatia", "Sinha", "Mishra"]
    platforms = ["Swiggy", "Zomato", "Blinkit", "Dunzo", "Zepto"]
    
    riders = []
    used_names = set()
    
    for i in range(count):
        first = random.choice(first_names)
        last = random.choice(last_names)
        full_name = f"{first} {last}"
        
        # Ensure unique names
        while full_name in used_names:
            first = random.choice(first_names)
            last = random.choice(last_names)
            full_name = f"{first} {last}"
        used_names.add(full_name)
        
        # Random location in Delhi
        area = random.choice(DELHI_AREAS)
        
        rider = {
            "id": generate_uuid(),
            "email": generate_email(full_name),
            "hashed_password": "$2b$12$dummy_hash_for_demo",
            "full_name": full_name,
            "phone": generate_phone(),
            "is_active": True,
            "is_admin": False,
            "platform": random.choice(platforms),
            "last_lat": area[1] + random.uniform(-0.01, 0.01),
            "last_lon": area[2] + random.uniform(-0.01, 0.01),
            "last_seen": datetime.utcnow() - timedelta(minutes=random.randint(1, 180)),
            "total_reports": random.randint(15, 80),
            "confirmed_reports": random.randint(5, 40),
            "accuracy_score": round(random.uniform(65, 95), 2),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(30, 365))
        }
        riders.append(rider)
    
    return riders


def generate_contractors(count: int = 6) -> List[Dict]:
    """Generate contractor data."""
    company_names = [
        "Delhi Road Repairs Pvt Ltd",
        "Pothole Fighters Delhi",
        "Delhi Infrastructure Solutions",
        "Capital Road Works Co",
        "Metro Pothole Masters",
        "Delhi Surface Solutions",
        "Road Care Delhi",
        "Safe Roads Delhi"
    ]
    
    contractors = []
    for i in range(count):
        name = company_names[i]
        reg_num = f"DL{random.randint(2015, 2023)}{random.randint(10000, 99999)}"
        
        contractor = {
            "id": generate_uuid(),
            "name": name,
            "registration_number": reg_num,
            "contact_email": f"contact@{name.lower().replace(' ', '').replace('pvt', '').replace('ltd', '')}.com",
            "contact_phone": generate_phone(),
            "performance_score": round(random.uniform(55, 98), 2),
            "warranty_violations": random.randint(0, 5),
            "fraud_claims": random.randint(0, 2),
            "verified_repairs": random.randint(10, 100),
            "total_potholes_on_record": random.randint(20, 150),
            "total_estimated_damage_inr": round(random.uniform(50000, 500000), 2),
            "created_at": datetime.utcnow() - timedelta(days=random.randint(180, 730)),
            "updated_at": datetime.utcnow()
        }
        contractors.append(contractor)
    
    return contractors


def generate_road_segments(contractors: List[Dict], count: int = 15) -> List[Dict]:
    """Generate road segment data."""
    roads = list(DELHI_ROADS.keys())
    
    road_segments = []
    used_roads = set()
    
    for i in range(min(count, len(roads))):
        road_name = roads[i]
        coords = DELHI_ROADS[road_name]
        
        # Create a bounding box around the road
        lats = [c[0] for c in coords]
        lons = [c[1] for c in coords]
        
        # Simple polygon around the road (rectangle)
        boundary = f"POLYGON(({min(lons)-0.002} {min(lats)-0.002}, {max(lons)+0.002} {min(lats)-0.002}, {max(lons)+0.002} {max(lats)+0.002}, {min(lons)-0.002} {max(lats)+0.002}, {min(lons)-0.002} {min(lats)-0.002}))"
        
        # Find area name
        area_name = road_name.split()[0]
        
        road_segment = {
            "id": generate_uuid(),
            "name": f"{road_name}, {area_name}",
            "boundary": boundary,
            "contractor_id": random.choice(contractors)["id"],
            "construction_date": datetime.utcnow() - timedelta(days=random.randint(365, 1825)),
            "warranty_expiry": datetime.utcnow() + timedelta(days=random.randint(30, 365)),
            "road_type": get_road_type(road_name)
        }
        road_segments.append(road_segment)
    
    return road_segments


def generate_potholes(road_segments: List[Dict], contractors: List[Dict], count: int = 45) -> List[Dict]:
    """Generate pothole data with realistic distribution."""
    
    # Status distribution: more confirmed, some candidates, few repaired
    status_options = ["confirmed"] * 20 + ["candidate"] * 18 + ["repair_claimed"] * 4 + ["repaired"] * 3
    
    # Severity distribution: S2 most common, then S1, then S3
    severity_options = ["S1"] * 25 + ["S2"] * 40 + ["S3"] * 35
    
    potholes = []
    pothole_id_road_map = {}  # Track which road each pothole is on
    
    for i in range(count):
        # Pick random road and get coordinates
        road_name = random.choice(list(DELHI_ROADS.keys()))
        road_coords = DELHI_ROADS[road_name]
        
        # Get random point on road
        lat, lon = get_random_point_on_road(road_coords)
        
        # Generate metadata
        status = random.choice(status_options)
        severity = random.choice(severity_options)
        
        # Calculate report count based on status
        if status == "confirmed":
            report_count = random.randint(5, 15)
        elif status == "candidate":
            report_count = random.randint(1, 4)
        elif status == "repair_claimed":
            report_count = random.randint(6, 12)
        else:  # repaired
            report_count = random.randint(5, 10)
        
        # Camera/sensor confirmation distribution
        camera_confirmed = random.randint(0, report_count)
        sensor_confirmed = report_count - camera_confirmed if random.random() > 0.3 else 0
        
        # Water filled (more common in monsoon season areas)
        water_filled = random.randint(0, 3) if random.random() > 0.5 else 0
        
        # High confidence count
        high_confidence_count = random.randint(0, report_count // 2)
        
        # Days since created (older = more days unresolved)
        if status == "repaired":
            days_ago = random.randint(20, 60)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            repaired_at = created_at + timedelta(days=random.randint(5, 15))
            days_unresolved = (repaired_at - created_at).days
        elif status == "repair_claimed":
            days_ago = random.randint(15, 40)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            repaired_at = None
            days_unresolved = days_ago
        else:
            days_ago = random.randint(5, 45)
            created_at = datetime.utcnow() - timedelta(days=days_ago)
            repaired_at = None
            days_unresolved = days_ago
        
        # Find nearest area
        nearest_area = min(DELHI_AREAS, key=lambda a: ((a[1]-lat)**2 + (a[2]-lon)**2)**0.5)
        
        # Contractor (only for confirmed/repair_claimed)
        contractor_id = random.choice(contractors)["id"] if status in ["confirmed", "repair_claimed", "repaired"] else None
        
        # Road segment
        road_segment = random.choice(road_segments)
        
        # Estimate damage based on severity
        damage_map = {"S1": 2000, "S2": 5000, "S3": 10000}
        estimated_damage = damage_map[severity] * (1 + random.random())
        
        pothole = {
            "id": generate_uuid(),
            "avg_lat": lat,
            "avg_lon": lon,
            "location": f"POINT({lon} {lat})",
            "severity": severity,
            "status": status,
            "report_count": report_count,
            "camera_confirmed": camera_confirmed,
            "sensor_confirmed": sensor_confirmed,
            "water_filled": water_filled,
            "pothole_type": "water_filled" if water_filled > 0 else "dry",
            "high_confidence_count": high_confidence_count,
            "contractor_id": contractor_id,
            "road_segment_id": road_segment["id"],
            "estimated_damage_inr": round(estimated_damage, 2),
            "city": "Delhi",
            "address": f"{road_name}, {nearest_area[0]}",
            "created_at": created_at,
            "updated_at": datetime.utcnow(),
            "repaired_at": repaired_at
        }
        
        potholes.append(pothole)
        pothole_id_road_map[pothole["id"]] = road_name
    
    return potholes, pothole_id_road_map


def generate_pothole_reports(potholes: List[Dict], riders: List[Dict], min_reports_per_pothole: int = 1) -> List[Dict]:
    """Generate individual pothole reports."""
    reports = []
    
    for pothole in potholes:
        report_count = pothole["report_count"]
        lat = pothole["avg_lat"]
        lon = pothole["avg_lon"]
        
        # Generate reports spread over time
        base_date = pothole["created_at"]
        
        for i in range(report_count):
            # Rider who reported
            rider = random.choice(riders)
            
            # Detection method
            detection_methods = ["camera", "sensor", "both"]
            detection_method = random.choice(detection_methods)
            
            # Confidence score (higher for confirmed potholes)
            confidence = round(random.uniform(0.5, 0.95), 3)
            
            # Severity (can be different from pothole severity for each report)
            severity_options = ["S1", "S2", "S3"]
            severity = random.choice(severity_options)
            
            # Slight GPS variation for realism (within ~20m)
            report_lat = lat + random.uniform(-0.0002, 0.0002)
            report_lon = lon + random.uniform(-0.0002, 0.0002)
            
            # Time of report (spread over days since pothole creation)
            days_offset = i * random.randint(0, 3)  # Reports spread over multiple days
            if days_offset > 30:
                days_offset = random.randint(0, min(30, (datetime.utcnow() - base_date).days))
            
            report_time = base_date + timedelta(days=days_offset, hours=random.randint(0, 23), minutes=random.randint(0, 59))
            
            report = {
                "id": generate_uuid(),
                "pothole_id": pothole["id"],
                "rider_id": rider["id"],
                "latitude": round(report_lat, 6),
                "longitude": round(report_lon, 6),
                "severity": severity,
                "detection_method": detection_method,
                "confidence": confidence,
                "image_s3_key": None,
                "pothole_type": pothole["pothole_type"],
                "yolo_bbox": f"[[{random.randint(50,200)},{random.randint(50,200)},{random.randint(200,400)},{random.randint(200,400)}]]",
                "rider_weight": rider["accuracy_score"] / 100,
                "speed_kmh": round(random.uniform(15, 45), 1),
                "accel_x": round(random.uniform(-2, 2), 3),
                "accel_y": round(random.uniform(-2, 2), 3),
                "accel_z": round(random.uniform(-10, 5), 3),
                "created_at": report_time
            }
            reports.append(report)
    
    return reports


def generate_repair_claims(potholes: List[Dict], contractors: List[Dict]) -> List[Dict]:
    """Generate repair claims."""
    # Get potholes that are repair_claimed or repaired
    claimable_statuses = ["repair_claimed", "repaired"]
    relevant_potholes = [p for p in potholes if p["status"] in claimable_statuses]
    
    claims = []
    status_choices = ["pending", "under_review", "verified", "fraud_detected", "rejected"]
    
    for pothole in relevant_potholes:
        status = random.choice(status_choices)
        
        claim = {
            "id": generate_uuid(),
            "pothole_id": pothole["id"],
            "contractor_id": pothole["contractor_id"] or random.choice(contracts)["id"],
            "status": status,
            "claimed_at": pothole["created_at"] + timedelta(days=random.randint(5, 20)),
            "verified_at": datetime.utcnow() - timedelta(days=random.randint(1, 10)) if status in ["verified", "fraud_detected"] else None,
            "verification_confidence": round(random.uniform(0.7, 0.99), 2) if status == "verified" else None,
            "notes": "Repair completed as per specifications" if status == "verified" else "Under review" if status == "under_review" else "Investigation ongoing",
            "proof_image_s3_key": None
        }
        claims.append(claim)
    
    return claims


def generate_alerts(potholes: List[Dict], riders: List[Dict], contractors: List[Dict]) -> List[Dict]:
    """Generate alerts."""
    alert_types = ["potholes_detected", "road_damage", "repair_completed", "emergency"]
    alert_priorities = ["low", "medium", "high", "critical"]
    
    alerts = []
    
    # Generate alerts for confirmed potholes
    confirmed_potholes = [p for p in potholes if p["status"] == "confirmed"]
    
    for pothole in random.sample(confirmed_potholes, min(15, len(confirmed_potholes))):
        # Alert to riders
        alert = {
            "id": generate_uuid(),
            "rider_id": random.choice(riders)["id"],
            "pothole_id": pothole["id"],
            "contractor_id": None,
            "alert_type": random.choice(alert_types[:2]),
            "priority": random.choice(alert_priorities),
            "title": f"Pothole detected on {pothole['address'].split(',')[0]}",
            "message": f"Severity: {pothole['severity']}, {pothole['report_count']} confirmations",
            "is_read": random.choice([True, False]),
            "is_resolved": random.choice([True, False]),
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 72)),
            "resolved_at": None
        }
        alerts.append(alert)
    
    # Generate alerts for contractors
    for pothole in random.sample([p for p in potholes if p["status"] in ["confirmed", "repair_claimed"]], min(8, len([p for p in potholes if p["status"] in ["confirmed", "repair_claimed"]]))):
        alert = {
            "id": generate_uuid(),
            "rider_id": None,
            "pothole_id": pothole["id"],
            "contractor_id": pothole["contractor_id"],
            "alert_type": "repair_completed" if pothole["status"] == "repair_claimed" else "road_damage",
            "priority": "high" if pothole["severity"] == "S3" else "medium",
            "title": f"Road damage requires attention - {pothole['address'].split(',')[0]}",
            "message": f"Severity: {pothole['severity']}, Estimated damage: ₹{int(pothole['estimated_damage_inr'])}",
            "is_read": random.choice([True, False]),
            "is_resolved": False,
            "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 48)),
            "resolved_at": None
        }
        alerts.append(alert)
    
    return alerts


def generate_sql_inserts(data: Dict) -> List[str]:
    """Generate SQL INSERT statements."""
    sql_statements = []
    
    # Riders
    for rider in data["riders"]:
        sql = f"""INSERT INTO riders (id, email, hashed_password, full_name, phone, is_active, is_admin, platform, 
            last_lat, last_lon, last_seen, total_reports, confirmed_reports, accuracy_score, created_at) VALUES (
            '{rider['id']}', '{rider['email']}', '{rider['hashed_password']}', '{rider['full_name']}', 
            '{rider['phone']}', {rider['is_active']}, {rider['is_admin']}, '{rider['platform']}', 
            {rider['last_lat']}, {rider['last_lon']}, '{rider['last_seen'].isoformat()}', 
            {rider['total_reports']}, {rider['confirmed_reports']}, {rider['accuracy_score']}, 
            '{rider['created_at'].isoformat()}');"""
        sql_statements.append(sql)
    
    # Contractors
    for contractor in data["contractors"]:
        sql = f"""INSERT INTO contractors (id, name, registration_number, contact_email, contact_phone, 
            performance_score, warranty_violations, fraud_claims, verified_repairs, 
            total_potholes_on_record, total_estimated_damage_inr, created_at, updated_at) VALUES (
            '{contractor['id']}', '{contractor['name']}', '{contractor['registration_number']}', 
            '{contractor['contact_email']}', '{contractor['contact_phone']}', {contractor['performance_score']}, 
            {contractor['warranty_violations']}, {contractor['fraud_claims']}, {contractor['verified_repairs']}, 
            {contractor['total_potholes_on_record']}, {contractor['total_estimated_damage_inr']}, 
            '{contractor['created_at'].isoformat()}', '{contractor['updated_at'].isoformat()}');"""
        sql_statements.append(sql)
    
    # Road Segments
    for segment in data["road_segments"]:
        sql = f"""INSERT INTO road_segments (id, name, boundary, contractor_id, construction_date, 
            warranty_expiry, road_type) VALUES (
            '{segment['id']}', '{segment['name']}', '{segment['boundary']}', 
            '{segment['contractor_id']}', '{segment['construction_date'].isoformat()}', 
            '{segment['warranty_expiry'].isoformat()}', '{segment['road_type']}');"""
        sql_statements.append(sql)
    
    # Potholes
    for pothole in data["potholes"]:
        repaired_at = f"'{pothole['repaired_at'].isoformat()}'" if pothole['repaired_at'] else "NULL"
        sql = f"""INSERT INTO potholes (id, avg_lat, avg_lon, location, severity, status, report_count, 
            camera_confirmed, sensor_confirmed, water_filled, pothole_type, high_confidence_count, 
            contractor_id, road_segment_id, estimated_damage_inr, city, address, created_at, 
            updated_at, repaired_at) VALUES (
            '{pothole['id']}', {pothole['avg_lat']}, {pothole['avg_lon']}, 
            ST_GeomFromText('{pothole['location']}', 4326), '{pothole['severity']}', '{pothole['status']}', 
            {pothole['report_count']}, {pothole['camera_confirmed']}, {pothole['sensor_confirmed']}, 
            {pothole['water_filled']}, '{pothole['pothole_type']}', {pothole['high_confidence_count']}, 
            {f"'{pothole['contractor_id']}'" if pothole['contractor_id'] else "NULL"}, 
            '{pothole['road_segment_id']}', {pothole['estimated_damage_inr']}, '{pothole['city']}', 
            '{pothole['address']}', '{pothole['created_at'].isoformat()}', 
            '{pothole['updated_at'].isoformat()}', {repaired_at});"""
        sql_statements.append(sql)
    
    # Pothole Reports
    for report in data["pothole_reports"]:
        sql = f"""INSERT INTO pothole_reports (id, pothole_id, rider_id, latitude, longitude, severity, 
            detection_method, confidence, image_s3_key, pothole_type, yolo_bbox, rider_weight, 
            speed_kmh, accel_x, accel_y, accel_z, created_at) VALUES (
            '{report['id']}', '{report['pothole_id']}', '{report['rider_id']}', {report['latitude']}, 
            {report['longitude']}, '{report['severity']}', '{report['detection_method']}', 
            {report['confidence']}, {f"'{report['image_s3_key']}'" if report['image_s3_key'] else "NULL"}, 
            '{report['pothole_type']}', '{report['yolo_bbox']}', {report['rider_weight']}, 
            {report['speed_kmh']}, {report['accel_x']}, {report['accel_y']}, {report['accel_z']}, 
            '{report['created_at'].isoformat()}');"""
        sql_statements.append(sql)
    
    # Repair Claims
    for claim in data["repair_claims"]:
        verified_at = f"'{claim['verified_at'].isoformat()}'" if claim['verified_at'] else "NULL"
        verification_confidence = f"{claim['verification_confidence']}" if claim['verification_confidence'] else "NULL"
        sql = f"""INSERT INTO repair_claims (id, pothole_id, contractor_id, status, claimed_at, 
            verified_at, verification_confidence, notes, proof_image_s3_key) VALUES (
            '{claim['id']}', '{claim['pothole_id']}', '{claim['contractor_id']}', '{claim['status']}', 
            '{claim['claimed_at'].isoformat()}', {verified_at}, {verification_confidence}, 
            '{claim['notes']}', {f"'{claim['proof_image_s3_key']}'" if claim['proof_image_s3_key'] else "NULL"});"""
        sql_statements.append(sql)
    
    # Alerts
    for alert in data["alerts"]:
        rider_id = f"'{alert['rider_id']}'" if alert['rider_id'] else "NULL"
        contractor_id = f"'{alert['contractor_id']}" if alert['contractor_id'] else "NULL"
        resolved_at = f"'{alert['resolved_at'].isoformat()}'" if alert['resolved_at'] else "NULL"
        sql = f"""INSERT INTO alerts (id, rider_id, pothole_id, contractor_id, alert_type, priority, 
            title, message, is_read, is_resolved, created_at, resolved_at) VALUES (
            '{alert['id']}', {rider_id}, '{alert['pothole_id']}', {contractor_id}, 
            '{alert['alert_type']}', '{alert['priority']}', '{alert['title']}', '{alert['message']}', 
            {alert['is_read']}, {alert['is_resolved']}, '{alert['created_at'].isoformat()}', {resolved_at});"""
        sql_statements.append(sql)
    
    return sql_statements


async def seed_database():
    """Main seeding function."""
    print("=" * 60)
    print("Delhi Pothole Database Seeding")
    print("=" * 60)
    
    # Set random seed for reproducibility
    random.seed(42)
    
    print("\n[1/7] Generating Riders...")
    riders = generate_riders(15)
    print(f"      Generated {len(riders)} riders")
    
    print("\n[2/7] Generating Contractors...")
    contractors = generate_contractors(6)
    print(f"      Generated {len(contractors)} contractors")
    
    print("\n[3/7] Generating Road Segments...")
    road_segments = generate_road_segments(contractors, 15)
    print(f"      Generated {len(road_segments)} road segments")
    print(f"      Roads covered: {len(DELHI_ROADS)}")
    
    print("\n[4/7] Generating Potholes...")
    potholes, pothole_road_map = generate_potholes(road_segments, contractors, 45)
    print(f"      Generated {len(potholes)} potholes")
    
    # Print status distribution
    status_counts = {}
    for p in potholes:
        status_counts[p["status"]] = status_counts.get(p["status"], 0) + 1
    print(f"      Status: {status_counts}")
    
    severity_counts = {}
    for p in potholes:
        severity_counts[p["severity"]] = severity_counts.get(p["severity"], 0) + 1
    print(f"      Severity: {severity_counts}")
    
    print("\n[5/7] Generating Pothole Reports...")
    pothole_reports = generate_pothole_reports(potholes, riders)
    print(f"      Generated {len(pothole_reports)} individual reports")
    
    print("\n[6/7] Generating Repair Claims...")
    repair_claims = generate_repair_claims(potholes, contractors)
    print(f"      Generated {len(repair_claims)} repair claims")
    
    print("\n[7/7] Generating Alerts...")
    alerts = generate_alerts(potholes, riders, contractors)
    print(f"      Generated {len(alerts)} alerts")
    
    # Compile all data
    data = {
        "riders": riders,
        "contractors": contractors,
        "road_segments": road_segments,
        "potholes": potholes,
        "pothole_reports": pothole_reports,
        "repair_claims": repair_claims,
        "alerts": alerts
    }
    
    # Generate SQL
    print("\n[8/8] Generating SQL INSERT statements...")
    sql_statements = generate_sql_inserts(data)
    print(f"      Generated {len(sql_statements)} SQL statements")
    
    # Write to file
    output_file = "db_seed/delhi_seed_data.sql"
    with open(output_file, "w") as f:
        f.write("-- Delhi Pothole Database Seed Data\n")
        f.write(f"-- Generated: {datetime.utcnow().isoformat()}\n\n")
        f.write("\n".join(sql_statements))
    
    print(f"\n✓ SQL file written to: {output_file}")
    
    # Also generate JSON for reference
    json_output = "db_seed/delhi_seed_data.json"
    # Convert datetime objects to strings for JSON
    json_data = {}
    for key, value in data.items():
        json_data[key] = []
        for item in value:
            json_item = {}
            for k, v in item.items():
                if isinstance(v, datetime):
                    json_item[k] = v.isoformat()
                else:
                    json_item[k] = v
            json_data[key].append(json_item)
    
    with open(json_output, "w") as f:
        json.dump(json_data, f, indent=2)
    
    print(f"✓ JSON reference written to: {json_output}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("SEEDING COMPLETE!")
    print("=" * 60)
    print(f"""
Summary:
- Riders: {len(riders)}
- Contractors: {len(contractors)}
- Road Segments: {len(road_segments)}
- Potholes: {len(potholes)}
  - Confirmed: {status_counts.get('confirmed', 0)}
  - Candidate: {status_counts.get('candidate', 0)}
  - Repair Claimed: {status_counts.get('repair_claimed', 0)}
  - Repaired: {status_counts.get('repaired', 0)}
- Pothole Reports: {len(pothole_reports)}
- Repair Claims: {len(repair_claims)}
- Alerts: {len(alerts)}

Roads covered: {len(DELHI_ROADS)} roads across Delhi

To insert into database:
1. psql -U username -d database_name -f {output_file}
2. Or use any SQL client to execute the SQL file
""")
    
    return data


if __name__ == "__main__":
    asyncio.run(seed_database())
