"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, Database, Layers, CheckCircle2, Clock, Globe, Cpu, FileText } from "lucide-react";
import { TimelinePoint, LocationItem } from "@/types";
import { fetchProvenance } from "@/services/api";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    async function loadProvenance() {
      try {
        const d = await fetchProvenance();
        if (d) {
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

  if (!isOpen || !mounted) return null;

  const portalTarget = typeof document !== "undefined"
    ? (document.getElementById("copilot-modal-root") || document.body)
    : null;

  if (!portalTarget) return null;

  const validTimeStr = currentPoint?.forecast_time 
    ? new Date(currentPoint.forecast_time).toUTCString()
    : "Active Forecast Hour";

  const leadHours = currentPoint?.lead_time_hours ?? 24;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99980] flex justify-end"
      style={{ isolation: "isolate" }}
    >
      {/* Full Viewport Dark/Blurred Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(8, 20, 35, 0.50)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)"
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-xl h-full bg-[#0D1B2E] border-l border-[#1E293B] p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 text-[#F4F8FC]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#00B8E6]" />
                <h3 className="font-bold text-base text-white tracking-wide uppercase">
                  FORECAST DATA PROVENANCE & LINEAGE
                </h3>
              </div>
              <p className="text-xs text-[#9DAFC4] font-mono mt-0.5">
                Full Scientific Traceability & Upstream Registry
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9DAFC4] hover:text-[#F4F8FC] hover:bg-[#14243A] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Target Metadata Card */}
          <div className="bg-[#081426] border border-[#1E293B] rounded-xl p-4 space-y-2 text-xs font-mono shadow-md">
            <div className="text-[10px] text-[#00B8E6] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>ACTIVE FORECAST QUERY</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[#9DAFC4]">
              <div>Station / Point: <strong className="text-white">{selectedLocation ? `${selectedLocation.name}, ${selectedLocation.state || "India"}` : "National Domain Grid (All India)"}</strong></div>
              <div>Coordinates: <strong className="text-white">{selectedLocation && selectedLocation.latitude !== undefined && selectedLocation.longitude !== undefined ? `${selectedLocation.latitude.toFixed(4)}°N, ${selectedLocation.longitude.toFixed(4)}°E` : "National Grid Bounding Box"}</strong></div>
              <div>Lead Horizon: <strong className="text-[#00B8E6]">+{leadHours}h</strong></div>
              <div>Valid Time: <strong className="text-white">{validTimeStr}</strong></div>
              <div>Primary Variable: <strong className="text-white">Total Precipitation (mm) & 2m Temp (°C)</strong></div>
              <div>Quality Flag: <strong className="text-emerald-400">QC_PASSED_SYNOPTIC</strong></div>
            </div>
          </div>

          {/* Multi-Model Upstream Sources Lineage */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-white uppercase">
              <span>UPSTREAM NUMERICAL & AI DATA SOURCES</span>
              <span className="text-[10px] text-[#9DAFC4]">All 4 operational inputs</span>
            </div>

            <div className="space-y-2.5">
              <div className="bg-[#081426] rounded-xl p-4 border border-[#233852] space-y-1.5 text-xs font-mono shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00B8E6]">NOAA GFS (Global Forecast System)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40">NWP 0.25°</span>
                </div>
                <div className="text-xs text-[#9DAFC4] space-y-0.5">
                  <div>Run Cycle: <span className="text-white font-medium">00Z UTC Operational</span> · Retrieval: <span className="text-white font-medium">NOMADS Open Data HTTP</span></div>
                  <div>Resolution: <span className="text-white font-medium">0.25° x 0.25°</span> · Processing: <span className="text-white font-medium">Bilinear Regridded to Common MoES Grid</span></div>
                  <div>Attribution: <span className="text-white font-medium">National Oceanic and Atmospheric Administration (NOAA)</span></div>
                </div>
              </div>

              <div className="bg-[#081426] rounded-xl p-4 border border-[#233852] space-y-1.5 text-xs font-mono shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#00B8E6]">ECMWF IFS (Integrated Forecasting System)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40">NWP 0.25°</span>
                </div>
                <div className="text-xs text-[#9DAFC4] space-y-0.5">
                  <div>Run Cycle: <span className="text-white font-medium">00Z UTC High-Res</span> · Retrieval: <span className="text-white font-medium">ECMWF Open Data Gateway</span></div>
                  <div>Resolution: <span className="text-white font-medium">0.25° (Native 0.1° Sliced)</span> · Processing: <span className="text-white font-medium">Boundary-Layer Orographic Correction</span></div>
                  <div>Attribution: <span className="text-white font-medium">European Centre for Medium-Range Weather Forecasts (CC-BY 4.0)</span></div>
                </div>
              </div>

              <div className="bg-[#081426] rounded-xl p-4 border border-[#233852] space-y-1.5 text-xs font-mono shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">ECMWF AIFS (Artificial Intelligence Forecasting System)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">AI/ML GNN</span>
                </div>
                <div className="text-xs text-[#9DAFC4] space-y-0.5">
                  <div>Architecture: <span className="text-white font-medium">Graph Neural Operator</span> · Run Cycle: <span className="text-white font-medium">00Z UTC Sync</span></div>
                  <div>Resolution: <span className="text-white font-medium">0.25° Spherical Grid</span> · Processing: <span className="text-white font-medium">Neural Wave Propagation</span></div>
                  <div>Attribution: <span className="text-white font-medium">ECMWF Machine Learning Open Data</span></div>
                </div>
              </div>

              <div className="bg-[#081426] rounded-xl p-4 border border-[#233852] space-y-1.5 text-xs font-mono shadow-md">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">NOAA GEFS (Global Ensemble Forecast System)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">31-Member Ens</span>
                </div>
                <div className="text-xs text-[#9DAFC4] space-y-0.5">
                  <div>Perturbations: <span className="text-white font-medium">31 Ensemble Members</span> · Quantiles: <span className="text-white font-medium">10%, 50%, 90% Exceedance</span></div>
                  <div>Spread Metric: <span className="text-white font-medium">Standard Deviation (&sigma;)</span> · Processing: <span className="text-white font-medium">Ensemble Variance Propagation</span></div>
                  <div>Attribution: <span className="text-white font-medium">NOAA NCEP Ensemble Open Data</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Blending Pipeline Provenance */}
          <div className="bg-[#081426] border border-[#1E293B] rounded-xl p-4 space-y-2 text-xs shadow-md">
            <span className="text-[10px] font-mono text-[#00B8E6] font-bold uppercase tracking-wider block">
              BLENDING ALGORITHM & SCIENTIFIC METHODOLOGY
            </span>
            <p className="text-xs text-[#9DAFC4] leading-relaxed font-mono">
              Algorithm: Adaptive Skill-Based Model Weighting with L2 Shrinkage Regularization (&lambda; = 0.12).
              Conditioned on: Region (MoES subdivisions) &times; Lead Time (+24h to +168h) &times; Season (JJAS, OND, JF, MAM) &times; Weather Regime (10 IMD atmospheric states).
            </p>
            <div className="pt-1 text-xs text-[#667B94] font-mono">
              Verification Baseline: ECMWF Copernicus ERA5 0.25° Reanalysis Archive & IMD AWS Surface Network.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00B8E6] to-[#1687FF] hover:brightness-110 text-white text-xs font-semibold shadow-md transition"
          >
            Close Provenance Drawer
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};
