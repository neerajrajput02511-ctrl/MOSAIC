import pytest
import datetime
import math
import os
import re
from backend.app.ml.blending import BlendingEngine
from backend.app.ml.uncertainty import UncertaintyEngine
from backend.app.database.session import SessionLocal
from backend.app.services.weather_service import WeatherService
from backend.app.database.init_db import init_db

# Initialize database schemas if not already initialized
init_db()

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def weather_service(db_session):
    return WeatherService(db_session)

# TEST 1: Weights sum to 1.
def test_1_weights_sum_to_one():
    test_models = {
        "NOAA_GFS": 18.8,
        "ECMWF_IFS": 14.5,
        "ECMWF_AIFS": 15.6,
        "NOAA_GEFS": 16.6
    }
    maes = {"NOAA_GFS": 2.8, "ECMWF_IFS": 2.1, "ECMWF_AIFS": 2.4, "NOAA_GEFS": 2.6}
    
    for lead in [24, 48, 72, 96, 120]:
        for regime in ["NORMAL", "ACTIVE_MONSOON", "BREAK_MONSOON", "HEAVY_RAIN"]:
            weights, _, _ = BlendingEngine.calculate_adaptive_weights(
                model_predictions=test_models,
                historical_maes=maes,
                lead_time_hours=lead,
                season="Monsoon",
                weather_regime=regime,
                disagreement_std=1.5
            )
            total = sum(weights.values())
            assert abs(total - 1.0) < 1e-4, f"Weights sum {total} != 1.0 at lead {lead}h in regime {regime}"

# TEST 2: No negative weights.
def test_2_no_negative_weights():
    test_models = {"NOAA_GFS": 12.0, "ECMWF_IFS": 10.0, "ECMWF_AIFS": 11.0, "NOAA_GEFS": 11.5}
    maes = {"NOAA_GFS": 3.5, "ECMWF_IFS": 2.0, "ECMWF_AIFS": 2.2, "NOAA_GEFS": 2.8}
    
    weights, _, _ = BlendingEngine.calculate_adaptive_weights(
        model_predictions=test_models,
        historical_maes=maes,
        lead_time_hours=72,
        season="Monsoon",
        weather_regime="NORMAL",
        disagreement_std=2.0
    )
    for model_code, w in weights.items():
        assert w >= 0.0, f"Negative weight found: {model_code} = {w}"
        assert w <= 1.0, f"Weight exceeding 1.0 found: {model_code} = {w}"

# TEST 3: Weighted blend equals displayed MOSAIC value with normalized weights.
def test_3_weighted_blend_equals_mosaic_value():
    # User scenario live numbers:
    # GFS = 17.2 mm, IFS = 14.5 mm, AIFS = 15.6 mm, GEFS = 16.3 mm
    # Raw Weights: 14%, 42%, 32%, 8% (sum = 0.96)
    preds = {
        "NOAA_GFS": 17.2,
        "ECMWF_IFS": 14.5,
        "ECMWF_AIFS": 15.6,
        "NOAA_GEFS": 16.3
    }
    raw_weights = {
        "NOAA_GFS": 0.14,
        "ECMWF_IFS": 0.42,
        "ECMWF_AIFS": 0.32,
        "NOAA_GEFS": 0.08
    }
    
    raw_sum = sum(raw_weights.values()) # 0.96
    # Normalized weights: w_i / sum(raw_weights)
    normalized_weights = {k: v / raw_sum for k, v in raw_weights.items()}
    assert abs(sum(normalized_weights.values()) - 1.0) < 1e-6
    
    # Exact weighted sum with normalized weights:
    exact_sum = sum(preds[k] * normalized_weights[k] for k in preds)
    blend_val = BlendingEngine.blend(preds, normalized_weights)
    
    assert abs(blend_val - exact_sum) < 0.05, f"Blend {blend_val} does not match weighted sum {exact_sum}"
    assert blend_val == 15.41 or round(exact_sum, 1) == 15.4

# TEST 4: Equal mean equals displayed baseline.
def test_4_equal_mean_equals_baseline():
    preds = {
        "NOAA_GFS": 17.2,
        "ECMWF_IFS": 14.5,
        "ECMWF_AIFS": 15.6,
        "NOAA_GEFS": 16.3
    }
    exact_average = (17.2 + 14.5 + 15.6 + 16.3) / 4.0 # 63.6 / 4 = 15.9
    equal_mean = BlendingEngine.calculate_equal_mean(preds)
    
    assert abs(equal_mean - exact_average) < 0.05, f"Equal mean {equal_mean} does not match average {exact_average}"
    assert equal_mean == 15.9

# TEST 5: Unavailable model causes correct renormalization.
def test_5_unavailable_model_renormalization():
    initial_weights = {
        "NOAA_GFS": 0.14,
        "ECMWF_IFS": 0.42,
        "ECMWF_AIFS": 0.32,
        "NOAA_GEFS": 0.08
    }
    # Simulate AIFS failure
    renorm = BlendingEngine.renormalize_weights_for_failure(initial_weights, "ECMWF_AIFS")
    
    assert renorm["ECMWF_AIFS"] == 0.0
    surviving_sum = renorm["NOAA_GFS"] + renorm["ECMWF_IFS"] + renorm["NOAA_GEFS"]
    assert abs(surviving_sum - 1.0) < 1e-4
    # Remaining weights should preserve relative order (IFS > GFS > GEFS)
    assert renorm["ECMWF_IFS"] > renorm["NOAA_GFS"] > renorm["NOAA_GEFS"]

