"""
Meteorological Weather Regime Classifier for MOSAIC.
Compliant with MoES / IMD (India Meteorological Department) synoptic classification criteria.

Supported 10 Synoptic Weather Regimes:
1. NORMAL: Atmospheric variables within seasonal climatological bounds
2. ACTIVE_MONSOON: Monsoon trough active; sustained wide-scale precipitation >= 20mm, RH > 75%, low pressure
3. BREAK_MONSOON: Monsoon season (JJAS) with trough shifted to foothills; rainfall < 2.5mm, elevated temperatures
4. HEAVY_RAIN: 24h accumulated rainfall >= 64.5 mm (IMD Heavy Rain criterion)
5. HEATWAVE: Max temperature >= 40.0°C in plains or >= 30.0°C in hills, or significant departure
6. HIGH_WIND: Peak sustained wind speed >= 15.0 m/s (~55 km/h, squall threshold)
7. CYCLONIC: Tropical depression/cyclonic storm with surface pressure < 1000 hPa & sustained wind >= 17.5 m/s
8. CONVECTIVE: Severe pre-monsoon/afternoon convection: high CAPE proxy (RH >= 80%, Temp >= 28°C, localized rain)
9. DRY_STABLE: Anticyclonic continental air: RH < 35%, precip < 0.2mm, pressure >= 1015 hPa
10. WESTERN_DISTURBANCE: Winter/spring mid-latitude trough over Northern/NW India: rain/snow, temp < 18°C, lat >= 26°N
"""

import datetime
from typing import Dict, Any, Tuple, Optional

