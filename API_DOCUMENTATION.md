# MOSAIC REST API Specification & Endpoint Catalog
**Problem Statement SIH26081 — MoES / NCMRWF**

Base URL: `/api/v1` (with alias `/api` and `/`)  
Interactive Swagger Docs: `/docs`  
Interactive Redoc: `/redoc`

---

## 1. Forecast & Blending Endpoints

### `GET /api/v1/weather/blend`
Generates or retrieves the operational dynamically blended forecast for a station or coordinate.
- **Parameters:**
  - `location_id` (int, optional): Location ID (e.g. 1 for Guwahati).
  - `latitude` (float, optional): Custom latitude.
  - `longitude` (float, optional): Custom longitude.
  - `lead_time_hours` (int, optional, default: 24): Forecast horizon in hours.
  - `season` (str, optional): `Monsoon`, `Pre-Monsoon`, `Post-Monsoon`, `Winter`.
  - `weather_regime` (str, optional): `Normal`, `Heavy Rain`, `Active Monsoon`.
- **Response:**
  - `mosaic_blend`: Blended values for precipitation, temperature, wind, humidity, pressure.
  - `baselines`: Equal-weighted mean and Best single model values.
  - `weights`: Model weight breakdown ($\sum w_i = 1.0$).
  - `uncertainty`: Disagreement spread $\sigma$, 90% confidence interval.
  - `confidence`: `HIGH`, `MODERATE`, `LOW`.

### `GET /api/v1/model-weights/spatial`
Returns the discrete 0.25° spatial model-weight grid and subdivision statistics.
- **Parameters:**
  - `scope` (str, default: `NER`): `NER` or `INDIA`.
  - `variable` (str, default: `precipitation_mm`): `precipitation_mm`, `temperature_c`, `wind_speed_ms`.
  - `leadTime` / `lead_time_hours` (int, default: 24): 6, 12, 24, 48, 72, 120.
  - `season` (str, default: `Monsoon`): Meteorological season.
  - `weatherRegime` (str, default: `Normal`): Synoptic regime.
  - `resolution` (float, default: 0.25): Grid spacing in degrees.
- **Response:**
  - `regions`: Subdivisions with bounding boxes, dominant models, weights, entropy, confidence.
  - `cells`: Discrete 0.25° grid points with latitude, longitude, weights, dominantModel, entropy, confidence, sample_size.

---

## 2. Verification & Skill Comparison Endpoints

### `GET /api/v1/verification/compare`
Official head-to-head verification scorecard comparing MOSAIC against all 4 models and the equal-weighted baseline.
- **Parameters:**
  - `variable` (str, default: `rainfall`): `rainfall`, `temperature`.
  - `lead_time` (int, default: 24): Lead time in hours.
  - `region` (str, default: `NER`): `NER` or `INDIA`.
  - `season` (str, default: `monsoon`): Target season.
- **Response:**
  - `comparison_table`: Array of models with MAE, RMSE, Bias, CSI, POD, FAR.
  - `skill_improvement`: Percentage reduction vs best individual model, reduction vs equal-weight mean, and statistical significance $p$-value.
  - `sample_size`: $N$ cases, $N$ stations, verification period.

### `GET /api/v1/verification/model`
Returns the historical verification scorecard for an individual model.
- **Parameters:** `model`, `variable`, `lead_time`, `region`, `season`.

---

## 3. ISRO SAC MOSDAC Endpoints

### `GET /api/v1/mosdac/status`
Server-side authentication and gateway health telemetry.
- **Response:** `status` (`CONNECTED` or `AUTHORIZATION REQUIRED`), `mode`, `username_configured`, `latency_ms`.

### `GET /api/v1/mosdac/datasets`
Catalog of official MOSDAC satellite products (INSAT-3DR TIR1, GSMaP_ISRO, Kalpana Archive).

### `GET /api/v1/mosdac/satellite`
Satellite imagery and cloud-top brightness temperature for coordinates.

### `GET /api/v1/mosdac/observations`
Ground observations or honest `AUTHORIZATION REQUIRED` response if uncredentialed.

### `GET /api/v1/mosdac/metadata`
Payload specifications, orbits, sensor channels, spatial and temporal resolutions.

---

## 4. Earth Observation & Ingestion Telemetry

### `GET /api/v1/sources/health`
Real-time operational health for all 12 observation and model feeds.

### `GET /api/v1/sources/ingestion-log`
Audit log of recent ingestion runs with latency, records ingested, and quality status.

### `GET /api/v1/imd/stations`
Active IMD synoptic and AWS observatories.

### `GET /api/v1/radar/nowcast`
Doppler Weather Radar reflectivity and 0–3h nowcast timeline.

### `GET /api/v1/observations/lightning`
IITM Damini lightning stroke count and flash density.

### `GET /api/v1/data-quality/check`
Physical limits and climatological outlier checker.

### `GET /api/v1/terrain/elevation`
NASADEM / SRTM elevation, slope, and terrain ruggedness index.

### `GET /api/v1/soil/moisture`
Topsoil and rootzone moisture fractions from Land Surface Models.

### `GET /api/v1/jobs/status`
Operational status of scheduled background ingestion workers.
