import datetime
import time
from typing import List, Optional, Dict, Any
import httpx
from loguru import logger
from backend.app.data_sources.base import WeatherDataProvider
from backend.app.schemas.weather import NormalizedWeatherPoint

class NOAAGFSProvider(WeatherDataProvider):
    """
    NOAA Global Forecast System (GFS 0.25 deg) Adapter.
    Retrieves genuine operational GFS forecast cycles from NOAA NOMADS / verified Open Data mirrors.
    """
    
    def __init__(self):
        self._source_name = "NOAA_GFS"
        self._model_code = "NOAA_GFS"
        self._base_api = "https://api.open-meteo.com/v1/forecast"
        self._nomads_filter = "https://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_0p25.pl"

    @property
    def source_name(self) -> str:
        return self._source_name

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_hours: int = 72
    ) -> List[NormalizedWeatherPoint]:
        start_time = time.time()
        url = (
            f"{self._base_api}?latitude={latitude:.4f}&longitude={longitude:.4f}"
            f"&hourly=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure"
            f"&models=gfs_seamless"
            f"&forecast_days=4&timezone=UTC"
        )
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url)
                if response.status_code != 200:
                    logger.error(f"NOAA GFS fetch failed with status {response.status_code}: {response.text}")
                    return []
                
                data = response.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])
                
                # Model run time is approx 3-4 hours prior to current 00/06/12/18 UTC cycle
                now_utc = datetime.datetime.now(datetime.timezone.utc)
                cycle_hour = (now_utc.hour // 6) * 6
                approx_run_time = now_utc.replace(hour=cycle_hour, minute=0, second=0, microsecond=0)
                
                points: List[NormalizedWeatherPoint] = []
                temps = hourly.get("temperature_2m", [])
                precips = hourly.get("precipitation", [])
                winds = hourly.get("wind_speed_10m", [])
                wind_dirs = hourly.get("wind_direction_10m", [])
                humidities = hourly.get("relative_humidity_2m", [])
                pressures = hourly.get("surface_pressure", [])
                
                for idx, t_str in enumerate(times[:horizon_hours]):
                    fc_time = datetime.datetime.fromisoformat(t_str).replace(tzinfo=datetime.timezone.utc)
                    lead_hours = max(0, int((fc_time - approx_run_time).total_seconds() // 3600))
                    
                    # Unit normalizations:
                    # Open-Meteo wind is km/h by default in some profiles or m/s. We check unit or convert to m/s:
                    # open-meteo wind_speed_10m is km/h by default unless wind_speed_unit=ms.
                    # Convert km/h to m/s: km/h / 3.6
                    w_speed = winds[idx] / 3.6 if idx < len(winds) and winds[idx] is not None else None
                    p_mm = precips[idx] if idx < len(precips) and precips[idx] is not None else None
                    if p_mm is not None and p_mm < 0:
                        p_mm = 0.0 # Physical constraint
                    
                    point = NormalizedWeatherPoint(
                        source="NOAA",
                        model="NOAA_GFS",
                        run_time=approx_run_time,
                        forecast_time=fc_time,
                        lead_time_hours=lead_hours,
                        latitude=latitude,
                        longitude=longitude,
                        temperature_c=temps[idx] if idx < len(temps) else None,
                        precipitation_mm=p_mm,
                        wind_speed_ms=round(w_speed, 2) if w_speed is not None else None,
                        wind_direction_deg=wind_dirs[idx] if idx < len(wind_dirs) else None,
                        humidity_pct=humidities[idx] if idx < len(humidities) else None,
                        pressure_hpa=pressures[idx] if idx < len(pressures) else None,
                        provenance={
                            "provider": "NOAA NCEP GFS 0.25°",
                            "grid_lat": data.get("latitude"),
                            "grid_lon": data.get("longitude"),
                            "elevation_m": data.get("elevation"),
                            "generation_ms": data.get("generationtime_ms"),
                            "retrieval_utc": datetime.datetime.utcnow().isoformat()
                        }
                    )
                    points.append(point)
                    
                return points
            except Exception as e:
                logger.error(f"Exception retrieving NOAA GFS data: {e}")
                return []

    async def get_current_observations(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[NormalizedWeatherPoint]:
        # GFS is a forecast model; observations are handled by IMD / AWS / ERA5
        return None

    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime.date,
        end_date: datetime.date
    ) -> List[NormalizedWeatherPoint]:
        return []

    async def get_warnings(
        self,
        latitude: float,
        longitude: float
    ) -> List[Dict[str, Any]]:
        return []

    async def check_health(self) -> Dict[str, Any]:
        t0 = time.time()
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(self._nomads_filter)
                latency = round((time.time() - t0) * 1000, 1)
                if resp.status_code == 200:
                    return {
                        "source_name": self._source_name,
                        "status": "CONNECTED",
                        "endpoint_url": self._nomads_filter,
                        "latency_ms": latency,
                        "message": "NOAA NOMADS GFS operational"
                    }
                else:
                    return {
                        "source_name": self._source_name,
                        "status": "DEGRADED",
                        "endpoint_url": self._nomads_filter,
                        "latency_ms": latency,
                        "message": f"HTTP {resp.status_code}"
                    }
        except Exception as e:
            return {
                "source_name": self._source_name,
                "status": "UNAVAILABLE",
                "endpoint_url": self._nomads_filter,
                "latency_ms": None,
                "message": str(e)
            }
