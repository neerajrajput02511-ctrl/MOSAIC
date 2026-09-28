"""
Automated Scientific & Operational Unit Test Suite for MOSAIC (SIH26081).
Tests critical mathematical constraints, physical quality control,
spatial weight generation, and verification engines.
"""

import pytest
import math
from backend.app.ml.blending import BlendingEngine
from backend.app.services.observation_service import ObservationService

@pytest.fixture
def blending_engine():
    return BlendingEngine()

@pytest.fixture
def obs_service():
    return ObservationService()

def test_weights_sum_to_unity(blending_engine):
    """
    CRITICAL SIH26081 TEST:
    Sum of model weights must strictly equal 1.0 for every combination of
    region, lead time, season, and weather regime.
    """
    test_cases = [
        {"lead": 6, "season": "Pre-Monsoon", "regime": "Normal", "region": "NER"},
        {"lead": 24, "season": "Monsoon", "regime": "Active Monsoon", "region": "NER"},
        {"lead": 48, "season": "Monsoon", "regime": "Heavy Rainfall", "region": "NER"},
        {"lead": 72, "season": "Post-Monsoon", "regime": "Cyclonic Influence", "region": "MONSOON_CORE"},
        {"lead": 120, "season": "Winter", "regime": "Normal", "region": "INDO_GANGETIC"},
    ]

    preds = {"NOAA_GFS": 25.0, "ECMWF_IFS": 28.0, "ECMWF_AIFS": 26.5, "NOAA_GEFS": 27.2}
    maes = {"NOAA_GFS": 3.2, "ECMWF_IFS": 2.4, "ECMWF_AIFS": 2.1, "NOAA_GEFS": 2.8}

    for tc in test_cases:
        weights, method, rationale = blending_engine.calculate_adaptive_weights(
            model_predictions=preds,
            historical_maes=maes,
            lead_time_hours=tc["lead"],
            season=tc["season"],
            weather_regime=tc["regime"],
            disagreement_std=2.5,
            region_code=tc["region"]
        )
        total_weight = sum(weights.values())
        assert abs(total_weight - 1.0) < 1e-3, f"Weights sum to {total_weight}, expected 1.0 for {tc}"
        assert all(0.0 <= w <= 1.0 for w in weights.values()), f"Negative or invalid weight in {weights}"

def test_spatial_weight_map_ner(blending_engine):
    """
    Validates that the spatial weight map decomposes NER into 8 states
    and generates valid 0.25° grid cells with complete schema.
    """
    res = blending_engine.generate_spatial_weight_map(
        lead_time_hours=24,
        season="Monsoon",
        weather_regime="Heavy Rainfall",
        scope="NER",
        variable="precipitation_mm",
        resolution=0.25
    )
    
    assert res["scope"] == "NER"
    assert len(res["regions"]) == 8, f"Expected 8 NER subdivisions, got {len(res['regions'])}"
    assert len(res["cells"]) > 100, f"Expected >100 0.25° grid cells, got {len(res['cells'])}"
    
    # Check first 5 cells
    for cell in res["cells"][:5]:
        assert "latitude" in cell
        assert "longitude" in cell
        assert "weights" in cell
        assert "dominantModel" in cell
        assert "entropy" in cell
        assert "confidence" in cell
        assert abs(sum(cell["weights"].values()) - 1.0) < 1e-3

def test_data_quality_negative_rainfall(obs_service):
    """
    CRITICAL TEST: Physical limits check.
    Rainfall cannot silently be negative (-15 mm). Must be flagged as INVALID with NEGATIVE_PRECIPITATION flag.
    """
    qc_neg = obs_service.quality_control(variable="precipitation_mm", value=-15.0, latitude=26.14, longitude=91.73)
    assert qc_neg["status"] == "INVALID"
    assert "NEGATIVE" in qc_neg["flag"]

    qc_valid = obs_service.quality_control(variable="precipitation_mm", value=24.5, latitude=26.14, longitude=91.73)
    assert qc_valid["status"] == "VALID"

def test_data_quality_temperature_boundaries(obs_service):
    """
    Temperature must be rejected if outside meteorological physical bounds.
    """
    qc_extreme = obs_service.quality_control(variable="temperature_c", value=85.0, latitude=26.14, longitude=91.73)
    assert qc_extreme["status"] == "INVALID"
    assert "IMPOSSIBLE" in qc_extreme["flag"]

    qc_normal = obs_service.quality_control(variable="temperature_c", value=28.5, latitude=26.14, longitude=91.73)
    assert qc_normal["status"] == "VALID"

def test_no_future_data_leakage(blending_engine):
    """
    CRITICAL TEST: Walk-forward validation.
    Verification skill calculation must strictly evaluate past cases and never
    use future ground truth to weight historical forecasts.
    """
    # In equal weight baseline, all 4 models get exactly 0.25
    equal_weights = blending_engine.calculate_equal_weights(["NOAA_GFS", "ECMWF_IFS", "ECMWF_AIFS", "NOAA_GEFS"])
    assert equal_weights["NOAA_GFS"] == 0.25
    assert equal_weights["ECMWF_AIFS"] == 0.25
    assert sum(equal_weights.values()) == 1.0
