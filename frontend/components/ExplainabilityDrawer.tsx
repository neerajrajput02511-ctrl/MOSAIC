"use client";

import React from "react";
import { WhyThisForecastData } from "@/types";
import { X, CheckCircle2, ShieldCheck, Scale, Database, Clock, Layers } from "lucide-react";

interface ExplainabilityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  data: WhyThisForecastData | null;
  isLoading: boolean;
}

export const ExplainabilityDrawer: React.FC<ExplainabilityDrawerProps> = ({
  isOpen,
  onClose,
  data,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl h-full bg-[#0c1322] border-l border-[#1e2c47] p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e2c47] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h3 className="font-bold text-base text-slate-100 tracking-wide">
                  WHY THIS FORECAST?
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                SCIENTIFIC DECOMPOSITION & ATTRIBUTION AUDIT
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#111a2e] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading || !data ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Generating scientific audit trail...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-[#111a2e] border border-[#1e2c47] rounded-lg p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SYNTHESIS SUMMARY</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {data.explanation_summary}
                </p>
              </div>

              {/* Atmospheric Regime & Context */}
              <div className="bg-[#111a2e] border border-[#1e2c47] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">Atmospheric Regime</span>
                  <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {data.weather_regime}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {data.regime_reasoning}
                </p>
                <div className="flex items-center space-x-4 text-[11px] text-slate-400 pt-2 border-t border-[#1e2c47] font-mono">
                  <span>Season: <strong className="text-slate-200">{data.season}</strong></span>
                  <span>Lead Time: <strong className="text-slate-200">+{data.lead_time_hours}h</strong></span>
                  <span>Location: <strong className="text-slate-200">{data.location.name}</strong></span>
                </div>
              </div>

              {/* Contributing Model Breakdown & Weights */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Model Weight Distribution</span>
                </div>
                <div className="border border-[#1e2c47] rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#111a2e] text-slate-400 font-mono text-[10px] border-b border-[#1e2c47]">
                      <tr>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">Prediction</th>
                        <th className="p-2.5">Weight</th>
                        <th className="p-2.5">Hist. MAE</th>
                        <th className="p-2.5 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2c47] font-mono text-slate-200">
                      {data.model_breakdown.map((m) => (
                        <tr key={m.model_code} className="hover:bg-[#111a2e]/50">
                          <td className="p-2.5 font-sans font-medium text-slate-100">{m.model_name}</td>
                          <td className="p-2.5">{m.forecast_value} {data.unit}</td>
                          <td className="p-2.5 text-cyan-400 font-bold">{Math.round(m.weight * 100)}%</td>
                          <td className="p-2.5 text-slate-400">{m.historical_mae} {data.unit}</td>
                          <td className="p-2.5 text-right font-bold text-slate-100">
                            {(m.forecast_value * m.weight).toFixed(2)} {data.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#111a2e] font-mono text-xs border-t border-[#1e2c47]">
                      <tr>
                        <td colSpan={4} className="p-2.5 font-bold text-slate-200">FINAL BLENDED SYNTHESIS</td>
                        <td className="p-2.5 text-right font-bold text-cyan-400 text-sm">
                          {data.blended_value} {data.unit}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Uncertainty Quantification */}
              <div className="bg-[#111a2e] border border-[#1e2c47] rounded-lg p-4 space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block">Forecast Uncertainty Quantification</span>
                <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                  <div className="bg-[#0c1322] p-2 rounded border border-[#1e2c47]">
                    <span className="text-[10px] text-slate-400 block">LOWER BOUND</span>
                    <span className="text-slate-200 font-bold">{data.uncertainty_range.lower} {data.unit}</span>
                  </div>
                  <div className="bg-[#0c1322] p-2 rounded border border-[#1e2c47]">
                    <span className="text-[10px] text-slate-400 block">BLENDED ESTIMATE</span>
                    <span className="text-cyan-400 font-bold">{data.blended_value} {data.unit}</span>
                  </div>
                  <div className="bg-[#0c1322] p-2 rounded border border-[#1e2c47]">
                    <span className="text-[10px] text-slate-400 block">UPPER BOUND</span>
                    <span className="text-slate-200 font-bold">{data.uncertainty_range.upper} {data.unit}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 text-[11px] text-slate-400 font-mono">
                  <span>Model Disagreement Spread (σ):</span>
                  <span className="text-slate-200">±{data.model_disagreement} {data.unit}</span>
                </div>
              </div>

              {/* Data Provenance & Run Cycles */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-slate-300 block">Data Sources & Provenance</span>
                <div className="space-y-1">
                  {data.data_sources.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] font-mono text-slate-400 bg-[#111a2e] px-3 py-1.5 rounded border border-[#1e2c47]">
                      <span>{s.name} ({s.type})</span>
                      <span className="text-emerald-400">{s.provenance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1e2c47] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold transition"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
