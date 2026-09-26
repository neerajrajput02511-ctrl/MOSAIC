"use client";

import React, { useState } from "react";
import { TimelinePoint } from "@/types";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Gauge, 
  Droplets,
  HelpCircle
} from "lucide-react";

interface ForecastTimelineProps {
  timeline: TimelinePoint[];
  selectedLeadTime: number;
  onSelectLeadTime: (leadTime: number) => void;
}

export const ForecastTimeline: React.FC<ForecastTimelineProps> = ({
  timeline,
  selectedLeadTime,
  onSelectLeadTime
}) => {
  const [activeVariable, setActiveVariable] = useState<"precip" | "temp" | "wind" | "hum">("precip");

  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 text-center text-xs text-[#52667A] shadow-xs">
        No forecast timeline points available for this location.
      </div>
    );
  }

  // Transform timeline points for Recharts visualization
  const chartData = timeline.map((pt) => {
    const rawTime = new Date(pt.forecast_time || Date.now());
    const timeLabel = `${rawTime.toLocaleDateString("en-US", { weekday: "short" })} ${rawTime.getHours().toString().padStart(2, "0")}:00`;
    
    const gfsModel = pt.contributing_models?.find(m => m.model_code.includes("GFS"));
    const ifsModel = pt.contributing_models?.find(m => m.model_code === "ECMWF_IFS" || (m.model_code.includes("IFS") && !m.model_code.includes("AIFS")));
    const aifsModel = pt.contributing_models?.find(m => m.model_code.includes("AIFS"));

    let blended = 0;
    let gfs = gfsModel?.prediction_precip ?? 0;
    let ifs = ifsModel?.prediction_precip ?? 0;
    let aifs = aifsModel?.prediction_precip ?? 0;
    let uncertLower = pt.uncertainty_lower_mm ?? 0;
    let uncertUpper = pt.uncertainty_upper_mm ?? 0;
    let spread = pt.model_disagreement_spread ?? 0;

    switch (activeVariable) {
      case "precip":
        blended = pt.blended_precipitation_mm;
        gfs = gfsModel?.prediction_precip ?? 0;
        ifs = ifsModel?.prediction_precip ?? 0;
        aifs = aifsModel?.prediction_precip ?? 0;
        uncertLower = pt.uncertainty_lower_mm ?? (blended - spread);
        uncertUpper = pt.uncertainty_upper_mm ?? (blended + spread);
        break;
      case "temp":
        blended = pt.blended_temperature_c;
        gfs = gfsModel?.prediction_temp ?? blended;
        ifs = ifsModel?.prediction_temp ?? blended;
        aifs = aifsModel?.prediction_temp ?? blended;
        uncertLower = blended - (spread * 0.8);
        uncertUpper = blended + (spread * 0.8);
        break;
      case "wind":
        blended = pt.blended_wind_speed_ms;
        gfs = gfsModel?.prediction_wind ?? blended;
        ifs = ifsModel?.prediction_wind ?? blended;
        aifs = aifsModel?.prediction_wind ?? blended;
        uncertLower = Math.max(0, blended - spread);
        uncertUpper = blended + spread;
        break;
      case "hum":
        blended = pt.blended_humidity_pct;
        gfs = blended;
        ifs = blended;
        aifs = blended;
        uncertLower = Math.max(0, blended - (spread * 2));
        uncertUpper = Math.min(100, blended + (spread * 2));
        break;
    }

    return {
      timeLabel,
      valid_time: pt.forecast_time,
      lead_time: pt.lead_time_hours,
      blended: Number(blended.toFixed(1)),
      gfs: Number(gfs.toFixed(1)),
      ifs: Number(ifs.toFixed(1)),
      aifs: Number(aifs.toFixed(1)),
      uncertLower: Number(uncertLower.toFixed(1)),
      uncertUpper: Number(uncertUpper.toFixed(1)),
      disagreement: Number(spread.toFixed(1)),
      regime: pt.weather_regime
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
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
      {/* Header & Variable Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-[#102A43] tracking-tight">
              MULTI-MODEL 72-HOUR TIMELINE & ADAPTIVE BLEND
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FF] text-[#1677FF] border border-[#BFD9FF]">
              PHYSICS + AI SYNTHESIS
            </span>
          </div>
          <p className="text-xs text-[#52667A] mt-0.5">
            Click any point along the timeline to inspect the exact weighting and historical skill decomposition.
          </p>
        </div>

        {/* Variable Switcher */}
        <div className="flex items-center space-x-1 bg-[#F4F7FA] border border-[#D9E2EC] rounded-lg p-1">
          <button
            onClick={() => setActiveVariable("precip")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs transition ${
              activeVariable === "precip" ? "bg-[#1677FF] text-white font-semibold shadow-xs" : "text-[#52667A] hover:text-[#102A43]"
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Rainfall</span>
          </button>
          <button
            onClick={() => setActiveVariable("temp")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs transition ${
              activeVariable === "temp" ? "bg-[#1677FF] text-white font-semibold shadow-xs" : "text-[#52667A] hover:text-[#102A43]"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp</span>
          </button>
          <button
            onClick={() => setActiveVariable("wind")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs transition ${
              activeVariable === "wind" ? "bg-[#1677FF] text-white font-semibold shadow-xs" : "text-[#52667A] hover:text-[#102A43]"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>
          <button
            onClick={() => setActiveVariable("hum")}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs transition ${
              activeVariable === "hum" ? "bg-[#1677FF] text-white font-semibold shadow-xs" : "text-[#52667A] hover:text-[#102A43]"
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
            <CartesianGrid strokeDasharray="3 3" stroke="#D9E2EC" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#52667A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#D9E2EC" }}
            />
            <YAxis
              stroke="#52667A"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#D9E2EC" }}
              unit={` ${getUnit()}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white border border-[#D9E2EC] rounded-xl p-3.5 text-xs shadow-lg space-y-2 text-[#102A43]">
                    <div className="flex justify-between items-center border-b border-[#D9E2EC] pb-1.5 font-mono">
                      <span className="text-[#1677FF] font-bold">{label} (+{d.lead_time}h)</span>
                      <span className="text-[#52667A] font-medium">{d.regime}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[#102A43] font-semibold">
                        <span>MOSAIC Blended:</span>
                        <span className="text-[#1677FF] font-bold">{d.blended} {getUnit()}</span>
                      </div>
                      <div className="flex justify-between text-[#52667A] text-[11px]">
                        <span>Uncertainty Range:</span>
                        <span>{d.uncertLower} - {d.uncertUpper} {getUnit()}</span>
                      </div>
                      <div className="flex justify-between text-[#52667A] text-[11px]">
                        <span>Model Spread (&sigma;):</span>
                        <span>&plusmn;{d.disagreement} {getUnit()}</span>
                      </div>
                      <div className="pt-1.5 border-t border-[#D9E2EC] space-y-0.5 text-[10px] text-[#52667A] font-mono">
                        <div>GFS: {d.gfs ?? "N/A"} {getUnit()}</div>
                        <div>ECMWF IFS: {d.ifs ?? "N/A"} {getUnit()}</div>
                        <div>ECMWF AIFS (AI): {d.aifs ?? "N/A"} {getUnit()}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#1677FF] font-semibold underline cursor-pointer pt-1">
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
              fill="#1677FF"
              fillOpacity={0.10}
              name="Uncertainty Range [Lower - Upper]"
            />
            
            {/* Individual NWP & AI traces */}
            <Line
              type="monotone"
              dataKey="gfs"
              stroke="#D97706"
              strokeDasharray="4 4"
              dot={false}
              strokeWidth={1.5}
              name="NOAA GFS (0.25° NWP)"
            />
            <Line
              type="monotone"
              dataKey="ifs"
              stroke="#0284C7"
              strokeDasharray="3 3"
              dot={false}
              strokeWidth={1.5}
              name="ECMWF IFS (0.25° NWP)"
            />
            <Line
              type="monotone"
              dataKey="aifs"
              stroke="#356AE6"
              strokeDasharray="2 2"
              dot={false}
              strokeWidth={1.5}
              name="ECMWF AIFS (AI Model)"
            />

            {/* Synthesized Final Blended Forecast Line */}
            <Line
              type="monotone"
              dataKey="blended"
              stroke="#1677FF"
              dot={{ r: 2.5, fill: "#1677FF" }}
              activeDot={{ r: 5, fill: "#0958D9" }}
              strokeWidth={3}
              name="FINAL BLENDED FORECAST"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Scrubber & Selected Step Indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-[#D9E2EC] text-xs font-mono text-[#52667A]">
        <div className="flex items-center space-x-2">
          <span className="text-[#52667A] font-sans">Active Horizon:</span>
          <span className="text-[#102A43] font-bold">+{selectedLeadTime} Hours</span>
        </div>
        <button
          onClick={() => onSelectLeadTime(selectedLeadTime)}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EAF3FF] hover:bg-[#D9E8FF] text-[#1677FF] border border-[#BFD9FF] rounded-lg transition font-sans font-semibold text-xs"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Explain +{selectedLeadTime}h Forecast</span>
        </button>
      </div>
    </div>
  );
};
