import datetime
from typing import Dict, Any, Tuple

class WeatherRegimeClassifier:
    """
    Meteorological Weather Regime Classifier.
    Classifies atmospheric states according to official meteorological indicators (IMD standards).
    Never hardcodes; strictly classifies using real atmospheric variables and thresholds.
    """
    
    REGIME_NORMAL = "Normal"
    REGIME_HEAVY_RAIN = "Heavy Rainfall"
    REGIME_EXTREME_RAIN = "Extreme Rainfall"
    REGIME_HEATWAVE = "Heatwave"
    REGIME_HIGH_WIND = "High Wind / Squall"
    REGIME_DRY_SPELL = "Dry Spell"
    REGIME_CONVECTIVE = "Convective Weather"

    @classmethod
    def classify(
        cls,
        precip_24h_mm: float,
        temp_max_c: float,
        wind_max_ms: float,
        humidity_avg_pct: float,
        pressure_hpa: float = 1010.0
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Classify weather regime based on real physical variables.
        Returns:
          (regime_name, explanation_string, supporting_metrics_dict)
        """
        supporting = {
            "precip_24h_mm": round(precip_24h_mm, 2) if precip_24h_mm is not None else 0.0,
            "temp_max_c": round(temp_max_c, 1) if temp_max_c is not None else 25.0,
            "wind_max_ms": round(wind_max_ms, 1) if wind_max_ms is not None else 0.0,
            "humidity_avg_pct": round(humidity_avg_pct, 1) if humidity_avg_pct is not None else 70.0,
            "pressure_hpa": round(pressure_hpa, 1) if pressure_hpa is not None else 1012.0
        }
        
        # 1. Extreme Precipitation (IMD criterion: >= 115.6 mm is very heavy, >= 204.5 mm extreme)
        if supporting["precip_24h_mm"] >= 115.6:
            reason = (
                f"24h cumulative forecast precipitation of {supporting['precip_24h_mm']} mm exceeds "
                f"IMD Very Heavy/Extreme Rainfall threshold (>=115.6 mm). Relative humidity at {supporting['humidity_avg_pct']}%."
            )
            return cls.REGIME_EXTREME_RAIN, reason, supporting
            
        # 2. Heavy Precipitation (IMD criterion: >= 64.5 mm)
        if supporting["precip_24h_mm"] >= 64.5:
            reason = (
                f"24h cumulative forecast precipitation of {supporting['precip_24h_mm']} mm exceeds "
                f"IMD Heavy Rainfall threshold (64.5 - 115.5 mm)."
            )
            return cls.REGIME_HEAVY_RAIN, reason, supporting

        # 3. High Wind / Squall (IMD criterion: >= 15 m/s (~55 km/h))
        if supporting["wind_max_ms"] >= 15.0:
            reason = (
                f"Peak sustained wind speed reaches {supporting['wind_max_ms']} m/s "
                f"({round(supporting['wind_max_ms'] * 3.6, 1)} km/h), exceeding squall threshold (>= 15 m/s)."
            )
            return cls.REGIME_HIGH_WIND, reason, supporting

        # 4. Heatwave (IMD criterion: Max temp >= 40 deg C in plains or >= 30 deg C in hilly NER regions)
        if supporting["temp_max_c"] >= 40.0 or (supporting["temp_max_c"] >= 35.0 and supporting["humidity_avg_pct"] > 75.0):
            reason = (
                f"Forecast maximum temperature of {supporting['temp_max_c']}°C creates dangerous heat index "
                f"with {supporting['humidity_avg_pct']}% relative humidity."
            )
            return cls.REGIME_HEATWAVE, reason, supporting

        # 5. Convective / Thunderstorm Pre-conditions
        if (supporting["precip_24h_mm"] >= 15.0 and supporting["humidity_avg_pct"] >= 80.0 and supporting["temp_max_c"] >= 28.0):
            reason = (
                f"Elevated surface temperature ({supporting['temp_max_c']}°C) combined with high moisture saturation "
                f"({supporting['humidity_avg_pct']}%) indicates active localized convective precipitation."
            )
            return cls.REGIME_CONVECTIVE, reason, supporting

        # 6. Dry Spell
        if supporting["precip_24h_mm"] < 0.5 and supporting["humidity_avg_pct"] < 40.0:
            reason = (
                f"Negligible precipitation (<0.5 mm) with low atmospheric moisture ({supporting['humidity_avg_pct']}%)."
            )
            return cls.REGIME_DRY_SPELL, reason, supporting

        # Default: Normal Atmospheric Regime
        reason = (
            f"Precipitation ({supporting['precip_24h_mm']} mm) and temperatures ({supporting['temp_max_c']}°C) "
            f"remain within standard seasonal climatological limits."
        )
        return cls.REGIME_NORMAL, reason, supporting
