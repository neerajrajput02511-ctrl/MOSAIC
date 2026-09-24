import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Region(Base):
    __tablename__ = "regions"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # e.g. "NER_ASSAM", "INDIA_NW"
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    is_ner = Column(Boolean, default=False, nullable=False) # North Eastern Region flag
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    locations = relationship("Location", back_populates="region")
    performances = relationship("ModelPerformance", back_populates="region")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    name = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    elevation_m = Column(Float, nullable=True)
    is_ner = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    region = relationship("Region", back_populates="locations")
    observations = relationship("WeatherObservation", back_populates="location")
    forecasts = relationship("WeatherForecast", back_populates="location")
    blended_forecasts = relationship("BlendedForecast", back_populates="location")
    alerts = relationship("Alert", back_populates="location")
    extreme_events = relationship("ExtremeEvent", back_populates="location")

class ModelMetadata(Base):
    __tablename__ = "model_metadata"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True) # NOAA_GFS, ECMWF_IFS, ECMWF_AIFS
    name = Column(String(100), nullable=False)
    organization = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False) # NWP, AI_ML, ENSEMBLE
    spatial_resolution_deg = Column(Float, nullable=False)
    temporal_resolution_hours = Column(Integer, nullable=False)
    is_operational = Column(Boolean, default=True, nullable=False)
    attribution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class ForecastRun(Base):
    __tablename__ = "forecast_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    model_code = Column(String(50), nullable=False, index=True)
    run_time = Column(DateTime, nullable=False, index=True) # e.g. 2026-09-21 00:00:00 UTC
    ingested_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    status = Column(String(50), default="COMPLETED", nullable=False)
    records_count = Column(Integer, default=0, nullable=False)

class WeatherObservation(Base):
    __tablename__ = "weather_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    source = Column(String(50), nullable=False) # IMD_AWS, ERA5_REANALYSIS, MOSDAC
    observed_at = Column(DateTime, nullable=False, index=True)
    
    temperature_c = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    wind_direction_deg = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    pressure_hpa = Column(Float, nullable=True)
    
    qc_passed = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    location = relationship("Location", back_populates="observations")
    
    __table_args__ = (
        Index("idx_obs_loc_time", "location_id", "observed_at"),
    )

class WeatherForecast(Base):
    __tablename__ = "weather_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    run_id = Column(Integer, ForeignKey("forecast_runs.id"), nullable=True)
    source = Column(String(50), nullable=False) # NOAA, ECMWF
    model_code = Column(String(50), nullable=False, index=True) # NOAA_GFS, ECMWF_IFS, ECMWF_AIFS
    initialization_time = Column(DateTime, nullable=False)
    forecast_valid_time = Column(DateTime, nullable=False, index=True)
    lead_time_hours = Column(Integer, nullable=False, index=True)
    
    temperature_c = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    wind_direction_deg = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    pressure_hpa = Column(Float, nullable=True)
    
    provenance = Column(JSON, nullable=True) # Store exact grid coords, dataset version, retrieval timestamp
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    location = relationship("Location", back_populates="forecasts")
    
    __table_args__ = (
        Index("idx_fc_loc_valid_model", "location_id", "forecast_valid_time", "model_code"),
    )

class ModelPerformance(Base):
    __tablename__ = "model_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    model_code = Column(String(50), nullable=False, index=True)
    region_id = Column(Integer, ForeignKey("regions.id"), nullable=True)
    variable = Column(String(50), nullable=False) # precipitation_mm, temperature_c, wind_speed_ms
    season = Column(String(50), nullable=False) # Monsoon, Post-Monsoon, Winter, Pre-Monsoon
    lead_time_hours = Column(Integer, nullable=False)
    weather_regime = Column(String(50), nullable=True)
    
    # Continuous Metrics
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mean_bias_error = Column(Float, nullable=True)
    correlation = Column(Float, nullable=True)
    crps = Column(Float, nullable=True) # Continuous Ranked Probability Score
    
    # Categorical / Extreme Rain Contingency Metrics
    pod = Column(Float, nullable=True) # Probability of Detection (Hit Rate / Recall)
    far = Column(Float, nullable=True) # False Alarm Ratio
    csi = Column(Float, nullable=True) # Critical Success Index (Threat Score)
    precision = Column(Float, nullable=True) # Positive Predictive Value
    recall = Column(Float, nullable=True) # Sensitivity (equivalent to POD)
    brier_score = Column(Float, nullable=True) # Brier Score for threshold exceedance
    
    sample_size = Column(Integer, nullable=False)
    evaluation_start = Column(DateTime, nullable=False)
    evaluation_end = Column(DateTime, nullable=False)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    region = relationship("Region", back_populates="performances")

