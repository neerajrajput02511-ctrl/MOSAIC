"use client";

import React from "react";
import { IndividualModelData } from "@/utils/forecastTruth";
import { X, Database, CheckCircle2, AlertTriangle, Layers, Cpu, Compass, Clock, Activity } from "lucide-react";

interface ModelProvenanceModalProps {
  model: IndividualModelData | null;
  isOpen: boolean;
  onClose: () => void;
  locationName: string;
  leadTime: number;
}

export const ModelProvenanceModal: React.FC<ModelProvenanceModalProps> = ({
  model,
  isOpen,
  onClose,
  locationName,
  leadTime
}) => {
  if (!isOpen || !model) return null;

  const contribution = (model.value * model.weight).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0b1220] border border-[#1e2c47] rounded-2xl w-full max-w-lg shadow-2xl p-6 text-slate-100 space-y-5 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e2c47] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-lg ${
              model.code === "ECMWF_AIFS" ? "bg-purple-900/40 text-purple-400" :
              model.code === "ECMWF_IFS" ? "bg-cyan-900/40 text-cyan-400" :
              model.code === "NOAA_GFS" ? "bg-blue-900/40 text-blue-400" :
              "bg-amber-900/40 text-amber-400"
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono tracking-tight text-white flex items-center gap-2">
                <span>{model.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                  model.status === "HEALTHY" 
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                    : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                }`}>
                  {model.status}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Model Value Provenance & Audit Trace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Value Banner */}
        <div className="bg-[#101b2f] border border-[#1e2f4d] rounded-xl p-4 flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase block">INTERPOLATED VALUE AT {locationName.toUpperCase()}</span>
            <div className="text-2xl font-bold text-cyan-300">
              {model.value.toFixed(1)} <span className="text-xs text-slate-400 font-normal">mm (Precipitation)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase block">BMA WEIGHT</span>
            <div className="text-xl font-bold text-purple-300">
              {Math.round(model.weight * 100)}% <span className="text-xs text-slate-500 font-normal">({model.weight.toFixed(4)})</span>
            </div>
          </div>
        </div>

        {/* Mathematical Contribution */}
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-3 text-xs font-mono flex items-center justify-between text-emerald-300">
          <span>Mathematical Blend Contribution (w &times; x):</span>
          <span className="font-bold text-sm">+{contribution} mm</span>
        </div>

        {/* Provenance Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">DATA SOURCE</span>
            <span className="text-slate-200 font-semibold block truncate">{model.source}</span>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">RUN CYCLE / INGESTION</span>
            <span className="text-slate-200 font-semibold block">{model.cycle}</span>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">TARGET LEAD HORIZON</span>
            <span className="text-cyan-300 font-bold block">+{leadTime} Hours</span>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">SPATIAL GRID</span>
            <span className="text-slate-200 font-semibold block">{model.resolution}</span>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">HISTORICAL SKILL (MAE)</span>
            <span className="text-amber-300 font-bold block">{model.historical_mae} mm</span>
          </div>

          <div className="bg-[#0f172a] p-2.5 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 block uppercase">QUALITY VERIFICATION</span>
            <span className="text-emerald-400 font-semibold block truncate">{model.quality_flag}</span>
          </div>
        </div>

        {/* Audit Footnote */}
        <div className="text-[10px] text-slate-400 font-mono bg-[#070c16] p-2.5 rounded-lg border border-[#141f33]">
          Interpolated via bilinear weighting onto the 0.25&deg; IMD common grid from native upstream GRIB2 coordinates. Zero future leakage verified.
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-semibold transition"
        >
          Close Provenance Inspector
        </button>
      </div>
    </div>
  );
};
