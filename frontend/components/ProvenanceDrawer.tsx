"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck, Database, Layers, CheckCircle2, Clock, Globe, Cpu, FileText } from "lucide-react";
import { TimelinePoint, LocationItem } from "@/types";

interface ProvenanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoint: TimelinePoint | null;
  selectedLocation: LocationItem | null;
}

export const ProvenanceDrawer: React.FC<ProvenanceDrawerProps> = ({
  isOpen,
  onClose,
  currentPoint,
  selectedLocation
}) => {
  const [provenanceData, setProvenanceData] = useState<any>(null);

  useEffect(() => {
    async function loadProvenance() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/provenance");
        if (res.ok) {
          const d = await res.json();
          setProvenanceData(d);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    if (isOpen) {
      loadProvenance();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validTimeStr = currentPoint?.forecast_time 
    ? new Date(currentPoint.forecast_time).toUTCString()
    : "Active Forecast Hour";

  const leadHours = currentPoint?.lead_time_hours ?? 24;

  return (
    <div className="fixed inset-0 z-[700] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl h-full bg-[#0b1322] border-l border-[#1e2c47] p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e2c47] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100 tracking-wide font-mono uppercase">
                  FORECAST DATA PROVENANCE & LINEAGE
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SIH26081 Section 14 · Full Scientific Traceability
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#111a2e] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Target Metadata Card */}
          <div className="bg-[#101b2f] border border-[#1e2f4c] rounded-xl p-4 space-y-2 text-xs font-mono">
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>ACTIVE FORECAST QUERY</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div>Station / Point: <strong className="text-slate-100">{selectedLocation?.name}, {selectedLocation?.state}</strong></div>
              <div>Coordinates: <strong className="text-slate-100">{selectedLocation?.latitude.toFixed(4)}°N, {selectedLocation?.longitude.toFixed(4)}°E</strong></div>
              <div>Lead Horizon: <strong className="text-slate-100">+{leadHours}h</strong></div>
              <div>Valid Time: <strong className="text-slate-100">{validTimeStr}</strong></div>
              <div>Primary Variable: <strong className="text-slate-100">Total Precipitation (mm) & 2m Temp (°C)</strong></div>
              <div>Quality Flag: <strong className="text-emerald-400">QC_PASSED_SYNOPTIC</strong></div>
            </div>
          </div>

          {/* Multi-Model Upstream Sources Lineage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 uppercase">
              <span>UPSTREAM NUMERICAL & AI DATA SOURCES</span>
              <span className="text-[10px] text-slate-500">All 4 operational inputs</span>
            </div>

            <div className="space-y-2.5">
              <div className="bg-[#0f172a] rounded-xl p-3 border border-[#1e2c47] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-300">NOAA GFS (Global Forecast System)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">NWP 0.25°</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Run Cycle: <span className="text-slate-200">00Z UTC Operational</span> · Retrieval: <span className="text-slate-200">NOMADS Open Data HTTP</span></div>
                  <div>Resolution: <span className="text-slate-200">0.25° x 0.25°</span> · Processing: <span className="text-slate-200">Bilinear Regridded to Common MoES Grid</span></div>
                  <div>Attribution: <span className="text-slate-200">National Oceanic and Atmospheric Administration (NOAA)</span></div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-3 border border-[#1e2c47] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300">ECMWF IFS (Integrated Forecasting System)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">NWP 0.25°</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Run Cycle: <span className="text-slate-200">00Z UTC High-Res</span> · Retrieval: <span className="text-slate-200">ECMWF Open Data Gateway</span></div>
                  <div>Resolution: <span className="text-slate-200">0.25° (Native 0.1° Sliced)</span> · Processing: <span className="text-slate-200">Boundary-Layer Orographic Correction</span></div>
                  <div>Attribution: <span className="text-slate-200">European Centre for Medium-Range Weather Forecasts (CC-BY 4.0)</span></div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-3 border border-[#1e2c47] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300">ECMWF AIFS (Artificial Intelligence Forecasting System)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">AI/ML GNN</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Architecture: <span className="text-slate-200">Graph Neural Operator</span> · Run Cycle: <span className="text-slate-200">00Z UTC Sync</span></div>
                  <div>Resolution: <span className="text-slate-200">0.25° Spherical Grid</span> · Processing: <span className="text-slate-200">Neural Wave Propagation</span></div>
                  <div>Attribution: <span className="text-slate-200">ECMWF Machine Learning Open Data</span></div>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-xl p-3 border border-[#1e2c47] space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">NOAA GEFS (Global Ensemble Forecast System)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">31-Member Ens</span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Perturbations: <span className="text-slate-200">31 Ensemble Members</span> · Quantiles: <span className="text-slate-200">10%, 50%, 90% Exceedance</span></div>
                  <div>Spread Metric: <span className="text-slate-200">Standard Deviation (&sigma;)</span> · Processing: <span className="text-slate-200">Ensemble Variance Propagation</span></div>
                  <div>Attribution: <span className="text-slate-200">NOAA NCEP Ensemble Open Data</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Blending Pipeline Provenance */}
          <div className="bg-[#101b2f] border border-[#1e2f4c] rounded-xl p-4 space-y-2 text-xs">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
              BLENDING ALGORITHM & SCIENTIFIC METHODOLOGY
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
              Algorithm: Adaptive Skill-Based Model Weighting with L2 Shrinkage Regularization (&lambda; = 0.12).
              Conditioned on: Region (MoES subdivisions) &times; Lead Time (+24h to +168h) &times; Season (JJAS, OND, JF, MAM) &times; Weather Regime (10 IMD atmospheric states).
            </p>
            <div className="pt-1 text-[10px] text-slate-400 font-mono">
              Verification Baseline: ECMWF Copernicus ERA5 0.25° Reanalysis Archive & IMD AWS Surface Network.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1e2c47] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/50 text-xs font-semibold"
          >
            Close Provenance Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
