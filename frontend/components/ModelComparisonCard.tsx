"use client";

import React from "react";
import { TimelinePoint } from "@/types";
import { Sliders, Activity, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { buildSingleForecastTruth, SingleForecastTruth } from "@/utils/forecastTruth";

interface ModelComparisonCardProps {
  currentPoint: TimelinePoint | null;
  onOpenExplainability: () => void;
}

export const ModelComparisonCard: React.FC<ModelComparisonCardProps> = ({
  currentPoint,
  onOpenExplainability
}) => {
  if (!currentPoint) return null;

  // Sourced strictly from Single Forecast Truth Engine
  const truth: SingleForecastTruth = buildSingleForecastTruth(
    currentPoint,
    currentPoint.lead_time_hours
  );

  return (
    <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg select-none">
      {/* 1. Header & Synthesis Hero Display */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-[#00B8E6]">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              DYNAMIC MULTI-MODEL BLEND & WEIGHTING (+{currentPoint.lead_time_hours}h)
            </h4>
          </div>
          <p className="text-[11px] text-[#9DAFC4] mt-1">
            Weights dynamically synthesized via Adaptive Skill-Based Model Weighting conditioned on Region &times; Season &times; Regime.
          </p>
        </div>
        
        {/* Blended Synthesis Hero Display with Uncertainty */}
        <div className="bg-[#081426] border border-[#233852] rounded-xl px-4 py-2.5 text-right">
          <span className="text-[10px] font-bold text-[#667B94] block uppercase tracking-wider">MOSAIC BLENDED RAINFALL</span>
          <div className="text-xl font-bold font-mono text-[#00B8E6] flex items-center justify-end gap-1.5">
            <span>{truth.mosaic_blend !== null ? truth.mosaic_blend.toFixed(1) : "N/A"}</span>
            <span className="text-xs font-normal text-[#9DAFC4]">mm</span>
            <span className="text-xs text-amber-400 font-semibold">{truth.uncertainty_pm !== null ? `(±${truth.uncertainty_pm} mm)` : "(N/A)"}</span>
          </div>
        </div>
      </div>

      {/* 2. MODEL CONSENSUS SECTION */}
      <div className="bg-[#081426] border border-[#1E293B] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Activity className="w-4 h-4 text-[#00B8E6]" />
            <span>MODEL CONSENSUS & ENSEMBLE SPREAD</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            truth.confidence === "HIGH" 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
              : truth.confidence === "MODERATE" 
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
              : truth.confidence === "LOW"
              ? "bg-red-500/10 text-red-400 border-red-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}>
            PROVISIONAL CONFIDENCE: {truth.confidence} {truth.confidence_score !== null ? `(${truth.confidence_score}%)` : "(N/A)"}
          </span>
        </div>

        {/* 4 Models Raw Values Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#233852]">
            <span className="text-[10px] text-[#667B94] block uppercase font-sans font-bold">NOAA GFS</span>
            <span className="text-white font-bold text-sm">{truth.models.gfs.value !== null ? `${truth.models.gfs.value.toFixed(1)} mm` : "N/A"}</span>
          </div>
          <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#233852]">
            <span className="text-[10px] text-[#667B94] block uppercase font-sans font-bold">ECMWF IFS</span>
            <span className="text-[#1687FF] font-bold text-sm">{truth.models.ifs.value !== null ? `${truth.models.ifs.value.toFixed(1)} mm` : "N/A"}</span>
          </div>
          <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#233852]">
            <span className="text-[10px] text-[#667B94] block uppercase font-sans font-bold">ECMWF AIFS</span>
            <span className="text-[#00B8E6] font-bold text-sm">{truth.models.aifs.value !== null ? `${truth.models.aifs.value.toFixed(1)} mm` : "N/A"}</span>
          </div>
          <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#233852]">
            <span className="text-[10px] text-[#667B94] block uppercase font-sans font-bold">NOAA GEFS</span>
            <span className="text-amber-400 font-bold text-sm">{truth.models.gefs.value !== null ? `${truth.models.gefs.value.toFixed(1)} mm` : "N/A"}</span>
          </div>
        </div>

        {/* Statistical Consensus Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono pt-2 border-t border-[#1E293B]">
          <div>
            <span className="text-[#667B94] text-[9px] uppercase block font-sans font-bold">EQUAL MEAN</span>
            <span className="text-white font-bold">{truth.equal_mean !== null ? `${truth.equal_mean.toFixed(1)} mm` : "N/A"}</span>
          </div>
          <div>
            <span className="text-[#667B94] text-[9px] uppercase block font-sans font-bold">SPREAD RANGE</span>
            <span className="text-white font-bold">{truth.spread !== null ? `${truth.spread.toFixed(1)} mm` : "N/A"}</span>
          </div>
          <div>
            <span className="text-[#667B94] text-[9px] uppercase block font-sans font-bold">STD DEV (&sigma;)</span>
            <span className="text-[#00B8E6] font-bold">{truth.std_dev !== null ? `${truth.std_dev.toFixed(2)} mm` : "N/A"}</span>
          </div>
          <div>
            <span className="text-[#667B94] text-[9px] uppercase block font-sans font-bold">AGREEMENT</span>
            <span className="text-emerald-400 font-bold">{truth.agreement_pct !== null ? `${truth.agreement_pct}%` : "N/A"}</span>
          </div>
          <div>
            <span className="text-[#667B94] text-[9px] uppercase block font-sans font-bold">90% UNCERTAINTY</span>
            <span className="text-amber-400 font-bold">{truth.uncertainty_pm !== null ? `±${truth.uncertainty_pm} mm` : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* 3. Model Weight Distribution Rows */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold text-[#9DAFC4] flex items-center justify-between uppercase">
          <span>CONTRIBUTING MODEL WEIGHTS (&Sigma;w = 1.0000)</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>&Sigma;w = {truth.weight_sum.toFixed(4)} Validated</span>
          </span>
        </div>

        {truth.model_list.map((m) => {
          const isAI = m.code.includes("AIFS");
          const isEnsemble = m.code.includes("GEFS");
          const weightPct = (m.normalized_weight * 100).toFixed(1);

          return (
            <div key={m.code} className="bg-[#081426] rounded-xl p-3.5 border border-[#1E293B] space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white">{m.name}</span>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded border uppercase font-sans font-bold ${
                    isAI 
                      ? "bg-cyan-950/60 text-[#00B8E6] border-cyan-800/60"
                      : isEnsemble 
                      ? "bg-amber-950/40 text-amber-400 border-amber-800/40"
                      : "bg-blue-950/60 text-[#1687FF] border-blue-800/60"
                  }`}>
                    {isAI ? "DEEP LEARNING AI" : isEnsemble ? "31-M ENSEMBLE" : "PHYSICS NWP"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-[#9DAFC4]">Pred: <strong className="text-white">{m.value.toFixed(1)} mm</strong></span>
                  <span className="text-[#00B8E6] font-bold">Weight: {weightPct}% <span className="text-[#667B94] text-[10px] font-normal">(raw {(m.raw_weight * 100).toFixed(0)}%)</span></span>
                </div>
              </div>

              {/* Visual Weight Progress Bar */}
              <div className="w-full h-2 bg-[#070D18] rounded-full overflow-hidden flex border border-[#1E293B]">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isAI ? "bg-[#00B8E6]" : isEnsemble ? "bg-amber-400" : "bg-[#1687FF]"
                  }`}
                  style={{ width: `${m.normalized_weight * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#667B94] pt-0.5">
                <span>Verified Historical MAE: {m.historical_mae} mm</span>
                <span>Weighted Contribution: {(m.value * m.normalized_weight).toFixed(2)} mm</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Uncertainty & Explainability Action Footer */}
      <div className="pt-3 border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-[#9DAFC4]">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Mathematical Identity: <strong className="text-white font-mono">{truth.weighted_sum !== null && truth.mosaic_blend !== null ? `Σ(w × x) = ${truth.weighted_sum.toFixed(2)} mm ≡ Blend ${truth.mosaic_blend.toFixed(1)} mm` : "Σ(w × x) = N/A (Awaiting Upstream Runs)"}</strong></span>
        </div>

        <button
          onClick={onOpenExplainability}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white text-xs font-semibold shadow-sm hover:brightness-110 transition"
        >
          <span>Why this forecast?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
