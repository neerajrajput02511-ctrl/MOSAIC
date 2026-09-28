# MOSAIC Meteorological & Earth Observation Data Sources
**Problem Statement SIH26081 — MoES / NCMRWF**

---

## 1. Authoritative Meteorological Data Providers

MOSAIC strictly ingests genuine observations, reanalyses, and NWP/AI forecasts from legitimate meteorological and space agencies. In strict accordance with the **Absolute Data Integrity Mandate**, simulated or fabricated data is forbidden. When an upstream provider is offline or unauthenticated, the system explicitly reports `AUTHORIZATION REQUIRED` or `DATA UNAVAILABLE`.

| Provider / Agency | Dataset / Model | Native Res | Update Cadence | Scientific Role in MOSAIC | Authentication & Licensing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **India Meteorological Department (IMD)** | In-Situ Synoptic AWS & ARG Network | Point (185+ stations) | Hourly | Ground Truth for verification & physical assimilation | Open Data (Govt of India) / Optional IMD API Key |
| **IMD Doppler Radar Network** | S-Band & C-Band DWR Network (10 Sites) | 1 km range bin / 250 km radius | 10–15 mins | 0–3h Nowcast validation & convective cell tracking | Public Operational Radar Products (mausam.imd.gov.in) |
| **ISRO SAC MOSDAC** | INSAT-3DR Imager (10.8 µm TIR1) | 4 km (Sub-satellite) | 15 mins | Cloud-top brightness temperature (CTBT) & convective monitoring | Server Credentials (`MOSDAC_USERNAME`, `MOSDAC_PASSWORD`) |
| **ISRO SAC / JAXA** | GSMaP_ISRO Precipitation Layer | 0.10° x 0.10° | Hourly | Microwave-IR satellite precipitation cross-validation | ISRO MOSDAC Open Telemetry / Level-2 HDF5 portal |
| **ECMWF** | Integrated Forecasting System (IFS HRES) | 0.25° Common Grid | 00Z, 12Z | Physics NWP mass-momentum conservation backbone | CC-BY 4.0 ECMWF Open Data / Open-Meteo Integration |
| **ECMWF** | Artificial Intelligence Forecasting System (AIFS) | 0.25° Common Grid | 00Z, 12Z | Deep learning spherical graph neural net for synoptic wave propagation | CC-BY 4.0 ECMWF Open Data Dissemination |
| **NOAA / NCEP** | Global Forecast System (GFS) | 0.25° Global | 00Z, 06Z, 12Z, 18Z | Independent NWP physics parameterizations (FV3 core) | U.S. Public Domain / NOAA Open Data Dissemination (NODD) |
| **NOAA / NCEP** | Global Ensemble Forecast System (GEFS) | 0.50° (31 Members) | 00Z, 06Z, 12Z, 18Z | Probabilistic dispersion, uncertainty sigma, and quantile exceedance | U.S. Public Domain / NOMADS |
| **ECMWF Copernicus C3S** | ERA5 Global Atmospheric Reanalysis | 0.25° x 0.25° | Hourly / Daily | Gold-standard retrospective ground truth for walk-forward verification | Copernicus License / CDS API |
| **IITM Pune** | Damini Lightning Location Network | Point / GeoJSON | 15 mins | Convective discharge tracking & severe squall guidance | Ministry of Earth Sciences (MoES) Public Feed |
| **NASA / USGS** | NASADEM / SRTM 30m Global DEM | 30 meter | Static | Terrain elevation, slope, and orographic precipitation barrier proxy | NASA Open Data Policy |
| **ECMWF / ISRO** | ERA5-Land & ISRO Land Surface Model | 0.10° | Daily | Topsoil (0–7cm) & rootzone (7–28cm) moisture for landslide proxy | Open Data License |

---

## 2. MOSDAC Server-Side Authentication Architecture

The Space Applications Centre (SAC), ISRO hosts operational satellite products on MOSDAC (`https://mosdac.gov.in`). To maintain complete enterprise security:
- **Zero Frontend Exposure:** Client browsers never receive or transmit MOSDAC credentials.
- **Environment Configuration:** Credentials reside exclusively in server-side `.env` via `MOSDAC_USERNAME` and `MOSDAC_PASSWORD`.
- **Public Open-Data Fallback:** When credentials are unconfigured, MOSAIC automatically runs in `PUBLIC_TELEMETRY_OPEN_DATA` mode, providing validated cloud-cover telemetry from public rapid-scan streams while flagging Level-2 HDF5 granules as `AUTHORIZATION REQUIRED`.
- **Dedicated Endpoints:**
  - `GET /api/v1/mosdac/status`: Full gateway connectivity and credential status.
  - `GET /api/v1/mosdac/datasets`: Official ISRO satellite catalog.
  - `GET /api/v1/mosdac/satellite`: Satellite products and latest acquisition timestamps.
  - `GET /api/v1/mosdac/observations`: Live observations or honest `AUTHORIZATION REQUIRED` state.
  - `GET /api/v1/mosdac/metadata`: Spectral band specs (VIS, SWIR, TIR1, TIR2, WV) and sensor payloads.
