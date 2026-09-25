import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "WEATHERFUSION AI"
    PROJECT_SUBTITLE: str = "Hybrid AI-NWP Multi-Model Forecast Blending & Extreme Weather Intelligence Platform"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    APP_ENV: str = "development"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    
    # Security & Auth
    SECRET_KEY: str = "weatherfusion-sih26081-meteorological-blending-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Database & Storage (Supports SQLite & Supabase PostgreSQL)
    DATABASE_URL: str = "sqlite:///./weatherfusion.db"
    REDIS_URL: Optional[str] = None
    
    # Supabase Cloud Configuration
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = None
    
    # Official IMD API
    IMD_API_BASE_URL: str = "https://api.imd.gov.in"
    IMD_BASE_URL: str = "https://mausam.imd.gov.in"
    IMD_API_KEY: Optional[str] = None
    IMD_OPEN_DATA_MODE: bool = False
    
    # ISRO MOSDAC
    MOSDAC_API_BASE_URL: str = "https://mosdac.gov.in/api/v1"
    MOSDAC_BASE_URL: str = "https://mosdac.gov.in"
    MOSDAC_USERNAME: Optional[str] = None
    MOSDAC_PASSWORD: Optional[str] = None
    MOSDAC_OPEN_DATA_MODE: bool = False
    
    # NOAA & ECMWF
    NOAA_NOMADS_URL: str = "https://nomads.ncep.noaa.gov"
    ECMWF_API_KEY: Optional[str] = None
    ECMWF_API_EMAIL: Optional[str] = None
    
    # Geospatial / Maps
    MAPTILER_API_KEY: Optional[str] = None
    MAPBOX_ACCESS_TOKEN: Optional[str] = None
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: Optional[str] = None
    
    # Gemini AI Agent Copilot
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.6-flash"
    
    # Operational Integrity Flag: NEVER fake data. DEMO_MODE defaults to false.
    DEMO_MODE: bool = False
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
