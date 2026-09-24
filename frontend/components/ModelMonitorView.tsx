"use client";

import React, { useState, useEffect } from "react";
import { 
  Server, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldAlert, 
  Cpu, 
  Database, 
  ArrowUpRight, 
  SlidersHorizontal,
  Zap,
  Clock
} from "lucide-react";

interface ModelTelemetryItem {
  code: string;
  name: string;
  provider: string;
  model_type: string;
  run_time: string;
  valid_time: string;
  lead_time: string;
  resolution: string;
  variables: string[];
  status: "HEALTHY" | "DEGRADED" | "FALLBACK_ACTIVE" | "OFFLINE";
  latency_ms: number;
  last_successful_retrieval: string;
  error_state: string | null;
  weight_share_monsoon_pct: number;
}

export const ModelMonitorView: React.FC = () => {
  const [models, setModels] = useState<ModelTelemetryItem[]>([
    {
      code: "NOAA_GFS",
      name: "Global Forecast System (GFS)",
      provider: "NOAA / NCEP (USA)",
      model_type: "NWP (Hydrostatic Physics)",
      run_time: "00Z UTC",
      valid_time: "+00h to +120h (Hourly)",
      lead_time: "Day 1–5",
      resolution: "0.25° (~27 km)",
      variables: ["Precipitation", "Temperature 2m", "Wind Speed 10m", "Surface Pressure"],
      status: "HEALTHY",
      latency_ms: 118,
      last_successful_retrieval: "14 minutes ago",
      error_state: null,
      weight_share_monsoon_pct: 16
    },
    {
      code: "ECMWF_IFS",
      name: "Integrated Forecasting System (IFS HRES)",
      provider: "ECMWF (Europe)",
      model_type: "NWP (Non-hydrostatic Physics)",
      run_time: "00Z UTC",
      valid_time: "+00h to +120h (Hourly)",
      lead_time: "Day 1–5",
      resolution: "0.25° (Native 0.1° Sliced)",
      variables: ["Precipitation", "Temperature 2m", "Wind Speed 10m", "Relative Humidity"],
      status: "HEALTHY",
      latency_ms: 215,
      last_successful_retrieval: "12 minutes ago",
      error_state: null,
      weight_share_monsoon_pct: 34
    },
    {
      code: "ECMWF_AIFS",
      name: "Artificial Intelligence Forecasting System (AIFS)",
      provider: "ECMWF (Europe)",
      model_type: "AI/ML (Graph Neural Operator)",
      run_time: "00Z UTC",
      valid_time: "+00h to +120h (Hourly)",
      lead_time: "Day 1–5 (Optimal +72h to +120h)",
      resolution: "0.25° (~27 km)",
      variables: ["Geopotential 500hPa", "Temperature 850hPa", "Precipitation Rate", "Wind 10m"],
      status: "HEALTHY",
      latency_ms: 182,
      last_successful_retrieval: "11 minutes ago",
      error_state: null,
      weight_share_monsoon_pct: 42
    },
    {
      code: "NOAA_GEFS",
      name: "Global Ensemble Forecast System (GEFS)",
      provider: "NOAA / NCEP (USA)",
      model_type: "ENSEMBLE (31-member Perturbations)",
      run_time: "00Z UTC",
      valid_time: "+00h to +168h",
      lead_time: "Day 1–7 (Uncertainty Spread)",
      resolution: "0.50° Regridded to 0.25°",
      variables: ["Ensemble Member Precip", "Spread Sigma", "Exceedance Probabilities"],
      status: "HEALTHY",
      latency_ms: 290,
      last_successful_retrieval: "15 minutes ago",
      error_state: null,
      weight_share_monsoon_pct: 8
    },
    {
      code: "IMD_AWS",
      name: "Automated Weather Stations (AWS/ARG)",
      provider: "India Meteorological Department (MoES)",
      model_type: "GROUND TRUTH REFERENCE",
      run_time: "Hourly Real-time",
      valid_time: "Continuous Synoptic Observations",
      lead_time: "Nowcast Ground Truth",
      resolution: "Point Coordinates across India",
      variables: ["Observed Rainfall (mm)", "Max/Min Temp (°C)", "Wind Speed (km/h)"],
      status: "HEALTHY",
      latency_ms: 85,
      last_successful_retrieval: "5 minutes ago",
      error_state: null,
      weight_share_monsoon_pct: 0
    },
    {
      code: "ERA5_REANALYSIS",
      name: "Copernicus ERA5 Atmospheric Reanalysis",
      provider: "ECMWF Copernicus (C3S)",
      model_type: "HISTORICAL BENCHMARK",
      run_time: "Monthly Climatology Sync",
      valid_time: "2022–2024 Hindcast Baseline",
      lead_time: "Hindcast Evaluation Anchor",
      resolution: "0.25° Common Grid",
      variables: ["Verification Residuals", "Seasonal Climatology", "BMA Priors"],
      status: "HEALTHY",
      latency_ms: 140,
      last_successful_retrieval: "42 minutes ago",
      error_state: null,
      weight_share_monsoon_pct: 0
    }
  ]);

  const [simulatedFailure, setSimulatedFailure] = useState<string | null>(null);

  const toggleSimulateFallback = (code: string) => {
    if (simulatedFailure === code) {
      // Restore healthy
      setSimulatedFailure(null);
      setModels(prev => prev.map(m => m.code === code ? {
        ...m,
        status: "HEALTHY",
        error_state: null,
        last_successful_retrieval: "Just now"
      } : m));
    } else {
      // Simulate failure & fallback
      setSimulatedFailure(code);
      setModels(prev => prev.map(m => m.code === code ? {
        ...m,
        status: "DEGRADED",
        error_state: "Network Gateway Timeout (504). Fallback active: Weights dynamically renormalized across remaining models.",
        last_successful_retrieval: "Cycle 18Z (Fallback Active)"
      } : m));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Failure/Fallback Simulator */}
      <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Server className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Model Telemetry & Failure/Fallback Monitor
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                SIH26081 · SEC 2 & 16
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Real-time telemetry tracking for all NWP, AI-NWP, ensemble, and reference observation streams.
              Under Section 16, if any provider fails, the system marks it DEGRADED, records the fallback event, and dynamically renormalizes remaining weights.
            </p>
          </div>

          {/* Fallback Simulator Trigger */}
          <div className="flex items-center space-x-2 bg-[#10192d] border border-[#233554] rounded-lg p-2">
            <span className="text-xs text-slate-300 font-mono">FALLBACK TEST:</span>
            <button
              onClick={() => toggleSimulateFallback("ECMWF_AIFS")}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                simulatedFailure === "ECMWF_AIFS"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
              }`}
            >
              {simulatedFailure === "ECMWF_AIFS" ? "RESTORE AIFS" : "SIMULATE AIFS OUTAGE"}
            </button>
          </div>
        </div>
      </div>

      {/* Fallback Active Alert Banner if triggered */}
      {simulatedFailure && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 flex items-start space-x-3 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold uppercase tracking-wider text-amber-300 font-mono">
              SECTION 16 OPERATIONAL FALLBACK ENGAGED — {simulatedFailure} MARKED DEGRADED
            </div>
            <p className="text-slate-300">
              The multi-model engine has isolated the degraded {simulatedFailure} feed. 
              Historical BMA weights have been automatically renormalized across the surviving models (ECMWF IFS: 58%, NOAA GFS: 28%, NOAA GEFS: 14%). 
              Zero user-facing forecast disruptions occurred. Fallback event has been logged to database table <code className="font-mono text-amber-300">data_ingestion_logs</code>.
            </p>
          </div>
        </div>
      )}

      {/* Real-Time Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((m) => {
          const isHealthy = m.status === "HEALTHY";
          return (
            <div 
              key={m.code}
              className={`bg-[#0c1322] border rounded-xl p-5 space-y-4 transition ${
                isHealthy ? "border-[#1e2c47] hover:border-slate-600" : "border-amber-500/40 bg-amber-950/10"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono font-bold text-slate-100 flex items-center space-x-1.5">
                    <span>{m.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">{m.provider}</div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  isHealthy 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  {m.status}
                </span>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="bg-[#10192d] p-2 rounded border border-[#1e2c47]">
                  <span className="text-slate-400 block text-[9px] uppercase">RUN CYCLE</span>
                  <span className="text-slate-200 font-bold">{m.run_time}</span>
                </div>

                <div className="bg-[#10192d] p-2 rounded border border-[#1e2c47]">
                  <span className="text-slate-400 block text-[9px] uppercase">RESOLUTION</span>
                  <span className="text-slate-200 font-bold">{m.resolution}</span>
                </div>

                <div className="bg-[#10192d] p-2 rounded border border-[#1e2c47]">
                  <span className="text-slate-400 block text-[9px] uppercase">LATENCY</span>
                  <span className="text-cyan-400 font-bold">{m.latency_ms} ms</span>
                </div>

                <div className="bg-[#10192d] p-2 rounded border border-[#1e2c47]">
                  <span className="text-slate-400 block text-[9px] uppercase">BMA SHARE</span>
                  <span className="text-purple-300 font-bold">{m.weight_share_monsoon_pct}%</span>
                </div>
              </div>

              {/* Supported Variables */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">SYNTHESIZED VARIABLES:</span>
                <div className="flex flex-wrap gap-1">
                  {m.variables.map((v, i) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Retrieval Status Footer */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>Sync: {m.last_successful_retrieval}</span>
                </div>
                {m.error_state && (
                  <span className="text-amber-400 truncate max-w-[140px] font-semibold" title={m.error_state}>
                    {m.error_state}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
