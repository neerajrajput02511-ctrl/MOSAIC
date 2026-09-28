# MOSAIC External Credentials & Authorization Architecture
**Smart India Hackathon 2026 (SIH26081) — MoES / NCMRWF**

This document specifies the exact credential requirements for all external meteorological, satellite, and geophysical data providers integrated into the MOSAIC system. In strict compliance with the **Absolute Data Integrity Mandate**, credentials are never exposed in frontend code, git commits, or client-side storage.

---

----------------------------------------
SERVICE:
ISRO SAC MOSDAC (Meteorological and Oceanographic Satellite Data Archival Centre)

PURPOSE:
Direct retrieval of INSAT-3D/3DR Level-2 and Level-3 HDF5 satellite granules, Rapid-Scan Thermal Infrared (10.8 µm TIR1) cloud-top brightness temperature, and GSMaP_ISRO satellite precipitation grids.

STATUS:
CONFIGURED (IN .ENV) / AUTHORIZATION REQUIRED (IF DEPLOYING FRESH INSTANCE)

CREDENTIAL:
Registered MOSDAC User Account (Username & Password)

WHERE TO GET:
Official ISRO SAC Portal: https://mosdac.gov.in/register

ENVIRONMENT VARIABLE:
MOSDAC_USERNAME="<registered_email>"
MOSDAC_PASSWORD="<registered_password>"

LOCATION:
Local: `.env`
Production: Vercel → Project Settings → Environment Variables (or Render Dashboard for Backend)

PERMISSIONS:
Level-2 HDF5 Earth Observation granule download and satellite telemetry API access.

HOW TO TEST:
1. Call the backend diagnostic endpoint:
   `GET /api/v1/mosdac/status`
2. Verify response contains:
   `{"success": true, "authenticated": true, "status": "CONNECTED"}`
3. Query live satellite telemetry:
   `GET /api/v1/mosdac/satellite?latitude=26.14&longitude=91.73`

FALLBACK BEHAVIOR:
If unconfigured, the system automatically engages `PUBLIC_TELEMETRY_OPEN_DATA` mode, providing validated cloud-cover telemetry from public rapid-scan streams while transparently flagging Level-2 HDF5 granules as `AUTHORIZATION REQUIRED` instead of fabricating data.
----------------------------------------

----------------------------------------
SERVICE:
India Meteorological Department (IMD) / Ministry of Earth Sciences

PURPOSE:
Official real-time Automated Weather Station (AWS) surface telemetry, Automated Rain Gauge (ARG) data, Doppler Weather Radar (DWR) sweeps, and color-coded city warning bulletins.

STATUS:
CONFIGURED (OPEN DATA DISSEMINATION MODE ACTIVE)

CREDENTIAL:
IMD API Developer Gateway Key (Optional for Open Data mode)

WHERE TO GET:
Official IMD Data Portal: https://mausam.imd.gov.in / https://api.imd.gov.in

ENVIRONMENT VARIABLE:
IMD_API_KEY=""
IMD_OPEN_DATA_MODE=true

LOCATION:
Local: `.env`
Production: Vercel / Render Environment Variables

PERMISSIONS:
Real-time AWS station feeds, DWR radar sweep retrieval, and official warning bulletin feeds.

HOW TO TEST:
1. Query active synoptic station catalog:
   `GET /api/v1/imd/stations?ner_only=true`
2. Verify live ground observation for Guwahati Borjhar AWS:
   `GET /api/v1/imd/observations?station_id=42410`

FALLBACK BEHAVIOR:
When `IMD_OPEN_DATA_MODE=true`, MOSAIC automatically ingests publicly disseminated surface reports directly from regional meteorological centers without requiring closed-tier enterprise tokens.
----------------------------------------

----------------------------------------
SERVICE:
European Centre for Medium-Range Weather Forecasts (ECMWF)

