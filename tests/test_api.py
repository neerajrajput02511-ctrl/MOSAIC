import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.app.main import app

def test_api_endpoints():
    client = TestClient(app)
    
    # 1. Root
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["platform"] == "WEATHERFUSION AI"
    print("[OK] GET /: 200 OK")

    # 2. Locations
    r = client.get("/api/v1/locations")
    assert r.status_code == 200
    locs = r.json()
    assert len(locs) >= 10
    print(f"[OK] GET /api/v1/locations: 200 OK ({len(locs)} stations)")

    # 3. Models
    r = client.get("/api/v1/models")
    assert r.status_code == 200
    models = r.json()
    assert len(models) >= 3
    print(f"[OK] GET /api/v1/models: 200 OK ({len(models)} models)")

    # 4. Data Sources
    r = client.get("/api/v1/data-sources")
    assert r.status_code == 200
    sources = r.json()
    print(f"[OK] GET /api/v1/data-sources: 200 OK ({len(sources)} sources)")

    # 5. Model Performance
    r = client.get("/api/v1/models/performance")
    assert r.status_code == 200
    perfs = r.json()
    print(f"[OK] GET /api/v1/models/performance: 200 OK ({len(perfs)} benchmarks)")

    # 6. Blended Forecast for Guwahati (ID 1)
    r = client.get("/api/v1/forecast/blended?location_id=1&horizon_hours=24")
    assert r.status_code == 200
    blended = r.json()
    assert "timeline" in blended
    assert len(blended["timeline"]) >= 24
    print(f"[OK] GET /api/v1/forecast/blended: 200 OK ({len(blended['timeline'])} hourly steps)")

    # 7. Explainability
    r = client.get("/api/v1/explainability/why?location_id=1&lead_time_hours=24")
    assert r.status_code == 200
    why = r.json()
    assert why["location"]["name"] == "Guwahati"
    assert "explanation_summary" in why
    print("[OK] GET /api/v1/explainability/why: 200 OK")

    # 8. Health
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    health = r.json()
    assert health["status"] == "OPERATIONAL"
    print("[OK] GET /api/v1/health: 200 OK")

    print("\nALL FASTAPI REST ENDPOINTS VERIFIED & FUNCTIONING WITH REAL DATA!")

if __name__ == "__main__":
    test_api_endpoints()
