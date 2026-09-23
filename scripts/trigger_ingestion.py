import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.ingestion.pipeline import AutomatedIngestionPipeline

async def main():
    print("=== WEATHERFUSION AI - Triggering Automated Ingestion Pipeline ===")
    result = await AutomatedIngestionPipeline.run_pipeline(target_location_id=1)
    print(f"Status: {result.get('status')}")
    print(f"Location: {result.get('location')}")
    print(f"Records Ingested: {result.get('records_ingested')}")
    print(f"Duration: {result.get('duration_seconds')}s")
    print(f"Extreme Events Detected: {result.get('extreme_events_detected')}")
    print(f"Timestamp UTC: {result.get('timestamp_utc')}")

if __name__ == "__main__":
    asyncio.run(main())
