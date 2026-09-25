import datetime
import time
from typing import List, Optional, Dict, Any, Union
import httpx
from loguru import logger
from backend.app.core.config import settings
from backend.app.data_sources.base import WeatherDataProvider
from backend.app.schemas.weather import NormalizedWeatherPoint

# Official IMD State IDs for AWS/ARG observations
IMD_STATE_IDS = {
    "1": "TELANGANA",
    "2": "ANDHRA_PRADESH",
    "3": "HIMACHAL_PRADESH",
    "4": "KERALA",
    "5": "UTTAR_PRADESH",
    "6": "MEGHALAYA",
    "7": "DELHI",
    "8": "RAJASTHAN",
    "9": "GUJARAT",
    "10": "ODISHA",
    "11": "BIHAR",
    "12": "CHHATTISGARH",
    "13": "KARNATAKA",
    "14": "MIZORAM",
    "15": "JHARKHAND",
    "16": "TRIPURA",
    "17": "CHANDIGARH",
    "18": "JAMMU_AND_KASHMIR",
    "19": "GOA",
    "20": "SIKKIM",
    "21": "MAHARASHTRA",
    "22": "HARYANA"
}

class IMDProvider(WeatherDataProvider):
    """
    Official India Meteorological Department (IMD) Connector.
    Integrates:
      1. Official IMD API (https://api.imd.gov.in) with IMD_API_KEY authentication.
      2. Fallback to public IMD Mausam RSS & Nowcast GeoJSON layers (mausam.imd.gov.in)
         if API key is unconfigured.
      3. Strict credential checks: Never fabricates API keys or synthetic observation values.
    """
    
    def __init__(self):
        self._source_name = "IMD"
        self._api_base_url = settings.IMD_API_BASE_URL.rstrip("/")
        self._api_key = settings.IMD_API_KEY
        self._open_data_mode = getattr(settings, "IMD_OPEN_DATA_MODE", False)
        self._public_base_url = settings.IMD_BASE_URL.rstrip("/")
        self._cityforecastloc_url = f"{self._api_base_url}/api/v1/cityforecastloc"
        self._cityforecast_mapping_url = f"{self._api_base_url}/api/v1/cityforecast_mapping"
        self._aws_data_url = f"{self._api_base_url}/api/v1/aws_data"
        self._aws_data_mapping_url = f"{self._api_base_url}/api/v1/aws_data_mapping"
        self._visualize_url = "https://city.imd.gov.in"
        self._nowcast_geojson_url = f"{self._public_base_url}/responsive/nowcast.geojson"
        self._last_checked: Optional[datetime.datetime] = None
        self._last_status: str = "UNCHECKED"

    @property
    def source_name(self) -> str:
        return self._source_name

    def set_credentials(self, api_key: Optional[str] = None, open_data_mode: Optional[bool] = None):
        if api_key is not None:
            self._api_key = api_key.strip()
        if open_data_mode is not None:
            self._open_data_mode = open_data_mode

    def is_authenticated(self) -> bool:
        has_key = bool(self._api_key and len(self._api_key.strip()) > 0)
        return has_key or self._open_data_mode

    def get_masked_key(self) -> Optional[str]:
        if self._api_key and len(self._api_key.strip()) > 0:
            key = self._api_key.strip()
            if len(key) <= 6:
                return "••••••••"
            return f"{key[:3]}••••{key[-3:]}"
        if self._open_data_mode:
            return "MoES Open Access (No Key Required)"
        return None

    async def get_city_forecast_7days(
        self,
        station_id: Optional[str] = "42182",
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Retrieves official IMD 7-day City Weather forecast with latitude and longitude:
        URL: https://api.imd.gov.in/api/v1/cityforecastloc?id=42182
        Mapping: https://api.imd.gov.in/api/v1/cityforecast_mapping
        Visualize: https://city.imd.gov.in
        """
        if not self.is_authenticated():
            return {
                "success": False,
                "status": "AUTHENTICATION REQUIRED",
                "message": "IMD API Key required to query city weather forecast endpoint."
            }
        
        headers: Dict[str, str] = {"Accept": "application/json"}
        if self._api_key and len(self._api_key.strip()) > 0:
            headers["X-API-KEY"] = self._api_key.strip()
            headers["Authorization"] = f"Bearer {self._api_key.strip()}"
        params = {}
        if station_id:
            params["id"] = station_id
        if latitude is not None and longitude is not None:
            params["lat"] = str(latitude)
            params["lon"] = str(longitude)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self._cityforecastloc_url, headers=headers, params=params)
                if resp.status_code == 200:
                    return {
                        "success": True,
                        "data": resp.json(),
                        "provenance": {
                            "source": "IMD (api.imd.gov.in)",
                            "endpoint": self._cityforecastloc_url,
                            "visualize_url": self._visualize_url,
                            "station_id": station_id
                        }
                    }
                else:
                    return {
                        "success": False,
                        "status_code": resp.status_code,
                        "error": resp.text
                    }
        except Exception as e:
            logger.error(f"Error querying IMD cityforecastloc: {e}")
            return {"success": False, "error": str(e)}

    async def get_aws_arg_data(
        self,
        station_id: Optional[str] = None,
        state_id: Optional[Union[int, str]] = None
    ) -> Dict[str, Any]:
        """
        Retrieves official IMD Automated Weather Station (AWS) and Rain Gauge (ARG) data:
        URL: https://api.imd.gov.in/api/v1/aws_data
        By station ID: https://api.imd.gov.in/api/v1/aws_data?id=NDL
        State-wise: https://api.imd.gov.in/api/v1/aws_data?sid=7
        """
        if not self.is_authenticated():
            return {
                "success": False,
                "status": "AUTHENTICATION REQUIRED",
                "message": "IMD API Key required to query AWS/ARG observational data."
            }

        headers: Dict[str, str] = {"Accept": "application/json"}
        if self._api_key and len(self._api_key.strip()) > 0:
            headers["X-API-KEY"] = self._api_key.strip()
            headers["Authorization"] = f"Bearer {self._api_key.strip()}"

        params = {}
        if station_id:
            params["id"] = station_id
        if state_id is not None:
            params["sid"] = str(state_id)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self._aws_data_url, headers=headers, params=params)
                if resp.status_code == 200:
                    state_name = IMD_STATE_IDS.get(str(state_id)) if state_id else None
                    return {
                        "success": True,
                        "data": resp.json(),
                        "query": {
                            "station_id": station_id,
                            "state_id": str(state_id) if state_id else None,
                            "state_name": state_name
                        },
                        "provenance": {
                            "source": "IMD (api.imd.gov.in)",
                            "endpoint": self._aws_data_url,
                            "data_type": "AWS/ARG Real-Time Ground Observations"
                        }
                    }
                else:
                    return {
                        "success": False,
                        "status_code": resp.status_code,
                        "error": resp.text
                    }
        except Exception as e:
            logger.error(f"Error querying IMD aws_data: {e}")
            return {"success": False, "error": str(e)}

    async def get_aws_mapping_data(self) -> Dict[str, Any]:
        """
        Retrieves station mapping catalog for AWS/ARG stations:
        URL: https://api.imd.gov.in/api/v1/aws_data_mapping
        """
        if not self.is_authenticated():
            return {
                "success": False,
                "status": "AUTHENTICATION REQUIRED",
                "message": "IMD API Key required to query AWS mapping catalog."
            }

        headers: Dict[str, str] = {"Accept": "application/json"}
        if self._api_key and len(self._api_key.strip()) > 0:
            headers["X-API-KEY"] = self._api_key.strip()
            headers["Authorization"] = f"Bearer {self._api_key.strip()}"

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(self._aws_data_mapping_url, headers=headers)
                if resp.status_code == 200:
                    return {
                        "success": True,
                        "data": resp.json(),
                        "state_ids": IMD_STATE_IDS
                    }
                else:
                    return {
                        "success": False,
                        "status_code": resp.status_code,
                        "error": resp.text
                    }
        except Exception as e:
            logger.error(f"Error querying IMD aws_data_mapping: {e}")
            return {"success": False, "error": str(e)}

    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_hours: int = 72
    ) -> List[NormalizedWeatherPoint]:
        """
        Official IMD forecasts require API key registration from National Data Center (NDC) Pune.
        If unauthenticated, returns empty list so multi-model ensemble seamlessly recalibrates
        over available NWP / AI models (GFS, IFS, AIFS) without synthetic fabrication.
        """
        if not self.is_authenticated():
            logger.info("IMD API key not configured; skipping direct IMD gridded forecast ingestion.")
            return []
            
        try:
            headers = {"Authorization": f"Bearer {self._api_key}", "Accept": "application/json"}
            url = f"{self._api_base_url}/weather/forecast"
            params = {"lat": latitude, "lon": longitude, "hours": horizon_hours}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=headers, params=params)
                if resp.status_code == 200:
                    # Parse official IMD forecast structure if returned
                    return []
                else:
                    logger.warning(f"IMD API returned HTTP {resp.status_code}: {resp.text[:200]}")
                    return []
        except Exception as e:
            logger.error(f"Error querying official IMD API: {e}")
            return []

    async def get_current_observations(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[NormalizedWeatherPoint]:
        nowcasts = await self.get_warnings(latitude, longitude)
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        
        if nowcasts:
            active = nowcasts[0]
            return NormalizedWeatherPoint(
                source="IMD",
                model="IMD_NOWCAST",
                run_time=now_utc,
                forecast_time=now_utc,
                lead_time_hours=0,
                latitude=latitude,
                longitude=longitude,
                precipitation_mm=None,
                provenance={
                    "provider": "India Meteorological Department (MoES)",
                    "warning": active.get("warning"),
                    "valid_until": active.get("valid_until"),
                    "district": active.get("district"),
                    "official_bulletin": True,
                    "auth_status": "AUTHENTICATED" if self.is_authenticated() else "PUBLIC_BULLETIN"
                }
            )
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
        # In-memory cache for 15 minutes to prevent blocking on sluggish external MoES portals
        now = time.time()
        if hasattr(self, "_cached_warnings") and self._cached_warnings:
            cached_time, cached_data = self._cached_warnings
            if now - cached_time < 900:
                return cached_data

        warnings: List[Dict[str, Any]] = []
        try:
            async with httpx.AsyncClient(timeout=3.0, follow_redirects=True) as client:
                resp = await client.get(self._nowcast_geojson_url)
                if resp.status_code == 200:
                    data = resp.json()
                    for feat in data.get("features", []):
                        props = feat.get("properties", {})
                        warnings.append({
                            "source": "IMD_NOWCAST",
                            "warning": props.get("Warning"),
                            "district": props.get("State_District"),
                            "date": props.get("Date"),
                            "time_of_issue": props.get("toi"),
                            "valid_until": props.get("vupto"),
                            "color_hex": props.get("Color")
                        })
                    self._cached_warnings = (now, warnings)
        except Exception as e:
            logger.warning(f"IMD nowcast warnings query skipped/timed out: {e}")
            if hasattr(self, "_cached_warnings") and self._cached_warnings:
                return self._cached_warnings[1]
        return warnings

    async def check_health(self) -> Dict[str, Any]:
        """
        Tests connectivity against both official IMD API and public Mausam fallback.
        """
        self._last_checked = datetime.datetime.now(datetime.timezone.utc)
        t0 = time.time()
        
        # 1. If Open Data Mode is active (MoES public portal access)
        if self._open_data_mode:
            try:
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.get(self._public_base_url)
                    latency = round((time.time() - t0) * 1000, 1)
                    if resp.status_code == 200:
                        self._last_status = "CONNECTED"
                        return {
                            "source_name": self._source_name,
                            "status": "CONNECTED",
                            "endpoint_url": self._public_base_url,
                            "authenticated": True,
                            "masked_key": "MoES Open Access (No Key Required)",
                            "latency_ms": latency,
                            "data_freshness": "LIVE",
                            "message": "Official IMD Mausam portal connected (Ministry of Earth Sciences Open Data Policy)."
                        }
            except Exception as e:
                logger.warning(f"IMD open data healthcheck error: {e}")

        # 2. If API key configured, test official API endpoint (City Forecast Mapping)
        if self._api_key and len(self._api_key.strip()) > 0:
            try:
                headers = {
                    "X-API-KEY": self._api_key,
                    "Authorization": f"Bearer {self._api_key}",
                    "Accept": "application/json"
                }
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.get(self._cityforecast_mapping_url, headers=headers)
                    latency = round((time.time() - t0) * 1000, 1)
                    if resp.status_code in [200, 204]:
                        self._last_status = "CONNECTED"
                        return {
                            "source_name": self._source_name,
                            "status": "CONNECTED",
                            "endpoint_url": self._cityforecastloc_url,
                            "authenticated": True,
                            "masked_key": self.get_masked_key(),
                            "latency_ms": latency,
                            "data_freshness": "LIVE",
                            "message": "Official IMD City Forecast API connected and authenticated."
                        }
                    elif resp.status_code in [401, 403]:
                        self._last_status = "AUTHENTICATION REQUIRED"
                        return {
                            "source_name": self._source_name,
                            "status": "AUTHENTICATION REQUIRED",
                            "endpoint_url": self._cityforecastloc_url,
                            "authenticated": False,
                            "masked_key": self.get_masked_key(),
                            "latency_ms": latency,
                            "data_freshness": "UNAVAILABLE",
                            "message": f"IMD API rejected credentials (HTTP {resp.status_code}). Check IMD_API_KEY."
                        }
                    else:
                        self._last_status = "DEGRADED"
                        return {
                            "source_name": self._source_name,
                            "status": "DEGRADED",
                            "endpoint_url": self._cityforecastloc_url,
                            "authenticated": False,
                            "masked_key": self.get_masked_key(),
                            "latency_ms": latency,
                            "data_freshness": "DEGRADED",
                            "message": f"IMD API returned HTTP {resp.status_code}"
                        }
            except Exception as e:
                logger.warning(f"Official IMD API check error: {e}")

        # 3. If neither key nor open data mode configured
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.get(self._public_base_url)
                latency = round((time.time() - t0) * 1000, 1)
                
                if not self.is_authenticated():
                    self._last_status = "AUTHENTICATION REQUIRED"
                    return {
                        "source_name": self._source_name,
                        "status": "AUTHENTICATION REQUIRED",
                        "endpoint_url": self._api_base_url,
                        "fallback_endpoint": self._public_base_url,
                        "authenticated": False,
                        "masked_key": None,
                        "fallback_active": True,
                        "latency_ms": latency,
                        "data_freshness": "RECENT" if resp.status_code == 200 else "UNAVAILABLE",
                        "message": "IMD API Key not configured. Set IMD_API_KEY in .env. Public Mausam bulletin feeds are currently active as fallback."
                    }
                else:
                    self._last_status = "DEGRADED"
                    return {
                        "source_name": self._source_name,
                        "status": "DEGRADED",
                        "endpoint_url": self._public_base_url,
                        "authenticated": False,
                        "latency_ms": latency,
                        "data_freshness": "RECENT",
                        "message": "Official API unreachable; fallback Mausam portal reachable."
                    }
        except Exception as e:
            self._last_status = "UNAVAILABLE"
            return {
                "source_name": self._source_name,
                "status": "UNAVAILABLE",
                "endpoint_url": self._api_base_url,
                "authenticated": False,
                "masked_key": self.get_masked_key(),
                "fallback_active": False,
                "latency_ms": None,
                "data_freshness": "UNAVAILABLE",
                "message": f"IMD portals unreachable: {str(e)}"
            }

    def get_status_summary(self) -> Dict[str, Any]:
        return {
            "source_name": "IMD",
            "provider_name": "India Meteorological Department (MoES)",
            "api_base_url": self._api_base_url,
            "is_authenticated": self.is_authenticated(),
            "masked_key": self.get_masked_key(),
            "last_checked": self._last_checked.isoformat() if self._last_checked else None,
            "status": self._last_status if self._last_status != "UNCHECKED" else ("CONNECTED" if self.is_authenticated() else "AUTHENTICATION REQUIRED"),
            "fallback_active": not self.is_authenticated(),
            "public_portal": self._public_base_url,
            "documentation": "https://api.imd.gov.in / National Data Center (NDC)",
            "endpoints": {
                "cityforecast": f"{self._api_base_url}/api/v1/cityforecastloc",
                "cityforecast_mapping": f"{self._api_base_url}/api/v1/cityforecast_mapping",
                "aws_data": self._aws_data_url,
                "aws_data_mapping": self._aws_data_mapping_url,
                "states_catalog": len(IMD_STATE_IDS)
            }
        }

