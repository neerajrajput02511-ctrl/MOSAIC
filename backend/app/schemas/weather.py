import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class LocationSchema(BaseModel):
    id: int
    name: str
    state: str
    district: Optional[str] = None
    latitude: float
    longitude: float
    elevation_m: Optional[float] = None
    is_ner: bool
    region_id: Optional[int] = None

    class Config:
        from_attributes = True

class NormalizedWeatherPoint(BaseModel):
    source: str
    model: str
    run_time: datetime.datetime
    forecast_time: datetime.datetime
    lead_time_hours: int
    latitude: float
    longitude: float
    temperature_c: Optional[float] = None
    precipitation_mm: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    humidity_pct: Optional[float] = None
    pressure_hpa: Optional[float] = None
    provenance: Optional[Dict[str, Any]] = None

class ObservationSchema(BaseModel):
    id: int
    location_id: int
    source: str
    observed_at: datetime.datetime
    temperature_c: Optional[float] = None
    precipitation_mm: Optional[float] = None
    wind_speed_ms: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    humidity_pct: Optional[float] = None
    pressure_hpa: Optional[float] = None

    class Config:
        from_attributes = True

class ModelForecastDetail(BaseModel):
    model_code: str
    model_name: str
    model_type: str
    forecast_value: Optional[float] = None
    weight: Optional[float] = None
    historical_mae: Optional[float] = None
    historical_rmse: Optional[float] = None
    historical_bias: Optional[float] = None

class BlendedForecastItem(BaseModel):
    forecast_valid_time: datetime.datetime
    lead_time_hours: int
    variable: str
    blended_value: float
    unit: str
    uncertainty_lower: Optional[float] = None
    uncertainty_upper: Optional[float] = None
    model_disagreement_spread: Optional[float] = None
    confidence_indicator: str
    weather_regime: Optional[str] = None
    contributing_models: List[ModelForecastDetail]

class MultiVariableBlendedForecast(BaseModel):
    location: LocationSchema
    generated_at: datetime.datetime
    forecast_timeline: List[Dict[str, Any]]

class WhyThisForecastResponse(BaseModel):
    location: LocationSchema
    forecast_valid_time: datetime.datetime
    lead_time_hours: int
    season: str
    weather_regime: str
    regime_reasoning: str
    variable: str
    blended_value: float
    unit: str
    uncertainty_range: Dict[str, float]
    model_disagreement: float
    confidence_assessment: str
    model_breakdown: List[ModelForecastDetail]
    historical_validation: List[Dict[str, Any]]
    data_sources: List[Dict[str, Any]]
    explanation_summary: str

class DataSourceStatusSchema(BaseModel):
    source_name: str
    status: str
    endpoint_url: Optional[str] = None
    latency_ms: Optional[float] = None
    last_attempt_at: Optional[datetime.datetime] = None
    last_success_at: Optional[datetime.datetime] = None
    error_message: Optional[str] = None
    license_attribution: Optional[str] = None

    class Config:
        from_attributes = True

class SystemHealthResponse(BaseModel):
    status: str
    timestamp: datetime.datetime
    database: Dict[str, Any]
    data_sources: List[DataSourceStatusSchema]
    active_models_count: int
    cached_runs_count: int
