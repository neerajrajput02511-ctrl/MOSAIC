import datetime
from typing import List, Dict, Any
from backend.app.schemas.weather import LocationSchema

class ExtremeWeatherEngine:
    """
    Evaluates multi-model blended forecasts and active observations against official
    India Meteorological Department (IMD) warning criteria.
    Never generates unsupported disaster claims.
    """

    # IMD 24-hour Rainfall Standard Classifications:
    # Very Light Rain: 0.1 - 2.4 mm
    # Light Rain: 2.5 - 15.5 mm
    # Moderate Rain: 15.6 - 64.4 mm
    # Heavy Rain: 64.5 - 115.5 mm (Yellow/Orange Alert)
    # Very Heavy Rain: 115.6 - 204.4 mm (Orange/Red Alert)
    # Extremely Heavy Rain: >= 204.5 mm (Red Alert)

    @classmethod
    def evaluate_events(
        cls,
        location: LocationSchema,
        forecast_timeline: List[Dict[str, Any]],
        imd_bulletins: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        events = []
        
        # 1. Check cumulative 24h forecast windows for extreme precipitation
        if len(forecast_timeline) >= 24:
            precip_24h = sum(pt.get("precipitation_mm", 0.0) or 0.0 for pt in forecast_timeline[:24])
            precip_24h = round(precip_24h, 1)
            
            if precip_24h >= 204.5:
                events.append({
                    "event_type": "EXTREMELY_HEAVY_RAINFALL",
                    "severity": "RED_ALERT",
                    "title": "Extremely Heavy Rainfall Expected (>= 204.5 mm/24h)",
                    "description": f"Forecast 24-hour cumulative rainfall reaches {precip_24h} mm in {location.name}. High risk of flash flooding and severe localized inundation.",
                    "criterion": "IMD Severe Weather Standard (>= 204.5 mm/24h)",
                    "start_time": forecast_timeline[0]["forecast_time"],
                    "end_time": forecast_timeline[23]["forecast_time"],
                    "value": precip_24h,
                    "unit": "mm"
                })
            elif precip_24h >= 115.6:
                events.append({
                    "event_type": "VERY_HEAVY_RAINFALL",
                    "severity": "ORANGE_ALERT",
                    "title": "Very Heavy Rainfall Expected (115.6 - 204.4 mm/24h)",
                    "description": f"Forecast 24-hour cumulative rainfall reaches {precip_24h} mm in {location.name}. Moderate to high risk of urban waterlogging and hill slope instability.",
                    "criterion": "IMD Standard (115.6 - 204.4 mm/24h)",
                    "start_time": forecast_timeline[0]["forecast_time"],
                    "end_time": forecast_timeline[23]["forecast_time"],
                    "value": precip_24h,
                    "unit": "mm"
                })
            elif precip_24h >= 64.5:
                events.append({
                    "event_type": "HEAVY_RAINFALL",
                    "severity": "YELLOW_WATCH",
                    "title": "Heavy Rainfall Advisory (64.5 - 115.5 mm/24h)",
                    "description": f"Forecast 24-hour cumulative rainfall reaches {precip_24h} mm in {location.name}. Be updated on local road conditions.",
                    "criterion": "IMD Heavy Rain Standard (64.5 - 115.5 mm/24h)",
                    "start_time": forecast_timeline[0]["forecast_time"],
                    "end_time": forecast_timeline[23]["forecast_time"],
                    "value": precip_24h,
                    "unit": "mm"
                })

        # 2. Check Wind Squalls
        max_wind_pt = max(forecast_timeline[:48], key=lambda pt: pt.get("wind_speed_ms", 0.0) or 0.0) if forecast_timeline else None
        if max_wind_pt and (max_wind_pt.get("wind_speed_ms") or 0.0) >= 15.0:
            w_ms = max_wind_pt.get("wind_speed_ms")
            w_kmh = round(w_ms * 3.6, 1)
            events.append({
                "event_type": "HIGH_WIND_SQUALL",
                "severity": "ORANGE_ALERT" if w_ms >= 20.0 else "YELLOW_WATCH",
                "title": f"Strong Wind / Squall Gusts ({w_kmh} km/h)",
                "description": f"Peak sustained wind forecast reaches {w_ms} m/s ({w_kmh} km/h) around {max_wind_pt['forecast_time']}.",
                "criterion": "IMD Squall Guidance (>= 15 m/s)",
                "start_time": max_wind_pt["forecast_time"],
                "end_time": max_wind_pt["forecast_time"],
                "value": w_kmh,
                "unit": "km/h"
            })

        # 3. Check official IMD nowcast warnings if passed
        if imd_bulletins:
            for b in imd_bulletins:
                events.append({
                    "event_type": "OFFICIAL_IMD_NOWCAST",
                    "severity": "YELLOW_WATCH" if "light" in b.get("warning", "").lower() else "ORANGE_ALERT",
                    "title": f"IMD Nowcast: {b.get('warning')}",
                    "description": f"Official Nowcast for {b.get('district')}: {b.get('warning')} valid until {b.get('valid_until')}.",
                    "criterion": "Official India Meteorological Department Nowcast Feed",
                    "start_time": b.get("date"),
                    "end_time": b.get("valid_until"),
                    "value": None,
                    "unit": None
                })
                
        return events
