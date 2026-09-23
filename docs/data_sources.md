# WEATHERFUSION AI — Operational Meteorological Data Sources & Compliance
**Problem Statement SIH26081: Hybrid AI–NWP Multi-Model Forecast Blending System**

---

## 1. Overview & Operational Mandate

WEATHERFUSION AI strictly processes **real-world meteorological data**. Under no circumstance does the platform fabricate weather numbers, fake API responses, generate synthetic accuracy values, or simulate operational status.

When an external provider requires credentials that have not yet been provisioned in the deployment environment, the platform flags `AUTHENTICATION REQUIRED`, displays masked credentials (`••••••••`), and gracefully recalculates multi-model blending across operational providers without generating synthetic artifacts.

---

## 2. Integrated Data Sources & License Compliance

### 2.1 India Meteorological Department (IMD) — Ministry of Earth Sciences (MoES)
- **Role**: Ground-truth in-situ AWS observations, radar nowcasts, and official meteorological warnings.
- **Official Portal**: [https://mausam.imd.gov.in](https://mausam.imd.gov.in)
- **API Registration**: [https://api.imd.gov.in](https://api.imd.gov.in) (National Data Center, NDC Pune)
- **License / Terms**: Open Government Data (OGD) Platform India / MoES Data Policy. Attribution to India Meteorological Department is mandatory.
- **Authentication**: Bearer API token configured via `IMD_API_KEY`.
- **Fallback Behavior**: If unauthenticated, the system ingests public Mausam GeoJSON bulletin warnings (`https://mausam.imd.gov.in/responsive/nowcast.geojson`).

### 2.2 ISRO MOSDAC (Space Applications Centre)
- **Role**: High-resolution satellite precipitation verification (`GSMaP_ISRO`) and INSAT-3D/3DR sounder products.
- **Official Portal**: [https://mosdac.gov.in](https://mosdac.gov.in)
- **Data Catalog**: INSAT-3DR Imager/Sounder, SCATSAT-1, GSMaP Indian Ocean coverage.
- **License / Terms**: ISRO Open Earth Observation Data Policy. Registration required.
- **Authentication**: Basic/OAuth via `MOSDAC_USERNAME` and `MOSDAC_PASSWORD`.
- **Fallback Behavior**: If credentials are unset, flags `AUTHENTICATION REQUIRED` on administrative telemetry and skips satellite verification without inventing synthetic grids.

### 2.3 NOAA National Centers for Environmental Prediction (NCEP)
- **Models**:
  - **GFS (Global Forecast System)**: 0.25° grid (~28 km resolution), 4 cycles daily (00, 06, 12, 18 UTC).
  - **GEFS (Global Ensemble Forecast System)**: 0.50° grid, 31 members (Control + 30 perturbed).
- **Official Portal**: [https://nomads.ncep.noaa.gov](https://nomads.ncep.noaa.gov)
- **License / Terms**: Public Domain (U.S. Federal Government Work). Unrestricted scientific and commercial use.
- **Authentication**: None required (open data access).
- **Subsetting**: Open-Data GRIB2 filter / Open-Meteo operational mirror for region of interest.

### 2.4 ECMWF (European Centre for Medium-Range Weather Forecasts)
- **Models**:
  - **IFS (Integrated Forecasting System HRES)**: 0.25° NWP numerical physics model.
  - **AIFS (Artificial Intelligence Forecasting System)**: 0.25° deep-learning data-driven atmospheric model.
  - **ERA5 Reanalysis**: Ground truth for historical skill calculation (MAE, RMSE, Bias, CSI).
- **Official Portal**: [https://www.ecmwf.int](https://www.ecmwf.int)
- **License / Terms**: Creative Commons Attribution 4.0 International (CC-BY 4.0) via ECMWF Open Data Policy (introduced in 2024). Attribution: "Generated using ECMWF Open Data".
- **Authentication**: Optional MARS key for high-volume raw streams via `ECMWF_API_KEY` and `ECMWF_API_EMAIL`. Open-Data mirror queried for operational forecast cycles.

### 2.5 Map & Geospatial Providers
- **MapTiler / OpenStreetMap**: Vector/raster basemaps for MapLibre GL. [https://cloud.maptiler.com](https://cloud.maptiler.com).
- **Open-Meteo Geocoding**: Real-time geocoding service for Indian districts and stations.

---

## 3. Strict Multi-Model Fallback & Availability Matrix

The blending engine enforces strict mathematical integrity under partial upstream outages:

$$\sum_{i=1}^M w_i = 1.0, \quad w_i \ge 0 \quad \forall i$$

| Operational Models Online ($M$) | Blending Action | User Facing Indicator | Synthetic Data Generated? |
|:---|:---|:---|:---:|
| **3 Models (GFS + IFS + AIFS)** | Full adaptive blending combining physics NWP and AI deep learning based on regional regime and historical MAE. | `FULL_ENSEMBLE` | **NO** |
| **2 Models (e.g. GFS + IFS)** | Weights dynamically re-normalized over the 2 available models: $w_1' = \frac{w_1}{w_1+w_2}, w_2' = \frac{w_2}{w_1+w_2}$. Uncertainty bounds widen. | `RECALIBRATED_ENSEMBLE` (Degraded) | **NO** |
| **1 Model (e.g. GFS only)** | Weight = 1.0. Blended forecast equals single operational model. Uncertainty intervals marked as provisional. | `SINGLE_SOURCE_WARNING` | **NO** |
| **0 Models** | Pipeline reports service unavailability with explicit HTTP 503 error. | `UNAVAILABLE` | **NO** |

---

## 4. Security & Credential Masking Policy

1. **No Secret Leakage**: No passwords, API tokens, or secrets are ever exposed in client-side HTML, Next.js bundles, or public REST endpoints.
2. **Server-Side Masking**: All administrative endpoints return credentials in masked format (e.g. `••••••••` or `ab••••yz`).
3. **Environment Security**: All sensitive keys reside in `.env` (strictly ignored by `.gitignore`).
