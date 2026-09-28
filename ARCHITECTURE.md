# MOSAIC System Architecture
**Problem Statement SIH26081 — Hybrid AI–NWP Multi-Model Forecast Blending System**  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Medium Range Weather Forecasting (NCMRWF)

---

## 1. High-Level Architecture Overview

MOSAIC is engineered as an operational, research-grade meteorological intelligence platform that ingests, harmonizes, verifies, and adaptively synthesizes multiple Numerical Weather Prediction (NWP) physics cores and Deep Learning Artificial Intelligence (AI) foundation weather models.

```
                           +-----------------------------------------------------------+
                           |               DATA INGESTION ADAPTERS                     |
                           |  - IMD AWS & DWR Radar      - ISRO SAC MOSDAC (INSAT/GSMaP)|
                           |  - ECMWF IFS (0.25° NWP)    - ECMWF AIFS (0.25° Graph AI)  |
                           |  - NOAA GFS (0.25° NWP)     - NOAA GEFS (0.50° 31-Mbr Ens) |
                           |  - NASA GPM IMERG & NASADEM - Copernicus ERA5 Reanalysis   |
                           +-----------------------------+-----------------------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |    DATA QUALITY ENGINE     |
                                           | - Physical Boundary Check  |
                                           | - Temporal Continuity QC   |
                                           | - Spatial Cross-Sensor QC  |
                                           +-------------+--------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |   COMMON-GRID REGRIDDING   |
                                           | - 0.25° Common India Grid  |
                                           | - Bilinear Interpolation   |
                                           | - Unit Normalization (SI)  |
                                           +-------------+--------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |   HISTORICAL VERIFICATION  |
                                           | - 1,284 Hindcast Cases     |
                                           | - MAE, RMSE, Bias Residuals|
                                           | - Contingency CSI, POD, FAR|
                                           +-------------+--------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |  CONDITIONING & REGIMES    |
                                           | - Region (NER & Subdivs)   |
                                           | - Lead Time (Day 1 to 5)   |
                                           | - Season (Monsoon, Winter) |
                                           | - Weather Regime Detector  |
                                           +-------------+--------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |   ADAPTIVE BLENDING ENGINE |
                                           | - Bayesian Model Averaging |
                                           | - Regularization (λ = 0.12)|
                                           | - Sum of Weights ≡ 1.0     |
                                           +-------------+--------------+
                                                         |
                                                         v
                                           +----------------------------+
                                           |   UNCERTAINTY & EXTREMES   |
                                           | - Model Disagreement Spread|
                                           | - 90% Confidence Intervals |
                                           | - IMD Extreme Rain Alarms  |
                                           | - Landslide Trigger Proxy  |
                                           +-------------+--------------+
                                                         |
                                                         v
+--------------------------------------------------------------------------------------------------------+
|                                      OPERATIONAL FORECASTER DASHBOARD                                  |
|  - Real-Time Forecast Intelligence Window       - Discrete 0.25° Spatial Model Weight Map (Choropleth) |
|  - Head-to-Head Verification Scorecards         - Earth Observation Center (AWS, Satellite, Radar)    |
|  - Automated 12-Stage Pipeline Monitor          - End-to-End Scientific Data Lineage & Provenance      |
+--------------------------------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Backend Layer (FastAPI + Python 3.14)
- **Framework:** FastAPI with asynchronous I/O and ASGI concurrency.
- **Database Engine:** SQLAlchemy ORM supporting PostgreSQL (Supabase with connection pooling) and local SQLite fallback.
- **Computational Stack:** NumPy, SciPy, Scikit-learn, Pandas for statistical post-processing, Bayesian model averaging, and spatial grid operations.
- **In-Memory Caching:** 15-minute TTL spatial weight grid cache and client-side HTTP caching headers to prevent hammering external data providers.

### 2.2 Frontend Layer (Next.js 16.3 + React 19 + TypeScript)
- **Engine:** Next.js App Router with Turbopack bundler for sub-second hot reloads and optimized production builds.
- **Mapping & Geospatial GIS:** MapLibre GL / Leaflet WebGL canvas rendering 0.25° discrete grid cells, state boundary vector layers, and Doppler radar sweeps.
- **Scientific Visualization:** Recharts SVG components for error growth degradation curves, BMA weight distributions, and contingency scorecards.
- **Styling & Aesthetics:** Dark operational tactical palette (`#0B1F33`, `#0F172A`, `#1769AA`, `#16A34A`) designed according to ISRO/NCMRWF mission control standards.

---

## 3. Data Integrity & Provenance Guarantee
Every scientific figure presented in the UI is tied to a database provenance record specifying:
1. `source_agency`: Providing institution (IMD, ECMWF, NOAA, SAC-ISRO, NASA).
2. `model_or_sensor`: Specific numerical model run or instrument band (e.g. `ECMWF_IFS_00Z`, `INSAT3DR_TIR1`).
3. `initialization_time`: UTC initialization timestamp of the NWP/AI cycle.
4. `valid_time`: Target forecast valid window.
5. `spatial_resolution`: Native grid spacing (0.25° common grid).
6. `processing_pipeline`: Sequence of algorithms applied (`regrid_bilinear -> bma_blending_v1 -> physical_qc`).
7. `quality_status`: QC flag (`VALID`, `SUSPECT`, `SOURCE_ERROR`).
