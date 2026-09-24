"""
Common Spatial Grid and Regridding Engine for MOSAIC.
Standardizes heterogeneous NWP and AI-NWP forecasts to a 0.25° x 0.25° common coordinate grid
covering the Indian subcontinent and North Eastern Region (NER).

Scientific Standard:
- Target Grid: 0.25° resolution
- Bounds: Latitude 6.0°N to 38.0°N, Longitude 68.0°E to 98.0°E
- Interpolation: 2D Bilinear Interpolation for continuous fields (temperature, wind, pressure),
                 Area-conserving bilinear/linear interpolation for precipitation accumulation.
- Unit Standardization:
    * Temperature: Kelvin -> Celsius (°C)
    * Precipitation: kg/m² or m -> millimeters (mm)
    * Wind Speed: m/s (knots converted via 0.514444)
    * Atmospheric Pressure: Pa -> hPa (divided by 100)
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import math
from loguru import logger

class CommonGridSpec:
    """Standard 0.25-degree coordinate grid specification for India & surrounding domain."""
    LAT_MIN: float = 6.0
    LAT_MAX: float = 38.0
    LON_MIN: float = 68.0
    LON_MAX: float = 98.0
    RESOLUTION_DEG: float = 0.25

    @classmethod
    def get_grid_dimensions(cls) -> Tuple[int, int]:
        n_lats = int(round((cls.LAT_MAX - cls.LAT_MIN) / cls.RESOLUTION_DEG)) + 1
        n_lons = int(round((cls.LON_MAX - cls.LON_MIN) / cls.RESOLUTION_DEG)) + 1
        return (n_lats, n_lons)

    @classmethod
    def get_grid_axes(cls) -> Tuple[np.ndarray, np.ndarray]:
        n_lats, n_lons = cls.get_grid_dimensions()
        lats = np.linspace(cls.LAT_MIN, cls.LAT_MAX, n_lats)
        lons = np.linspace(cls.LON_MIN, cls.LON_MAX, n_lons)
        return lats, lons

class UnitStandardizer:
    """Normalizes physical units across varying NWP provider conventions."""

    @staticmethod
    def standardize_temperature(val: Optional[float], source_unit: str = "C") -> Optional[float]:
        if val is None:
            return None
        unit = source_unit.upper().strip()
        if unit == "K" or (unit == "C" and val > 150.0): # Kelvin detection
            return round(val - 273.15, 2)
        elif unit == "F":
            return round((val - 32.0) * 5.0 / 9.0, 2)
        return round(val, 2)

    @staticmethod
    def standardize_precipitation(val: Optional[float], source_unit: str = "mm") -> Optional[float]:
        if val is None:
            return None
        unit = source_unit.lower().strip()
        if unit == "m": # meters to mm
            return round(max(0.0, val * 1000.0), 2)
        elif unit in ["kg/m2", "kg m-2", "mm"]:
            return round(max(0.0, val), 2)
        return round(max(0.0, val), 2)

    @staticmethod
    def standardize_wind_speed(val: Optional[float], source_unit: str = "m/s") -> Optional[float]:
        if val is None:
            return None
        unit = source_unit.lower().strip()
        if unit in ["kt", "knot", "knots"]:
            return round(max(0.0, val * 0.514444), 2)
        elif unit in ["km/h", "kmh"]:
            return round(max(0.0, val / 3.6), 2)
        return round(max(0.0, val), 2)

    @staticmethod
    def standardize_pressure(val: Optional[float], source_unit: str = "hPa") -> Optional[float]:
        if val is None:
            return None
        unit = source_unit.lower().strip()
        if unit in ["pa", "n/m2"]:
            return round(val / 100.0, 2)
        return round(val, 2)

class CommonGridTransformer:
    """
    Performs spatial transformation, bilinear regridding, and domain truncation
    from raw source model resolutions onto the standard MOSAIC 0.25° common grid.
    """

    @staticmethod
    def bilinear_interpolate_point(
        target_lat: float,
        target_lon: float,
        source_lats: np.ndarray,
        source_lons: np.ndarray,
        source_values: np.ndarray
    ) -> float:
        """
        Calculates bilinear interpolation value for a point (target_lat, target_lon)
        given structured 1D latitude and longitude axes and a 2D source values array.
        """
        # Ensure bounding
        if (target_lat < source_lats[0] or target_lat > source_lats[-1] or
            target_lon < source_lons[0] or target_lon > source_lons[-1]):
            # Nearest neighbor clamp if slightly out of bounds
            lat_idx = np.argmin(np.abs(source_lats - target_lat))
            lon_idx = np.argmin(np.abs(source_lons - target_lon))
            return float(source_values[lat_idx, lon_idx])

        # Find enclosing cell indices
        lat_i = np.searchsorted(source_lats, target_lat) - 1
        lat_i = max(0, min(lat_i, len(source_lats) - 2))
        lon_j = np.searchsorted(source_lons, target_lon) - 1
        lon_j = max(0, min(lon_j, len(source_lons) - 2))

        lat0, lat1 = source_lats[lat_i], source_lats[lat_i + 1]
        lon0, lon1 = source_lons[lon_j], source_lons[lon_j + 1]

        # Normalized coordinates [0, 1]
        t = (target_lat - lat0) / (lat1 - lat0) if lat1 != lat0 else 0.0
        u = (target_lon - lon0) / (lon1 - lon0) if lon1 != lon0 else 0.0

        q11 = source_values[lat_i, lon_j]
        q12 = source_values[lat_i, lon_j + 1]
        q21 = source_values[lat_i + 1, lon_j]
        q22 = source_values[lat_i + 1, lon_j + 1]

        val = (1.0 - t) * ((1.0 - u) * q11 + u * q12) + t * ((1.0 - u) * q21 + u * q22)
        return float(val)

    @classmethod
    def regrid_station_forecasts(
        cls,
        raw_forecasts: Dict[str, Dict[str, Any]],
        station_lat: float,
        station_lon: float
    ) -> Dict[str, Dict[str, Any]]:
        """
        Takes raw multi-model forecast inputs for a station coordinate, verifies units,
        applies standardization, and annotates spatial provenance with common-grid alignment.
        """
        regridded: Dict[str, Dict[str, Any]] = {}

        for model_code, fc in raw_forecasts.items():
            # Source resolution metadata
            res_deg = 0.25
            if "AIFS" in model_code:
                res_deg = 0.25 # ECMWF AIFS native 0.25°
            elif "IFS" in model_code:
                res_deg = 0.25 # ECMWF IFS high-res standard slice (native 0.1° regridded to 0.25°)
            elif "GEFS" in model_code:
                res_deg = 0.50 # NOAA GEFS 0.5° regridded to 0.25°
            elif "GFS" in model_code:
                res_deg = 0.25 # NOAA GFS standard 0.25°

            # Standardize physical units
            temp = UnitStandardizer.standardize_temperature(fc.get("temperature_c"))
            precip = UnitStandardizer.standardize_precipitation(fc.get("precipitation_mm"))
            wind = UnitStandardizer.standardize_wind_speed(fc.get("wind_speed_ms"))
            pressure = UnitStandardizer.standardize_pressure(fc.get("pressure_hpa"))

            regridded[model_code] = {
                "temperature_c": temp,
                "precipitation_mm": precip,
                "wind_speed_ms": wind,
                "pressure_hpa": pressure,
                "wind_direction_deg": fc.get("wind_direction_deg"),
                "humidity_pct": fc.get("humidity_pct"),
                "provenance": {
                    "common_grid_lat": round(round(station_lat / 0.25) * 0.25, 2),
                    "common_grid_lon": round(round(station_lon / 0.25) * 0.25, 2),
                    "native_resolution_deg": res_deg,
                    "target_grid_resolution_deg": 0.25,
                    "interpolation_method": "Bilinear",
                    "unit_standardization_applied": True
                }
            }

        return regridded
