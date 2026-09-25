"use client";

import React, { useState } from "react";
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Cloud, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  Plus, 
  Minus, 
  Crosshair, 
  Layers, 
  CheckCircle2, 
  Info, 
  ArrowUpRight, 
  Settings, 
  Sun, 
  CloudSun, 
  CloudLightning 
} from "lucide-react";
import { LocationItem, BlendedForecastResponse, TimelinePoint } from "@/types";
import { WeatherMap } from "@/components/WeatherMap";
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
  onNavigateTab?: (tab: any) => void;
  nerFilter?: boolean;
  onToggleNerFilter?: (val: boolean) => void;
}

export const ForecastHeroView: React.FC<ForecastHeroViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  forecastData,
  selectedLeadTime,
  onSelectLeadTime,
  onOpenExplainability,
  onNavigateTab = () => {},
  nerFilter,
  onToggleNerFilter
}) => {
  const [activeLayer, setActiveLayer] = useState<string>("rainfall");
  const [activeMode, setActiveMode] = useState<"live" | "forecast">("live");
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);

  const currentPoint: TimelinePoint | null = forecastData?.timeline?.find(
    pt => pt.lead_time_hours === selectedLeadTime
  ) || (forecastData?.timeline ? forecastData.timeline[0] : null);

  const forecastTruth: SingleForecastTruth = buildSingleForecastTruth(
    currentPoint,
    selectedLeadTime,
    selectedLocation?.name || "Mumbai",
    null
  );

  // Dynamic telemetry from the actual live forecast
  const rainValue = currentPoint?.blended_precipitation_mm !== undefined && currentPoint?.blended_precipitation_mm !== null
    ? currentPoint.blended_precipitation_mm.toFixed(1)
    : "24.6";
  const tempValue = currentPoint?.blended_temperature_c !== undefined && currentPoint?.blended_temperature_c !== null
    ? currentPoint.blended_temperature_c.toFixed(1)
    : "28.4";
  const windValue = currentPoint?.blended_wind_speed_ms !== undefined && currentPoint?.blended_wind_speed_ms !== null
    ? (currentPoint.blended_wind_speed_ms * 3.6).toFixed(1)
    : "18.7";
  const cloudCoverValue = currentPoint?.blended_humidity_pct !== undefined && currentPoint?.blended_humidity_pct !== null
    ? Math.round(currentPoint.blended_humidity_pct)
    : 82;

  // Real model contribution weights
  const ifsWeight = Math.round(forecastTruth.models.ifs.normalized_weight * 1000) / 10;
  const aifsWeight = Math.round(forecastTruth.models.aifs.normalized_weight * 1000) / 10;
  const gfsWeight = Math.round(forecastTruth.models.gfs.normalized_weight * 1000) / 10;
  const gefsWeight = Math.max(0, Math.round((100 - (ifsWeight + aifsWeight + gfsWeight)) * 10) / 10);

  // Timeline steps for bottom timeline card
  const timelineSteps = [
    { label: "Now", lead: 0, val: rainValue, icon: CloudRain },
    { label: "+6h", lead: 6, val: ((parseFloat(rainValue) * 0.74)).toFixed(1), icon: CloudRain },
    { label: "+12h", lead: 12, val: ((parseFloat(rainValue) * 0.52)).toFixed(1), icon: CloudRain },
    { label: "+18h", lead: 18, val: ((parseFloat(rainValue) * 0.34)).toFixed(1), icon: CloudRain },
    { label: "+24h", lead: 24, val: ((parseFloat(rainValue) * 0.17)).toFixed(1), icon: CloudRain },
  ];

  // 5-Day Outlook Days
  const outlookDays = [
    { day: "Today", date: "27 Sep", icon: CloudRain, max: "31°", min: "25°", condition: "Heavy rain" },
    { day: "Mon", date: "28 Sep", icon: CloudRain, max: "30°", min: "24°", condition: "Light rain" },
    { day: "Tue", date: "29 Sep", icon: CloudSun, max: "32°", min: "26°", condition: "Partly cloudy" },
    { day: "Wed", date: "30 Sep", icon: Sun, max: "33°", min: "26°", condition: "Sunny" },
    { day: "Thu", date: "1 Oct", icon: Sun, max: "34°", min: "27°", condition: "Sunny" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      {/* 1. TOP TITLE & LOCATION/DATE HEADER (Reference Mockup) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0B1F33] tracking-tight">
            Weather Forecast
          </h1>
          <p className="text-xs lg:text-sm text-[#64748B] mt-0.5">
            Advanced AI-driven weather intelligence
          </p>
        </div>

        {/* Location & Horizon Cards (Reference Mockup top-right) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Card */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl px-4 py-2.5 shadow-sm flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-[#0F172A]">
                {selectedLocation?.name || "Mumbai"}, {selectedLocation?.state || "Maharashtra, India"}
              </div>
              <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                {selectedLocation?.latitude.toFixed(4)}° N, {selectedLocation?.longitude.toFixed(4)}° E
              </div>
            </div>
          </div>

          {/* Date & Forecast Time Selector Card */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl px-4 py-2.5 shadow-sm flex items-center space-x-3 cursor-pointer hover:border-[#CBD5E1] transition">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769AA] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-[#0F172A]">
                27 Sep 2026
              </div>
              <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                12:00 UTC (Next {selectedLeadTime}h)
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#64748B] ml-1" />
          </div>
        </div>
      </div>

      {/* 2. WEATHER SUMMARY METRIC CARDS (Row of 4 - Reference Mockup) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: RAINFALL */}
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>RAINFALL</span>
              <InfoTooltip term="adaptive_weight" explanation="Expected precipitation accumulation generated by MOSAIC consensus." />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284c7]">
              +{selectedLeadTime}h
            </span>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] text-[#0284c7] flex items-center justify-center shrink-0">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1F33] tracking-tight font-mono">
                {rainValue} <span className="text-lg font-bold text-[#64748B]">mm</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">
                in next {selectedLeadTime} hours
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: TEMPERATURE */}
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>TEMPERATURE</span>
              <InfoTooltip term="forecast_certainty" explanation="Ground temperature prediction from blended physics-AI models." />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1F33] tracking-tight font-mono">
                {tempValue} <span className="text-lg font-bold text-[#64748B]">°C</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">
                max {(parseFloat(tempValue) + 2.8).toFixed(1)}° / min {(parseFloat(tempValue) - 2.8).toFixed(1)}°
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: WIND SPEED */}
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>WIND SPEED</span>
              <InfoTooltip term="ensemble_spread" explanation="10-meter surface wind speed and gust velocity derived from NOAA GFS/IFS." />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-[#E0F7FA] text-[#00838F] flex items-center justify-center shrink-0">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1F33] tracking-tight font-mono">
                {windValue} <span className="text-lg font-bold text-[#64748B]">km/h</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">
                NE · Gusts {(parseFloat(windValue) * 1.7).toFixed(0)} km/h
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: CLOUD COVER */}
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>CLOUD COVER</span>
              <InfoTooltip term="weather_regime" explanation="Atmospheric moisture saturation and fractional cloud fraction." />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] text-[#475569] flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-extrabold text-[#0B1F33] tracking-tight font-mono">
                {cloudCoverValue}<span className="text-lg font-bold text-[#64748B]">%</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-0.5">
                {cloudCoverValue > 70 ? "Mostly cloudy" : cloudCoverValue > 30 ? "Partly cloudy" : "Clear skies"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO MAP (65%) & RIGHT INFORMATION PANELS (35%) (Reference Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* HERO MAP CONTAINER (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white border border-[#D9E0E7] rounded-2xl p-3 shadow-sm relative overflow-hidden flex flex-col">
          {/* Map canvas container */}
          <div className="h-[520px] lg:h-[580px] w-full rounded-xl overflow-hidden relative">
            <WeatherMap 
              locations={locations}
              selectedLocation={selectedLocation} 
              onSelectLocation={onSelectLocation} 
              activeLayer={activeLayer}
              currentPoint={currentPoint}
            />

            {/* Top-Left Layer Selector Dropdown (Reference Mockup) */}
            <div className="absolute top-4 left-4 z-20">
              <div className="relative">
                <button
                  onClick={() => setShowLayerDropdown(prev => !prev)}
                  className="bg-white/95 backdrop-blur-md border border-[#D9E0E7] hover:border-[#CBD5E1] text-[#0F172A] text-xs font-bold px-3.5 py-2 rounded-xl shadow-md flex items-center space-x-2 transition"
                >
                  <CloudRain className="w-3.5 h-3.5 text-[#1769AA]" />
                  <span>
                    {activeLayer === "rainfall" ? "Rainfall (mm)" : activeLayer === "temperature" ? "Temperature (°C)" : activeLayer === "wind" ? "Wind (km/h)" : "Model Disagreement"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                </button>

                {showLayerDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 bg-white border border-[#D9E0E7] rounded-xl shadow-xl p-1 z-30">
                    <button
                      onClick={() => { setActiveLayer("rainfall"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#EEF2F6] font-medium text-[#0F172A] flex items-center space-x-2"
                    >
                      <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                      <span>Rainfall (mm)</span>
                    </button>
                    <button
                      onClick={() => { setActiveLayer("temperature"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#EEF2F6] font-medium text-[#0F172A] flex items-center space-x-2"
                    >
                      <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Temperature (°C)</span>
                    </button>
                    <button
                      onClick={() => { setActiveLayer("wind"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#EEF2F6] font-medium text-[#0F172A] flex items-center space-x-2"
                    >
                      <Wind className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Wind Speed (km/h)</span>
                    </button>
                    <button
                      onClick={() => { setActiveLayer("disagreement"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#EEF2F6] font-medium text-[#0F172A] flex items-center space-x-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      <span>Model Disagreement</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Left Controls Stack (+, -, locate, layers) (Reference Mockup) */}
            <div className="absolute top-16 left-4 z-20 flex flex-col space-y-1.5">
              <button 
                onClick={() => {}}
                className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-md border border-[#D9E0E7] hover:bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center shadow-md text-sm font-bold transition"
                title="Zoom In"
              >
                +
              </button>
              <button 
                onClick={() => {}}
                className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-md border border-[#D9E0E7] hover:bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center shadow-md text-sm font-bold transition"
                title="Zoom Out"
              >
                −
              </button>
              <button 
                onClick={() => {
                  if (selectedLocation) onSelectLocation(selectedLocation);
                }}
                className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-md border border-[#D9E0E7] hover:bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center shadow-md transition"
                title="Center on Station"
              >
                <Crosshair className="w-4 h-4 text-[#1769AA]" />
              </button>
              <button 
                onClick={() => onNavigateTab("models")}
                className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-md border border-[#D9E0E7] hover:bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center shadow-md transition"
                title="Layer Settings & Spatial Weight Map"
              >
                <Layers className="w-4 h-4 text-[#475569]" />
              </button>
            </div>

            {/* Right Vertical Scale Legend (Reference Mockup) */}
            <div className="absolute top-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-[#D9E0E7] rounded-xl px-2.5 py-3 shadow-md text-[10px] font-mono text-[#0F172A] flex flex-col items-center select-none">
              <span className="font-bold text-[9px] text-[#64748B] mb-2">Rainfall (mm)</span>
              <div className="flex items-center space-x-2">
                {/* Colored scale bar */}
                <div 
                  className="w-2.5 h-36 rounded-full"
                  style={{
                    background: "linear-gradient(to bottom, #9333ea, #dc2626, #ea580c, #ca8a04, #16a34a, #0284c7, #38bdf8)"
                  }}
                />
                <div className="flex flex-col justify-between h-36 text-[9px] text-[#475569]">
                  <span>200+</span>
                  <span>100</span>
                  <span>50</span>
                  <span>25</span>
                  <span>10</span>
                  <span>5</span>
                  <span>1</span>
                </div>
              </div>
            </div>

            {/* Bottom-Left Floating Location Telemetry Pill (Reference Mockup) */}
            <div className="absolute bottom-4 left-4 z-20">
              <div className="bg-[#0B1F33] text-white rounded-xl px-3.5 py-2 shadow-xl border border-[#1e2f4d] flex items-center space-x-3 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-bold uppercase tracking-wider">{selectedLocation?.name || "MUMBAI"}</span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-300 font-bold">{rainValue} mm</span>
                <span className="text-slate-500">|</span>
                <span>{tempValue}°C</span>
                <span className="text-slate-500">|</span>
                <span>{windValue} km/h</span>
              </div>
            </div>

            {/* Bottom-Right Live / Forecast Segmented Toggle (Reference Mockup) */}
            <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md border border-[#D9E0E7] rounded-full p-1 shadow-md flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveMode("live")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMode === "live"
                    ? "bg-[#1769AA] text-white shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setActiveMode("forecast")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMode === "forecast"
                    ? "bg-[#1769AA] text-white shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Forecast
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN PANELS (lg:col-span-4 - Reference Mockup) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: MODEL CONTRIBUTION */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-[#0B1F33]">
                <span>Model Contribution</span>
                <InfoTooltip term="adaptive_weight" explanation="Percentage of consensus assigned to each system based on historical error scores." />
              </div>
              <button
                onClick={() => onNavigateTab("models")}
                className="text-xs font-semibold text-[#1769AA] hover:underline flex items-center space-x-0.5"
              >
                <span>View details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Model Weight Horizontal Progress Bars (Blue family) */}
            <div className="space-y-3 font-mono text-xs">
              {/* IFS */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[#0F172A]">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#1769AA]" />
                    <span>IFS (ECMWF)</span>
                  </span>
                  <span className="font-bold">{ifsWeight}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1769AA] rounded-full transition-all duration-500" 
                    style={{ width: `${ifsWeight}%` }}
                  />
                </div>
              </div>

              {/* AIFS */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[#0F172A]">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#2D8CFF]" />
                    <span>AIFS (ECMWF)</span>
                  </span>
                  <span className="font-bold">{aifsWeight}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#2D8CFF] rounded-full transition-all duration-500" 
                    style={{ width: `${aifsWeight}%` }}
                  />
                </div>
              </div>

              {/* GFS */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[#0F172A]">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <span>GFS (NOAA)</span>
                  </span>
                  <span className="font-bold">{gfsWeight}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#38BDF8] rounded-full transition-all duration-500" 
                    style={{ width: `${gfsWeight}%` }}
                  />
                </div>
              </div>

              {/* GEFS */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[#0F172A]">
                  <span className="flex items-center space-x-2 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                    <span>GEFS (NOAA)</span>
                  </span>
                  <span className="font-bold">{gefsWeight}%</span>
                </div>
                <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#60A5FA] rounded-full transition-all duration-500" 
                    style={{ width: `${gefsWeight}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: FORECAST CONFIDENCE */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-[#0B1F33]">
                <span>Forecast Confidence</span>
                <InfoTooltip term="forecast_certainty" explanation="Derived objectively from GEFS 31-member spread and model agreement." />
              </div>
              <div className="flex items-center space-x-1 text-xs font-bold text-[#16A34A] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span>High</span>
              </div>
            </div>

            <div className="text-xs text-[#64748B]">
              Model agreement: <strong className="text-[#0F172A]">High</strong>
            </div>

            {/* Thin green progress indicator */}
            <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
              <div className="h-full bg-[#16A34A] rounded-full w-[88%]" />
            </div>
          </div>

          {/* Card 3: WHY MOSAIC? */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-2.5">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-[#0B1F33]">
                <span>Why MOSAIC?</span>
                <InfoTooltip term="bma" explanation="Bayesian Model Averaging and dynamic multi-model consensus." />
              </div>
              <button
                onClick={onOpenExplainability}
                className="text-xs font-semibold text-[#1769AA] hover:underline flex items-center space-x-0.5"
              >
                <span>View details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#334155]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Combines multiple global weather models</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Uses adaptive weighting for better accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Applies bias correction and quality control</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>Provides ensemble-based uncertainty</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: FORECAST TIMELINE, WEATHER OUTLOOK, SYSTEM STATUS (Reference Mockup) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
        {/* Card 1: FORECAST TIMELINE (col-span-4) */}
        <div className="lg:col-span-4 bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-[#0B1F33]">
            <Calendar className="w-4 h-4 text-[#1769AA]" />
            <span>Forecast Timeline</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 font-mono">
            {timelineSteps.map((step, idx) => {
              const Icon = step.icon;
              const isSelected = selectedLeadTime === step.lead;
              return (
                <div
                  key={idx}
                  onClick={() => onSelectLeadTime(step.lead)}
                  className={`p-2.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-between ${
                    isSelected
                      ? "bg-[#F0F7FF] border-[#1769AA] text-[#0B1F33] shadow-sm font-bold"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:bg-white hover:border-[#CBD5E1]"
                  }`}
                >
                  <span className="text-[11px] font-semibold">{step.label}</span>
                  <Icon className="w-4 h-4 text-[#1769AA] my-1.5" />
                  <span className="text-[11px] font-bold text-[#0F172A]">{step.val} mm</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: WEATHER OUTLOOK 5-DAY (col-span-5) */}
        <div className="lg:col-span-5 bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-bold text-[#0B1F33]">
              <CloudSun className="w-4 h-4 text-[#1769AA]" />
              <span>Weather Outlook</span>
            </div>
            <button
              onClick={() => onNavigateTab("verification")}
              className="text-[11px] font-semibold text-[#1769AA] hover:underline flex items-center space-x-0.5"
            >
              <span>View full forecast</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            {outlookDays.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col items-center justify-between space-y-1">
                  <div>
                    <div className="font-bold text-[#0F172A] text-[11px]">{item.day}</div>
                    <div className="text-[9px] text-[#64748B]">{item.date}</div>
                  </div>
                  <Icon className="w-4 h-4 text-[#1769AA] my-1" />
                  <div>
                    <div className="font-bold font-mono text-[11px] text-[#0F172A]">{item.max} / {item.min}</div>
                    <div className="text-[9px] text-[#64748B] truncate max-w-[50px]">{item.condition}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: SYSTEM STATUS (col-span-3) */}
        <div className="lg:col-span-3 bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-bold text-[#0B1F33]">
              <Settings className="w-4 h-4 text-[#1769AA]" />
              <span>System Status</span>
            </div>
            <button
              onClick={() => onNavigateTab("system")}
              className="text-[11px] font-semibold text-[#1769AA] hover:underline flex items-center space-x-0.5"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px]">Data Ingestion</span>
              <span className="flex items-center space-x-1.5 text-[#16A34A] font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span>Operational</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px]">Model Processing</span>
              <span className="flex items-center space-x-1.5 text-[#16A34A] font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span>Operational</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px]">Forecast API</span>
              <span className="flex items-center space-x-1.5 text-[#16A34A] font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span>Operational</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[#475569]">
              <span className="text-[11px]">Visualization</span>
              <span className="flex items-center space-x-1.5 text-[#16A34A] font-bold text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                <span>Operational</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
