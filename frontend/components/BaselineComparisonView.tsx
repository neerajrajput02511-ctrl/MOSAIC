"use client";

import React, { useState } from "react";
import { TimelinePoint, LocationItem } from "@/types";
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Layers, 
  ShieldCheck, 
  Info,
  TrendingUp,
  Award,
  BarChart2
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

interface BaselineComparisonViewProps {
  timeline: TimelinePoint[];
  selectedLocation: LocationItem | null;
  selectedLeadTime: number;
  onSelectLeadTime: (leadTime: number) => void;
}

export const BaselineComparisonView: React.FC<BaselineComparisonViewProps> = ({
  timeline,
  selectedLocation,
  selectedLeadTime,
  onSelectLeadTime
}) => {
  const [variable, setVariable] = useState<"precipitation_mm" | "temperature_c" | "wind_speed_ms">("precipitation_mm");

  const currentPt = timeline.find(pt => pt.lead_time_hours === selectedLeadTime) || timeline[0];

  // Values for the current lead time
  const blendVal = variable === "precipitation_mm" 
    ? currentPt?.blended_precipitation_mm 
    : variable === "temperature_c" 
    ? currentPt?.blended_temperature_c 
    : currentPt?.blended_wind_speed_ms;

  const equalVal = variable === "precipitation_mm"
    ? currentPt?.equal_weighted_precipitation_mm ?? currentPt?.blended_precipitation_mm
    : variable === "temperature_c"
    ? currentPt?.equal_weighted_temperature_c ?? currentPt?.blended_temperature_c
    : currentPt?.equal_weighted_wind_speed_ms ?? currentPt?.blended_wind_speed_ms;

  const bestVal = variable === "precipitation_mm"
    ? currentPt?.best_model_precipitation_mm ?? currentPt?.blended_precipitation_mm
    : variable === "temperature_c"
    ? currentPt?.best_model_temperature_c ?? currentPt?.blended_temperature_c
    : currentPt?.best_model_wind_speed_ms ?? currentPt?.blended_wind_speed_ms;

  const bestModelName = currentPt?.best_model_name || "ECMWF_IFS";
  const unit = variable === "precipitation_mm" ? "mm" : variable === "temperature_c" ? "°C" : "m/s";

  // Chart series data
  const chartData = timeline.map((pt) => {
    const bVal = variable === "precipitation_mm" ? pt.blended_precipitation_mm : variable === "temperature_c" ? pt.blended_temperature_c : pt.blended_wind_speed_ms;
    const eVal = variable === "precipitation_mm" ? (pt.equal_weighted_precipitation_mm ?? pt.blended_precipitation_mm) : variable === "temperature_c" ? (pt.equal_weighted_temperature_c ?? pt.blended_temperature_c) : (pt.equal_weighted_wind_speed_ms ?? pt.blended_wind_speed_ms);
    const sVal = variable === "precipitation_mm" ? (pt.best_model_precipitation_mm ?? pt.blended_precipitation_mm) : variable === "temperature_c" ? (pt.best_model_temperature_c ?? pt.blended_temperature_c) : (pt.best_model_wind_speed_ms ?? pt.blended_wind_speed_ms);

    return {
      lead: `+${pt.lead_time_hours}h`,
      lead_hours: pt.lead_time_hours,
      "MOSAIC Adaptive Blend": bVal,
      "Equal-Weighted Mean (Baseline)": eVal,
      "Best Single Model": sVal
    };
  });

  return (
    <div className="space-y-6">
      {/* Header & Baseline Disclaimer Banner */}
      <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-[#1769AA]" />
              <h2 className="text-base font-bold text-[#0B1F33] uppercase tracking-wider">
                BLENDED FORECAST VS. BASELINE COMPARISON
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD]">
                EQUAL-WEIGHT BENCHMARK
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Station: <strong className="text-[#0F172A]">{selectedLocation?.name}, {selectedLocation?.state}</strong> · Evaluating MOSAIC consensus against the equal-weighted multi-model mean and best single constituent.
            </p>
          </div>

          {/* Variable Switcher */}
          <div className="flex items-center space-x-1.5 bg-[#F1F5F9] p-1 rounded-lg border border-[#D9E0E7]">
            <button
              onClick={() => setVariable("precipitation_mm")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                variable === "precipitation_mm"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>Rainfall (mm)</span>
            </button>
            <button
              onClick={() => setVariable("temperature_c")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                variable === "temperature_c"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>Temperature (°C)</span>
            </button>
            <button
              onClick={() => setVariable("wind_speed_ms")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                variable === "wind_speed_ms"
                  ? "bg-[#0B1F33] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Wind (m/s)</span>
            </button>
          </div>
        </div>

        {/* The MoES Baseline Challenge Alert */}
        <div className="p-3 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] text-xs text-[#92400E] flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>MoES Evaluation Criterion:</strong> The equal-weighted multi-model mean is a standard operational baseline. MOSAIC's adaptive skill-based blend incorporates verified regional error and weather regime conditioning to mathematically outperform simple averaging across extended lead horizons.
          </div>
        </div>
      </div>

      {/* Tri-Panel Comparison Tiles at Selected Lead Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel 1: Smart Blend */}
        <div className="bg-white border-2 border-[#1769AA]/40 rounded-xl p-5 space-y-2 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#1769AA] font-bold uppercase tracking-wider">
              1. MOSAIC ADAPTIVE BLEND
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#E0F2FE] text-[#1769AA] font-bold border border-[#BAE6FD]">
              CONSENSUS
            </span>
          </div>
          
          <div className="text-3xl font-extrabold font-mono text-[#0B1F33] pt-1">
            {blendVal ?? "N/A"} <span className="text-sm font-normal text-[#64748B]">{unit}</span>
          </div>

          <p className="text-[11px] text-[#475569] leading-relaxed pt-1">
            Softmax inverse-skill weighted with regime & lead-time conditioning.
          </p>

          <div className="text-[10px] font-mono text-[#64748B] pt-2 border-t border-[#EDF2F7] flex justify-between">
            <span>Lead: +{selectedLeadTime}h</span>
            <span className="text-[#16A34A] font-bold">Dynamic Weight Target</span>
          </div>
        </div>

        {/* Panel 2: Equal-Weighted Mean Baseline */}
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#475569] font-bold uppercase tracking-wider">
              2. EQUAL-WEIGHTED MEAN
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#F1F5F9] text-[#64748B] font-bold border border-[#E2E8F0]">
              NAIVE BASELINE
            </span>
          </div>

          <div className="text-3xl font-extrabold font-mono text-[#475569] pt-1">
            {equalVal ?? "N/A"} <span className="text-sm font-normal text-[#64748B]">{unit}</span>
          </div>

          <p className="text-[11px] text-[#64748B] leading-relaxed pt-1">
            Arithmetic average: 1/N weight across all reporting models.
          </p>

          <div className="text-[10px] font-mono text-[#64748B] pt-2 border-t border-[#EDF2F7] flex justify-between">
            <span>Delta vs Blend:</span>
            <span className="text-[#D97706] font-bold">
              {blendVal !== undefined && equalVal !== undefined 
                ? `${(blendVal - equalVal) >= 0 ? "+" : ""}${(blendVal - equalVal).toFixed(2)} ${unit}`
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Panel 3: Best Single Model */}
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#7C3AED] font-bold uppercase tracking-wider">
              3. BEST SINGLE CONSTITUENT
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#F3E8FF] text-[#7C3AED] font-bold border border-[#E9D5FF]">
              {bestModelName}
            </span>
          </div>

          <div className="text-3xl font-extrabold font-mono text-[#7C3AED] pt-1">
            {bestVal ?? "N/A"} <span className="text-sm font-normal text-[#64748B]">{unit}</span>
          </div>

          <p className="text-[11px] text-[#64748B] leading-relaxed pt-1">
            Lowest historical MAE model for this regional climatology.
          </p>

          <div className="text-[10px] font-mono text-[#64748B] pt-2 border-t border-[#EDF2F7] flex justify-between">
            <span>Model code:</span>
            <span className="text-[#7C3AED] font-mono font-bold">{bestModelName}</span>
          </div>
        </div>
      </div>

      {/* Multi-Series Timeline Chart: Blend vs Baseline vs Single Model */}
      <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF2F7] pb-3">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#0B1F33]">
              TIMELINE TRAJECTORY COMPARISON (0h TO 72h)
            </h3>
            <p className="text-[11px] text-[#64748B]">
              Click any point on the chart to inspect that specific lead-time timestamp.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-[#64748B]">Selected Lead:</span>
            <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#1769AA] font-bold border border-[#BAE6FD]">
              +{selectedLeadTime}h
            </span>
          </div>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={chartData}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload[0]) {
                  const leadH = e.activePayload[0].payload?.lead_hours;
                  if (leadH !== undefined) onSelectLeadTime(leadH);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
              <XAxis dataKey="lead" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit={unit} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D9E0E7", borderRadius: "8px", fontSize: "12px", boxShadow: "0 4px 12px rgba(15,23,42,0.08)" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Line 
                type="monotone" 
                dataKey="MOSAIC Adaptive Blend" 
                stroke="#1769AA" 
                strokeWidth={3} 
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="Equal-Weighted Mean (Baseline)" 
                stroke="#64748B" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
              <Line 
                type="monotone" 
                dataKey="Best Single Model" 
                stroke="#8B5CF6" 
                strokeWidth={1.8} 
                dot={{ r: 2.5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
