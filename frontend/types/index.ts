export interface LocationItem {
  id: number;
  name: string;
  state: string;
  district?: string;
  country?: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  is_ner: boolean;
  region_id?: number;
}

export interface ModelDetail {
  model_code: string;
  model_name: string;
  prediction_precip?: number;
  prediction_temp?: number;
  prediction_wind?: number;
  weight?: number;
  historical_mae?: number;
}

export interface TimelinePoint {
  forecast_time: string;
  lead_time_hours: number;
  blended_precipitation_mm: number;
  blended_temperature_c: number;
  blended_wind_speed_ms: number;
  blended_humidity_pct: number;
  blended_pressure_hpa: number;
  
  // Baseline comparisons
  equal_weighted_precipitation_mm?: number;
  equal_weighted_temperature_c?: number;
  equal_weighted_wind_speed_ms?: number;
  best_model_name?: string;
  best_model_precipitation_mm?: number;
  best_model_temperature_c?: number;
  best_model_wind_speed_ms?: number;
  improvement_vs_baseline_pct?: number;

  // GEFS ensemble probabilities
  gefs_prob_gt_15mm?: number;
  gefs_prob_gt_50mm?: number;

  uncertainty_lower_mm: number;
  uncertainty_upper_mm: number;
  model_disagreement_spread: number;
  confidence_assessment: string;
  weather_regime: string;
  regime_reason: string;
  weighting_rationale?: string;
  weights: Record<string, number>;
  contributing_models: ModelDetail[];
}

export interface ExtremeEvent {
  event_type: string;
  severity: string;
  title: string;
  description: string;
  criterion: string;
  start_time: string;
  end_time: string;
  value?: number;
  unit?: string;
}

export interface DataSourceItem {
  name?: string;
  source_name?: string;
  status: string;
  type?: string;
  provenance?: string;
  endpoint_url?: string;
  latency_ms?: number;
  last_attempt_at?: string;
  last_success_at?: string;
  error_message?: string;
  license_attribution?: string;
}

export interface BlendedForecastResponse {
  location: LocationItem;
  season: string;
  generated_at: string;
  timeline_length: number;
  timeline: TimelinePoint[];
  extreme_events: ExtremeEvent[];
  sources?: DataSourceItem[];
  forecast_run_time?: string;
  horizon_hours?: number;
  blending_method?: string;
}

export interface WhyThisForecastData {
  location: LocationItem;
  forecast_valid_time: string;
  lead_time_hours: number;
  season: string;
  weather_regime: string;
  regime_reasoning: string;
  variable: string;
  blended_value: number;
  unit: string;
  uncertainty_range: { lower: number; upper: number };
  model_disagreement: number;
  confidence_assessment: string;
  model_breakdown: Array<{
    model_code: string;
    model_name: string;
    forecast_value: number;
    weight: number;
    historical_mae: number;
    historical_rmse: number;
    historical_bias: number;
  }>;
  historical_validation: Array<{
    model: string;
    mae: number;
    rmse: number;
    bias: number;
  }>;
  data_sources: DataSourceItem[];
  explanation_summary: string;
}

export interface ModelPerformanceBenchmark {
  model_code: string;
  model_name: string;
  variable: string;
  season: string;
  lead_time_hours: number;
  mae: number;
  rmse: number;
  bias: number;
  correlation: number;
  pod: number;
  far: number;
  csi: number;
  evaluation_period?: string;
}

export interface SpatialRegionCell {
  region_code: string;
  region_name: string;
  states: string[];
  center: [number, number];
  elevation_m?: number;
  orographic_feature?: string;
  description?: string;
  lead_time_hours: number;
  season: string;
  weather_regime: string;
  weights: Record<string, number>;
  dominant_model: string;
  dominant_weight_pct: number;
  color: string;
  bma_entropy?: number;
  model_disagreement_spread?: number;
  physics_vs_ai_ratio?: {
    ai_pct: number;
    physics_pct: number;
    ensemble_pct: number;
  };
  contingency_threat_score?: number;
  rationale: string;
  tactical_advisory?: string;
  historical_era5_mae?: Record<string, number>;
  geometry?: {
    type: string;
    coordinates: number[][][];
  };
  stations?: SpatialStationItem[];
}

