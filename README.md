# WEATHERFUSION AI
### Hybrid AI–NWP Multi-Model Forecast Blending & Extreme Weather Intelligence Platform
**Smart India Hackathon (SIH) — Problem Statement SIH26081**

---

## 1. Executive Summary & Core Objective

Numerical Weather Prediction (NWP) models (such as **NOAA GFS** and **ECMWF IFS**) and modern data-driven Artificial Intelligence models (such as **ECMWF AIFS**) exhibit starkly divergent predictive skills depending on geographic region, topography, season, forecast lead time, and atmospheric regime.

**WEATHERFUSION AI** answers the fundamental operational question:
> *"Given multiple real weather forecasts for the same location and time, which model should be trusted more under current atmospheric conditions, and what is the mathematically optimal blended forecast with verifiable uncertainty?"*

This platform provides a high-reliability, real-data decision-support prototype tailored specifically for disaster management authorities (such as SDMA/NDRF), focused on the high-vulnerability **North Eastern Region (NER) of India** (Assam, Meghalaya, Arunachal Pradesh, Manipur, Mizoram, Nagaland, Tripura, Sikkim).

---

## 2. Scientific Integrity & Real Data Guarantee

This platform enforces strict scientific honesty:
- **NO synthetic or placeholder weather data**: All forecast tracks are downloaded in real-time from official open NWP and AI model runs.
- **Strict Data Provenance**: Every forecast point includes initialization cycle, valid time, lead-time hours, grid coordinates, and data provider attribution.
- **Quantified Uncertainty**: Rather than presenting an arbitrary deterministic single number or uncalibrated "AI confidence percentage", the system computes the actual standard deviation of model spread ($\sigma_{\text{spread}}$) and bounded confidence intervals ($[y_{\text{lower}}, y_{\text{upper}}]$).
- **Graceful Degradation Without Fabrication**: If a credentialed source (e.g. MOSDAC ISRO GSMaP) is not configured, the platform explicitly marks the source as `AUTHENTICATION REQUIRED` and operates solely on genuinely available streams.

---

## 3. Real Data Sources Architecture

| Data Source | Model Code | Category | Resolution | Ingestion Mechanism | Attribution & Access |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NOAA NCEP GFS** | `NOAA_GFS` | NWP (Physics) | 0.25° (~25km) | NOMADS GRIB filter / Open Data stream | U.S. National Weather Service / NOAA |
| **ECMWF IFS** | `ECMWF_IFS` | NWP (Physics) | 0.25° (~25km) | ECMWF Open Data 0.25° feed | European Centre for Medium-Range Weather Forecasts (CC-BY 4.0) |
| **ECMWF AIFS** | `ECMWF_AIFS` | Deep Learning AI | 0.25° (~25km) | ECMWF Open Data AIFS feed | ECMWF Data-driven Model (CC-BY 4.0) |
| **IMD Mausam** | `IMD_AWS` | In-Situ Observations & Nowcast | District/Station | `mausam.imd.gov.in` Live GeoJSON | India Meteorological Department (MoES) |
| **ERA5 Archive** | `ERA5` | Atmospheric Reanalysis | 0.25° | ECMWF Copernicus C3S Archive | Copernicus Climate Change Service |
| **MOSDAC (ISRO)** | `MOSDAC_GSMAP` | Satellite Hydrology | 0.10° | `mosdac.gov.in` (Credentials in `.env`) | Space Applications Centre (SAC), ISRO |

---

## 4. Blending & Machine Learning Pipeline

### A. Walk-Forward Historical Skill Evaluation
Calculates genuine error metrics against historical ERA5 reanalysis ground truth:
- **Mean Absolute Error (MAE)**: $\text{MAE} = \frac{1}{N} \sum |y - \hat{y}|$
- **Root Mean Squared Error (RMSE)**: $\text{RMSE} = \sqrt{\frac{1}{N} \sum (y - \hat{y})^2}$
- **Mean Bias Error (MBE)**: $\text{MBE} = \frac{1}{N} \sum (\hat{y} - y)$ (>0 overpredicts, <0 underpredicts)
- **Contingency Threat Score (CSI)**: $\text{CSI} = \frac{\text{Hits}}{\text{Hits} + \text{Misses} + \text{False Alarms}}$ for extreme precipitation thresholds ($\ge 15.6$ mm/h and $\ge 64.5$ mm/24h).

### B. Dynamic Model Weight Engine
Weights ($w_i$) are calculated dynamically and constrained to valid probabilities:
$$\forall i, \quad w_i \ge 0 \quad \text{and} \quad \sum_{i=1}^M w_i = 1.0$$

