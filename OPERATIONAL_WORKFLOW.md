# MOSAIC Automated Operational Workflow & Ingestion Daemon
**Problem Statement SIH26081 — MoES / NCMRWF**

---

## 1. 12-Stage Operational Pipeline Architecture

In direct compliance with Section 15 of SIH26081, MOSAIC executes an automated end-to-end meteorological pipeline without requiring manual user intervention:

```
[STAGE 1: Fetch Models]  --> [STAGE 2: Validate QC]  --> [STAGE 3: Normalize SI] --> [STAGE 4: Regrid 0.25°]
          |
          v
[STAGE 5: Update Verif]  --> [STAGE 6: Calc Skill]   --> [STAGE 7: BMA Weights]  --> [STAGE 8: Blend Forecast]
          |
          v
[STAGE 9: Uncertainty]   --> [STAGE 10: Extremes]    --> [STAGE 11: Publish API] --> [STAGE 12: Forecaster Console]
```

### Stage Details
1. **Stage 1 — Fetch Model Data:** Automated retrieval of 00Z, 06Z, 12Z, 18Z cycles from NOAA NOMADS, ECMWF Open Data, and IMD servers.
2. **Stage 2 — Data Validation & Physical QC:** Physical range bounds (negative rainfall rejection, $-50^\circ\text{C} \le T \le 60^\circ\text{C}$), null filtering, coordinate domain checks.
3. **Stage 3 — Normalization:** Standardizes disparate units into SI metrics ($\text{Kelvin} \rightarrow ^\circ\text{C}$, $\text{m} \rightarrow \text{mm}$, $\text{kt} \rightarrow \text{m/s}$, $\text{Pa} \rightarrow \text{hPa}$).
4. **Stage 4 — Common Grid Regridding:** 2D Bilinear spatial interpolation onto the standard 0.25° India Bounding Box ($6^\circ\text{N} - 38^\circ\text{N}$, $68^\circ\text{E} - 98^\circ\text{E}$).
5. **Stage 5 — Update Ground Truth & Verification:** Syncs real-time observations from IMD AWS stations and computes rolling forecast-observation error residuals.
6. **Stage 6 — Calculate Model Skill:** Evaluates rolling MAE, RMSE, Pearson $r$, CSI, POD, and FAR per region, lead time, and season.
7. **Stage 7 — Adaptive Bayesian Weighting:** Solves regularized BMA logit equations ($\lambda = 0.12$) to generate discrete spatial weight fields.
8. **Stage 8 — Multi-Model Blending:** Synthesizes consensus fields for rainfall, temperature, wind speed, wind direction, humidity, and surface pressure.
9. **Stage 9 — Uncertainty Quantification:** Computes ensemble standard deviation spread ($\sigma$), 90% confidence intervals, and Shannon information entropy.
10. **Stage 10 — Extreme Weather Hazard Detection:** Evaluates IMD hazard thresholds for Heavy Rain ($\ge 64.5\text{ mm}$), Extreme Heat ($\ge 40^\circ\text{C}$), Cyclonic Squalls ($\ge 15\text{ m/s}$), and landslide trigger proxies.
11. **Stage 11 — Publish & Invalidate Cache:** Persists latest blended fields to database and refreshes REST API endpoints and geospatial GeoJSON layers.
12. **Stage 12 — Forecaster Console Broadcast:** Telemetry stream updates the operational web dashboard and alerts forecasters.

---

## 2. Ingestion Scheduling Daemon

| Job Identifier | Frequency / Cron | Target Payload | Fallback / Degradation Policy |
| :--- | :--- | :--- | :--- |
| `JOB_00Z_INGESTION` | `00:30 UTC` | GFS, IFS, AIFS, GEFS 00Z Run | If a single model fails, renormalize weights over remaining $K-1$ models |
| `JOB_06Z_INGESTION` | `06:30 UTC` | GFS, GEFS 06Z Cycle | Intermediate update for fast-moving convective troughs |
| `JOB_12Z_INGESTION` | `12:30 UTC` | GFS, IFS, AIFS, GEFS 12Z Run | Full synoptic refresh across all 4 global models |
| `JOB_18Z_INGESTION` | `18:30 UTC` | GFS, GEFS 18Z Cycle | Evening intermediate cycle |
| `JOB_HOURLY_AWS_SYNC`| Every 60 minutes | IMD Surface AWS & ARG Stations | Automatic outlier rejection; flags dead sensors as `STALE` |
| `JOB_NOWCAST_SWEEP` | Every 15 minutes | IMD DWR Radar & INSAT-3DR TIR1 | If radar beam blocked, fall back to INSAT-3DR Rapid-Scan |

---

## 3. Degradation & Failover Policy

In accordance with SIH26081 requirements:
- **No Silent Failures:** If an upstream server (e.g. ECMWF Open Data network glitch) times out, the source is flagged `DEGRADED` in `GET /api/v1/sources/health`.
- **Dynamic Renormalization:** The Blending Engine excludes the missing model and re-solves:
  $$\sum_{j \ne \text{failed}} w_j' = 1.0$$
- **Telemetry Audit:** Every stage execution records duration in milliseconds, record count, retry attempts, and detailed error messages in `pipeline_stage_executions`.