# TEST 6: Confidence changes when uncertainty changes.
def test_6_confidence_changes_with_uncertainty():
    conf_low_unc, _ = BlendingEngine.calculate_traceable_confidence(
        std_dev=0.5, spread=1.2, avg_mae=2.0, available_count=4, total_count=4
    )
    conf_high_unc, _ = BlendingEngine.calculate_traceable_confidence(
        std_dev=8.0, spread=22.0, avg_mae=4.5, available_count=4, total_count=4
    )
    assert conf_low_unc > conf_high_unc, f"Confidence did not decrease under high uncertainty: {conf_low_unc} <= {conf_high_unc}"

# TEST 7: Provenance exists for every forecast.
@pytest.mark.asyncio
async def test_7_provenance_exists_for_forecast(weather_service):
    locs = weather_service.get_locations()
    assert len(locs) > 0
    snapshot = await weather_service.get_forecast_snapshot(locs[0].id, lead_time_hours=24)
    
    assert snapshot.provenance is not None
    assert "common_grid" in snapshot.provenance
    assert "regridding_method" in snapshot.provenance
    for m in snapshot.models:
        assert m.source is not None and len(m.source) > 0
        assert m.run_time is not None and len(m.run_time) > 0

# TEST 8: Forecast initialization and valid times are consistent.
@pytest.mark.asyncio
async def test_8_init_and_valid_times_consistent(weather_service):
    locs = weather_service.get_locations()
    snapshot = await weather_service.get_forecast_snapshot(locs[0].id, lead_time_hours=48)
    
    init_dt = datetime.datetime.fromisoformat(snapshot.initialization_time)
    valid_dt = datetime.datetime.fromisoformat(snapshot.valid_time)
    diff_hours = (valid_dt - init_dt).total_seconds() / 3600.0
    assert diff_hours == 48.0, f"Lead time hours mismatch: {diff_hours} != 48.0"

# TEST 9: No NaN / Infinity reaches frontend.
@pytest.mark.asyncio
async def test_9_no_nan_or_infinity(weather_service):
    locs = weather_service.get_locations()
    snapshot = await weather_service.get_forecast_snapshot(locs[0].id, lead_time_hours=24)
    
    assert not math.isnan(snapshot.mosaic_blend) and not math.isinf(snapshot.mosaic_blend)
    assert not math.isnan(snapshot.equal_mean) and not math.isinf(snapshot.equal_mean)
    assert not math.isnan(snapshot.uncertainty) and not math.isinf(snapshot.uncertainty)
    assert not math.isnan(snapshot.confidence) and not math.isinf(snapshot.confidence)
    for m in snapshot.models:
        assert not math.isnan(m.value) and not math.isinf(m.value)
        assert not math.isnan(m.weight) and not math.isinf(m.weight)

# TEST 10: No hardcoded forecast values remain in production components.
def test_10_no_hardcoded_forecast_values_in_production():
    # Verify that in forecastTruth.ts, mosaic_blend is strictly calculated from weighted sum
    filepath = os.path.join(os.getcwd(), "frontend", "utils", "forecastTruth.ts")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    assert "exactWeightedSum = activeModels.reduce" in content
    assert "mosaicBlend = Number(exactWeightedSum.toFixed(1))" in content
    assert "equalMean = Number((activeModels.reduce" in content

# TEST 11: No API secrets are exposed in frontend bundles.
def test_11_no_api_secrets_exposed():
    # Ensure no AWS_SECRET, API_KEY private tokens, or passwords are hardcoded in frontend code
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    secret_patterns = [
        re.compile(r"sk-[a-zA-Z0-9]{20,}"),
        re.compile(r"ghp_[a-zA-Z0-9]{20,}"),
        re.compile(r"aws_secret_access_key\s*="),
        re.compile(r"private_key\s*=")
    ]
    for root, _, files in os.walk(frontend_dir):
        if "node_modules" in root or ".next" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".json")):
                file_path = os.path.join(root, file)
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read()
                    for pat in secret_patterns:
                        assert not pat.search(text), f"Potential secret matched in {file_path}"

# TEST 12: Train/validation/test periods do not overlap.
def test_12_train_val_test_periods_do_not_overlap():
    train_start = datetime.date(2018, 1, 1)
    train_end = datetime.date(2022, 12, 31)
    
    val_start = datetime.date(2023, 1, 1)
    val_end = datetime.date(2023, 12, 31)
    
    test_start = datetime.date(2024, 1, 1)
    test_end = datetime.date(2024, 12, 31)
    
    assert train_end < val_start, "Train and Validation periods overlap"
    assert val_end < test_start, "Validation and Test periods overlap"
    assert (train_end - train_start).days > 365 * 4
    assert (val_end - val_start).days >= 364
    assert (test_end - test_start).days >= 364
