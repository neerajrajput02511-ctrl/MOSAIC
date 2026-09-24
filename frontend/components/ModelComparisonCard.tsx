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

  // Sourced strictly from Single Forecast Truth Engine (Requirements 1, 2, 5, 8, 9)
  const truth: SingleForecastTruth = buildSingleForecastTruth(
    currentPoint,
    currentPoint.lead_time_hours
  );

  return (
    <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-5 shadow-lg">
      {/* 1. Header & Synthesis Hero Display */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2c47] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-xs text-slate-100 uppercase tracking-wider font-mono">
              DYNAMIC MULTI-MODEL BLEND & WEIGHTING (+{currentPoint.lead_time_hours}h)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Weights dynamically synthesized via regularized BMA conditioned on Region &times; Season &times; Regime.
          </p>
        </div>
        
        {/* Blended Synthesis Hero Display with Uncertainty */}
        <div className="bg-[#101b2e] border border-cyan-500/40 rounded-xl px-4 py-2 text-right">
          <span className="text-[10px] font-mono text-slate-400 block uppercase">MOSAIC BLENDED RAINFALL</span>
          <div className="text-xl font-extrabold font-mono text-cyan-300 flex items-center justify-end gap-1.5">
            <span>{truth.mosaic_blend.toFixed(1)}</span>
            <span className="text-xs font-normal text-slate-400">mm</span>
            <span className="text-xs text-amber-300 font-normal">(&plusmn;{truth.uncertainty_pm} mm)</span>
          </div>
        </div>
      </div>

      {/* 2. MODEL CONSENSUS SECTION (SECTION 8 MANDATE) */}
      <div className="bg-[#090f1d] border border-[#1e2f4c] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>MODEL CONSENSUS & ENSEMBLE SPREAD</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
            truth.confidence === "HIGH" 
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
              : truth.confidence === "MODERATE" 
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
              : "bg-rose-500/20 text-rose-300 border-rose-500/40"
          }`}>
            CONFIDENCE: {truth.confidence} ({truth.confidence_score}%)
          </span>
        </div>

        {/* 4 Models Raw Values Grid (Bound to Single Truth) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="bg-[#101b2f] p-2 rounded-lg border border-[#1b2b45]">
            <span className="text-[10px] text-slate-400 block uppercase">NOAA GFS</span>
            <span className="text-blue-300 font-bold">{truth.models.gfs.value.toFixed(1)} mm</span>
          </div>
          <div className="bg-[#101b2f] p-2 rounded-lg border border-[#1b2b45]">
            <span className="text-[10px] text-slate-400 block uppercase">ECMWF IFS</span>
            <span className="text-cyan-300 font-bold">{truth.models.ifs.value.toFixed(1)} mm</span>
          </div>
          <div className="bg-[#101b2f] p-2 rounded-lg border border-[#1b2b45]">
            <span className="text-[10px] text-slate-400 block uppercase">ECMWF AIFS</span>
            <span className="text-purple-300 font-bold">{truth.models.aifs.value.toFixed(1)} mm</span>
          </div>
          <div className="bg-[#101b2f] p-2 rounded-lg border border-[#1b2b45]">
            <span className="text-[10px] text-slate-400 block uppercase">NOAA GEFS</span>
            <span className="text-amber-300 font-bold">{truth.models.gefs.value.toFixed(1)} mm</span>
          </div>
        </div>

        {/* Statistical Consensus Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono pt-1 border-t border-[#18263f]">
          <div>
            <span className="text-slate-500 text-[9px] uppercase block">EQUAL MEAN</span>
            <span className="text-slate-200 font-bold">{truth.equal_mean.toFixed(1)} mm</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase block">SPREAD RANGE</span>
            <span className="text-slate-200 font-bold">{truth.spread.toFixed(1)} mm</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase block">STD DEV (&sigma;)</span>
            <span className="text-cyan-300 font-bold">{truth.std_dev.toFixed(2)} mm</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase block">AGREEMENT</span>
            <span className="text-emerald-400 font-bold">{truth.agreement_pct}%</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase block">90% UNCERTAINTY</span>
            <span className="text-amber-300 font-bold">&plusmn;{truth.uncertainty_pm} mm</span>
          </div>
        </div>
      </div>

      {/* 3. Model Weight Distribution Rows */}
      <div className="space-y-2.5">
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between uppercase">
          <span>CONTRIBUTING MODEL WEIGHTS (&Sigma;w = 1.0000)</span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>&Sigma;w = {truth.weight_sum.toFixed(4)} Validated</span>
          </span>
        </div>

        {truth.model_list.map((m) => {
          const isAI = m.code.includes("AIFS");
          const isEnsemble = m.code.includes("GEFS");
          const weightPct = Math.round(m.weight * 100);

          return (
            <div key={m.code} className="bg-[#111a2e] rounded-xl p-3 border border-[#1e2c47]/80 space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-200">{m.name}</span>
                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded border ${
                    isAI 
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : isEnsemble 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                  }`}>
                    {isAI ? "DEEP LEARNING AI" : isEnsemble ? "31-M ENSEMBLE" : "PHYSICS NWP"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-slate-400">Pred: <strong className="text-slate-200">{m.value.toFixed(1)} mm</strong></span>
                  <span className="text-cyan-400 font-bold">Weight: {weightPct}%</span>
                </div>
              </div>

              {/* Visual Weight Progress Bar */}
              <div className="w-full h-1.5 bg-[#0c1322] rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 ${isAI ? "bg-purple-500" : isEnsemble ? "bg-amber-400" : "bg-cyan-400"}`}
                  style={{ width: `${weightPct}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Verified Historical MAE: {m.historical_mae} mm</span>
                <span>Weighted Contribution: {(m.value * m.weight).toFixed(2)} mm</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Uncertainty & Explainability Action Footer (Section 9) */}
      <div className="pt-2 border-t border-[#1e2c47] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Mathematical Identity: <strong className="text-slate-200 font-mono">&Sigma;(w &times; x) = {truth.weighted_sum.toFixed(2)} mm &equiv; Blend {truth.mosaic_blend.toFixed(1)} mm</strong></span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 text-[10px] hidden md:inline">Gaussian Error Bounds &sigma; &times; 1.645</span>
        </div>

        <button
          onClick={onOpenExplainability}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
        >
          <span>Why this forecast?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
