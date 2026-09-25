"use client";

import React, { useState } from "react";
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Sliders, 
  HelpCircle, 
  ShieldCheck, 
  AlertTriangle, 
  Compass, 
  Layers, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Calendar 
} from "lucide-react";
import { LocationItem, BlendedForecastResponse, TimelinePoint, WhyThisForecastData } from "@/types";
import { WeatherMap } from "@/components/WeatherMap";
import { ForecastTimeline } from "@/components/ForecastTimeline";
import { InfoTooltip } from "@/components/InfoTooltip";
import { buildSingleForecastTruth, SingleForecastTruth } from "@/utils/forecastTruth";

interface ForecastHeroViewProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  forecastData: BlendedForecastResponse | null;
  selectedLeadTime: number;
  onSelectLeadTime: (lead: number) => void;
  onOpenExplainability: () => void;
  nerFilter: boolean;
  onToggleNerFilter: (val: boolean) => void;
}

export const ForecastHeroView: React.FC<ForecastHeroViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  forecastData,
  selectedLeadTime,
  onSelectLeadTime,
  onOpenExplainability,
  nerFilter,
  onToggleNerFilter
}) => {
  const [activeLayer, setActiveLayer] = useState<string>("rainfall");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  const currentPoint: TimelinePoint | null = forecastData?.timeline?.find(
    pt => pt.lead_time_hours === selectedLeadTime
  ) || (forecastData?.timeline ? forecastData.timeline[0] : null);

  const forecastTruth: SingleForecastTruth = buildSingleForecastTruth(
    currentPoint,
    selectedLeadTime,
    selectedLocation?.name || "Northeast India",
    null
  );

  const leadOptions = [24, 48, 72, 120];

  // Helper values based on active variable
  const getPrimaryValue = () => {
    if (activeLayer === "temperature") {
      const v = currentPoint?.blended_temperature_c ?? 26.5;
      return { val: `${v.toFixed(1)}°`, unit: "°C", label: "Temperature" };
    }
    if (activeLayer === "wind") {
      const v = currentPoint?.blended_wind_speed_ms ?? 3.2;
      return { val: `${v.toFixed(1)}`, unit: "m/s", label: "Wind Speed" };
    }
    if (activeLayer === "disagreement") {
      const v = currentPoint?.model_disagreement_spread ?? 0.8;
      return { val: `±${v.toFixed(1)}`, unit: "spread", label: "Model Disagreement" };
    }
    const v = currentPoint?.blended_precipitation_mm ?? 15.4;
    return { val: `${v.toFixed(1)}`, unit: "mm", label: "Rainfall" };
  };

  const primary = getPrimaryValue();

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* 1. COMPACT TOP CONTROL BAR (Region + Variable + Lead Time) mandated by Section 12 & 46 */}
      <div className="bg-[#0c1322] border border-[#1e2f4d] rounded-2xl p-3 shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left: Region & Station Quick Filter */}
        <div className="flex items-center space-x-2">
          {/* NER vs All India Switcher */}
          <div className="flex items-center bg-[#111a2e] rounded-xl p-0.5 border border-[#1e2f4d]">
            <button
              onClick={() => onToggleNerFilter(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !nerFilter ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All India
            </button>
            <button
              onClick={() => onToggleNerFilter(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                nerFilter ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Northeast (NER) ★
            </button>
          </div>

          {/* Station Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedLocation?.id || ""}
              onChange={(e) => {
                const loc = locations.find(l => l.id === Number(e.target.value));
                if (loc) onSelectLocation(loc);
              }}
              className="appearance-none bg-[#111a2e] border border-[#1e2f4d] hover:border-slate-500 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-medium cursor-pointer"
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#0c1322] text-slate-200">
                  {l.name}, {l.state} {l.is_ner ? "★" : ""}
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Center: Variable Switcher */}
        <div className="flex items-center bg-[#111a2e] rounded-xl p-0.5 border border-[#1e2f4d]">
          <button
            onClick={() => setActiveLayer("rainfall")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "rainfall" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rainfall</span>
          </button>

          <button
            onClick={() => setActiveLayer("temperature")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "temperature" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            <span>Temp</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "wind" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Wind</span>
          </button>

          <button
            onClick={() => setActiveLayer("disagreement")}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeLayer === "disagreement" ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
            title="Model Disagreement Spread"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Disagreement</span>
          </button>
        </div>

        {/* Right: Forecast Lead Horizon Switcher */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] font-mono text-slate-400 uppercase hidden sm:inline">Lead Horizon:</span>
          <div className="flex items-center bg-[#111a2e] rounded-xl p-0.5 border border-[#1e2f4d] text-xs font-mono">
            {leadOptions.map((lt) => (
              <button
                key={lt}
                onClick={() => onSelectLeadTime(lt)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  selectedLeadTime === lt
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                +{lt}h
              </button>
            ))}
          </div>
          <InfoTooltip term="forecast_lead" explanation="" />
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: HERO MAP (60-70%) + FORECAST INTELLIGENCE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* MAP CONTAINER (Hero ~65% desktop) */}
        <div className="lg:col-span-8 bg-[#0c1322] border border-[#1e2f4d] rounded-2xl p-3 flex flex-col shadow-xl relative overflow-hidden">
          <div className="h-[520px] lg:h-[580px] w-full rounded-xl overflow-hidden relative">
            <WeatherMap 
              locations={locations}
              selectedLocation={selectedLocation} 
              onSelectLocation={onSelectLocation} 
              activeLayer={activeLayer}
              currentPoint={currentPoint}
            />
          </div>

          {/* Map Footer Bar: Dynamic layer legend & common grid note */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono pt-3 px-1">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 uppercase">Scale:</span>
              {activeLayer === "rainfall" && (
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span><span>&lt;2.5mm</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span><span>2.5–15mm</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span><span>15–64mm</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>&gt;64.5mm (Heavy)</span></span>
                </div>
              )}
              {activeLayer === "temperature" && (
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span>&lt;20°C</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>20–28°C</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span><span>28–35°C</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>&gt;35°C (Heat)</span></span>
                </div>
              )}
              {activeLayer === "wind" && (
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span><span>Light (&lt;8 m/s)</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span><span>Gale (&gt;15 m/s)</span></span>
                </div>
              )}
              {activeLayer === "disagreement" && (
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>Low (Consensus)</span></span>
                  <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span>High (Divergence)</span></span>
                </div>
              )}
            </div>
            <div className="text-slate-500">
              0.25° Grid · Bilinear Regridded
            </div>
          </div>
        </div>

        {/* FORECAST & MODEL CONTRIBUTION CARD (~35% desktop) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Main Forecast Card */}
          <div className="bg-[#0c1322] border border-[#1e2f4d] rounded-2xl p-5 space-y-5 shadow-xl">
            {/* Station Header */}
            <div className="flex items-center justify-between border-b border-[#1e2f4d] pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                    {selectedLocation?.name || "Northeast India"}
                  </h2>
                  {selectedLocation?.is_ner && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      NER
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {selectedLocation?.state} · {selectedLocation?.latitude.toFixed(2)}°N, {selectedLocation?.longitude.toFixed(2)}°E · Elev {selectedLocation?.elevation_m || 100}m
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-500 uppercase block">Horizon</span>
                <span className="text-xs font-bold text-cyan-400">+{selectedLeadTime}h Lead</span>
              </div>
            </div>

            {/* Blended Forecast Primary Value Display */}
            <div className="p-4 rounded-xl bg-[#10192d] border border-[#1e2f4d] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>MOSAIC Blended {primary.label}</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  Consensus
                </span>
              </div>

              <div className="flex items-baseline space-x-2 pt-1">
                <span className="text-4xl font-extrabold font-mono text-slate-100 tracking-tight">
                  {primary.val}
                </span>
                <span className="text-sm font-bold text-slate-400 font-mono">
                  {primary.unit}
                </span>
              </div>
            </div>

            {/* Uncertainty, Certainty & Risk Probability */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              {/* Forecast Certainty */}
              <div className="p-3 rounded-xl bg-[#10192d] border border-[#1e2f4d] space-y-1">
                <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
                  <span>Certainty</span>
                  <InfoTooltip term="forecast_certainty" explanation="" />
                </div>
                <div className="text-sm font-bold text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{forecastTruth.confidence}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Spread: ±{forecastTruth.std_dev.toFixed(1)} mm
                </div>
              </div>

              {/* Exceedance Risk Probability */}
              <div className="p-3 rounded-xl bg-[#10192d] border border-[#1e2f4d] space-y-1">
                <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
                  <span>P(&gt;50mm Rain)</span>
                  <InfoTooltip term="probability" explanation="" />
                </div>
                <div className={`text-sm font-bold ${
                  (currentPoint?.gefs_prob_gt_50mm ?? 0) > 0.3 ? "text-amber-400" : "text-slate-200"
                }`}>
                  {Math.round((currentPoint?.gefs_prob_gt_50mm ?? 0.18) * 100)}%
                </div>
                <div className="text-[10px] text-slate-500">
                  GEFS 31-Mbr Risk
                </div>
              </div>
            </div>

            {/* Model Contribution Breakdown Bars mandated by Section 10 */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                  <span>Model Contribution</span>
                  <InfoTooltip term="adaptive_weight" explanation="" />
                </span>
                <span className="text-[11px] font-mono text-slate-400">Σ = 100%</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                {/* IFS */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-cyan-300 font-semibold">ECMWF IFS (Physics)</span>
                    <span className="font-bold text-cyan-300">
                      {(forecastTruth.models.ifs.normalized_weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                      style={{ width: `${forecastTruth.models.ifs.normalized_weight * 100}%` }}
                    />
                  </div>
                </div>

                {/* AIFS */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-purple-300 font-semibold">ECMWF AIFS (Deep Learning)</span>
                    <span className="font-bold text-purple-300">
                      {(forecastTruth.models.aifs.normalized_weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                      style={{ width: `${forecastTruth.models.aifs.normalized_weight * 100}%` }}
                    />
                  </div>
                </div>

                {/* GFS */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-blue-300 font-semibold">NOAA GFS (Physics)</span>
                    <span className="font-bold text-blue-300">
                      {(forecastTruth.models.gfs.normalized_weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                      style={{ width: `${forecastTruth.models.gfs.normalized_weight * 100}%` }}
                    />
                  </div>
                </div>

                {/* GEFS */}
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-300 text-[11px]">
                    <span className="text-emerald-300 font-semibold">NOAA GEFS (Ensemble)</span>
                    <span className="font-bold text-emerald-300">
                      {(forecastTruth.models.gefs.normalized_weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                      style={{ width: `${forecastTruth.models.gefs.normalized_weight * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* "Why This Forecast?" Prominent Button mandated by Section 14 & 15 */}
            <div className="pt-2">
              <button
                onClick={onOpenExplainability}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Why this forecast?</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-slate-500 text-center mt-1.5 font-mono">
                Decomposes active synoptic regime, model agreement, and historical skill
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. FORECAST TIMELINE CHART (72-Hour Horizon Scrubber) */}
      <div className="pt-2">
        <ForecastTimeline
          timeline={forecastData?.timeline || []}
          selectedLeadTime={selectedLeadTime}
          onSelectLeadTime={onSelectLeadTime}
        />
      </div>
    </div>
  );
};
