"use client";

import React from "react";
import { ExtremeEvent } from "@/types";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  CloudRain
} from "lucide-react";

interface ExtremeWeatherPanelProps {
  events: ExtremeEvent[];
  locationName: string;
  probHeavyRain?: number; // P(Rain >= 15mm)
  probVeryHeavyRain?: number; // P(Rain >= 50mm)
}

export const ExtremeWeatherPanel: React.FC<ExtremeWeatherPanelProps> = ({
  events,
  locationName,
  probHeavyRain = 0.42,
  probVeryHeavyRain = 0.18
}) => {
  return (
    <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 space-y-4 shadow-md select-none">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
              EXTREME WEATHER INTELLIGENCE & EARLY WARNINGS
            </h4>
            <p className="text-[11px] text-[#9DAFC4]">
              Station: <strong className="text-white font-mono">{locationName.toUpperCase()}</strong> · Official IMD Standard Classification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold">
            MOSAIC MODEL GUIDANCE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/60 font-semibold">
            EARLY WARNING
          </span>
        </div>
      </div>

      {/* 31-Member GEFS Ensemble Probability Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-[#081426] rounded-lg border border-[#1E293B] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#9DAFC4] uppercase tracking-wider flex items-center space-x-1 font-semibold">
              <CloudRain className="w-3.5 h-3.5 text-[#00B8E6]" />
              <span>P(Rain &ge; 15.6mm / 24h)</span>
            </span>
            <span className="text-[11px] text-[#667B94]">Moderate/Heavy Threshold</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {Math.round(probHeavyRain * 100)}%
          </div>
        </div>

        <div className="p-3 bg-[#081426] rounded-lg border border-[#1E293B] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#9DAFC4] uppercase tracking-wider flex items-center space-x-1 font-semibold">
              <CloudRain className="w-3.5 h-3.5 text-purple-400" />
              <span>P(Rain &ge; 64.5mm / 24h)</span>
            </span>
            <span className="text-[11px] text-[#667B94]">IMD Heavy Rain Alert Threshold</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">
            {Math.round(probVeryHeavyRain * 100)}%
          </div>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="py-6 px-4 bg-emerald-950/20 rounded-lg border border-emerald-800/40 flex items-center space-x-3 text-emerald-400 text-xs">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
          <div>
            <span className="font-semibold block text-emerald-300">No Extreme Weather Alerts Active</span>
            <span className="text-emerald-400/80 text-[11px]">
              Precipitation and surface wind forecasts remain below official IMD warning thresholds for the next 48 hours.
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((ev, idx) => {
            const isRed = ev.severity.includes("RED") || ev.severity.includes("SEVERE");
            const isOrange = ev.severity.includes("ORANGE") || ev.severity.includes("WARNING");
            const colorClass = isRed
              ? "border-red-500/40 bg-red-950/40 text-red-200"
              : isOrange
              ? "border-amber-500/40 bg-amber-950/40 text-amber-200"
              : "border-yellow-500/40 bg-yellow-950/30 text-yellow-200";

            return (
              <div key={idx} className={`p-4 rounded-lg border ${colorClass} space-y-2 shadow-md`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{ev.title}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border border-current">
                    {ev.severity.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {ev.description}
                </p>
                <div className="flex justify-between items-center text-[10px] opacity-75 font-mono pt-1.5 border-t border-white/10">
                  <span>IMD Criterion: {ev.criterion}</span>
                  <span>Window: {ev.start_time ? String(ev.start_time).slice(0, 16) : "Immediate 24h"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official IMD Reference Scale Footer & Statutory Distinction */}
      <div className="pt-2 border-t border-[#1E293B] space-y-1.5 text-[10px] text-[#9DAFC4]">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span>IMD Rain Scale: Moderate (15.6–64.4mm) · Heavy (64.5–115.5mm) · Very Heavy (115.6–204.4mm) · Squall (&ge;15 m/s)</span>
          <span className="font-mono text-white font-medium">MoES Disaster Management Advisory</span>
        </div>
        <p className="text-[10px] text-[#667B94] italic">
          Disclaimer: MOSAIC provides automated multi-model synthesis for research & disaster planning. Official statutory weather warnings are exclusively promulgated by the India Meteorological Department (IMD/MoES).
        </p>
      </div>
    </div>
  );
};