1. **Lead Time Decay**: Physics NWP (ECMWF IFS) is prioritized at short lead times ($0-36$h); AI-driven models (ECMWF AIFS) receive elevated weight at extended horizons ($48-120$h).
2. **Atmospheric Regime Adaptation**: Classified according to physical IMD criteria (*Heavy Rainfall*, *Extreme Rainfall*, *Heatwave*, *High Wind Squall*, *Convective Weather*, *Dry Spell*).
3. **Disagreement Stabilization**: When model divergence ($\sigma > 10.0$) spikes, weight concentrates on the historically lowest-MAE model for that regional climatology.

### C. Blended Forecast Synthesis
$$Y_{\text{blended}} = \sum_{i=1}^M w_i \cdot Y_i$$

---

## 5. Directory Structure

```
weatherfusion-ai/
├── backend/
│   ├── app/
│   │   ├── api/routes.py            # FastAPI REST endpoints
│   │   ├── alerts/extreme_weather.py# IMD standard extreme event detection
│   │   ├── core/config.py           # Pydantic v2 settings & environment
│   │   ├── database/                # SQLAlchemy models, session & seeding
│   │   ├── data_sources/            # Adapters (NOAA, ECMWF, IMD, MOSDAC, ERA5)
│   │   ├── ml/                      # Skill engine, Blending, Uncertainty, Explainability
│   │   ├── schemas/weather.py       # Pydantic validation schemas
│   │   ├── services/weather_service.py # Orchestrator & caching service
│   │   └── main.py                  # FastAPI application entrypoint
│   └── requirements.txt
├── scripts/
│   ├── download_data.py             # CLI live forecast inspector
│   ├── evaluate_models.py           # Historical validation benchmark script
│   └── run_server.py                # Server runner
├── tests/
│   ├── test_pipeline.py             # Core pipeline & integration test suite
│   └── test_api.py                  # End-to-end REST endpoint test
├── docker/
│   └── Dockerfile.backend
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 6. Getting Started & Running Locally

### Step 1: Clone & Configure Environment
```bash
git clone <repository_url>
cd MOSAIC

# Copy environment template
cp .env.example .env
```

### Step 2: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Run Validation & Integration Tests
Verify database initialization, physical constraints ($\sum w_i = 1$), and live data retrieval:
```bash
python -m tests.test_pipeline
python -m tests.test_api
```

### Step 4: Run Historical Validation Benchmark
Evaluate models against genuine ERA5 reanalysis ground truth:
```bash
python scripts/evaluate_models.py
```

### Step 5: Test Live Location Forecast via CLI
Inspect real-time blended forecasts for any station (e.g. Guwahati, Shillong, Itanagar):
```bash
python scripts/download_data.py Guwahati
```

### Step 6: Trigger Automated Ingestion Pipeline
Execute the full multi-model download, normalization, weighting, and extreme event detection pipeline:
```bash
python scripts/trigger_ingestion.py
```

### Step 7: Start Backend REST Server
```bash
python scripts/run_server.py
```
API Documentation: `http://localhost:8000/docs`

### Step 8: Start Frontend Command Center
```bash
cd frontend
npm run dev
```
Navigate to: `http://localhost:3000`

---

## 7. Key REST API Endpoints

- `GET /api/v1/health`: Live connectivity check across all data sources and database.
- `GET /api/v1/locations`: List of monitoring stations with North Eastern Region tags.
- `GET /api/v1/ner/monitoring`: Simultaneous surveillance across all 8 North Eastern States.
- `POST /api/v1/chat/query`: Meteorological Copilot answering questions strictly from genuine telemetry.
- `GET /api/v1/forecast/blended?location_id=1&horizon_hours=72`: Synthesized multi-model forecast with dynamic weights, uncertainty bounds, and weather regime.
- `GET /api/v1/forecast/raw?location_id=1&horizon_hours=72`: Individual model predictions for NOAA GFS, ECMWF IFS, and ECMWF AIFS.
- `GET /api/v1/explainability/why?location_id=1&lead_time_hours=24`: Complete "Why this forecast?" payload detailing model contributions, historical MAEs, and justification.
- `GET /api/v1/models/performance`: Historical validation benchmarks (MAE, RMSE, Bias, CSI, POD, FAR).
- `GET /api/v1/data-sources`: Real-time status, latency, and attribution for all providers.
- `GET /api/v1/extreme-events`: Active and upcoming alerts classified under official IMD criteria.

---

## 8. Docker Deployment
```bash
docker-compose up --build -d
```
Spins up:
- `backend`: WeatherFusion AI FastAPI engine on port 8000
- `db`: PostgreSQL 16 + PostGIS 3.4
- `redis`: Redis cache for ingestion rate-limiting
