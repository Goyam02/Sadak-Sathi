import os
import psycopg2

# Get NeonDB connection string from env (set in your .env for local dev)
NEONDB_URL = os.getenv("NEONDB_URL", "postgresql://neondb_owner:***REMOVED***@ep-autumn-cherry-a18ij12x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")

conn = psycopg2.connect(NEONDB_URL)
cur = conn.cursor()

try:
    cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    cur.execute("SELECT PostGIS_Version();")
    ver = cur.fetchone()
    print("PostGIS enabled. Version:", ver[0])
except Exception as e:
    print("Error:", e)
finally:
    cur.close()
    conn.close()