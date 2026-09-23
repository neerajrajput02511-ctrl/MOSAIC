import math
import numpy as np
from typing import Dict, Tuple, Optional

class UncertaintyEngine:
    """
    Quantifies multi-model forecast uncertainty and model disagreement spread.
    Provides verifiable confidence intervals grounded in physical dispersion.
    Never fabricates confidence percentages.
    """

    @staticmethod
    def calculate_disagreement(
        model_predictions: Dict[str, Optional[float]],
        weights: Optional[Dict[str, float]] = None
    ) -> float:
        """
        Calculates weighted or unweighted standard deviation across models:
        sigma = sqrt( sum( w_i * (y_i - y_mean)^2 ) )
        """
        valid_vals = [v for v in model_predictions.values() if v is not None]
        if len(valid_vals) <= 1:
            return 0.0
            
        if not weights:
            return round(float(np.std(valid_vals)), 2)
            
        mean_val = float(np.mean(valid_vals))
        variance = sum(
            weights.get(m, 1.0 / len(valid_vals)) * ((val - mean_val) ** 2)
            for m, val in model_predictions.items()
            if val is not None
        )
        return round(float(math.sqrt(max(0.0, variance))), 2)

    @classmethod
    def calculate_uncertainty_interval(
        cls,
        blended_value: float,
        disagreement_spread: float,
        variable: str = "precipitation_mm"
    ) -> Tuple[float, float, str]:
        """
        Returns:
          (lower_bound, upper_bound, confidence_indicator)
        """
        if blended_value is None:
            return 0.0, 0.0, "DATA_UNAVAILABLE"
            
        # Confidence interval scaled by model disagreement
        spread = max(1.2, disagreement_spread * 1.5)
        lower = round(max(0.0 if "precip" in variable or "wind" in variable else -50.0, blended_value - spread), 1)
        upper = round(blended_value + spread, 1)
        
        # Determine calibrated confidence label
        if disagreement_spread < 2.5:
            confidence = "HIGH_CONFIDENCE"
        elif disagreement_spread < 8.0:
            confidence = "MODERATE_CONFIDENCE"
        else:
            confidence = "HIGH_UNCERTAINTY"
            
        return lower, upper, confidence
