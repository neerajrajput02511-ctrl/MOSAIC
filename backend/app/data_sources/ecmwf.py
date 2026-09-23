import datetime
import time
from typing import List, Optional, Dict, Any, Tuple
import httpx
from loguru import logger
from backend.app.data_sources.base import WeatherDataProvider
from backend.app.schemas.weather import NormalizedWeatherPoint
from backend.app.core.config import settings

class ECMWFProvider(WeatherDataProvider):
    """
    ECMWF Data Provider Adapter.
    Retrieves:
      1. ECMWF Integrated Forecasting System (IFS 0.25 deg NWP)
      2. ECMWF Artificial Intelligence Forecasting System (AIFS 0.25 deg Deep Learning)
    Normalizes units to mm, deg C, m/s, hPa, % and tags strict provenance.
    """
    
    def __init__(self, model_variant: str = "ECMWF_IFS"):
        """
        model_variant: "ECMWF_IFS" or "ECMWF_AIFS"
        """
        self._variant = model_variant
        self._source_name = model_variant
        self._base_api = "https://api.open-meteo.com/v1/forecast"
        self._ecmwf_portal = "https://data.ecmwf.int/"
        self._api_url = "https://api.ecmwf.int/v1"
        self._api_key = settings.ECMWF_API_KEY
        self._email = settings.ECMWF_API_EMAIL
        
        if model_variant == "ECMWF_AIFS":
            self._model_param = "ecmwf_aifs025"
            self._display_name = "ECMWF AIFS (Deep Learning)"
        else:
            self._model_param = "ecmwf_ifs025"
            self._display_name = "ECMWF IFS (0.25° NWP)"

    @property
    def source_name(self) -> str:
        return self._source_name

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_hours: int = 72
    ) -> List[NormalizedWeatherPoint]:
        url = (
            f"{self._base_api}?latitude={latitude:.4f}&longitude={longitude:.4f}"
            f"&hourly=temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure"
            f"&models={self._model_param}"
            f"&forecast_days=4&timezone=UTC"
        )
        
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(url)
                if response.status_code != 200:
                    logger.error(f"{self._display_name} fetch failed with status {response.status_code}: {response.text}")
                    return []
                
                data = response.json()
                hourly = data.get("hourly", {})
                times = hourly.get("time", [])
                
                now_utc = datetime.datetime.now(datetime.timezone.utc)
                # ECMWF runs are 00 and 12 UTC
                cycle_hour = 12 if now_utc.hour >= 18 else (0 if now_utc.hour >= 6 else 12)
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
                    
                    w_speed = winds[idx] / 3.6 if idx < len(winds) and winds[idx] is not None else None
                    p_mm = precips[idx] if idx < len(precips) and precips[idx] is not None else None
                    if p_mm is not None and p_mm < 0:
                        p_mm = 0.0
                    
                    point = NormalizedWeatherPoint(
                        source="ECMWF",
                        model=self._variant,
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
                            "provider": self._display_name,
                            "license": "CC-BY 4.0 ECMWF Open Data",
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
                logger.error(f"Exception retrieving {self._display_name} data: {e}")
                return []

    async def get_current_observations(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[NormalizedWeatherPoint]:
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

    def set_credentials(self, api_key: Optional[str] = None, email: Optional[str] = None):
        if api_key is not None:
            self._api_key = api_key.strip()
        if email is not None:
            self._email = email.strip()

    def is_authenticated(self) -> bool:
        return bool(self._api_key and len(self._api_key.strip()) > 0)

    def get_masked_credentials(self) -> Dict[str, Optional[str]]:
        masked_key = None
        if self._api_key:
            k = self._api_key.strip()
            masked_key = f"{k[:2]}••••••••{k[-2:]}" if len(k) > 4 else "••••••••"
        return {
            "email": self._email,
            "api_key": masked_key
        }

    def get_status_summary(self) -> Dict[str, Any]:
        return {
            "source_name": self._source_name,
            "provider_name": "European Centre for Medium-Range Weather Forecasts (ECMWF)",
            "api_base_url": self._api_url,
            "is_authenticated": self.is_authenticated(),
            "masked_credentials": self.get_masked_credentials(),
            "last_checked": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }

    async def check_health(self) -> Dict[str, Any]:
        t0 = time.time()
        # If API key is configured, test official ECMWF who-am-i endpoint
        if self.is_authenticated() and self._email:
            try:
                headers = {
                    "From": self._email,
                    "X-ECMWF-KEY": self._api_key
                }
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.get(f"{self._api_url}/who-am-i", headers=headers)
                    latency = round((time.time() - t0) * 1000, 1)
                    if resp.status_code == 200:
                        user_info = resp.json()
                        return {
                            "source_name": self._source_name,
                            "status": "CONNECTED",
                            "endpoint_url": f"{self._api_url}/who-am-i",
                            "authenticated": True,
                            "latency_ms": latency,
                            "account_name": user_info.get("full_name", "ECMWF Member"),
                            "account_email": self._email,
                            "message": f"ECMWF authenticated for {user_info.get('full_name')} ({self._email})"
                        }
                    else:
                        return {
                            "source_name": self._source_name,
                            "status": "AUTH_FAILED",
                            "endpoint_url": f"{self._api_url}/who-am-i",
                            "authenticated": False,
                            "latency_ms": latency,
                            "message": f"ECMWF returned HTTP {resp.status_code}"
                        }
            except Exception as e:
                logger.warning(f"ECMWF direct auth check: {e}")

        # Fallback check against portal / mirror
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(self._ecmwf_portal)
                latency = round((time.time() - t0) * 1000, 1)
                return {
                    "source_name": self._source_name,
                    "status": "CONNECTED" if resp.status_code == 200 else "DEGRADED",
                    "endpoint_url": self._ecmwf_portal,
                    "authenticated": self.is_authenticated(),
                    "latency_ms": latency,
                    "message": f"{self._display_name} accessible"
                }
        except Exception as e:
            return {
                "source_name": self._source_name,
                "status": "UNAVAILABLE",
                "endpoint_url": self._ecmwf_portal,
                "authenticated": False,
                "latency_ms": None,
                "message": str(e)
            }
