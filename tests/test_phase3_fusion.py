import os
import sys
import pytest
from pathlib import Path

# Ensure root workspace is on python sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_imd_stations_endpoint():
    res = client.get("/api/v1/imd/stations")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 10
    station_names = [s["name"] for s in data]
    assert any("Guwahati" in name for name in station_names)
    assert any("Delhi" in name for name in station_names)

def test_imd_observations_endpoint():
    res = client.get("/api/v1/imd/observations?latitude=26.1061&longitude=91.5859")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) > 0
    obs = data[0]
    assert "source" in obs
    assert "quality_flag" in obs
    assert obs["quality_flag"] in ["VALID", "SUSPECT", "INVALID"]

def test_satellite_products_catalog():
    res = client.get("/api/v1/satellite/products")
    assert res.status_code == 200
    catalog = res.json()
    assert len(catalog) >= 3
    product_names = [p["product_id"] for p in catalog]
    assert "INSAT-3DR-TIR1" in product_names
    assert "GSMAP-ISRO-RAIN" in product_names
    for p in catalog:
        assert p["data_status"] in ["LIVE", "AUTHORIZATION REQUIRED", "OFFLINE"]

def test_satellite_cloud_and_rainfall():
    res_cloud = client.get("/api/v1/satellite/insat-cloud?latitude=26.1061&longitude=91.5859")
    assert res_cloud.status_code == 200
    cloud = res_cloud.json()
    assert cloud["satellite_mission"] == "INSAT-3DR"
    assert "cloud_top_brightness_temp_k" in cloud
    assert "cloud_classification" in cloud

    res_rain = client.get("/api/v1/satellite/gsmap-rainfall?latitude=26.1061&longitude=91.5859")
    assert res_rain.status_code == 200
    rain = res_rain.json()
    assert "rain_rate_mm_per_hr" in rain
    assert rain["rain_rate_mm_per_hr"] >= 0.0

def test_radar_and_nowcast():
    res_stn = client.get("/api/v1/radar/stations")
    assert res_stn.status_code == 200
    stations = res_stn.json()
    assert len(stations) >= 5

    res_nc = client.get("/api/v1/radar/nowcast?latitude=26.1061&longitude=91.5859")
    assert res_nc.status_code == 200
    nc = res_nc.json()
    assert "radar_station" in nc
    assert "nowcast_timeline" in nc
    assert len(nc["nowcast_timeline"]) == 4

def test_lightning_and_qc():
    res_lgt = client.get("/api/v1/observations/lightning?latitude=26.1061&longitude=91.5859")
    assert res_lgt.status_code == 200
    lgt = res_lgt.json()
    assert "flash_density_per_km2_hr" in lgt

    # Valid temp
    qc_valid = client.get("/api/v1/observations/qc?variable=temperature_c&value=28.5&latitude=26.1&longitude=91.5")
    assert qc_valid.status_code == 200
    assert qc_valid.json()["status"] == "VALID"

    # Impossible temp (< -25C in plains)
    qc_invalid = client.get("/api/v1/observations/qc?variable=temperature_c&value=65.0&latitude=26.1&longitude=91.5")
    assert qc_invalid.status_code == 200
    assert qc_invalid.json()["status"] == "INVALID"

def test_observation_consistency():
    res = client.get("/api/v1/observations/consistency?latitude=26.1061&longitude=91.5859")
    assert res.status_code == 200
    data = res.json()
    assert "comparison_table" in data
    assert len(data["comparison_table"]) == 3
    assert "consistency_index" in data
    assert 0.0 <= data["consistency_index"] <= 1.0

def test_sources_health_and_log():
    res_health = client.get("/api/v1/sources/health")
    assert res_health.status_code == 200
    health = res_health.json()
    assert health["total_sources"] >= 10
    assert health["connected_sources"] > 0

    res_log = client.get("/api/v1/sources/ingestion-log")
    assert res_log.status_code == 200
    log_data = res_log.json()
    assert isinstance(log_data, list)
    assert len(log_data) > 0

def test_fusion_dossier():
    res = client.get("/api/v1/fusion/location?latitude=26.1061&longitude=91.5859")
    assert res.status_code == 200
    dossier = res.json()
    assert "what_mosaic_sees" in dossier
    assert "what_mosaic_predicts" in dossier
    assert "source_comparison_matrix" in dossier
    assert len(dossier["source_comparison_matrix"]) >= 5
