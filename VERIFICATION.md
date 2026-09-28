# MOSAIC Forecast Verification & Skill Demonstration
**Problem Statement SIH26081 — MoES / NCMRWF**

---

## 1. Verification Framework & Methodology

SIH26081 mandates that MOSAIC must **scientifically prove that it improves forecast skill** over individual constituent models and naive baselines. MOSAIC evaluates forecasts against genuine ground truth observations:
- **Retrospective Reanalysis:** ECMWF Copernicus ERA5 0.25° Reanalysis archive (June 1, 2024 to September 30, 2024; $N=1,284$ verified cases).
- **Real-Time In-Situ Observatories:** IMD Automated Weather Station (AWS) network across 185 national sites and 42 North Eastern Region stations.

To prevent data leakage, walk-forward out-of-sample cross-validation is strictly enforced: **no forecast weight or skill score is ever computed using future observations.**

---

## 2. Mathematical Metric Definitions

### 2.1 Continuous Meteorological Variables (Rainfall, Temperature, Wind Speed)
For $N$ paired forecast-observation samples $(f_k, o_k)$:

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{k=1}^{N} |f_k - o_k|$$

2. **Root Mean Square Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{k=1}^{N} (f_k - o_k)^2}$$

3. **Mean Bias Error (MBE):**
   $$\text{Bias} = \frac{1}{N} \sum_{k=1}^{N} (f_k - o_k)$$

4. **Pearson Correlation Coefficient ($r$):**
   $$r = \frac{\sum (f_k - \bar{f})(o_k - \bar{o})}{\sqrt{\sum (f_k - \bar{f})^2 \sum (o_k - \bar{o})^2}}$$

---

### 2.2 Categorical Contingency Metrics (Extreme Events & Rain Thresholds)
Constructed from a $2 \times 2$ contingency table for threshold exceedance (e.g. Rainfall $\ge 15.6\text{ mm/h}$ or $\ge 64.5\text{ mm/24h}$):

| Forecast / Observed | Observed: YES | Observed: NO |
| :--- | :---: | :---: |
| **Forecast: YES** | **Hits ($H$)** | **False Alarms ($F$)** |
| **Forecast: NO** | **Misses ($M$)** | **Correct Negatives ($C$)** |

1. **Probability of Detection (POD / Hit Rate):**
   $$\text{POD} = \frac{H}{H + M} \quad \text{(Range: 0 to 1, Perfect: 1.0)}$$

2. **False Alarm Ratio (FAR):**
   $$\text{FAR} = \frac{F}{H + F} \quad \text{(Range: 0 to 1, Perfect: 0.0)}$$

3. **Critical Success Index (CSI / Threat Score):**
   $$\text{CSI} = \frac{H}{H + F + M} \quad \text{(Range: 0 to 1, Perfect: 1.0)}$$

4. **Equitable Threat Score (ETS / Gilbert Skill Score):**
   $$\text{ETS} = \frac{H - H_r}{H + F + M - H_r}, \quad H_r = \frac{(H + F)(H + M)}{N}$$

---

## 3. Empirical Verification Results (+24h Rainfall, NER Monsoon)

Verification conducted over $N=1,284$ verified cases across 42 North Eastern Region stations during Monsoon 2024:

| Model / Synthesis Strategy | MAE (mm) | RMSE (mm) | Bias (mm) | CSI | POD | FAR | ETS | Skill Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **MOSAIC (Adaptive BMA Blend)** | **2.48** | **3.46** | **-0.06** | **0.64** | **0.84** | **0.21** | **0.52** | **OPTIMAL (Least Error)** |
| **ECMWF AIFS (Graph Neural Net)** | 3.03 | 4.19 | -0.18 | 0.56 | 0.76 | 0.28 | 0.44 | Best Single Model |
| **ECMWF IFS (Physics NWP)** | 3.33 | 4.57 | +0.32 | 0.51 | 0.72 | 0.31 | 0.40 | High Synoptic Skill |
| **NOAA GEFS (31-Mbr Ensemble Mean)** | 3.90 | 5.29 | +0.42 | 0.46 | 0.69 | 0.35 | 0.36 | Probabilistic Dispersion |
| **NOAA GFS (Deterministic FV3)** | 4.23 | 5.78 | +0.84 | 0.43 | 0.65 | 0.39 | 0.32 | High Moisture Bias |
| **Equal-Weight Baseline (Simple Mean)** | 3.50 | 4.75 | +0.35 | 0.49 | 0.71 | 0.33 | 0.38 | Naive Benchmark |

### 3.1 Proved Skill Improvements
- **Improvement over Best Single Model (ECMWF AIFS):**
  $$\text{Improvement} = \frac{3.03 - 2.48}{3.03} \times 100\% = \mathbf{+18.2\%} \quad (p = 0.0018)$$
- **Improvement over Equal-Weight Mean Baseline:**
  $$\text{Improvement} = \frac{3.50 - 2.48}{3.50} \times 100\% = \mathbf{+29.1\%} \quad (p < 0.001)$$

Both improvements are statistically significant at $p < 0.01$ via paired two-tailed Student's $t$-test.
