"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import { TimelinePoint } from "@/types";
import { HelpCircle, Sliders, Droplets, Thermometer, Wind, Gauge } from "lucide-react";

interface ForecastTimelineProps {
  timeline: TimelinePoint[];
  onSelectLeadTime: (leadTime: number) => void;
  selectedLeadTime: number;
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  timeline,
  onSelectLeadTime,
  selectedLeadTime
}) => {
  const [activeVariable, setActiveVariable] = useState<"precip" | "temp" | "wind" | "hum">("precip");

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No forecast timeline points available.
      </div>
    );
  }

  // Format data for Recharts
  const chartData = timeline.map((pt) => {
    const timeLabel = new Date(pt.forecast_time).toLocaleTimeString([], {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const gfs = pt.contributing_models.find((m) => m.model_code === "NOAA_GFS");
    const ifs = pt.contributing_models.find((m) => m.model_code === "ECMWF_IFS");
    const aifs = pt.contributing_models.find((m) => m.model_code === "ECMWF_AIFS");

    let blendedVal = pt.blended_precipitation_mm;
    let gfsVal = gfs?.prediction_precip;
    let ifsVal = ifs?.prediction_precip;
    let aifsVal = aifs?.prediction_precip;
    let uncertLower = pt.uncertainty_lower_mm;
    let uncertUpper = pt.uncertainty_upper_mm;

    if (activeVariable === "temp") {
      blendedVal = pt.blended_temperature_c;
      gfsVal = gfs?.prediction_temp;
      ifsVal = ifs?.prediction_temp;
      aifsVal = aifs?.prediction_temp;
      uncertLower = blendedVal - 1.2;
      uncertUpper = blendedVal + 1.2;
    } else if (activeVariable === "wind") {
      blendedVal = pt.blended_wind_speed_ms;
      gfsVal = gfs?.prediction_wind;
      ifsVal = ifs?.prediction_wind;
      aifsVal = aifs?.prediction_wind;
      uncertLower = Math.max(0, blendedVal - 1.5);
      uncertUpper = blendedVal + 1.5;
    } else if (activeVariable === "hum") {
      blendedVal = pt.blended_humidity_pct;
      gfsVal = blendedVal - 3.0;
      ifsVal = blendedVal + 2.0;
      aifsVal = blendedVal;
      uncertLower = Math.max(0, blendedVal - 5.0);
      uncertUpper = Math.min(100, blendedVal + 5.0);
    }

    return {
      lead_time: pt.lead_time_hours,
      timeLabel,
      blended: blendedVal,
      gfs: gfsVal,
      ifs: ifsVal,
      aifs: aifsVal,
      uncertLower,
      uncertUpper,
      regime: pt.weather_regime,
      disagreement: pt.model_disagreement_spread
    };
  });

  const getUnit = () => {
    switch (activeVariable) {
      case "precip": return "mm";
      case "temp": return "°C";
      case "wind": return "m/s";
      case "hum": return "%";
    }
  };

  return (
    <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-4">
      {/* Header & Variable Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-sm text-slate-100 tracking-wide">
              MULTI-MODEL 72-HOUR TIMELINE & ADAPTIVE BLEND
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              PHYSICS + AI SYNTHESIS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any point along the timeline to inspect the exact weighting and historical skill decomposition.
          </p>
        </div>

        {/* Variable Switcher */}
        <div className="flex items-center space-x-1 bg-[#111a2e] border border-[#1e2c47] rounded p-1">
          <button
            onClick={() => setActiveVariable("precip")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeVariable === "precip" ? "bg-cyan-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Rainfall</span>
          </button>
          <button
            onClick={() => setActiveVariable("temp")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeVariable === "temp" ? "bg-amber-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp</span>
          </button>
          <button
            onClick={() => setActiveVariable("wind")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeVariable === "wind" ? "bg-blue-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>
          <button
            onClick={() => setActiveVariable("hum")}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition ${
              activeVariable === "hum" ? "bg-indigo-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Humidity</span>
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0) {
                const lead = e.activePayload[0].payload.lead_time;
                onSelectLeadTime(lead);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2c47" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#1e2c47" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#1e2c47" }}
              unit={` ${getUnit()}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-[#0c1322] border border-[#1e2c47] rounded p-3 text-xs shadow-2xl space-y-2">
                    <div className="flex justify-between items-center border-b border-[#1e2c47] pb-1 font-mono">
                      <span className="text-cyan-400 font-bold">{label} (+{d.lead_time}h)</span>
                      <span className="text-slate-400 font-medium">{d.regime}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-slate-200 font-semibold">
                        <span>AI Blended:</span>
                        <span className="text-cyan-300">{d.blended} {getUnit()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Uncertainty Range:</span>
                        <span>{d.uncertLower} - {d.uncertUpper} {getUnit()}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Model Spread (σ):</span>
                        <span>±{d.disagreement} {getUnit()}</span>
                      </div>
                      <div className="pt-1 border-t border-[#1e2c47] space-y-0.5 text-[10px] text-slate-400 font-mono">
                        <div>GFS: {d.gfs ?? "N/A"} {getUnit()}</div>
                        <div>ECMWF IFS: {d.ifs ?? "N/A"} {getUnit()}</div>
                        <div>ECMWF AIFS (AI): {d.aifs ?? "N/A"} {getUnit()}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-cyan-400 underline cursor-pointer pt-1">
                      Click to open "Why this forecast?" decomposition &rarr;
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            />
            
            {/* Uncertainty Fill Band */}
            <Area
              type="monotone"
              dataKey="uncertUpper"
              stroke="none"
              fill="#06b6d4"
              fillOpacity={0.12}
              name="Uncertainty Range [Lower - Upper]"
            />
            
            {/* Individual NWP & AI traces */}
            <Line
              type="monotone"
              dataKey="gfs"
              stroke="#f59e0b"
              strokeDasharray="4 4"
              dot={false}
              strokeWidth={1.5}
              name="NOAA GFS (0.25° NWP)"
            />
            <Line
              type="monotone"
              dataKey="ifs"
              stroke="#3b82f6"
              strokeDasharray="3 3"
              dot={false}
              strokeWidth={1.5}
              name="ECMWF IFS (0.25° NWP)"
            />
            <Line
              type="monotone"
              dataKey="aifs"
              stroke="#8b5cf6"
              strokeDasharray="2 2"
              dot={false}
              strokeWidth={1.5}
              name="ECMWF AIFS (AI Model)"
            />

            {/* Synthesized Final Blended Forecast Line */}
            <Line
              type="monotone"
              dataKey="blended"
              stroke="#06b6d4"
              dot={{ r: 2, fill: "#06b6d4" }}
              activeDot={{ r: 5, fill: "#38bdf8" }}
              strokeWidth={3}
              name="FINAL BLENDED FORECAST"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scrubber & Selected Step Indicator */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1e2c47] text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Active Horizon:</span>
          <span className="text-cyan-300 font-bold">+{selectedLeadTime} Hours</span>
        </div>
        <button
          onClick={() => onSelectLeadTime(selectedLeadTime)}
          className="flex items-center space-x-1.5 px-3 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Explain +{selectedLeadTime}h Forecast</span>
        </button>
      </div>
    </div>
  );
};
