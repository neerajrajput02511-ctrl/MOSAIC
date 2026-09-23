import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
import datetime
from sqlalchemy.orm import Session
from backend.app.database.models import ModelPerformance

class HistoricalSkillEngine:
    """
    Computes rigorous statistical verification metrics comparing
    model hindcasts/forecasts against ground-truth observations.
    Never fabricates metrics.
    """

    @staticmethod
    def calculate_continuous_metrics(
        observed: np.ndarray,
        predicted: np.ndarray
    ) -> Dict[str, Optional[float]]:
        """
        Calculates MAE, RMSE, Mean Bias Error, and Pearson Correlation.
        """
        # Filter valid paired values
        valid_mask = ~np.isnan(observed) & ~np.isnan(predicted)
        obs_clean = observed[valid_mask]
        pred_clean = predicted[valid_mask]
        
        n = len(obs_clean)
        if n == 0:
            return {"mae": None, "rmse": None, "bias": None, "correlation": None, "n": 0}
            
        mae = float(np.mean(np.abs(pred_clean - obs_clean)))
        rmse = float(np.sqrt(np.mean((pred_clean - obs_clean) ** 2)))
        bias = float(np.mean(pred_clean - obs_clean)) # Mean Bias Error: >0 overpredicts, <0 underpredicts
        
        # Pearson correlation
        if np.std(obs_clean) > 1e-6 and np.std(pred_clean) > 1e-6:
            correlation = float(np.corrcoef(obs_clean, pred_clean)[0, 1])
        else:
            correlation = 0.0
            
        return {
            "mae": round(mae, 3),
            "rmse": round(rmse, 3),
            "bias": round(bias, 3),
            "correlation": round(correlation, 3),
            "n": n
        }

    @staticmethod
    def calculate_contingency_metrics(
        observed: np.ndarray,
        predicted: np.ndarray,
        threshold_mm: float = 15.6 # Moderate rainfall threshold
    ) -> Dict[str, Optional[float]]:
        """
        Calculates 2x2 Contingency Table for extreme event classification:
        - Hits (a): Obs >= threshold & Pred >= threshold
        - False Alarms (b): Obs < threshold & Pred >= threshold
        - Misses (c): Obs >= threshold & Pred < threshold
        - Correct Rejections (d): Obs < threshold & Pred < threshold
        
        Metrics:
        - POD (Probability of Detection) = a / (a + c)
        - FAR (False Alarm Ratio) = b / (a + b)
        - CSI (Critical Success Index / Threat Score) = a / (a + b + c)
        """
        valid_mask = ~np.isnan(observed) & ~np.isnan(predicted)
        obs_clean = observed[valid_mask]
        pred_clean = predicted[valid_mask]
        
        if len(obs_clean) == 0:
            return {"pod": None, "far": None, "csi": None, "hits": 0, "false_alarms": 0, "misses": 0}
            
        hits = int(np.sum((obs_clean >= threshold_mm) & (pred_clean >= threshold_mm)))
        false_alarms = int(np.sum((obs_clean < threshold_mm) & (pred_clean >= threshold_mm)))
        misses = int(np.sum((obs_clean >= threshold_mm) & (pred_clean < threshold_mm)))
        
        # Probability of Detection (Hit rate)
        pod = hits / (hits + misses) if (hits + misses) > 0 else 0.0
        # False Alarm Ratio
        far = false_alarms / (hits + false_alarms) if (hits + false_alarms) > 0 else 0.0
        # Critical Success Index
        csi = hits / (hits + misses + false_alarms) if (hits + misses + false_alarms) > 0 else 0.0
        
        return {
            "pod": round(float(pod), 3),
            "far": round(float(far), 3),
            "csi": round(float(csi), 3),
            "hits": hits,
            "false_alarms": false_alarms,
            "misses": misses
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
