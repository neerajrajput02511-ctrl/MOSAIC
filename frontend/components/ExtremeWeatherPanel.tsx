"use client";

import React from "react";
import { ExtremeEvent } from "@/types";
import { 
  AlertTriangle, 
  AlertCircle, 
  ShieldAlert, 
  CheckCircle, 
  Info,
  CloudRain,
  Wind,
  Thermometer,
  Percent
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
    <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between border-b border-[#1e2c47] pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
              EXTREME WEATHER INTELLIGENCE & EARLY WARNINGS
            </h4>
            <p className="text-[11px] text-slate-400">
              Station: <strong className="text-slate-200">{locationName.toUpperCase()}</strong> · Official IMD Standard Classification
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
          SCREEN 5 · EARLY WARNING
        </span>
      </div>

      {/* 31-Member GEFS Ensemble Probability Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-[#111a2e] rounded-lg border border-[#1e2c47] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
              <span>P(Rain &ge; 15.6mm / 24h)</span>
            </span>
            <span className="text-[11px] text-slate-300">Moderate/Heavy Threshold</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-400">
            {Math.round(probHeavyRain * 100)}%
          </div>
        </div>

        <div className="p-3 bg-[#111a2e] rounded-lg border border-[#1e2c47] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <CloudRain className="w-3.5 h-3.5 text-purple-400" />
              <span>P(Rain &ge; 64.5mm / 24h)</span>
            </span>
            <span className="text-[11px] text-slate-300">IMD Heavy Rain Alert Threshold</span>
          </div>
          <div className="text-xl font-bold font-mono text-purple-400">
            {Math.round(probVeryHeavyRain * 100)}%
          </div>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="py-6 px-4 bg-[#111a2e]/60 rounded-lg border border-[#1e2c47] flex items-center space-x-3 text-emerald-400 text-xs">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold block text-slate-200">No Extreme Weather Alerts Active</span>
            <span className="text-slate-400 text-[11px]">
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
              ? "border-rose-500/50 bg-rose-950/20 text-rose-300"
              : isOrange
              ? "border-amber-500/50 bg-amber-950/20 text-amber-300"
              : "border-yellow-500/40 bg-yellow-950/20 text-yellow-300";

            return (
              <div key={idx} className={`p-4 rounded-lg border ${colorClass} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{ev.title}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border border-current">
                    {ev.severity.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ev.description}
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1.5 border-t border-white/10">
                  <span>IMD Criterion: {ev.criterion}</span>
                  <span>Window: {ev.start_time ? String(ev.start_time).slice(0, 16) : "Immediate 24h"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official IMD Reference Scale Footer */}
      <div className="pt-2 border-t border-[#1e2c47] text-[10px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
        <span>IMD Rain Scale: Moderate (15.6–64.4mm) · Heavy (64.5–115.5mm) · Very Heavy (115.6–204.4mm) · Squall (&ge;15 m/s)</span>
        <span className="font-mono text-slate-400">MoES Disaster Management Track</span>
      </div>
    </div>
  );
};
