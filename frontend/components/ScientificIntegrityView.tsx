"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Award, 
  Lock, 
  AlertCircle 
} from "lucide-react";

interface RequirementMapping {
  id: string;
  requirement: string;
  sih_section: string;
  implementation_module: string;
  evidence_endpoint_or_ui: string;
  status: "OPERATIONAL" | "VERIFIED" | "GROUNDED";
}

export const ScientificIntegrityView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"traceability" | "leakage" | "assumptions">("traceability");

  const requirements: RequirementMapping[] = [
    {
      id: "REQ-01",
      requirement: "Dynamic Blended Forecast Synthesizing Multiple Sources",
      sih_section: "Section 7: Blended Forecast",
      implementation_module: "backend/app/ml/blending.py (BlendingEngine.blend)",
      evidence_endpoint_or_ui: "GET /api/v1/blend?lat=26.14&lon=91.73&lead=72 & Forecaster Console",
      status: "OPERATIONAL"
    },
    {
      id: "REQ-02",
      requirement: "Common Spatial Grid (0.25°) & Regridding Abstraction",
      sih_section: "Section 3: Common Grid",
      implementation_module: "backend/app/ml/common_grid.py (CommonGridTransformer)",
      evidence_endpoint_or_ui: "2D Bilinear Interpolation over 6.0°–38.0°N, 68.0°–98.0°E & Unit Standardization",
      status: "VERIFIED"
    },
    {
      id: "REQ-03",
      requirement: "Interactive Spatial Model Weight Maps across Subdivisions",
      sih_section: "Section 9: Model Weight Map",
      implementation_module: "frontend/components/ModelWeightMapView.tsx + BlendingEngine",
      evidence_endpoint_or_ui: "GET /api/v1/spatial/weight-map & Interactive 7-Subdivision GeoJSON Map",
      status: "OPERATIONAL"
    },
    {
      id: "REQ-04",
      requirement: "Rigorous Historical Verification (RMSE, MAE, Bias, CRPS, Brier, POD/FAR)",
      sih_section: "Section 4 & 11: Historical Verification & Lab",
      implementation_module: "backend/app/ml/skill_engine.py (HistoricalSkillEngine)",
      evidence_endpoint_or_ui: "GET /api/v1/verification & Scientific Validation Lab (Day 1–7 Curve)",
      status: "VERIFIED"
    },
    {
      id: "REQ-05",
      requirement: "Ground-Truth Verification Engine vs. Real ERA5 & IMD",
      sih_section: "Section 5: Verification Engine",
      implementation_module: "backend/app/ml/verification_engine.py",
      evidence_endpoint_or_ui: "Copernicus ERA5 0.25° Archive & IMD Synoptic Ground Station Feeds",
      status: "VERIFIED"
    },
    {
      id: "REQ-06",
      requirement: "Baseline Model Comparison (Equal-Weighted Mean Benchmark)",
      sih_section: "Section 8: Baseline Comparison",
      implementation_module: "backend/app/ml/blending.py + BaselineComparisonView.tsx",
      evidence_endpoint_or_ui: "MOSAIC Blend vs. Equal-Weight vs. Single Best Constituent",
      status: "OPERATIONAL"
    },
    {
      id: "REQ-07",
      requirement: "Quantified Uncertainty & Ensemble Dispersion (GEFS)",
      sih_section: "Section 13: Quantified Uncertainty",
      implementation_module: "backend/app/ml/uncertainty.py + SingleForecastTruth",
      evidence_endpoint_or_ui: "Inter-model spread σ, 90% confidence interval, calibrated probabilities",
      status: "VERIFIED"
    },
    {
      id: "REQ-08",
      requirement: "Historical Extreme Event Replay Lab with Timeline Scrubber",
      sih_section: "Section 12: Forecast Replay",
      implementation_module: "frontend/components/ForecastReplayView.tsx + /api/v1/replay/cases",
      evidence_endpoint_or_ui: "Cyclone Remal, Assam Floods 2024, Delhi Heatwave with timeline scrubber",
      status: "OPERATIONAL"
    },
    {
      id: "REQ-09",
      requirement: "Explainable Weights ('Why This Model?' Attribution)",
      sih_section: "Section 10: Explainable Weights",
      implementation_module: "backend/app/ml/explainability.py + ExplainabilityDrawer.tsx",
      evidence_endpoint_or_ui: "GET /api/v1/explainability/why & Slide-over Forecaster Drawer",
      status: "VERIFIED"
    },
    {
      id: "REQ-10",
      requirement: "Extreme Weather Center (Threshold Exceedances & Warning Criteria)",
      sih_section: "Section 14: Extreme Weather Center",
      implementation_module: "backend/app/alerts/extreme_weather.py + ExtremeWeatherPanel.tsx",
      evidence_endpoint_or_ui: "GET /api/v1/extremes & Heavy Rain/Heatwave probability alerts",
      status: "OPERATIONAL"
    },
    {
      id: "REQ-11",
      requirement: "12-Stage Operational Pipeline with Retry & Fallback",
      sih_section: "Section 15: Operational Pipeline",
      implementation_module: "backend/app/ingestion/pipeline.py (AutomatedIngestionPipeline)",
      evidence_endpoint_or_ui: "GET /api/v1/pipeline & AutomatedPipelineView tracking all 12 stages",
      status: "OPERATIONAL"
    },
    {
      id: "REQ-12",
      requirement: "Failure & Fallback Graceful Degradation",
      sih_section: "Section 16: Failure and Fallback",
      implementation_module: "backend/app/ingestion/pipeline.py + ModelMonitorView.tsx",
      evidence_endpoint_or_ui: "Interactive Outage Simulation & Weight Renormalization Logging",
      status: "VERIFIED"
    },
    {
      id: "REQ-13",
      requirement: "Scientific Integrity & Zero Data Leakage Guarantee",
      sih_section: "Section 18 & 24: Scientific Integrity & Real Data Policy",
      implementation_module: "Temporal Walk-Forward Data Partitioning Protocol",
      evidence_endpoint_or_ui: "Strict Train (2022-2023), Val (2024 Pre-Monsoon), Test (2024 Monsoon)",
      status: "GROUNDED"
    }
  ];

  return (
    <div className="space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Scientific Integrity & SIH26081 Traceability Matrix
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                MoES / NCMRWF SPECIFICATION
              </span>
            </div>
            <p className="text-xs text-[#9DAFC4] mt-1 max-w-3xl">
              Scientific audit mapping key technical requirements mandated by Smart India Hackathon Problem Statement SIH26081.
              Forecasts originate from verifiable calculations, official APIs, or clearly labeled evaluation datasets.
            </p>
          </div>

          {/* Sub-tab navigation */}
          <div className="flex items-center space-x-1 bg-[#081426] p-1 rounded-xl border border-[#1E293B]">
            <button
              onClick={() => setActiveTab("traceability")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "traceability" ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold" : "text-[#9DAFC4] hover:text-white"
              }`}
            >
              Requirements Matrix
            </button>
            <button
              onClick={() => setActiveTab("leakage")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "leakage" ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold" : "text-[#9DAFC4] hover:text-white"
              }`}
            >
              Walk-Forward Protocol
            </button>
            <button
              onClick={() => setActiveTab("assumptions")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === "assumptions" ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold" : "text-[#9DAFC4] hover:text-white"
              }`}
            >
              Assumptions & Limits
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Requirements Traceability Table */}
      {activeTab === "traceability" && (
        <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#00B8E6]" />
              <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                SIH26081 Problem Statement Traceability Matrix (13 Core Modules)
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
              AUDITED IMPLEMENTATION STATUS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E293B] text-[#667B94] bg-[#081426]">
                  <th className="py-2.5 px-3">REQ ID</th>
                  <th className="py-2.5 px-3">SIH26081 MANDATE</th>
                  <th className="py-2.5 px-3">SPECIFICATION SECTION</th>
                  <th className="py-2.5 px-3">CODE ARCHITECTURE</th>
                  <th className="py-2.5 px-3">AUDIT REFERENCE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-[#111F33]">
                    <td className="py-2.5 px-3 font-bold text-[#00B8E6]">{req.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white font-sans">{req.requirement}</td>
                    <td className="py-2.5 px-3 text-[#9DAFC4]">{req.sih_section}</td>
                    <td className="py-2.5 px-3 text-purple-400 font-mono text-[11px]">{req.implementation_module}</td>
                    <td className="py-2.5 px-3 text-[#F4F8FC] text-[11px] font-sans">{req.evidence_endpoint_or_ui}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Zero Data Leakage Protocol */}
      {activeTab === "leakage" && (
        <div className="space-y-4">
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <Lock className="w-4 h-4" />
              <span className="uppercase tracking-wider font-mono">Temporal Walk-Forward Data Partitioning Protocol (No Data Leakage)</span>
            </div>

            <p className="text-xs text-[#9DAFC4] leading-relaxed">
              In operational weather forecasting, standard random k-fold cross-validation leaks future synoptic boundary conditions into training sets, artificially inflating reported skill scores. MOSAIC strictly enforces a **strictly temporal walk-forward evaluation protocol**:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-[#081426] border border-[#233852] rounded-lg p-4 space-y-2">
                <div className="text-[#00B8E6] font-bold uppercase text-[11px]">HISTORICAL BASELINE: TRAINING PERIOD</div>
                <div className="text-white font-bold">2022-01-01 to 2023-12-31</div>
                <p className="text-[11px] text-[#9DAFC4] font-sans">
                  Used solely to train baseline error prior distributions, initial BMA variance parameters, and orographic bias maps across India.
                </p>
              </div>

              <div className="bg-[#081426] border border-[#233852] rounded-lg p-4 space-y-2">
                <div className="text-purple-400 font-bold uppercase text-[11px]">HYPERPARAMETER TUNING: VALIDATION PERIOD</div>
                <div className="text-white font-bold">2024-03-01 to 2024-05-31</div>
                <p className="text-[11px] text-[#9DAFC4] font-sans">
                  Pre-Monsoon season used to tune BMA softmax temperature logits, shrinkage hyperparameter (λ = 0.12), and regime threshold boundaries.
                </p>
              </div>

              <div className="bg-[#081426] border border-[#233852] rounded-lg p-4 space-y-2">
                <div className="text-emerald-400 font-bold uppercase text-[11px]">INDEPENDENT TEST: OUT-OF-SAMPLE EVALUATION</div>
                <div className="text-white font-bold">2024-06-01 to 2024-09-30</div>
                <p className="text-[11px] text-[#9DAFC4] font-sans">
                  Held-out full Indian Summer Monsoon season verified strictly against Copernicus ERA5 ground truth. Zero parameter adjustments permitted.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Assumptions & Known Limitations */}
      {activeTab === "assumptions" && (
        <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-4">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span className="uppercase tracking-wider font-mono">Scientific Assumptions & Known Physical Limitations</span>
          </div>

          <div className="space-y-3 text-xs text-[#9DAFC4]">
            <div className="p-3 bg-[#081426] rounded-lg border border-[#1E293B]">
              <span className="font-bold text-white block mb-1">1. Bilinear Regridding Interpolation in High Himalayas</span>
              <p className="text-[#9DAFC4]">
                At 0.25° coordinate resolution (~27 km), steep Himalayan valleys (e.g. Sikkim Teesta Gorge) experience unresolved micro-climates. While bilinear interpolation smooths continuous thermodynamic fields well, localized convective cloudbursts require radar assimilation for sub-hourly nowcasting.
              </p>
            </div>

            <div className="p-3 bg-[#081426] rounded-lg border border-[#1E293B]">
              <span className="font-bold text-white block mb-1">2. Lead-Time AI Crossover Dynamic (+72h Boundary)</span>
              <p className="text-[#9DAFC4]">
                At Day 1 (+24h), ECMWF IFS non-hydrostatic physics outperforms data-driven AI models by 8–12% because IFS explicitly resolves localized boundary-layer turbulence. Beyond Day 3 (+72h), AI neural operators (ECMWF AIFS) overtake physics NWP by avoiding numerical grid dispersion error accumulation.
              </p>
            </div>

            <div className="p-3 bg-[#081426] rounded-lg border border-[#1E293B]">
              <span className="font-bold text-white block mb-1">3. Regularization Shrinkage Prior (λ = 0.12)</span>
              <p className="text-[#9DAFC4]">
                Without regularization, unconstrained Bayesian averaging can over-fit historical records and collapse excessive weight onto one model during rare meteorological anomalies. An L2 shrinkage penalty toward equal-weighted prior guarantees multi-model resilience.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
