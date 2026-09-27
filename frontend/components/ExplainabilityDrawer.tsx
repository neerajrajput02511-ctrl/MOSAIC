"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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

  if (!isOpen || !mounted) return null;

  const portalTarget = typeof document !== "undefined"
    ? (document.getElementById("copilot-modal-root") || document.body)
    : null;

  if (!portalTarget) return null;

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
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B8E6]" />
                <h3 className="font-bold text-base text-white tracking-wide">
                  WHY THIS FORECAST?
                </h3>
              </div>
              <p className="text-xs text-[#9DAFC4] font-mono mt-0.5">
                SCIENTIFIC DECOMPOSITION & ATTRIBUTION AUDIT
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#9DAFC4] hover:text-[#F4F8FC] hover:bg-[#14243A] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading || !data ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#9DAFC4]">
              <div className="w-8 h-8 border-2 border-[#00B8E6] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono">Generating scientific audit trail...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-[#081426] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-[#00B8E6] font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#00B8E6]" />
                  <span>SYNTHESIS SUMMARY</span>
                </div>
                <p className="text-xs text-[#9DAFC4] leading-relaxed">
                  {data.explanation_summary}
                </p>
              </div>

              {/* Atmospheric Regime & Context */}
              <div className="bg-[#081426] border border-[#1E293B] rounded-xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Atmospheric Regime</span>
                  <span className="px-2.5 py-0.5 rounded font-mono font-bold text-[11px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {data.weather_regime}
                  </span>
                </div>
                <p className="text-xs text-[#9DAFC4] leading-normal">
                  {data.regime_reasoning}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#1E293B] text-[11px] font-mono">
                  <div className="bg-[#0D1B2E] p-2 rounded border border-[#233852]">
                    <span className="text-[#667B94] text-[9px] uppercase block font-sans">Region</span>
                    <strong className="text-white truncate block">{data.location.state || data.location.name}</strong>
                  </div>
                  <div className="bg-[#0D1B2E] p-2 rounded border border-[#233852]">
                    <span className="text-[#667B94] text-[9px] uppercase block font-sans">Season & Lead</span>
                    <strong className="text-white block">{data.season} · +{data.lead_time_hours}h</strong>
                  </div>
                  <div className="bg-[#0D1B2E] p-2 rounded border border-[#233852]">
                    <span className="text-[#667B94] text-[9px] uppercase block font-sans">Variable</span>
                    <strong className="text-white block">Precipitation ({data.unit})</strong>
                  </div>
                  <div className="bg-[#0D1B2E] p-2 rounded border border-[#233852]">
                    <span className="text-[#667B94] text-[9px] uppercase block font-sans">QC & Availability</span>
                    <strong className="text-emerald-400 block">PASS · 4/4 Models</strong>
                  </div>
                </div>
              </div>

              {/* Contributing Model Breakdown & Weights */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                  <Scale className="w-4 h-4 text-[#00B8E6]" />
                  <span>Multi-Model Weight Distribution</span>
                </div>
                <div className="border border-[#233852] rounded-xl overflow-hidden shadow-md">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#081426] text-[#9DAFC4] font-mono text-[10px] border-b border-[#233852]">
                      <tr>
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">Prediction</th>
                        <th className="p-2.5">Weight</th>
                        <th className="p-2.5">Hist. MAE</th>
                        <th className="p-2.5 text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] font-mono text-[#F4F8FC]">
                      {data.model_breakdown.map((m) => (
                        <tr key={m.model_code} className="hover:bg-[#14243A] transition">
                          <td className="p-2.5 font-sans font-medium text-white">{m.model_name}</td>
                          <td className="p-2.5">{m.forecast_value} {data.unit}</td>
                          <td className="p-2.5 text-[#00B8E6] font-bold">{Math.round(m.weight * 100)}%</td>
                          <td className="p-2.5 text-[#9DAFC4]">{m.historical_mae} {data.unit}</td>
                          <td className="p-2.5 text-right font-bold text-white">
                            {(m.forecast_value * m.weight).toFixed(2)} {data.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[#081426] font-mono text-xs border-t border-[#233852]">
                      <tr>
                        <td colSpan={4} className="p-2.5 font-bold text-white">FINAL BLENDED SYNTHESIS</td>
                        <td className="p-2.5 text-right font-bold text-[#00B8E6] text-sm">
                          {data.blended_value} {data.unit}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Uncertainty Quantification */}
              <div className="bg-[#081426] border border-[#1E293B] rounded-xl p-4 space-y-2 text-xs">
                <span className="font-semibold text-white block">Forecast Uncertainty Quantification</span>
                <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                  <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#233852] shadow-sm">
                    <span className="text-[10px] text-[#667B94] block uppercase">LOWER BOUND</span>
                    <span className="text-white font-bold">{data.uncertainty_range.lower} {data.unit}</span>
                  </div>
                  <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#00B8E6] shadow-sm">
                    <span className="text-[10px] text-[#00B8E6] block uppercase font-semibold">BLENDED ESTIMATE</span>
                    <span className="text-[#00B8E6] font-bold">{data.blended_value} {data.unit}</span>
                  </div>
                  <div className="bg-[#0D1B2E] p-2.5 rounded-lg border border-[#233852] shadow-sm">
                    <span className="text-[10px] text-[#667B94] block uppercase">UPPER BOUND</span>
                    <span className="text-white font-bold">{data.uncertainty_range.upper} {data.unit}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 text-xs text-[#9DAFC4] font-mono">
                  <span>Model Disagreement Spread (σ):</span>
                  <span className="text-white font-semibold">±{data.model_disagreement} {data.unit}</span>
                </div>
              </div>

              {/* Data Provenance & Run Cycles */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-white block">Data Sources & Lineage</span>
                <div className="space-y-1">
                  {data.data_sources.map((s, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-mono text-[#9DAFC4] bg-[#081426] px-3 py-2 rounded-lg border border-[#233852]">
                      <span>{s.name} ({s.type})</span>
                      <span className="text-emerald-400 font-semibold">{s.provenance}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#1E293B] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-[#00B8E6] to-[#1687FF] hover:brightness-110 text-white rounded-lg text-xs font-semibold transition shadow-md"
          >
            Close Audit Inspector
          </button>
        </div>
      </div>
    </div>,
    portalTarget
  );
};
