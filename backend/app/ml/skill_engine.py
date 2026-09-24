"""
Meteorological Statistical Verification Engine for MOSAIC.
Implements standard WMO (World Meteorological Organization) and MoES/NCMRWF
verification metrics for deterministic and probabilistic NWP forecasts.

Supported Metrics:
Continuous:
- MAE (Mean Absolute Error)
- RMSE (Root Mean Square Error)
- Bias (Mean Bias Error: >0 overpredicts, <0 underpredicts)
- Correlation (Pearson correlation coefficient)
- CRPS (Continuous Ranked Probability Score for probabilistic and ensemble forecasts)

Categorical / Extreme Event:
- Brier Score (BS)
- POD (Probability of Detection / Hit Rate / Recall)
- FAR (False Alarm Ratio)
- CSI (Critical Success Index / Threat Score)
- Precision (Positive Predictive Value)
- Recall (Sensitivity / POD)
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import datetime
import math
from sqlalchemy.orm import Session

class HistoricalSkillEngine:
    """
    Computes rigorous statistical verification metrics comparing
    model hindcasts/forecasts against ground-truth observations or ERA5 reanalysis.
    Never fabricates metrics.
    """

    @staticmethod
    def calculate_continuous_metrics(
        observed: np.ndarray,
        predicted: np.ndarray
    ) -> Dict[str, Optional[float]]:
        """
        Calculates continuous metrics: MAE, RMSE, Mean Bias Error, Correlation, CRPS.
        """
        valid_mask = ~np.isnan(observed) & ~np.isnan(predicted)
        obs_clean = observed[valid_mask]
        pred_clean = predicted[valid_mask]
        
        n = len(obs_clean)
        if n == 0:
            return {
                "mae": None, "rmse": None, "bias": None,
                "correlation": None, "crps": None, "n": 0
            }
            
        mae = float(np.mean(np.abs(pred_clean - obs_clean)))
        rmse = float(np.sqrt(np.mean((pred_clean - obs_clean) ** 2)))
        bias = float(np.mean(pred_clean - obs_clean))
        
        # Pearson correlation
        if np.std(obs_clean) > 1e-6 and np.std(pred_clean) > 1e-6:
            correlation = float(np.corrcoef(obs_clean, pred_clean)[0, 1])
        else:
            correlation = 0.0

        # Deterministic CRPS reduces to MAE
        crps = float(mae)
            
        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "bias": round(bias, 3),
            "correlation": round(correlation, 3),
            "crps": round(crps, 3),
            "n": n
        }

    @staticmethod
    def calculate_ensemble_crps(
        observed: float,
        ensemble_members: List[float]
    ) -> float:
        """
        Calculates exact CRPS for an ensemble forecast:
        CRPS = (1/M) * sum(|x_m - y|) - (1 / (2*M^2)) * sum_i sum_j (|x_i - x_j|)
        """
        if not ensemble_members or math.isnan(observed):
            return 0.0
        
        m_arr = np.array(ensemble_members, dtype=float)
        m = len(m_arr)
        if m == 0:
            return 0.0
            
        term1 = np.mean(np.abs(m_arr - observed))
        diff_matrix = np.abs(m_arr[:, None] - m_arr[None, :])
        term2 = np.sum(diff_matrix) / (2.0 * (m ** 2))
        
        return round(float(term1 - term2), 3)

    @staticmethod
    def calculate_contingency_metrics(
        observed: np.ndarray,
        predicted: np.ndarray,
        threshold: float = 15.6, # e.g. Moderate rainfall threshold (mm)
        forecast_probs: Optional[np.ndarray] = None,
        threshold_mm: Optional[float] = None
    ) -> Dict[str, Optional[float]]:
        if threshold_mm is not None:
            threshold = threshold_mm
        """
        Calculates 2x2 Contingency Table and categorical scores:
        - Hits (a): Obs >= threshold & Pred >= threshold
        - False Alarms (b): Obs < threshold & Pred >= threshold
        - Misses (c): Obs >= threshold & Pred < threshold
        - Correct Rejections (d): Obs < threshold & Pred < threshold
        
        Metrics:
        - POD (Probability of Detection / Recall) = a / (a + c)
        - FAR (False Alarm Ratio) = b / (a + b)
        - CSI (Critical Success Index / Threat Score) = a / (a + b + c)
        - Precision = a / (a + b)
        - Recall = a / (a + c)
        - Brier Score = (1/N) * sum((prob - binary_obs)^2)
        """
        valid_mask = ~np.isnan(observed) & ~np.isnan(predicted)
        obs_clean = observed[valid_mask]
        pred_clean = predicted[valid_mask]
        
        if len(obs_clean) == 0:
            return {
                "pod": None, "far": None, "csi": None,
                "precision": None, "recall": None, "brier_score": None,
                "hits": 0, "false_alarms": 0, "misses": 0, "correct_rejections": 0
            }
            
        obs_binary = (obs_clean >= threshold).astype(int)
        pred_binary = (pred_clean >= threshold).astype(int)

        hits = int(np.sum((obs_binary == 1) & (pred_binary == 1)))
        false_alarms = int(np.sum((obs_binary == 0) & (pred_binary == 1)))
        misses = int(np.sum((obs_binary == 1) & (pred_binary == 0)))
        correct_rejections = int(np.sum((obs_binary == 0) & (pred_binary == 0)))
        
        # POD (Probability of Detection / Recall)
        pod = hits / (hits + misses) if (hits + misses) > 0 else 0.0
        # FAR (False Alarm Ratio)
        far = false_alarms / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0
        # CSI (Critical Success Index)
        csi = hits / (hits + misses + false_alarms) if (hits + misses + false_alarms) > 0 else 0.0
        # Precision (Hits / (Hits + FA))
        precision = hits / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0
        # Recall (same as POD)
        recall = pod

        # Brier Score
        if forecast_probs is not None and len(forecast_probs) == len(obs_binary):
            clean_probs = np.clip(forecast_probs[valid_mask], 0.0, 1.0)
            brier_score = float(np.mean((clean_probs - obs_binary) ** 2))
        else:
            # Deterministic probability is 0 or 1
            brier_score = float(np.mean((pred_binary - obs_binary) ** 2))
        
        return {
            "pod": round(float(pod), 3),
            "far": round(float(far), 3),
            "csi": round(float(csi), 3),
            "precision": round(float(precision), 3),
            "recall": round(float(recall), 3),
            "brier_score": round(float(brier_score), 4),
            "hits": hits,
            "false_alarms": false_alarms,
            "misses": misses,
            "correct_rejections": correct_rejections
        }

    @classmethod
    def get_season_name(cls, month: int) -> str:
        """Standard IMD 4 meteorological seasons in India"""
        if month in [12, 1, 2]:
            return "Winter"
        elif month in [3, 4, 5]:
            return "Pre-Monsoon"
        elif month in [6, 7, 8, 9]:
            return "Monsoon"
        else:
            return "Post-Monsoon"
