import asyncio
import sys
import os
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database.session import SessionLocal
from backend.app.database.models import Location
from backend.app.services.weather_service import WeatherService

async def main():
    target_city = sys.argv[1] if len(sys.argv) > 1 else "Guwahati"
    db = SessionLocal()
    try:
        service = WeatherService(db)
        loc = db.query(Location).filter(Location.name.ilike(f"%{target_city}%")).first()
        if not loc:
            print(f"Location '{target_city}' not found.")
            return
            
        print(f"Fetching live multi-model forecast for {loc.name}, {loc.state} ({loc.latitude}°N, {loc.longitude}°E)...")
        blended = await service.get_blended_forecast(loc.id, horizon_hours=24)
        
        print("\n--- SOURCES STATUS ---")
        for s in blended["sources"]:
            print(f"  [{s['status']}] {s['name']} ({s['type']}): {s['provenance']}")

        print(f"\n--- 24-HOUR FORECAST TIMELINE (Sample) ---")
        for pt in blended["timeline"][:6]:
            print(
                f"  Valid: {pt['forecast_time']} (+{pt['lead_time_hours']}h) | "
                f"Rain: {pt['blended_precipitation_mm']}mm [{pt['uncertainty_lower_mm']}-{pt['uncertainty_upper_mm']}mm] | "
                f"Temp: {pt['blended_temperature_c']}°C | "
                f"Regime: {pt['weather_regime']} | "
                f"Weights: {pt['weights']}"
            )
            
        if blended["extreme_events"]:
            print("\n--- DETECTED EXTREME EVENTS ---")
            for ev in blended["extreme_events"]:
                print(f"  [{ev['severity']}] {ev['title']}: {ev['description']}")
        else:
            print("\nNo extreme weather thresholds exceeded in this 24h window.")

    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
