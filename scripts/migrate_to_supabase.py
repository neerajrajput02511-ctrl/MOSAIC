import os
import sys
import sqlite3
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.config import settings
from backend.app.database.session import SessionLocal, engine, Base
from backend.app.database.models import Region, Location, ModelMetadata, DataSourceStatus
from backend.app.database.init_db import init_db

def migrate():
    print(f"Connecting to target database: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    
    if settings.DATABASE_URL.startswith("sqlite"):
        print("DATABASE_URL is still set to SQLite. Please update your DATABASE_URL in .env to your Supabase PostgreSQL connection string first.")
        return

    print("Step 1: Initializing database tables and default seeds in Supabase...")
    init_db()

    sqlite_path = "weatherfusion.db"
    if not os.path.exists(sqlite_path):
        print(f"Local SQLite database {sqlite_path} not found; tables initialized cleanly.")
        return

    print("Step 2: Syncing latest user locations from local SQLite into Supabase...")
    conn = sqlite3.connect(sqlite_path)
    cur = conn.cursor()
    cur.execute("SELECT name, state, district, latitude, longitude, elevation_m, is_ner FROM locations WHERE district IN ('User Location', 'GPS Location', 'Active Tracking') OR name LIKE '%📍%'")
    user_rows = cur.fetchall()

    db: Session = SessionLocal()
    try:
        for r in user_rows:
            name, state, district, lat, lon, elev, is_ner = r
            existing = db.query(Location).filter(Location.name == name).first()
            if not existing:
                loc = Location(
                    name=name,
                    state=state,
                    district=district,
                    latitude=lat,
                    longitude=lon,
                    elevation_m=elev,
                    is_ner=bool(is_ner)
                )
                db.add(loc)
        db.commit()
        print(f"Migration completed successfully! Synced {len(user_rows)} custom records.")
    finally:
        db.close()
        conn.close()

if __name__ == "__main__":
    migrate()
