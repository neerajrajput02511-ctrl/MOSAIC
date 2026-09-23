from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
import datetime
from backend.app.schemas.weather import NormalizedWeatherPoint

class WeatherDataProvider(ABC):
    """
    Abstract base class for all meteorological data providers.
    Enforces standardized retrieval, unit normalization, error handling,
    and provenance tracking without fabrication.
    """
    
    @property
    @abstractmethod
    def source_name(self) -> str:
        """Name of the data provider source, e.g. NOAA_GFS, ECMWF_IFS, IMD"""
        pass

    @abstractmethod
    async def get_forecast(
        self,
        latitude: float,
        longitude: float,
        horizon_hours: int = 72
    ) -> List[NormalizedWeatherPoint]:
        """
        Retrieve forecast time-series for a given lat/lon.
        Must normalize units:
          - precipitation in mm
          - temperature in deg C
          - wind speed in m/s
          - pressure in hPa
          - relative humidity in %
        Must include exact model run timestamp and provenance.
        """
        pass

    @abstractmethod
    async def get_current_observations(
        self,
        latitude: float,
        longitude: float
    ) -> Optional[NormalizedWeatherPoint]:
        """Retrieve real current observed data if supported, else None."""
        pass

    @abstractmethod
    async def get_historical_data(
        self,
        latitude: float,
        longitude: float,
        start_date: datetime.date,
        end_date: datetime.date
    ) -> List[NormalizedWeatherPoint]:
        """Retrieve historical verification / reanalysis data."""
        pass

    @abstractmethod
    async def get_warnings(
        self,
        latitude: float,
        longitude: float
    ) -> List[Dict[str, Any]]:
        """Retrieve official meteorological bulletins or warnings."""
        pass

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Ping API/service and return status, latency, and message."""
        pass
