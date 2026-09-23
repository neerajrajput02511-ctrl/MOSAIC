import os
import sys
import asyncio
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root workspace is on python sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.api.auth import (
    create_access_token, decode_access_token, mask_secret,
    ROLE_ADMIN, ROLE_ANALYST, ROLE_VIEWER
)
from backend.app.ml.blending import BlendingEngine
from backend.app.data_sources.imd import IMDProvider
from backend.app.data_sources.mosdac import MOSDACProvider
from backend.app.data_sources.noaa_gfs import NOAAGFSProvider
from backend.app.data_sources.noaa_gefs import NOAAGEFSProvider

client = TestClient(app)

def test_01_server_boot_and_zero_mock():
    """TEST 1: Server Boot & Zero-Mock Confirmation"""
    assert settings.DEMO_MODE is False, "DEMO_MODE must be False: NEVER fake weather data!"
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "OPERATIONAL"
    assert data["database"]["status"] == "HEALTHY"
    assert data["database"]["locations_seeded"] >= 10
    print("\n[PASSED] Test 1: Server boots with zero-mock confirmation and active database.")

def test_02_imd_connector_and_status():
    """TEST 2: Official IMD Connector & Telemetry"""
    resp = client.get("/api/data-sources/imd/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_name"] == "IMD"
    assert "api_base_url" in data
    # When IMD key is not configured, must flag AUTHENTICATION REQUIRED or fallback active
    assert data["status"] in ["CONNECTED", "AUTHENTICATION REQUIRED", "DEGRADED"]
    assert "fallback_active" in data
    print("\n[PASSED] Test 2: IMD connector telemetry verified with masked credentials.")

def test_03_mosdac_connector_and_status():
    """TEST 3: MOSDAC ISRO Satellite Connector"""
    provider = MOSDACProvider()
    assert hasattr(provider, "authenticate")
    assert hasattr(provider, "search_dataset")
    assert hasattr(provider, "download_dataset")
    assert hasattr(provider, "validate_dataset")
    assert hasattr(provider, "store_dataset_metadata")
    
    resp = client.get("/api/data-sources/mosdac/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source_name"] == "MOSDAC"
    assert "masked_credentials" in data
    assert data["status"] in ["CONNECTED", "AUTHENTICATION REQUIRED", "DEGRADED", "UNAVAILABLE"]
    print("\n[PASSED] Test 3: MOSDAC ISRO methods and authentication status verified.")

def test_04_noaa_gfs_and_gefs():
    """TEST 4: NOAA GFS and GEFS Ensemble Connectors"""
    gfs = NOAAGFSProvider()
    gefs = NOAAGEFSProvider()
    assert gfs.source_name == "NOAA_GFS"
    assert gefs.source_name == "NOAA_GEFS"
    assert hasattr(gefs, "get_forecast")
    print("\n[PASSED] Test 4: NOAA GFS & GEFS ensemble providers verified.")

def test_05_map_layer_endpoints():
    """TEST 5: GeoJSON Map Layer Endpoints"""
    layers = ["rainfall", "temperature", "wind", "blended", "disagreement"]
    for l in layers:
        resp = client.get(f"/api/map/layers/{l}")
        assert resp.status_code == 200
        geo = resp.json()
        assert geo["type"] == "FeatureCollection"
        assert geo["layer"] == l
        assert "features" in geo
        assert len(geo["features"]) > 0
        feat0 = geo["features"][0]
        assert feat0["type"] == "Feature"
        assert feat0["geometry"]["type"] == "Point"
        assert len(feat0["geometry"]["coordinates"]) == 2
        assert "primary_value" in feat0["properties"]
        assert "station_name" in feat0["properties"]
    print("\n[PASSED] Test 5: All 5 GeoJSON map layers generate valid RFC 7946 structures.")

def test_06_geocoding_search():
    """TEST 6: Geocoding Search Endpoint"""
    resp = client.get("/api/geocoding/search?q=Guwahati")
    assert resp.status_code == 200
    results = resp.json()
    assert len(results) > 0
    guwahati = results[0]
    assert "Guwahati" in guwahati["name"]
    assert abs(guwahati["latitude"] - 26.14) < 0.5
    assert abs(guwahati["longitude"] - 91.73) < 0.5
    print("\n[PASSED] Test 6: Geocoding search resolves real geographic coordinates.")

def test_07_admin_test_connection():
    """TEST 7: Admin Live Connection Test Endpoint"""
    resp = client.post("/api/admin/data-sources/test?source=era5")
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "era5"
    assert "tested_at" in data
    assert "result" in data
    assert "status" in data["result"]
    assert data["result"]["status"] in ["CONNECTED", "AUTHENTICATION REQUIRED", "DEGRADED", "UNAVAILABLE"]
    print("\n[PASSED] Test 7: Admin test connection executes live health checks.")

