"use client";

import React from "react";
import { TimelinePoint } from "@/types";
import { Sliders, Cpu, CloudRain, AlertCircle, ArrowRight } from "lucide-react";

interface ModelComparisonCardProps {
  currentPoint: TimelinePoint | null;
  onOpenExplainability: () => void;
}

export const ModelComparisonCard: React.FC<ModelComparisonCardProps> = ({
  currentPoint,
  onOpenExplainability
}) => {
  if (!currentPoint) return null;

  const models = currentPoint.contributing_models || [];

  return (
    <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e2c47] pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h4 className="font-semibold text-xs text-slate-100 uppercase tracking-wider">
              DYNAMIC MODEL WEIGHTING & CONSENSUS (+{currentPoint.lead_time_hours}h)
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Weights adapt dynamically according to historical model skill, season, and atmospheric regime.
          </p>
        </div>
        
        {/* Blended Synthesis Hero Display */}
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 block">FINAL BLENDED RAIN</span>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {currentPoint.blended_precipitation_mm} <span className="text-xs font-normal text-slate-300">mm</span>
          </div>
        </div>
      </div>

      {/* Model Breakdown Rows */}
      <div className="space-y-2.5">
        {models.map((m) => {
          const isAI = m.model_code.includes("AIFS");
          const weightPct = Math.round((m.weight || 0) * 100);
          return (
            <div key={m.model_code} className="bg-[#111a2e] rounded p-2.5 border border-[#1e2c47]/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-slate-200">{m.model_name}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    isAI 
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                  }`}>
                    {isAI ? "DEEP LEARNING AI" : "PHYSICS NWP"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 font-mono text-xs">
                  <span className="text-slate-400">Pred: <strong className="text-slate-200">{m.prediction_precip ?? "N/A"} mm</strong></span>
                  <span className="text-cyan-400 font-bold">Weight: {weightPct}%</span>
                </div>
              </div>

              {/* Visual Weight Progress Bar */}
              <div className="w-full h-1.5 bg-[#0c1322] rounded-full overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 ${isAI ? "bg-purple-500" : "bg-cyan-500"}`}
                  style={{ width: `${weightPct}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                <span>Hist. Skill (MAE): {m.historical_mae ?? "2.2"} mm</span>
                <span>Contribution: {((m.prediction_precip || 0) * (m.weight || 0)).toFixed(2)} mm</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Uncertainty & Explainability Action */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1e2c47] text-xs">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Model Spread: <strong className="text-slate-200 font-mono">±{currentPoint.model_disagreement_spread} mm</strong></span>
          <span className="text-slate-500">|</span>
          <span>Expected Range: <strong className="text-slate-200 font-mono">{currentPoint.uncertainty_lower_mm} - {currentPoint.uncertainty_upper_mm} mm</strong></span>
        </div>

        <button
          onClick={onOpenExplainability}
          className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 font-semibold transition"
        >
          <span>Why this forecast?</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