class ModelWeight(Base):
    __tablename__ = "model_weights"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    forecast_valid_time = Column(DateTime, nullable=False, index=True)
    lead_time_hours = Column(Integer, nullable=False)
    variable = Column(String(50), default="precipitation_mm", nullable=False)
    model_code = Column(String(50), nullable=False)
    weight = Column(Float, nullable=False) # Normalized weight in [0, 1]
    weighting_method = Column(String(50), nullable=False) # HISTORICAL_SKILL, ML_ADAPTIVE, EQUAL
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class BlendedForecast(Base):
    __tablename__ = "blended_forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    forecast_valid_time = Column(DateTime, nullable=False, index=True)
    lead_time_hours = Column(Integer, nullable=False)
    
    temperature_c = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    wind_speed_ms = Column(Float, nullable=True)
    wind_direction_deg = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    pressure_hpa = Column(Float, nullable=True)
    
    # Scientific Uncertainty & Disagreement Quantification
    uncertainty_precip_lower = Column(Float, nullable=True)
    uncertainty_precip_upper = Column(Float, nullable=True)
    model_disagreement_spread = Column(Float, nullable=True)
    confidence_indicator = Column(String(50), nullable=True) # HIGH, MODERATE, LOW (based on spread)
    
    contributing_models = Column(JSON, nullable=False) # Exact JSON breakdown {model: {value, weight, mae}}
    weather_regime = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    location = relationship("Location", back_populates="blended_forecasts")

class WeatherRegime(Base):
    __tablename__ = "weather_regimes"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    valid_time = Column(DateTime, nullable=False)
    regime_name = Column(String(50), nullable=False) # Normal, Heavy Rain, Extreme Rainfall, Heatwave, Strong Wind
    reasoning = Column(Text, nullable=False)
    supporting_metrics = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class ExtremeEvent(Base):
    __tablename__ = "extreme_events"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    event_type = Column(String(50), nullable=False) # HEAVY_RAIN, EXTREME_RAIN, HEATWAVE, HIGH_WIND
    severity = Column(String(50), nullable=False) # WARNING, SEVERE, CATASTROPHIC
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    source = Column(String(50), nullable=False) # IMD_CRITERIA, ENSEMBLE_BLEND
    supporting_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    location = relationship("Location", back_populates="extreme_events")

class DataSourceStatus(Base):
    __tablename__ = "data_source_status"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), unique=True, nullable=False) # IMD, NOAA_GFS, ECMWF_IFS, ECMWF_AIFS, MOSDAC, ERA5
    status = Column(String(50), nullable=False) # CONNECTED, DEGRADED, AUTH_REQUIRED, UNAVAILABLE
    endpoint_url = Column(String(255), nullable=True)
    latency_ms = Column(Float, nullable=True)
    last_attempt_at = Column(DateTime, nullable=True)
    last_success_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    license_attribution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow, nullable=False)

class DataIngestionLog(Base):
    __tablename__ = "data_ingestion_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(50), nullable=False)
    job_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False) # SUCCESS, FAILED, PARTIAL
    records_ingested = Column(Integer, default=0, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    title = Column(String(200), nullable=False)
    severity = Column(String(50), nullable=False) # RED, ORANGE, YELLOW, GREEN
    category = Column(String(50), nullable=False) # Rainfall, Heatwave, Wind, Storm
    description = Column(Text, nullable=False)
    effective_from = Column(DateTime, nullable=False)
    effective_to = Column(DateTime, nullable=False)
    source = Column(String(50), nullable=False) # IMD_OFFICIAL, BLEND_THRESHOLD
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    location = relationship("Location", back_populates="alerts")

class PipelineStageExecution(Base):
    __tablename__ = "pipeline_stage_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    stage_number = Column(Integer, nullable=False) # 1 to 12
    stage_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False) # SUCCESS, RUNNING, DEGRADED, FAILED
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    records_processed = Column(Integer, default=0, nullable=False)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

class HistoricalReplayCase(Base):
    __tablename__ = "historical_replay_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    event_type = Column(String(50), nullable=False) # CYCLONE, FLASH_FLOOD, HEATWAVE, MONSOON_DEPRESSION
    region_code = Column(String(50), nullable=False)
    event_date = Column(DateTime, nullable=False)
    initialization_time = Column(DateTime, nullable=False)
    lead_time_hours = Column(Integer, nullable=False)
    primary_variable = Column(String(50), nullable=False)
    observed_value = Column(Float, nullable=False)
    observation_source = Column(String(100), nullable=False) # IMD_AWS, ERA5_REANALYSIS
    forecast_values = Column(JSON, nullable=False) # {NOAA_GFS: x, ECMWF_IFS: y, ECMWF_AIFS: z, NOAA_GEFS: w, EQUAL_MEAN: e, MOSAIC_BLEND: m}
    bma_weights = Column(JSON, nullable=False)
    synoptic_summary = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