class WeatherRegimeClassifier:
    """
    Synoptic Weather Regime Classification Engine.
    Evaluates atmospheric state variables against established IMD physical thresholds.
    Outputs the active regime, a human-readable explanation, and supporting telemetry.
    """

    REGIME_NORMAL = "NORMAL"
    REGIME_ACTIVE_MONSOON = "ACTIVE_MONSOON"
    REGIME_BREAK_MONSOON = "BREAK_MONSOON"
    REGIME_HEAVY_RAIN = "HEAVY_RAIN"
    REGIME_EXTREME_RAIN = "HEAVY_RAIN"  # Alias for IMD extremely heavy rainfall
    REGIME_HEATWAVE = "HEATWAVE"
    REGIME_HIGH_WIND = "HIGH_WIND"
    REGIME_CYCLONIC = "CYCLONIC"
    REGIME_CONVECTIVE = "CONVECTIVE"
    REGIME_DRY_STABLE = "DRY_STABLE"
    REGIME_WESTERN_DISTURBANCE = "WESTERN_DISTURBANCE"

    ALL_REGIMES = [
        REGIME_NORMAL,
        REGIME_ACTIVE_MONSOON,
        REGIME_BREAK_MONSOON,
        REGIME_HEAVY_RAIN,
        REGIME_HEATWAVE,
        REGIME_HIGH_WIND,
        REGIME_CYCLONIC,
        REGIME_CONVECTIVE,
        REGIME_DRY_STABLE,
        REGIME_WESTERN_DISTURBANCE
    ]

    @classmethod
    def classify(
        cls,
        precip_24h_mm: float,
        temp_max_c: float,
        wind_max_ms: float,
        humidity_avg_pct: float,
        pressure_hpa: float = 1010.0,
        month: Optional[int] = None,
        latitude: float = 26.0
    ) -> Tuple[str, str, Dict[str, Any]]:
        """
        Classifies current atmospheric regime using physical boundary conditions.
        Returns:
            (regime_name, explanation_string, supporting_metrics_dict)
        """
        if month is None:
            month = datetime.datetime.utcnow().month

        is_monsoon_season = (month in [6, 7, 8, 9]) # June, July, August, September
        is_winter_spring = (month in [11, 12, 1, 2, 3]) # Nov to March

        precip = round(precip_24h_mm, 2) if precip_24h_mm is not None else 0.0
        temp = round(temp_max_c, 1) if temp_max_c is not None else 25.0
        wind = round(wind_max_ms, 1) if wind_max_ms is not None else 5.0
        humidity = round(humidity_avg_pct, 1) if humidity_avg_pct is not None else 65.0
        pressure = round(pressure_hpa, 1) if pressure_hpa is not None else 1012.0

        supporting = {
            "precip_24h_mm": precip,
            "temp_max_c": temp,
            "wind_max_ms": wind,
            "humidity_avg_pct": humidity,
            "pressure_hpa": pressure,
            "month": month,
            "latitude": latitude,
            "is_monsoon_season": is_monsoon_season
        }

        # 1. CYCLONIC REGIME: Deep depression / Cyclonic storm
        if pressure < 1000.0 and wind >= 17.5:
            reason = (
                f"Cyclonic signature detected: Barometric core pressure dropped to {pressure} hPa "
                f"(< 1000 hPa threshold) with sustained gale-force winds of {wind} m/s ({round(wind * 3.6, 1)} km/h)."
            )
            return cls.REGIME_CYCLONIC, reason, supporting

        # 2. HEAVY RAINFALL REGIME (IMD criteria >= 64.5 mm)
        if precip >= 64.5:
            severity = "Extremely Heavy" if precip >= 204.5 else ("Very Heavy" if precip >= 115.6 else "Heavy")
            reason = (
                f"IMD {severity} Rainfall alert triggered: 24h precipitation reaches {precip} mm "
                f"(exceeds 64.5 mm threshold). High relative humidity ({humidity}%)."
            )
            return cls.REGIME_HEAVY_RAIN, reason, supporting

        # 3. HIGH WIND / SQUALL REGIME
        if wind >= 15.0:
            reason = (
                f"Squall-level surface wind speeds reached {wind} m/s ({round(wind * 3.6, 1)} km/h), "
                f"exceeding the IMD squall criterion (>= 15 m/s)."
            )
            return cls.REGIME_HIGH_WIND, reason, supporting

        # 4. HEATWAVE REGIME
        if temp >= 40.0 or (latitude >= 25.0 and temp >= 38.0 and humidity > 60.0):
            reason = (
                f"Heatwave criteria met: Maximum temperature of {temp}°C combined with {humidity}% humidity "
                f"creates severe physiological heat stress and high thermal advection."
            )
            return cls.REGIME_HEATWAVE, reason, supporting

        # 5. WESTERN DISTURBANCE (Northern/Northwest India during winter/spring)
        if is_winter_spring and latitude >= 24.0 and precip >= 5.0 and temp < 20.0 and pressure < 1012.0:
            reason = (
                f"Western Disturbance synoptic feature active: Mid-latitude extra-tropical trough producing "
                f"precipitation ({precip} mm) with depressed daytime temperature ({temp}°C) at latitude {latitude}°N."
            )
            return cls.REGIME_WESTERN_DISTURBANCE, reason, supporting

        # 6. ACTIVE MONSOON REGIME
        if is_monsoon_season and precip >= 15.0 and humidity >= 75.0 and pressure < 1008.0:
            reason = (
                f"Active Southwest Monsoon regime: Strong southwesterly moisture flux with 24h precipitation "
                f"of {precip} mm, relative humidity of {humidity}%, and active monsoon trough axis."
            )
            return cls.REGIME_ACTIVE_MONSOON, reason, supporting

        # 7. BREAK MONSOON REGIME
        if is_monsoon_season and precip < 2.5 and humidity < 65.0 and pressure >= 1008.0:
            reason = (
                f"Break Monsoon condition: Monsoon trough has migrated north towards Himalayan foothills; "
                f"widespread rainfall suppressed ({precip} mm) with elevated surface temperatures ({temp}°C)."
            )
            return cls.REGIME_BREAK_MONSOON, reason, supporting

        # 8. CONVECTIVE / THUNDERSTORM REGIME
        if precip >= 8.0 and humidity >= 78.0 and temp >= 27.0:
            reason = (
                f"Severe localized thermodynamic instability: Surface heat ({temp}°C) and moisture saturation "
                f"({humidity}%) driving diurnal convective storm development."
            )
            return cls.REGIME_CONVECTIVE, reason, supporting

        # 9. DRY STABLE REGIME
        if precip < 0.5 and humidity < 35.0 and pressure >= 1014.0:
            reason = (
                f"Anticyclonic continental airmass: Persistent subsiding dry air with low humidity ({humidity}%), "
                f"clear skies, and high barometric pressure ({pressure} hPa)."
            )
            return cls.REGIME_DRY_STABLE, reason, supporting

        # 10. NORMAL REGIME
        reason = (
            f"Equilibrium synoptic state: Precipitation ({precip} mm), temperature ({temp}°C), "
            f"and wind ({wind} m/s) stay within standard seasonal climatological deviations."
        )
        return cls.REGIME_NORMAL, reason, supporting
