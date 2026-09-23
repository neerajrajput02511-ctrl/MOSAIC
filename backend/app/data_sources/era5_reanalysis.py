import datetime
import time
from typing import List, Optional, Dict, Any
import httpx
from loguru import logger
from backend.app.data_sources.base import WeatherDataProvider
from backend.app.schemas.weather import NormalizedWeatherPoint

class ERA5ReanalysisProvider(WeatherDataProvider):
    """
    ECMWF ERA5 / Archive Reanalysis Data Provider.
    Retrieves genuine historical atmospheric observations and reanalysis ground truth
    for walk-forward model skill evaluation.
    """
    
    def __init__(self):
        self._source_name = "ERA5"
        self._archive_api = "https://archive-api.open-meteo.com/v1/archive"

    @property
    def source_name(self) -> str:
        return self._source_name

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_hours: int = 72
    ) -> List[NormalizedWeatherPoint]:
        return []

    async def get_current_observations(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[NormalizedWeatherPoint]:
        # ERA5 has a ~5-day latency in open feeds; use previous recent reanalysis point if needed
        return None

    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime.date,
        end_date: datetime.date
    ) -> List[NormalizedWeatherPoint]:
        url = (
            f"{self._archive_api}?latitude={latitude:.4f}&longitude={longitude:.4f}"
            f"&start_date={start_date.isoformat()}&end_date={end_date.isoformat()}"
            f"&hourly=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure"
            f"&timezone=UTC"
        )
        
        async with httpx.AsyncClient(timeout=20.0) as client:
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.error(f"ERA5 archive fetch failed: {resp.status_code} - {resp.text}")
                    return []
                
                data = resp.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])
                temps = hourly.get("temperature_2m", [])
                precips = hourly.get("precipitation", [])
                winds = hourly.get("wind_speed_10m", [])
                wind_dirs = hourly.get("wind_direction_10m", [])
                humidities = hourly.get("relative_humidity_2m", [])
                pressures = hourly.get("surface_pressure", [])
                
                points: List[NormalizedWeatherPoint] = []
                for idx, t_str in enumerate(times):
                    obs_time = datetime.datetime.fromisoformat(t_str).replace(tzinfo=datetime.timezone.utc)
                    w_speed = winds[idx] / 3.6 if idx < len(winds) and winds[idx] is not None else None
                    p_mm = precips[idx] if idx < len(precips) and precips[idx] is not None else None
                    if p_mm is not None and p_mm < 0:
                        p_mm = 0.0
                        
                    pt = NormalizedWeatherPoint(
                        source="ERA5_REANALYSIS",
                        model="ECMWF_ERA5",
                        run_time=obs_time,
                        forecast_time=obs_time,
                        lead_time_hours=0,
                        latitude=latitude,
                        longitude=longitude,
                        temperature_c=temps[idx] if idx < len(temps) else None,
                        precipitation_mm=p_mm,
                        wind_speed_ms=round(w_speed, 2) if w_speed is not None else None,
                        wind_direction_deg=wind_dirs[idx] if idx < len(wind_dirs) else None,
                        humidity_pct=humidities[idx] if idx < len(humidities) else None,
                        pressure_hpa=pressures[idx] if idx < len(pressures) else None,
                        provenance={
                            "provider": "ECMWF Copernicus Climate Change Service (C3S) ERA5",
                            "resolution_deg": 0.25,
                            "dataset": "ERA5 reanalysis hourly ground truth",
                            "grid_lat": data.get("latitude"),
                            "grid_lon": data.get("longitude"),
                            "retrieval_utc": datetime.datetime.utcnow().isoformat()
                        }
                    )
                    points.append(pt)
                return points
            except Exception as e:
                logger.error(f"Error fetching ERA5 historical data: {e}")
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
                # Test minimal metadata ping
                test_url = f"{self._archive_api}?latitude=26.14&longitude=91.74&start_date=2024-01-01&end_date=2024-01-01&hourly=temperature_2m"
                resp = await client.get(test_url)
                latency = round((time.time() - t0) * 1000, 1)
                return {
                    "source_name": self._source_name,
                    "status": "CONNECTED" if resp.status_code == 200 else "DEGRADED",
                    "endpoint_url": self._archive_api,
                    "latency_ms": latency,
                    "message": "ERA5 historical ground truth archive online"
                }
        except Exception as e:
            return {
                "source_name": self._source_name,
                "status": "UNAVAILABLE",
                "endpoint_url": self._archive_api,
                "latency_ms": None,
                "message": str(e)
            }
