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
    <div className="fixed inset-0 z-[600] flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl h-full bg-white border-l border-[#D9E0E7] p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1769AA]" />
                <h3 className="font-bold text-base text-[#0B1F33] tracking-wide">
                  WHY THIS FORECAST?
                </h3>
              </div>
              <p className="text-xs text-[#64748B] font-mono mt-0.5">
                SCIENTIFIC DECOMPOSITION & ATTRIBUTION AUDIT
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0B1F33] hover:bg-[#F8FAFC] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading || !data ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#64748B]">
              <div className="w-8 h-8 border-2 border-[#1769AA] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Generating scientific audit trail...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-[#F8FAFC] border border-[#D9E0E7] rounded-xl p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#1769AA] font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1769AA]" />
                  <span>SYNTHESIS SUMMARY</span>
                </div>
                <p className="text-xs text-[#334155] leading-relaxed">
                  {data.explanation_summary}
                </p>
              </div>

              {/* Atmospheric Regime & Context */}
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#0B1F33]">Atmospheric Regime</span>
                  <span className="px-2.5 py-0.5 rounded font-mono font-bold text-[11px] bg-amber-50 text-amber-800 border border-amber-200">
                    {data.weather_regime}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] leading-normal">
                  {data.regime_reasoning}
                </p>
                <div className="flex items-center space-x-4 text-xs text-[#64748B] pt-2 border-t border-[#EDF2F7] font-mono">
                  <span>Season: <strong className="text-[#0B1F33]">{data.season}</strong></span>
                  <span>Lead Time: <strong className="text-[#0B1F33]">+{data.lead_time_hours}h</strong></span>
                  <span>Location: <strong className="text-[#0B1F33]">{data.location.name}</strong></span>
                </div>
              </div>

              {/* Contributing Model Breakdown & Weights */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#0B1F33]">
                  <Scale className="w-4 h-4 text-[#1769AA]" />
                  <span>Multi-Model Weight Distribution</span>
                </div>
                <div className="border border-[#D9E0E7] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] text-[#64748B] font-mono text-[10px] border-b border-[#D9E0E7]">
                      <tr>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">Prediction</th>
                        <th className="p-2.5">Weight</th>
                        <th className="p-2.5">Hist. MAE</th>
                        <th className="p-2.5 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2F7] font-mono text-[#0B1F33]">
                      {data.model_breakdown.map((m) => (
                        <tr key={m.model_code} className="hover:bg-[#F8FAFC]">
                          <td className="p-2.5 font-sans font-medium text-[#0B1F33]">{m.model_name}</td>
                          <td className="p-2.5">{m.forecast_value} {data.unit}</td>
                          <td className="p-2.5 text-[#1769AA] font-bold">{Math.round(m.weight * 100)}%</td>
                          <td className="p-2.5 text-[#64748B]">{m.historical_mae} {data.unit}</td>
                          <td className="p-2.5 text-right font-bold text-[#0B1F33]">
                            {(m.forecast_value * m.weight).toFixed(2)} {data.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#F8FAFC] font-mono text-xs border-t border-[#D9E0E7]">
                      <tr>
                        <td colSpan={4} className="p-2.5 font-bold text-[#0B1F33]">FINAL BLENDED SYNTHESIS</td>
                        <td className="p-2.5 text-right font-bold text-[#1769AA] text-sm">
                          {data.blended_value} {data.unit}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Uncertainty Quantification */}
              <div className="bg-[#F8FAFC] border border-[#D9E0E7] rounded-xl p-4 space-y-2 text-xs">
                <span className="font-semibold text-[#0B1F33] block">Forecast Uncertainty Quantification</span>
                <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                  <div className="bg-white p-2.5 rounded-lg border border-[#D9E0E7] shadow-sm">
                    <span className="text-[10px] text-[#64748B] block uppercase">LOWER BOUND</span>
                    <span className="text-[#0B1F33] font-bold">{data.uncertainty_range.lower} {data.unit}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#1769AA] shadow-sm">
                    <span className="text-[10px] text-[#1769AA] block uppercase font-semibold">BLENDED ESTIMATE</span>
                    <span className="text-[#1769AA] font-bold">{data.blended_value} {data.unit}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-[#D9E0E7] shadow-sm">
                    <span className="text-[10px] text-[#64748B] block uppercase">UPPER BOUND</span>
                    <span className="text-[#0B1F33] font-bold">{data.uncertainty_range.upper} {data.unit}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 text-xs text-[#64748B] font-mono">
                  <span>Model Disagreement Spread (σ):</span>
                  <span className="text-[#0B1F33] font-semibold">±{data.model_disagreement} {data.unit}</span>
                </div>
              </div>

              {/* Data Provenance & Run Cycles */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-[#0B1F33] block">Data Sources & Lineage</span>
                <div className="space-y-1">
                  {data.data_sources.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono text-[#64748B] bg-white px-3 py-2 rounded-lg border border-[#D9E0E7]">
                      <span>{s.name} ({s.type})</span>
                      <span className="text-emerald-700 font-semibold">{s.provenance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#EDF2F7] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0B1F33] hover:bg-[#17253a] text-white rounded-lg text-xs font-semibold transition shadow-sm"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