export interface SpatialStationItem {
  id: number;
  station_id?: string;
  name: string;
  state: string;
  district?: string;
  latitude: number;
  longitude: number;
  elevation_m?: number;
  is_ner?: boolean;
  data_source?: string;
  observation_time?: string;
  variables?: string[];
  quality_flag?: string;
  mode?: string;
  dominant_model: string;
  dominant_weight_pct: number;
  color?: string;
  predictions?: Record<string, number>;
  weights?: Record<string, number>;
}

export interface SpatialNationalSummary {
  ai_coverage_pct?: number | null;
  physics_coverage_pct?: number | null;
  mean_ai_weight_pct?: number | null;
  mean_physics_weight_pct?: number | null;
  mean_ensemble_weight_pct?: number | null;
  frontier_crossover?: string;
  total_stations_active?: number;
  mean_bma_entropy?: number | null;
  definition?: string;
  grid_cells_evaluated?: number;
  grid_cells_ai_dominant?: number;
  variable?: string;
  verification_period?: string;
  is_calculated?: boolean;
}

export interface SpatialWeightMapResponse {
  lead_time_hours: number;
  season: string;
  weather_regime: string;
  generated_at: string;
  national_summary?: SpatialNationalSummary;
  regions: SpatialRegionCell[];
  stations?: SpatialStationItem[];
}

export interface SkillTrendPoint {
  day: number;
  lead_time_hours: number;
  label: string;
  smart_blend_rmse: number;
  smart_blend_mae: number;
  equal_mean_rmse: number;
  equal_mean_mae: number;
  best_single_rmse: number;
  best_single_mae: number;
  best_single_model: string;
  rmse_reduction_pct: number;
  csi_smart_blend?: number;
  csi_equal_mean?: number;
}

export interface SkillTrendsResponse {
  region_code: string;
  variable: string;
  verification_source: string;
  sample_period: string;
  average_rmse_reduction_pct: number;
  key_finding: string;
  honest_limitations: string;
  curve: SkillTrendPoint[];
}

export interface PipelineStatusResponse {
  scheduler_status: string;
  interval_hours: number;
  last_run_utc: string;
  next_run_utc: string;
  is_running: boolean;
  last_result?: any;
  recent_logs: Array<{
    time: string;
    level: string;
    message: string;
  }>;
}

export interface CanonicalModelDetail {
  name: string;
  code: string;
  value: number;
  weight: number;
  availability: "SUCCESS" | "DEGRADED" | "FAILED" | "STALE" | "UNAVAILABLE" | "FALLBACK";
  source: string;
  retrieved_at: string;
  run_time: string;
  quality_status: string;
  historical_mae?: number;
  historical_rmse?: number;
  historical_bias?: number;
}

export interface ForecastSnapshot {
  forecast_id: string;
  generated_at: string;
  initialization_time: string;
  valid_time: string;
  location: {
    id: number;
    name: string;
    state: string;
    district?: string;
    latitude: number;
    longitude: number;
    elevation_m?: number;
    is_ner: boolean;
    region_id?: number;
  };
  lead_time: string;
  lead_time_hours: number;
  variable: string;
  units: string;
  models: CanonicalModelDetail[];
  equal_mean: number;
  mosaic_blend: number;
  uncertainty: number;
  uncertainty_bounds: { lower: number; upper: number };
  confidence: number;
  confidence_label: string;
  regime: string;
  verification_metrics: Record<string, any>;
  provenance: Record<string, any>;
  pipeline_status: Record<string, any>;
  provenance_state: "LIVE" | "CALCULATED" | "CACHED" | "DEMO" | "UNAVAILABLE";
  mathematical_audit: {
    weights_sum: number;
    is_valid_weights: boolean;
    exact_weighted_sum: number;
    mosaic_blend: number;
    is_valid_blend: boolean;
    equal_mean: number;
    diff: number;
  };
}