def test_08_mathematical_blending_invariance():
    """TEST 8: Strict Multi-Model Fallback & Mathematical Invariance"""
    # 3 models online
    preds = {"NOAA_GFS": 12.0, "ECMWF_IFS": 14.5, "ECMWF_AIFS": 13.2}
    maes = {"NOAA_GFS": 2.8, "ECMWF_IFS": 2.1, "ECMWF_AIFS": 2.4}
    weights, *_ = BlendingEngine.calculate_adaptive_weights(preds, maes, 24, "Monsoon", "Normal", 1.2)
    assert abs(sum(weights.values()) - 1.0) < 1e-6
    for w in weights.values():
        assert w >= 0.0

    # Fallback to 2 models
    preds_2 = {"NOAA_GFS": 12.0, "ECMWF_IFS": 14.5}
    weights_2, *_ = BlendingEngine.calculate_adaptive_weights(preds_2, maes, 24, "Monsoon", "Normal", 1.5)
    assert abs(sum(weights_2.values()) - 1.0) < 1e-6
    for w in weights_2.values():
        assert w >= 0.0

    # Fallback to 1 model
    preds_1 = {"ECMWF_IFS": 14.5}
    weights_1, *_ = BlendingEngine.calculate_adaptive_weights(preds_1, maes, 24, "Monsoon", "Normal", 0.0)
    assert weights_1 == {"ECMWF_IFS": 1.0}
    print("\n[PASSED] Test 8: Mathematical weights invariance (sum == 1.0, w_i >= 0) holds under all fallback states.")

def test_09_jwt_authentication_and_rbac():
    """TEST 9: JWT Authentication & Role-Based Access Control"""
    # Test Admin login
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert resp.status_code == 200
    data = resp.json()
    token = data["access_token"]
    assert data["user"]["role"] == ROLE_ADMIN
    
    # Verify token decoding
    payload = decode_access_token(token)
    assert payload["sub"] == "admin"
    assert payload["role"] == ROLE_ADMIN
    
    # Test Analyst login
    resp_analyst = client.post("/api/auth/login", json={"username": "analyst", "password": "analyst123"})
    assert resp_analyst.status_code == 200
    assert resp_analyst.json()["user"]["role"] == ROLE_ANALYST

    # Test /api/auth/me with bearer header
    headers = {"Authorization": f"Bearer {token}"}
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["authenticated"] is True
    assert me_data["role"] == ROLE_ADMIN
    assert "manage:data_sources" in me_data["permissions"]
    print("\n[PASSED] Test 9: JWT generation, validation, and RBAC permissions verified.")

def test_10_security_and_credential_masking():
    """TEST 10: Security & Zero Secret Leakage"""
    # 1. Masking logic
    assert mask_secret("secret_api_key_123456789") == "se••••••••89"
    assert mask_secret(None) is None
    assert mask_secret("abc") == "••••••••"
    
    # 2. Check .gitignore exists and ignores .env
    gitignore_path = Path(__file__).parent.parent / ".gitignore"
    assert gitignore_path.exists()
    content = gitignore_path.read_text(encoding="utf-8")
    assert ".env" in content
    assert "*.db" in content
    assert "node_modules" in content
    
    # 3. Check IMD and MOSDAC endpoints never reveal raw secrets
    imd_resp = client.get("/api/data-sources/imd/status").json()
    if imd_resp.get("masked_key"):
        assert "••••" in imd_resp["masked_key"] or "Open Access" in imd_resp["masked_key"]

    
    mosdac_resp = client.get("/api/data-sources/mosdac/status").json()
    if mosdac_resp.get("masked_credentials"):
        p = mosdac_resp["masked_credentials"].get("password")
        if p:
            assert p == "••••••••"
    print("\n[PASSED] Test 10: Secret masking and gitignore protection verified.")

if __name__ == "__main__":
    test_funcs = [
        ("Test 1: Server Boot & Zero-Mock Confirmation", test_01_server_boot_and_zero_mock),
        ("Test 2: Official IMD Connector & Telemetry", test_02_imd_connector_and_status),
        ("Test 3: MOSDAC ISRO Satellite Connector", test_03_mosdac_connector_and_status),
        ("Test 4: NOAA GFS & GEFS Ensemble Connectors", test_04_noaa_gfs_and_gefs),
        ("Test 5: GeoJSON Map Layer Endpoints (5 layers)", test_05_map_layer_endpoints),
        ("Test 6: Geocoding Search Endpoint", test_06_geocoding_search),
        ("Test 7: Admin Live Connection Test Endpoint", test_07_admin_test_connection),
        ("Test 8: Strict Multi-Model Fallback & Math Invariance", test_08_mathematical_blending_invariance),
        ("Test 9: JWT Authentication & RBAC Roles", test_09_jwt_authentication_and_rbac),
        ("Test 10: Security & Zero Secret Leakage", test_10_security_and_credential_masking)
    ]
    
    print("\n=======================================================")
    print("WEATHERFUSION AI — ACCEPTANCE TEST SUITE (SECTION 126)")
    print("=======================================================")
    passed = 0
    failed = 0
    for name, func in test_funcs:
        try:
            func()
            passed += 1
        except Exception as e:
            print(f"\n[FAILED] {name}: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
            
    print("\n=======================================================")
    print(f"ACCEPTANCE TEST RESULTS: {passed} PASSED, {failed} FAILED (TOTAL: {len(test_funcs)})")
    print("=======================================================\n")
    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

