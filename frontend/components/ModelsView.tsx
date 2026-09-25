"use client";

import React, { useState } from "react";
import { 
  Cpu, 
  Brain, 
  Layers, 
  Globe2, 
  Activity, 
  Info, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  ChevronRight, 
  Zap, 
  ShieldCheck 
} from "lucide-react";
import { ModelWeightMapView } from "./ModelWeightMapView";
import { InfoTooltip } from "./InfoTooltip";

export const ModelsView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>("ECMWF_IFS");
  const [viewMode, setViewMode] = useState<"cards" | "weights">("cards");

  const models = [
    {
      code: "ECMWF_IFS",
      name: "ECMWF IFS",
      fullName: "Integrated Forecasting System (IFS HRES)",
      institution: "European Centre for Medium-Range Weather Forecasts",
      category: "Physics NWP",
      typeDescription: "Hydrostatic Primitive Equation Numerical Model",
      resolution: "0.25° (~25 km operational grid)",
      leadTime: "Up to +120h (5 days)",
      updateCadence: "00Z, 06Z, 12Z, 18Z cycles",
      historicalSkill: "High (Assam: 2.1mm MAE, National: 2.3mm MAE)",
      currentWeightContribution: "35% – 45% (Higher at extended leads)",
      howMosaicUses: "Acts as the physical benchmark backbone. In extreme convective setups and tropical storm synoptics, IFS provides physically consistent mass-momentum flux constraints that anchor the AI models.",
      strengths: "Global synoptic accuracy, precipitation accumulation physics, pressure gradient tracking.",
      accentColor: "#0284c7"
    },
    {
      code: "ECMWF_AIFS",
      name: "ECMWF AIFS",
      fullName: "Artificial Intelligence Forecasting System",
      institution: "ECMWF Machine Learning Division",
      category: "AI Deep Learning",
      typeDescription: "Spherical Graph Neural Network (GNN) on ERA5 Pre-training",
      resolution: "0.25° (~25 km common grid)",
      leadTime: "Up to +120h (High fidelity +24h to +72h)",
      updateCadence: "00Z & 12Z cycles (Inference <45 seconds)",
      historicalSkill: "Exceptional (2.4mm MAE; superior 500hPa geopotential height skill)",
      currentWeightContribution: "28% – 38% (Higher in normal regimes & short leads)",
      howMosaicUses: "Provides rapid, low-error large-scale field propagation. MOSAIC leverages AIFS to smooth out high-frequency noise inherent in single-deterministic physics runs.",
      strengths: "Speed, synoptic wave propagation, temperature field tracking, energy efficiency.",
      accentColor: "#8b5cf6"
    },
    {
      code: "NOAA_GFS",
      name: "NOAA GFS",
      fullName: "Global Forecast System",
      institution: "National Oceanic and Atmospheric Administration (NCEP)",
      category: "Physics NWP",
      typeDescription: "Spectral Finite-Volume Dynamic Core (FV3)",
      resolution: "0.25° operational output",
      leadTime: "Up to +120h",
      updateCadence: "00Z, 06Z, 12Z, 18Z cycles",
      historicalSkill: "Good (2.8mm MAE; strong low-level moisture convergence)",
      currentWeightContribution: "14% – 20%",
      howMosaicUses: "Adds independent physics diversity. Because GFS utilizes parameterizations independent of ECMWF, it prevents systemic European bias during the Indian Summer Monsoon.",
      strengths: "Bay of Bengal moisture surge detection, trade wind shear, independent boundary layer physics.",
      accentColor: "#06b6d4"
    },
    {
      code: "NOAA_GEFS",
      name: "NOAA GEFS",
      fullName: "Global Ensemble Forecast System",
      institution: "NOAA National Centers for Environmental Prediction",
      category: "31-Member Ensemble",
      typeDescription: "Perturbed Initial Conditions Ensemble (FV3-based)",
      resolution: "0.25° re-gridded",
      leadTime: "Up to +120h (Ensemble Mean & Spread)",
      updateCadence: "00Z, 06Z, 12Z, 18Z cycles",
      historicalSkill: "Reliable probabilistic dispersion (2.6mm MAE ensemble mean)",
      currentWeightContribution: "8% – 15% (Scales with atmospheric spread)",
      howMosaicUses: "Directly supplies MOSAIC with ensemble dispersion. Spread between GEFS members determines atmospheric uncertainty and calibrated exceedance probabilities (P > 15mm, P > 50mm).",
      strengths: "Quantified uncertainty, risk percentiles (P10–P90), heavy rainfall exceedance signals.",
      accentColor: "#10b981"
    }
  ];

  const activeModelObj = models.find(m => m.code === selectedModel) || models[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2f4d] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Integrated Forecasting Models
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Explore the four foundational NWP and AI forecasting systems dynamically weighted by the MOSAIC blending engine.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#0c1322] border border-[#1e2f4d] rounded-xl p-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "cards"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Model Profiles</span>
          </button>
          <button
            onClick={() => setViewMode("weights")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === "weights"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Spatial Weight Map</span>
          </button>
        </div>
      </div>

      {viewMode === "weights" ? (
        <div className="space-y-4">
          <div className="p-3 bg-[#0c1322] border border-[#1e2f4d] rounded-xl text-xs text-slate-400 flex items-center justify-between">
            <span>
              Interactive spatial weight distribution across India and the North Eastern Region.
            </span>
            <InfoTooltip term="adaptive_weight" explanation="" />
          </div>
          <ModelWeightMapView />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {models.map((m) => {
              const isSelected = selectedModel === m.code;
              return (
                <div
                  key={m.code}
                  onClick={() => setSelectedModel(m.code)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? "bg-[#10192d] border-cyan-500 shadow-lg shadow-cyan-500/10"
                      : "bg-[#0c1322] border-[#1e2f4d] hover:border-slate-600 hover:bg-[#0f172a]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {m.category}
                    </span>
                    <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{m.name}</h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{m.fullName}</p>
                  </div>

                  <div className="pt-2 border-t border-[#1e2f4d] flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[10px] font-mono">RESOLUTION</span>
                    <span className="font-mono text-slate-300 text-[11px] font-semibold">{m.resolution}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[10px] font-mono">AVG CONTRIBUTION</span>
                    <span className="font-mono text-cyan-400 text-[11px] font-bold">{m.currentWeightContribution.split(" ")[0]}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-end text-[11px] text-cyan-400 font-medium">
                    <span>{isSelected ? "Inspecting" : "Click to Inspect"}</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Model Inspector */}
          {activeModelObj && (
            <div className="bg-[#0c1322] border border-[#1e2f4d] rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2f4d] pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-slate-100">
                      {activeModelObj.fullName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {activeModelObj.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Operating Agency: {activeModelObj.institution}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-mono uppercase">Typical Contribution</div>
                    <div className="text-sm font-bold font-mono text-cyan-400">{activeModelObj.currentWeightContribution}</div>
                  </div>
                </div>
              </div>

              {/* Technical Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#10192d] border border-[#1e2f4d] space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Model Architecture</div>
                  <div className="text-xs font-semibold text-slate-200">{activeModelObj.typeDescription}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#10192d] border border-[#1e2f4d] space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Forecast Horizon & Grid</div>
                  <div className="text-xs font-semibold text-slate-200">{activeModelObj.resolution} · {activeModelObj.leadTime}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#10192d] border border-[#1e2f4d] space-y-1">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Regional Historical Skill</div>
                  <div className="text-xs font-semibold text-emerald-400">{activeModelObj.historicalSkill}</div>
                </div>
              </div>

              {/* How MOSAIC uses this model */}
              <div className="p-5 rounded-xl bg-[#0a101d] border border-[#1e2f4d] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>How MOSAIC Leverages {activeModelObj.name} in Consensus Blending</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeModelObj.howMosaicUses}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-slate-500 font-mono">
                <span>Cycles: {activeModelObj.updateCadence}</span>
                <span>Regridded via 0.25° Bilinear Interpolation onto Common Grid</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
