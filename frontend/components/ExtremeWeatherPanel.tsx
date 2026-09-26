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
    <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-[#D97706]" />
          <div>
            <h4 className="font-bold text-xs text-[#0B1F33] uppercase tracking-wider">
              EXTREME WEATHER INTELLIGENCE & EARLY WARNINGS
            </h4>
            <p className="text-[11px] text-[#64748B]">
              Station: <strong className="text-[#0F172A]">{locationName.toUpperCase()}</strong> · Official IMD Standard Classification
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD] font-semibold">
            MOSAIC MODEL GUIDANCE
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] font-semibold">
            EARLY WARNING
          </span>
        </div>
      </div>

      {/* 31-Member GEFS Ensemble Probability Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#D9E0E7] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider flex items-center space-x-1 font-semibold">
              <CloudRain className="w-3.5 h-3.5 text-[#1769AA]" />
              <span>P(Rain &ge; 15.6mm / 24h)</span>
            </span>
            <span className="text-[11px] text-[#475569]">Moderate/Heavy Threshold</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#0B1F33]">
            {Math.round(probHeavyRain * 100)}%
          </div>
        </div>

        <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#D9E0E7] flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider flex items-center space-x-1 font-semibold">
              <CloudRain className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>P(Rain &ge; 64.5mm / 24h)</span>
            </span>
            <span className="text-[11px] text-[#475569]">IMD Heavy Rain Alert Threshold</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#7C3AED]">
            {Math.round(probVeryHeavyRain * 100)}%
          </div>
        </div>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <div className="py-6 px-4 bg-[#F0FDF4] rounded-lg border border-[#BBF7D0] flex items-center space-x-3 text-[#16A34A] text-xs">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <span className="font-semibold block text-[#166534]">No Extreme Weather Alerts Active</span>
            <span className="text-[#15803D] text-[11px]">
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
              ? "border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]"
              : isOrange
              ? "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"
              : "border-[#FEF08A] bg-[#FEFCE8] text-[#854D0E]";

            return (
              <div key={idx} className={`p-4 rounded-lg border ${colorClass} space-y-2 shadow-xs`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{ev.title}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border border-current">
                    {ev.severity.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {ev.description}
                </p>
                <div className="flex justify-between items-center text-[10px] opacity-75 font-mono pt-1.5 border-t border-black/10">
                  <span>IMD Criterion: {ev.criterion}</span>
                  <span>Window: {ev.start_time ? String(ev.start_time).slice(0, 16) : "Immediate 24h"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Official IMD Reference Scale Footer */}
      <div className="pt-2 border-t border-[#EDF2F7] text-[10px] text-[#64748B] flex flex-wrap justify-between items-center gap-2">
        <span>IMD Rain Scale: Moderate (15.6–64.4mm) · Heavy (64.5–115.5mm) · Very Heavy (115.6–204.4mm) · Squall (&ge;15 m/s)</span>
        <span className="font-mono text-[#0F172A] font-medium">MoES Disaster Management Guidance Track</span>
      </div>
    </div>
  );
};
