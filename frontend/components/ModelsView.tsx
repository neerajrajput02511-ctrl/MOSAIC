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

interface ModelsViewProps {
  monitoringScope?: "NER" | "INDIA";
  onOpenCopilot?: (initialQuery?: string) => void;
}

export const ModelsView: React.FC<ModelsViewProps> = ({ 
  monitoringScope = "NER",
  onOpenCopilot 
}) => {
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
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E0E7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#1769AA]">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#0B1F33] tracking-tight">
              Constituent NWP & AI Weather Models
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Explore the multi-model architecture powering MOSAIC's dynamically weighted consensus forecast.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#F1F5F9] border border-[#D9E0E7] rounded-xl p-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "cards"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Model Profiles</span>
          </button>
          <button
            onClick={() => setViewMode("weights")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "weights"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Spatial Weight Map</span>
          </button>
        </div>
      </div>

      {viewMode === "weights" ? (
        <div className="space-y-4">
          <div className="p-3 bg-white border border-[#D9E0E7] rounded-xl text-xs text-[#64748B] flex items-center justify-between shadow-sm">
            <span>
              Interactive spatial weight distribution across India and the North Eastern Region.
            </span>
            <InfoTooltip term="adaptive_weight" explanation="Dynamic model weight distribution computed per grid point and lead time based on recent rolling verification skill." />
          </div>
          <ModelWeightMapView 
            monitoringScope={monitoringScope} 
            onOpenCopilot={onOpenCopilot}
          />
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
                      ? "bg-white border-[#1769AA] ring-2 ring-[#1769AA]/20 shadow-md"
                      : "bg-white border-[#D9E0E7] hover:border-[#94A3B8] shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0]">
                      {m.category}
                    </span>
                    <span className="flex items-center space-x-1 text-[10px] font-mono font-semibold text-[#16A34A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                      <span>OPERATIONAL</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0B1F33] text-base">{m.name}</h3>
                    <p className="text-[11px] text-[#64748B] line-clamp-1">{m.fullName}</p>
                  </div>

                  <div className="pt-2 border-t border-[#EDF2F7] flex items-center justify-between text-xs">
                    <span className="text-[#64748B] text-[10px] font-mono">RESOLUTION</span>
                    <span className="font-mono text-[#0F172A] text-[11px] font-semibold">{m.resolution}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#64748B] text-[10px] font-mono">AVG CONTRIBUTION</span>
                    <span className="font-mono text-[#1769AA] text-[11px] font-bold">{m.currentWeightContribution.split(" ")[0]}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-end text-[11px] text-[#1769AA] font-semibold">
                    <span>{isSelected ? "Inspecting" : "Click to Inspect"}</span>
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Model Inspector */}
          {activeModelObj && (
            <div className="bg-white border border-[#D9E0E7] rounded-xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EDF2F7] pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold text-[#0B1F33]">
                      {activeModelObj.fullName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD]">
                      {activeModelObj.code}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Operating Agency: {activeModelObj.institution}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-[10px] text-[#64748B] font-mono uppercase">Typical Contribution</div>
                    <div className="text-sm font-bold font-mono text-[#1769AA]">{activeModelObj.currentWeightContribution}</div>
                  </div>
                </div>
              </div>

              {/* Technical Profile Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] text-[#64748B] font-mono uppercase">Model Architecture</div>
                  <div className="text-xs font-semibold text-[#0F172A]">{activeModelObj.typeDescription}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] text-[#64748B] font-mono uppercase">Forecast Horizon & Grid</div>
                  <div className="text-xs font-semibold text-[#0F172A]">{activeModelObj.resolution} · {activeModelObj.leadTime}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                  <div className="text-[10px] text-[#64748B] font-mono uppercase">Regional Historical Skill</div>
                  <div className="text-xs font-semibold text-[#16A34A]">{activeModelObj.historicalSkill}</div>
                </div>
              </div>

              {/* How MOSAIC uses this model */}
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#0B1F33] uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-[#1769AA]" />
                  <span>How MOSAIC Leverages {activeModelObj.name} in Consensus Blending</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  {activeModelObj.howMosaicUses}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#64748B] font-mono">
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
