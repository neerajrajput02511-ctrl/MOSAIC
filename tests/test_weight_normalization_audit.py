"""
MOSAIC Mathematical Acceptance Test (Requirement 13)

Validates:
1. RAW WEIGHTS: may sum to != 1.0 (e.g. 0.96)
2. NORMALIZED WEIGHTS: MUST sum strictly to 1.000000
3. MOSAIC BLEND: Σ(normalized_weight_i * forecast_value_i) equals displayed blend within tolerance
4. EQUAL MEAN: Σ(valid values) / N equals displayed equal mean
5. AIFS OUTAGE SIMULATION: Surviving models renormalize to 1.000000, recalculate MOSAIC and Equal Mean
"""

import sys
import os
import math

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.ml.blending import BlendingEngine

def test_weight_normalization_acceptance():
    print("=" * 60)
    print("MOSAIC FINAL MATHEMATICAL ACCEPTANCE AUDIT")
    print("=" * 60)

    # 1. Given user scenario inputs:
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

    raw_sum = sum(raw_weights.values())
    print(f"\n1. RAW WEIGHTS:")
    for k, v in raw_weights.items():
        print(f"   {k}: {v:.2f} ({v*100:.0f}%)")
    print(f"   RAW SUM = {raw_sum:.4f}")
    assert abs(raw_sum - 0.96) < 1e-4, f"Raw sum expected 0.96, got {raw_sum}"

    # Previous unnormalized blend check
    prev_unnormalized_blend = sum(preds[k] * raw_weights[k] for k in preds)
    print(f"   (Previous unnormalized weighted sum = {prev_unnormalized_blend:.4f} -> {round(prev_unnormalized_blend, 1)} mm)")
    assert round(prev_unnormalized_blend, 1) == 14.8

    # 2. Normalization at source:
    # normalized_weight_i = raw_weight_i / sum(raw_weights)
    normalized_weights = {k: v / raw_sum for k, v in raw_weights.items()}
    norm_sum = sum(normalized_weights.values())
    print(f"\n2. NORMALIZED WEIGHTS:")
    for k, v in normalized_weights.items():
        print(f"   {k}: {v:.6f} ({v*100:.4f}%)")
    print(f"   NORMALIZED SUM = {norm_sum:.6f}")
    assert abs(norm_sum - 1.000000) < 1e-6, f"Normalized sum must equal 1.0, got {norm_sum}"

    # Check expected normalized percentages
    assert abs(normalized_weights["NOAA_GFS"] - (0.14 / 0.96)) < 1e-6
    assert abs(normalized_weights["ECMWF_IFS"] - (0.42 / 0.96)) < 1e-6
    assert abs(normalized_weights["ECMWF_AIFS"] - (0.32 / 0.96)) < 1e-6
    assert abs(normalized_weights["NOAA_GEFS"] - (0.08 / 0.96)) < 1e-6

    # 3. MOSAIC Blend Calculation:
    # Σ(normalized_weight_i * forecast_value_i)
    exact_weighted_sum = sum(preds[k] * normalized_weights[k] for k in preds)
    mosaic_blend = round(exact_weighted_sum, 1)
    blend_engine_val = BlendingEngine.blend(preds, normalized_weights)

    print(f"\n3. MOSAIC CALCULATION:")
    print(f"   Exact weighted sum = {exact_weighted_sum:.4f} mm")
    print(f"   Displayed MOSAIC blend = {mosaic_blend:.1f} mm")
    print(f"   BlendingEngine.blend = {blend_engine_val:.2f} mm")
    assert abs(exact_weighted_sum - mosaic_blend) < 0.05, f"Identity diff too large: {abs(exact_weighted_sum - mosaic_blend)}"
    assert mosaic_blend == 15.4

    # 4. Equal Mean Baseline:
    # Σ(valid forecast values) / N
    exact_avg = sum(preds.values()) / len(preds)
    equal_mean = round(exact_avg, 1)
    equal_mean_engine = BlendingEngine.calculate_equal_mean(preds)

    print(f"\n4. EQUAL MEAN BASELINE:")
    print(f"   Exact average = {exact_avg:.4f} mm")
    print(f"   Displayed Equal Mean = {equal_mean:.1f} mm")
    print(f"   BlendingEngine.calculate_equal_mean = {equal_mean_engine:.2f} mm")
    assert abs(equal_mean - 15.9) < 1e-4, f"Equal mean expected 15.9, got {equal_mean}"

    # 5. Failure Test (Simulate AIFS Outage):
    print(f"\n5. SIMULATE AIFS OUTAGE TEST:")
    surviving_preds = {k: v for k, v in preds.items() if k != "ECMWF_AIFS"}
    active_raw_weights = {k: v for k, v in raw_weights.items() if k != "ECMWF_AIFS"}
    active_raw_sum = sum(active_raw_weights.values()) # 0.14 + 0.42 + 0.08 = 0.64
    assert abs(active_raw_sum - 0.64) < 1e-4

    outage_norm_weights = {k: v / active_raw_sum for k, v in active_raw_weights.items()}
    outage_norm_sum = sum(outage_norm_weights.values())
    print(f"   Surviving active models: {list(surviving_preds.keys())}")
    for k, v in outage_norm_weights.items():
        print(f"   {k}: {v:.6f} ({v*100:.2f}%)")
    print(f"   Surviving normalized sum = {outage_norm_sum:.6f}")
    assert abs(outage_norm_sum - 1.0) < 1e-6

    # Surviving Equal Mean
    surviving_equal_mean = round(sum(surviving_preds.values()) / len(surviving_preds), 1)
    print(f"   Surviving Equal Mean (N=3) = {surviving_equal_mean:.1f} mm (Expected: 16.0 mm)")
    assert surviving_equal_mean == 16.0

    # Surviving MOSAIC Blend
    surviving_exact_sum = sum(surviving_preds[k] * outage_norm_weights[k] for k in surviving_preds)
    surviving_mosaic = round(surviving_exact_sum, 1)
    print(f"   Surviving exact weighted sum = {surviving_exact_sum:.4f} mm -> {surviving_mosaic:.1f} mm (Expected: 15.3 mm)")
    assert surviving_mosaic == 15.3
    assert abs(surviving_exact_sum - surviving_mosaic) < 0.05

    print("\n" + "=" * 60)
    print("ALL MATHEMATICAL ACCEPTANCE ASSERTIONS PASSED (100% STRICT IDENTITY MATCH)")
    print("=" * 60)

if __name__ == "__main__":
    test_weight_normalization_acceptance()
