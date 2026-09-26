"use client";

import React from "react";
import { TimelinePoint } from "@/types";
import { Sliders, Cpu, CloudRain, AlertCircle, ArrowRight, Activity, ShieldCheck, CheckCircle2 } from "lucide-react";
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
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs">
      {/* 1. Header & Synthesis Hero Display */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E2EC] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#EAF3FF] border border-[#BFD9FF] flex items-center justify-center text-[#1677FF]">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h4 className="font-bold text-xs text-[#102A43] uppercase tracking-wider font-mono">
              DYNAMIC MULTI-MODEL BLEND & WEIGHTING (+{currentPoint.lead_time_hours}h)
            </h4>
          </div>
          <p className="text-[11px] text-[#52667A] mt-1">
            Weights dynamically synthesized via Adaptive Skill-Based Model Weighting conditioned on Region &times; Season &times; Regime.
          </p>
        </div>
        
        {/* Blended Synthesis Hero Display with Uncertainty */}
        <div className="bg-[#EAF3FF] border border-[#BFD9FF] rounded-xl px-4 py-2.5 text-right">
          <span className="text-[10px] font-bold text-[#52667A] block uppercase tracking-wider">MOSAIC BLENDED RAINFALL</span>
          <div className="text-xl font-bold font-mono text-[#1677FF] flex items-center justify-end gap-1.5">
            <span>{truth.mosaic_blend.toFixed(1)}</span>
            <span className="text-xs font-normal text-[#52667A]">mm</span>
            <span className="text-xs text-[#B7791F] font-semibold">(&plusmn;{truth.uncertainty_pm} mm)</span>
          </div>
        </div>
      </div>

      {/* 2. MODEL CONSENSUS SECTION */}
      <div className="bg-[#F4F7FA] border border-[#D9E2EC] rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#102A43]">
            <Activity className="w-4 h-4 text-[#1677FF]" />
            <span>MODEL CONSENSUS & ENSEMBLE SPREAD</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            truth.confidence === "HIGH" 
              ? "bg-[#E6F4EA] text-[#15966B] border-[#CEEAD6]" 
              : truth.confidence === "MODERATE" 
              ? "bg-[#FFF8E8] text-[#B7791F] border-[#F4D58D]" 
              : "bg-[#FDE8E8] text-[#C53030] border-[#F8B4B4]"
          }`}>
            PROVISIONAL CONFIDENCE: {truth.confidence} ({truth.confidence_score}%)
          </span>
        </div>

        {/* 4 Models Raw Values Grid (Bound to Single Truth) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="bg-white p-2.5 rounded-lg border border-[#D9E2EC]">
            <span className="text-[10px] text-[#52667A] block uppercase font-sans font-bold">NOAA GFS</span>
            <span className="text-[#102A43] font-bold text-sm">{truth.models.gfs.value.toFixed(1)} mm</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#D9E2EC]">
            <span className="text-[10px] text-[#52667A] block uppercase font-sans font-bold">ECMWF IFS</span>
            <span className="text-[#1677FF] font-bold text-sm">{truth.models.ifs.value.toFixed(1)} mm</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#D9E2EC]">
            <span className="text-[10px] text-[#52667A] block uppercase font-sans font-bold">ECMWF AIFS</span>
            <span className="text-[#356AE6] font-bold text-sm">{truth.models.aifs.value.toFixed(1)} mm</span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-[#D9E2EC]">
            <span className="text-[10px] text-[#52667A] block uppercase font-sans font-bold">NOAA GEFS</span>
            <span className="text-[#B7791F] font-bold text-sm">{truth.models.gefs.value.toFixed(1)} mm</span>
          </div>
        </div>

        {/* Statistical Consensus Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono pt-2 border-t border-[#D9E2EC]">
          <div>
            <span className="text-[#52667A] text-[9px] uppercase block font-sans font-bold">EQUAL MEAN</span>
            <span className="text-[#102A43] font-bold">{truth.equal_mean.toFixed(1)} mm</span>
          </div>
          <div>
            <span className="text-[#52667A] text-[9px] uppercase block font-sans font-bold">SPREAD RANGE</span>
            <span className="text-[#102A43] font-bold">{truth.spread.toFixed(1)} mm</span>
          </div>
          <div>
            <span className="text-[#52667A] text-[9px] uppercase block font-sans font-bold">STD DEV (&sigma;)</span>
            <span className="text-[#1677FF] font-bold">{truth.std_dev.toFixed(2)} mm</span>
          </div>
          <div>
            <span className="text-[#52667A] text-[9px] uppercase block font-sans font-bold">AGREEMENT</span>
            <span className="text-[#15966B] font-bold">{truth.agreement_pct}%</span>
          </div>
          <div>
            <span className="text-[#52667A] text-[9px] uppercase block font-sans font-bold">90% UNCERTAINTY</span>
            <span className="text-[#B7791F] font-bold">&plusmn;{truth.uncertainty_pm} mm</span>
          </div>
        </div>
      </div>

      {/* 3. Model Weight Distribution Rows */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-bold text-[#52667A] flex items-center justify-between uppercase">
          <span>CONTRIBUTING MODEL WEIGHTS (&Sigma;w = 1.0000)</span>
          <span className="text-[10px] text-[#15966B] flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>&Sigma;w = {truth.weight_sum.toFixed(4)} Validated</span>
          </span>
        </div>

        {truth.model_list.map((m) => {
          const isAI = m.code.includes("AIFS");
          const isEnsemble = m.code.includes("GEFS");
          const weightPct = (m.normalized_weight * 100).toFixed(1);

          return (
            <div key={m.code} className="bg-white rounded-xl p-3.5 border border-[#D9E2EC] space-y-2 font-mono">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-[#102A43]">{m.name}</span>
                  <span className={`text-[8.5px] px-1.5 py-0.5 rounded border uppercase font-sans font-bold ${
                    isAI 
                      ? "bg-[#F2F6FF] text-[#356AE6] border-[#C8D9FF]"
                      : isEnsemble 
                      ? "bg-[#FFF8E8] text-[#9A6700] border-[#F4D58D]"
                      : "bg-[#EEF6FF] text-[#1677FF] border-[#BFD9FF]"
                  }`}>
                    {isAI ? "DEEP LEARNING AI" : isEnsemble ? "31-M ENSEMBLE" : "PHYSICS NWP"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-[#52667A]">Pred: <strong className="text-[#102A43]">{m.value.toFixed(1)} mm</strong></span>
                  <span className="text-[#1677FF] font-bold">Weight: {weightPct}% <span className="text-[#52667A] text-[10px] font-normal">(raw {(m.raw_weight * 100).toFixed(0)}%)</span></span>
                </div>
              </div>

              {/* Visual Weight Progress Bar */}
              <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isAI ? "bg-[#1677FF]" : isEnsemble ? "bg-[#B7791F]" : "bg-[#0284C7]"
                  }`}
                  style={{ width: `${m.normalized_weight * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-[#52667A] pt-0.5">
                <span>Verified Historical MAE: {m.historical_mae} mm</span>
                <span>Weighted Contribution: {(m.value * m.normalized_weight).toFixed(2)} mm</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Uncertainty & Explainability Action Footer */}
      <div className="pt-3 border-t border-[#D9E2EC] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-[#52667A]">
          <AlertCircle className="w-3.5 h-3.5 text-[#B7791F] shrink-0" />
          <span>Mathematical Identity: <strong className="text-[#102A43] font-mono">&Sigma;(w &times; x) = {truth.weighted_sum.toFixed(2)} mm &equiv; Blend {truth.mosaic_blend.toFixed(1)} mm</strong></span>
        </div>

        <button
          onClick={onOpenExplainability}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#EAF3FF] hover:bg-[#D9E8FF] text-[#1677FF] border border-[#BFD9FF] text-xs font-semibold transition"
        >
          <span>Why this forecast?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
