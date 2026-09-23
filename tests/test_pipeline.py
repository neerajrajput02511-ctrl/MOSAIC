import sys
import os
from pathlib import Path

# Ensure root workspace is on python sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
import datetime
from sqlalchemy.orm import Session
from backend.app.database.session import SessionLocal
from backend.app.database.init_db import init_db
from backend.app.database.models import Location, Region, ModelMetadata
from backend.app.services.weather_service import WeatherService
from backend.app.ml.blending import BlendingEngine
from backend.app.ml.regimes import WeatherRegimeClassifier
from backend.app.ml.uncertainty import UncertaintyEngine
from backend.app.ml.skill_engine import HistoricalSkillEngine

def test_database_initialization():
    """Verify tables exist and seeding accurately populated NER stations."""
    init_db()
    db = SessionLocal()
    try:
        locs = db.query(Location).all()
        assert len(locs) >= 10, f"Expected at least 10 stations, found {len(locs)}"
        
        # Verify Guwahati, Assam is seeded
        guwahati = db.query(Location).filter(Location.name == "Guwahati").first()
        assert guwahati is not None, "Guwahati location must be seeded"
        assert guwahati.state == "Assam"
        assert guwahati.is_ner is True
        
        # Verify models are seeded
        models = db.query(ModelMetadata).all()
        model_codes = [m.code for m in models]
        assert "NOAA_GFS" in model_codes
        assert "ECMWF_IFS" in model_codes
        assert "ECMWF_AIFS" in model_codes
    finally:
        db.close()

def test_weight_normalization_and_constraints():
    """Verify sum(w_i) == 1.0 and all w_i >= 0 across varying conditions."""
    models = ["NOAA_GFS", "ECMWF_IFS", "ECMWF_AIFS"]
    
    # 1. Equal weights
    eq_weights = BlendingEngine.calculate_equal_weights(models)
    assert abs(sum(eq_weights.values()) - 1.0) < 1e-4
    assert all(w >= 0 for w in eq_weights.values())

    # 2. Skill weights with varying MAEs
    maes = {"NOAA_GFS": 2.8, "ECMWF_IFS": 2.1, "ECMWF_AIFS": 2.4}
    skill_weights = BlendingEngine.calculate_skill_weights(maes)
    assert abs(sum(skill_weights.values()) - 1.0) < 1e-4
    assert all(w >= 0 for w in skill_weights.values())
    # Lower MAE must have higher weight
    assert skill_weights["ECMWF_IFS"] > skill_weights["NOAA_GFS"]

    # 3. AI Adaptive weights
    preds = {"NOAA_GFS": 12.0, "ECMWF_IFS": 8.5, "ECMWF_AIFS": 9.2}
    ad_weights, method, *_ = BlendingEngine.calculate_adaptive_weights(
        model_predictions=preds,
        historical_maes=maes,
        lead_time_hours=48,
        season="Monsoon",
        weather_regime="Heavy Rainfall",
        disagreement_std=1.5
    )
    assert abs(sum(ad_weights.values()) - 1.0) < 1e-4
    assert all(w >= 0 for w in ad_weights.values())

def test_blending_calculation():
    """Verify Y_blend = sum(w_i * y_i) exact math."""
    preds = {"NOAA_GFS": 10.0, "ECMWF_IFS": 20.0, "ECMWF_AIFS": 30.0}
    weights = {"NOAA_GFS": 0.25, "ECMWF_IFS": 0.50, "ECMWF_AIFS": 0.25}
    # Expected: 0.25*10 + 0.50*20 + 0.25*30 = 2.5 + 10.0 + 7.5 = 20.0
    blended = BlendingEngine.blend(preds, weights)
    assert blended == 20.0

def test_regime_classification_physics():
    """Verify meteorologically consistent classification."""
    # Heavy Rain
    regime, reason, _ = WeatherRegimeClassifier.classify(
        precip_24h_mm=75.0, temp_max_c=28.0, wind_max_ms=5.0, humidity_avg_pct=88.0
    )
    assert regime == WeatherRegimeClassifier.REGIME_HEAVY_RAIN
    assert "Heavy Rainfall" in reason

    # Extreme Rain
    regime_ext, _, _ = WeatherRegimeClassifier.classify(
        precip_24h_mm=210.0, temp_max_c=27.0, wind_max_ms=10.0, humidity_avg_pct=92.0
    )
    assert regime_ext == WeatherRegimeClassifier.REGIME_EXTREME_RAIN

    # High Wind Squall
    regime_wind, _, _ = WeatherRegimeClassifier.classify(
        precip_24h_mm=10.0, temp_max_c=29.0, wind_max_ms=18.0, humidity_avg_pct=75.0
    )
    assert regime_wind == WeatherRegimeClassifier.REGIME_HIGH_WIND

def test_historical_metrics_calculation():
    """Verify MAE, RMSE, Bias, and CSI calculation without fabrication."""
    import numpy as np
    obs = np.array([10.0, 20.0, 0.0, 50.0, 5.0])
    pred = np.array([12.0, 18.0, 2.0, 45.0, 4.0])
    metrics = HistoricalSkillEngine.calculate_continuous_metrics(obs, pred)
    
    assert metrics["n"] == 5
    assert metrics["mae"] > 0
    assert metrics["rmse"] >= metrics["mae"] # Cauchy-Schwarz inequality
    
    # Contingency threshold >= 15.0
    # obs >= 15: indices 1 (20) and 3 (50) -> 2 events
    # pred >= 15: indices 1 (18) and 3 (45) -> 2 events
    # Hits = 2, Misses = 0, False Alarms = 0
    cont = HistoricalSkillEngine.calculate_contingency_metrics(obs, pred, threshold_mm=15.0)
    assert cont["hits"] == 2
    assert cont["pod"] == 1.0
    assert cont["csi"] == 1.0

async def test_live_data_and_blended_pipeline():
    """End-to-end integration test against live external feeds."""
    db = SessionLocal()
    try:
        service = WeatherService(db)
        guwahati = db.query(Location).filter(Location.name == "Guwahati").first()
        assert guwahati is not None
        
        # Test full blended forecast generation
        blended = await service.get_blended_forecast(guwahati.id, horizon_hours=24)
        assert blended is not None
        assert "timeline" in blended
        assert len(blended["timeline"]) >= 24
        
        # Check first forecast point
        pt0 = blended["timeline"][0]
        assert "blended_precipitation_mm" in pt0
        assert "blended_temperature_c" in pt0
        assert "weights" in pt0
        assert abs(sum(pt0["weights"].values()) - 1.0) < 1e-3
        
        # Check explainability
        why = await service.get_explainability(guwahati.id, lead_time_hours=24)
        assert why is not None
        assert why.location.name == "Guwahati"
        assert len(why.model_breakdown) >= 3
        
        # Check system health
        health = await service.get_system_health()
        assert health["status"] == "OPERATIONAL"
        assert len(health["data_sources"]) >= 5
    finally:
        db.close()

if __name__ == "__main__":
    test_database_initialization()
    test_weight_normalization_and_constraints()
    test_blending_calculation()
    test_regime_classification_physics()
    test_historical_metrics_calculation()
    print("Unit tests passed. Executing live pipeline integration test...")
    asyncio.run(test_live_data_and_blended_pipeline())
    print("All tests PASSED successfully!")