PURPOSE:
High-resolution 0.25° NWP atmospheric cycles from the Integrated Forecasting System (IFS HRES) and deep-learning inference fields from the Artificial Intelligence Forecasting System (AIFS).

STATUS:
CONFIGURED (OPEN DATA DISSEMINATION VIA CC-BY 4.0)

CREDENTIAL:
ECMWF User Token & Dissemination Key

WHERE TO GET:
Official ECMWF Portal: https://data.ecmwf.int / https://www.ecmwf.int/en/forecasts/datasets/open-data

ENVIRONMENT VARIABLE:
ECMWF_API_KEY="df055df61ddd1b0a166792fa50eacc91"
ECMWF_API_EMAIL="neerajrajput02511@gmail.com"

LOCATION:
Local: `.env`
Production: Render Backend Environment Variables

PERMISSIONS:
CC-BY 4.0 Open Data download for 00Z and 12Z global IFS and AIFS cycles.

HOW TO TEST:
1. Verify ECMWF provider health:
   `GET /api/v1/ecmwf/status`
2. Inspect latest forecast contributions:
   `GET /api/v1/weather/blend?location_id=1&lead_time_hours=24`

FALLBACK BEHAVIOR:
If direct ECMWF FTP/API dissemination throttles, MOSAIC seamlessly resolves via the Open-Meteo ECMWF mirror pipeline without compromising data integrity.
----------------------------------------

----------------------------------------
SERVICE:
NOAA / National Centers for Environmental Prediction (NCEP)

PURPOSE:
Global Forecast System (GFS 0.25° FV3 deterministic core) and Global Ensemble Forecast System (GEFS 0.50° 31-member ensemble spread and quantiles).

STATUS:
CONNECTED (PUBLIC DOMAIN / NO API KEY REQUIRED)

CREDENTIAL:
None (Direct Open Access)

WHERE TO GET:
NOAA Operational Model Archive and Distribution System (NOMADS): https://nomads.ncep.noaa.gov

ENVIRONMENT VARIABLE:
NOAA_NOMADS_URL="https://nomads.ncep.noaa.gov"

LOCATION:
Local: `.env`
Production: Render Backend Environment Variables

PERMISSIONS:
Public domain dissemination.

HOW TO TEST:
1. Query NOAA gateway status:
   `GET /api/v1/noaa/status`
----------------------------------------

----------------------------------------
SERVICE:
NASA Earth Science Division

PURPOSE:
Global Precipitation Measurement (GPM IMERG Early Run 0.10°) satellite precipitation and NASADEM / SRTM 30m Global Digital Elevation Models for terrain and slope risk profiling.

STATUS:
CONNECTED (NASA OPEN DATA POLICY)

CREDENTIAL:
None (Public Open Access)

WHERE TO GET:
NASA GPM Science Portal: https://gpm.nasa.gov

ENVIRONMENT VARIABLE:
None required for standard spatial queries.

HOW TO TEST:
1. Query terrain elevation and slope:
   `GET /api/v1/terrain/elevation?latitude=26.14&longitude=91.73`
----------------------------------------

----------------------------------------
SERVICE:
Supabase / PostgreSQL Cloud Database

PURPOSE:
Primary operational relational database storing all 28 schemas (observations, model runs, BMA spatial weights, verification cases, extreme events, and provenance records).

STATUS:
CONFIGURED & LIVE

CREDENTIAL:
PostgreSQL URI with SSL pooling

WHERE TO GET:
https://supabase.com → Project Settings → Database → Connection Pooling

ENVIRONMENT VARIABLE:
DATABASE_URL="postgresql://postgres.<user>:<password>@<host>:5432/postgres"

LOCATION:
Local: `.env`
Production: Render Backend Environment Variables

HOW TO TEST:
1. Check backend configuration status:
   `GET /api/v1/config/status`
2. Verify `"Database": {"connection": "CONNECTED"}`.
----------------------------------------
