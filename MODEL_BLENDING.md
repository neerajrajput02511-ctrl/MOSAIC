# MOSAIC Adaptive Multi-Model Blending Engine
**Problem Statement SIH26081 — Hybrid AI–NWP Multi-Model Forecast Blending System**

---

## 1. Core Mathematical Formulation

MOSAIC does not perform a naive arithmetic average of numerical weather models. Naive averaging dilutes high-skill models in their areas of strength and amplifies systematic model biases. Instead, MOSAIC implements **Adaptive Bayesian Model Averaging (BMA) with Shrinkage Regularization**, directly conditioned on five physical dimensions:
1. **Historical Verification Skill** ($S_{i}$)
2. **Forecast Lead Time** ($\tau \in \{6, 12, 24, 48, 72, 120\}\text{ h}$)
3. **Geographic Climate Sub-division** ($R$)
4. **Meteorological Season** ($\Omega \in \{\text{Pre-Monsoon}, \text{Monsoon}, \text{Post-Monsoon}, \text{Winter}\}$)
5. **Synoptic Weather Regime** ($\Phi \in \{\text{Normal}, \text{Active Monsoon}, \text{Break Monsoon}, \text{Heavy Convection}, \text{Cyclonic Storm}\}$)

### 1.1 Blending Equation
For $K$ constituent models ($K=4$: ECMWF IFS, ECMWF AIFS, NOAA GFS, NOAA GEFS), the blended forecast $\hat{Y}(x, y, t + \tau)$ at coordinate $(x, y)$ for lead time $\tau$ is:

$$\hat{Y}(x, y, t + \tau) = \sum_{i=1}^{K} w_i(x, y, \tau, \Omega, \Phi) \cdot \hat{y}_i(x, y, t + \tau)$$

Subject to the strict mathematical constraints:
$$w_i(x, y, \tau, \Omega, \Phi) \ge 0 \quad \forall i \in \{1, \dots, K\}$$
$$\sum_{i=1}^{K} w_i(x, y, \tau, \Omega, \Phi) = 1.0$$

---

## 2. Inverse-Error Skill Weighting

The unconditioned baseline weights $w_{i}^{(0)}$ are computed inversely proportional to the verified Mean Absolute Error ($\text{MAE}_i$) over the rolling historical verification window:

$$w_{i}^{(0)} = \frac{\frac{1}{\text{MAE}_i + \epsilon}}{\sum_{j=1}^{K} \frac{1}{\text{MAE}_j + \epsilon}}$$

where $\epsilon = 0.05$ prevents numerical instability during zero-error realizations.

---

## 3. Bayesian Model Averaging (BMA) with Shrinkage Regularization

To prevent overfitting to short-term observation noise while allowing models to dominate where scientifically justified, logit adjustments are computed from conditioning coefficients:

$$\log \left( \frac{w_i}{1 - w_i} \right) = \log \left( \frac{w_{i}^{(0)}}{1 - w_{i}^{(0)}} \right) + \beta_{\tau, i} + \gamma_{R, i} + \delta_{\Omega, i} + \theta_{\Phi, i}$$

### 3.1 Conditioning Coefficients
- **Lead Time Dynamics ($\beta_{\tau, i}$):**
  - **Day 1–2 ($\tau \le 48\text{h}$):** Physics NWP (ECMWF IFS) receives a $+0.25$ logit boost due to explicitly resolved boundary-layer turbulence and hydrostatic mass-momentum balance.
  - **Day 4–5 ($\tau \ge 96\text{h}$):** Graph Neural Network AI (ECMWF AIFS) receives a $+0.35$ logit boost due to superior retention of planetary Rossby waves and minimal numerical diffusion over extended horizons.
- **Orographic Relief & Roughness ($\gamma_{R, i}$):**
  - High-elevation terrain ($>1,000\text{ m}$ in Meghalaya Khasi Hills, Sikkim, Arunachal): ECMWF IFS is prioritized ($+0.20$) for explicit sub-grid gravity wave drag parameterizations.
  - Plain and maritime regimes: ECMWF AIFS and NOAA GFS receive elevated weighting.
- **Synoptic Weather Regime ($\theta_{\Phi, i}$):**
  - Under active cyclonic depression or extreme convective instability, the ensemble mean (NOAA GEFS) receives an elevated weight ($+0.25$) to capture non-linear atmospheric dispersion.

### 3.2 Shrinkage Regularization ($\lambda = 0.12$)
To safeguard against sparse station coverage in mountainous terrain, weights are regularized toward the uninformative uniform prior $w_{\text{uniform}} = 1/K = 0.25$:

$$w_{i}^{\text{final}} = (1 - \lambda) \cdot w_{i}^{\text{BMA}} + \lambda \cdot \frac{1}{K}$$

with $\lambda = 0.12$, guaranteeing non-zero representation and robustness against single-model operational corruption.

---

## 4. Information Entropy & Model Disagreement

MOSAIC computes Shannon information entropy $H(x, y)$ across the model weight vector to evaluate multi-model consensus:

$$H(x, y) = -\sum_{i=1}^{K} w_i(x, y) \cdot \ln(w_i(x, y))$$

- **Low Entropy ($H < 0.85$):** High single-model dominance (e.g., AIFS dominant over plains or IFS dominant over mountains).
- **High Entropy ($H > 1.25$):** Balanced multi-model competition or high atmospheric ambiguity.

Model disagreement spread ($\sigma_{\text{models}}$) is computed as:

$$\sigma_{\text{models}} = \sqrt{\sum_{i=1}^{K} w_i \cdot \left( \hat{y}_i - \hat{Y}_{\text{blend}} \right)^2}$$

This spread directly determines forecast confidence (`HIGH`, `MODERATE`, `LOW`) and calibrates 90% confidence intervals $[\hat{Y} - 1.645\sigma, \hat{Y} + 1.645\sigma]$.
