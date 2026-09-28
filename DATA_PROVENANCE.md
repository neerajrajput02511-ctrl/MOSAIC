# MOSAIC Data Lineage & Scientific Provenance Architecture
**Problem Statement SIH26081 — MoES / NCMRWF**

---

## 1. Absolute Scientific Provenance Principle

Every scientific value displayed on the MOSAIC platform carries an immutable, auditable metadata trail. No value is presented without full context regarding its mathematical derivation, sensor acquisition, and physical units.

For every operational data point, MOSAIC records:
1. **Source Agency:** Providing national or international meteorological agency (e.g. `IMD`, `ECMWF`, `NOAA`, `ISRO SAC`, `NASA`).
2. **Dataset / Model Name:** Specific instrument or atmospheric model (e.g. `IFS Open Data 0.25°`, `INSAT-3DR Imager TIR1`).
3. **Model Run / Cycle:** Synoptic cycle time (e.g. `00Z UTC`, `12Z UTC`).
4. **Initialization Time:** Exact timestamp when model boundary conditions were locked.
5. **Valid Forecast Time:** Target time of the atmospheric state.
6. **Retrieval Timestamp:** Exact UTC time the ingestion worker fetched the telemetry.
7. **Spatial Resolution:** Native grid spacing (e.g. `0.25° (~25 km)` or `30m SRTM`).
8. **Temporal Resolution:** Time step frequency (e.g. `Hourly`, `3-Hourly`).
9. **Processing Pipeline:** Sequence of algorithms applied (`Unit Standardize -> Bilinear Regrid -> BMA Synthesis -> QC Bounds Filter`).
10. **Quality Status:** Operational validation flag (`VALID`, `SUSPECT`, `STALE`, `OUTLIER`, `SOURCE_ERROR`).
11. **Scientific Nature:** Explicit declaration whether the value is **OBSERVED**, **NWP_FORECAST**, **AI_FORECAST**, **DERIVED**, **BLENDED**, or **VERIFIED**.

---

## 2. Provenance Drawer & Interactive Forecaster Inspection

Forecasters clicking on any forecast value or weight in the MOSAIC dashboard open the **Interactive Provenance Drawer**, which renders:
- Model cycle version.
- Common-grid interpolation algorithm (2D Bilinear vs Area-Weighted).
- Mathematical weighting method (BMA with Shrinkage $\lambda = 0.12$).
- Verification sample size ($N$ stations, $N$ cases).
- Upstream network latency and provider HTTP status.

---

## 3. Forecast Revision Auditing

When a subsequent NWP cycle or real-time ground observation alters a forecast at a target station, MOSAIC logs the event in the `forecast_revisions` table:
- `previous_blend_value`
- `new_blend_value`
- `difference_value`
- `reason` (e.g. *"12Z ECMWF IFS cycle assimilated localized rainfall surge detected by Guwahati Borjhar AWS"*).
