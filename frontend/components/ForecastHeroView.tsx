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
  Crosshair, 
  Layers, 
  CheckCircle2, 
  ArrowUpRight, 
  Settings, 
  Sun, 
  CloudSun, 
  Globe 
} from "lucide-react";
import { LocationItem, BlendedForecastResponse, TimelinePoint } from "@/types";
import { WeatherMap } from "@/components/WeatherMap";
import { InfoTooltip } from "@/components/InfoTooltip";
import { buildSingleForecastTruth, SingleForecastTruth } from "@/utils/forecastTruth";
import { getScopeConfig } from "@/utils/scopeConfig";

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
  monitoringScope?: "NER" | "INDIA";
  onToggleScope?: (scope: "NER" | "INDIA") => void;
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
  onToggleNerFilter,
  monitoringScope = "NER",
  onToggleScope
}) => {
  const [activeLayer, setActiveLayer] = useState<string>("rainfall");
  const [activeMode, setActiveMode] = useState<"live" | "forecast">("live");
  const [showLayerDropdown, setShowLayerDropdown] = useState(false);

  const scopeConfig = getScopeConfig(monitoringScope);

  const currentPoint: TimelinePoint | null = forecastData?.timeline?.find(
    pt => pt.lead_time_hours === selectedLeadTime
  ) || (forecastData?.timeline ? forecastData.timeline[0] : null);

  const regionLabel = selectedLocation
    ? `${selectedLocation.name}, ${selectedLocation.state || (monitoringScope === "INDIA" ? "India" : "NER")}`
    : scopeConfig.domainName;

  const forecastTruth: SingleForecastTruth = buildSingleForecastTruth(
    currentPoint,
    selectedLeadTime,
    regionLabel,
    null
  );

  // Dynamic telemetry from the actual live forecast (strictly NO FAKE DATA)
  const rainValue = currentPoint?.blended_precipitation_mm !== undefined && currentPoint?.blended_precipitation_mm !== null
    ? currentPoint.blended_precipitation_mm.toFixed(1)
    : null;
  const tempValue = currentPoint?.blended_temperature_c !== undefined && currentPoint?.blended_temperature_c !== null
    ? currentPoint.blended_temperature_c.toFixed(1)
    : null;
  const windValue = currentPoint?.blended_wind_speed_ms !== undefined && currentPoint?.blended_wind_speed_ms !== null
    ? (currentPoint.blended_wind_speed_ms * 3.6).toFixed(1)
    : null;
  const cloudCoverValue = currentPoint?.blended_humidity_pct !== undefined && currentPoint?.blended_humidity_pct !== null
    ? Math.round(currentPoint.blended_humidity_pct)
    : null;

  // Real 24h temperature diurnal range computed from actual timeline
  const dayTemps = (forecastData?.timeline?.slice(0, 24) || [])
    .map(p => p.blended_temperature_c)
    .filter((t): t is number => t !== null && t !== undefined);
  const dayMaxTemp = dayTemps.length > 0 ? Math.max(...dayTemps).toFixed(1) : null;
  const dayMinTemp = dayTemps.length > 0 ? Math.min(...dayTemps).toFixed(1) : null;

  // Real model contribution weights
  const ifsWeight = Math.round(forecastTruth.models.ifs.normalized_weight * 1000) / 10;
  const aifsWeight = Math.round(forecastTruth.models.aifs.normalized_weight * 1000) / 10;
  const gfsWeight = Math.round(forecastTruth.models.gfs.normalized_weight * 1000) / 10;
  const gefsWeight = Math.max(0, Math.round((100 - (ifsWeight + aifsWeight + gfsWeight)) * 10) / 10);

  // Timeline steps for bottom timeline card - extracted directly from actual timeline points
  const timelineLeads = [0, 6, 12, 18, 24];
  const timelineSteps = timelineLeads.map((lead) => {
    const pt = forecastData?.timeline?.find(p => p.lead_time_hours === lead);
    const hasVal = pt?.blended_precipitation_mm !== undefined && pt?.blended_precipitation_mm !== null;
    const val = hasVal ? pt!.blended_precipitation_mm.toFixed(1) : "N/A";
    const rainNum = hasVal ? pt!.blended_precipitation_mm : 0;
    const Icon = rainNum > 5.0 ? CloudRain : (rainNum > 0.1 ? Cloud : Sun);
    return {
      label: lead === 0 ? "Now" : `+${lead}h`,
      lead,
      val,
      icon: Icon
    };
  });

  // 5-Day Outlook Days dynamically aggregated from actual forecast timeline
  const outlookDays = React.useMemo(() => {
    if (!forecastData?.timeline || forecastData.timeline.length === 0) {
      return [];
    }
    const dayGroups: Record<string, TimelinePoint[]> = {};
    for (const pt of forecastData.timeline) {
      const d = pt.forecast_time ? new Date(pt.forecast_time) : null;
      if (!d || isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      if (!dayGroups[key]) dayGroups[key] = [];
      dayGroups[key].push(pt);
    }
    const days = Object.keys(dayGroups).slice(0, 5);
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return days.map((dayKey, idx) => {
      const pts = dayGroups[dayKey];
      const d = new Date(dayKey);
      const temps = pts.map(p => p.blended_temperature_c).filter((t): t is number => t !== null && t !== undefined);
      const maxT = temps.length > 0 ? Math.round(Math.max(...temps)) : null;
      const minT = temps.length > 0 ? Math.round(Math.min(...temps)) : null;
      const totalRain = pts.reduce((sum, p) => sum + (p.blended_precipitation_mm || 0), 0);
      
      const dayLabel = idx === 0 ? "Today" : dayNames[d.getDay()];
      const dateLabel = `${d.getDate()} ${monthNames[d.getMonth()]}`;
      const condition = totalRain >= 20.0 ? "Heavy rain" : totalRain >= 2.5 ? "Rain" : (totalRain > 0.2 ? "Light rain" : "Clear");
      const Icon = totalRain > 5.0 ? CloudRain : (totalRain > 0.1 ? CloudSun : Sun);

      return {
        day: dayLabel,
        date: dateLabel,
        icon: Icon,
        max: maxT !== null ? `${maxT}°` : "—",
        min: minT !== null ? `${minT}°` : "—",
        condition
      };
    });
  }, [forecastData]);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto select-none">
      {/* 1. TOP TITLE & LOCATION/DATE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Title & Scope Badging */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-sans">
              Weather Forecast
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono border ${
              monitoringScope === "INDIA" 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
            }`}>
              {scopeConfig.badgeText}
            </span>
          </div>
          <p className="text-xs lg:text-sm text-[#9DAFC4]">
            {scopeConfig.heroSubtitle}
          </p>
        </div>

        {/* PRIMARY MONITORING SCOPE SELECTOR */}
        <div className="bg-[#0D1B2E] border border-[#233852] rounded-2xl p-1.5 shadow-md flex items-center gap-2">
          <div className="text-[10px] font-bold text-[#667B94] uppercase tracking-wider px-2 hidden sm:flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${monitoringScope === "INDIA" ? "bg-emerald-400" : "bg-[#00B8E6]"}`} />
            <span>MONITORING SCOPE</span>
          </div>
          <div className="flex items-center gap-1 bg-[#081426] p-1 rounded-xl border border-[#1E293B]">
            <button
              onClick={() => onToggleScope && onToggleScope("NER")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                monitoringScope === "NER"
                  ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                  : "text-[#9DAFC4] hover:text-white"
              }`}
              title="Focus on North Eastern Region (8 States & Brahmaputra Basin)"
            >
              <span className={`w-2 h-2 rounded-full ${monitoringScope === "NER" ? "bg-white" : "bg-slate-500"}`} />
              <span>NER</span>
            </button>
            <button
              onClick={() => onToggleScope && onToggleScope("INDIA")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                monitoringScope === "INDIA"
                  ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                  : "text-[#9DAFC4] hover:text-white"
              }`}
              title="Switch to Pan-India National Forecast Domain"
            >
              <span className={`w-2 h-2 rounded-full ${monitoringScope === "INDIA" ? "bg-white" : "bg-slate-500"}`} />
              <span>ALL INDIA</span>
            </button>
          </div>
        </div>

        {/* Location & Horizon Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Location Card */}
          <div className="bg-[#0D1B2E] border border-[#233852] rounded-xl px-4 py-2.5 shadow-md flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#081426] border border-[#1E293B] text-[#00B8E6] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-white">
                {selectedLocation
                  ? `${selectedLocation.name}, ${selectedLocation.state || (monitoringScope === "INDIA" ? "India" : "NER")}`
                  : (monitoringScope === "INDIA" ? "All India (Select on Map)" : "NER (Select a Station)")}
              </div>
              <div className="text-[11px] font-mono text-[#667B94] mt-0.5">
                {selectedLocation && selectedLocation.latitude !== undefined && selectedLocation.longitude !== undefined
                  ? `${selectedLocation.latitude.toFixed(4)}° N, ${selectedLocation.longitude.toFixed(4)}° E`
                  : `Domain Grid [${scopeConfig.geographicBounds}]`}
              </div>
            </div>
          </div>

          {/* Date & Forecast Time Selector Card */}
          <div className="bg-[#0D1B2E] border border-[#233852] rounded-xl px-4 py-2.5 shadow-md flex items-center space-x-3 cursor-pointer hover:border-[#00B8E6]/40 transition">
            <div className="w-8 h-8 rounded-lg bg-[#081426] border border-[#1E293B] text-[#00B8E6] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-white">
                {currentPoint?.forecast_time
                  ? new Date(currentPoint.forecast_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
                  : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}
              </div>
              <div className="text-[11px] font-mono text-[#667B94] mt-0.5">
                {currentPoint?.forecast_time
                  ? `${new Date(currentPoint.forecast_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC (+${selectedLeadTime}h)`
                  : `12:00 UTC (Next +${selectedLeadTime}h)`}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#667B94] ml-1" />
          </div>
        </div>
      </div>

      {/* 2. WEATHER SUMMARY METRIC CARDS (Row of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: RAINFALL */}
        <div className="bg-[#0D1B2E] border border-[#1E293B] hover:border-[#233852] rounded-xl p-4 shadow-md transition-all relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>RAINFALL</span>
              <InfoTooltip term="adaptive_weight" explanation="Expected precipitation accumulation generated by MOSAIC consensus." />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800">
              +{selectedLeadTime}h
            </span>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-[#00B8E6] flex items-center justify-center shrink-0">
              <CloudRain className="w-6 h-6" />
            </div>
            <div>
              {rainValue !== null ? (
                <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                  {rainValue} <span className="text-lg font-bold text-[#667B94]">mm</span>
                </div>
              ) : (
                <div className="text-xs font-bold text-amber-400 font-mono py-1">
                  DATA UNAVAILABLE
                </div>
              )}
              <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                {rainValue !== null ? `in next ${selectedLeadTime} hours` : "Upstream feed waiting"}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: TEMPERATURE */}
        <div className="bg-[#0D1B2E] border border-[#1E293B] hover:border-[#233852] rounded-xl p-4 shadow-md transition-all relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>TEMPERATURE</span>
              <InfoTooltip term="forecast_certainty" explanation="Ground temperature prediction from blended physics-AI models." />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0">
              <Thermometer className="w-6 h-6" />
            </div>
            <div>
              {tempValue !== null ? (
                <>
                  <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                    {tempValue} <span className="text-lg font-bold text-[#667B94]">°C</span>
                  </div>
                  <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                    {dayMaxTemp !== null && dayMinTemp !== null ? `max ${dayMaxTemp}° / min ${dayMinTemp}°` : "2m surface ground temp"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-amber-400 font-mono py-1">
                    DATA UNAVAILABLE
                  </div>
                  <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                    Upstream feed waiting
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: WIND SPEED */}
        <div className="bg-[#0D1B2E] border border-[#1E293B] hover:border-[#233852] rounded-xl p-4 shadow-md transition-all relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>WIND SPEED</span>
              <InfoTooltip term="ensemble_spread" explanation="10-meter surface wind speed derived from NOAA GFS/IFS." />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-sky-950/60 border border-sky-800/40 text-sky-400 flex items-center justify-center shrink-0">
              <Wind className="w-6 h-6" />
            </div>
            <div>
              {windValue !== null ? (
                <>
                  <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                    {windValue} <span className="text-lg font-bold text-[#667B94]">km/h</span>
                  </div>
                  <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                    {currentPoint?.blended_wind_speed_ms !== undefined ? `${currentPoint.blended_wind_speed_ms.toFixed(1)} m/s surface vector` : "Surface vector"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-amber-400 font-mono py-1">
                    DATA UNAVAILABLE
                  </div>
                  <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                    Upstream feed waiting
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: CLOUD COVER */}
        <div className="bg-[#0D1B2E] border border-[#1E293B] hover:border-[#233852] rounded-xl p-4 shadow-md transition-all relative space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
            <div className="flex items-center space-x-1.5 font-bold uppercase tracking-wider text-[11px]">
              <span>CLOUD COVER / HUMIDITY</span>
              <InfoTooltip term="weather_regime" explanation="Atmospheric moisture saturation and fractional cloud fraction." />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-1">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              {cloudCoverValue !== null ? (
                <>
                  <div className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
                    {cloudCoverValue}<span className="text-lg font-bold text-[#667B94]">%</span>
                  </div>
                  <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                    {cloudCoverValue > 70 ? "High atmospheric moisture" : cloudCoverValue > 30 ? "Moderate moisture" : "Dry continental"}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold text-amber-400 font-mono py-1">
                    DATA UNAVAILABLE
                  </div>
                  <div className="text-[11px] text-[#9DAFC4] mt-0.5">
                    Upstream feed waiting
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. HERO MAP (65%) & RIGHT INFORMATION PANELS (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* HERO MAP CONTAINER (lg:col-span-8) */}
        <div 
          className="lg:col-span-8 bg-[#0D1B2E] border border-[#1E293B] rounded-2xl p-3 shadow-lg relative overflow-hidden flex flex-col map-container"
          style={{ position: "relative", zIndex: 1, isolation: "isolate" }}
        >
          {/* Map canvas container */}
          <div 
            className="h-[520px] lg:h-[580px] w-full rounded-xl overflow-hidden relative map-stacking-context"
            style={{ position: "relative", zIndex: 1, isolation: "isolate" }}
          >
            <WeatherMap 
              locations={locations}
              selectedLocation={selectedLocation} 
              onSelectLocation={onSelectLocation} 
              activeLayer={activeLayer}
              currentPoint={currentPoint}
              monitoringScope={monitoringScope}
            />

            {/* Top-Left Layer Selector Dropdown */}
            <div className="absolute top-4 left-4 z-20">
              <div className="relative">
                <button
                  onClick={() => setShowLayerDropdown(prev => !prev)}
                  className="bg-[#081426]/95 backdrop-blur-md border border-[#233852] hover:border-[#00B8E6]/50 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg flex items-center space-x-2 transition"
                >
                  <CloudRain className="w-3.5 h-3.5 text-[#00B8E6]" />
                  <span>
                    {activeLayer === "rainfall" ? "Rainfall (mm)" : activeLayer === "temperature" ? "Temperature (°C)" : activeLayer === "wind" ? "Wind (km/h)" : "Model Disagreement"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#9DAFC4]" />
                </button>

                {showLayerDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-48 bg-[#0D1B2E] border border-[#233852] rounded-xl shadow-2xl p-1 z-30">
                    <button
                      onClick={() => { setActiveLayer("rainfall"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#172A43] font-medium text-white flex items-center space-x-2"
                    >
                      <CloudRain className="w-3.5 h-3.5 text-[#00B8E6]" />
                      <span>Rainfall (mm)</span>
                    </button>
                    <button
                      onClick={() => { setActiveLayer("temperature"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#172A43] font-medium text-white flex items-center space-x-2"
                    >
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Temperature (°C)</span>
                    </button>
                    <button
                      onClick={() => { setActiveLayer("wind"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#172A43] font-medium text-white flex items-center space-x-2"
                    >
                      <Wind className="w-3.5 h-3.5 text-sky-400" />
                      <span>Wind Speed (km/h)</span>
                    </button>
                    <button
                      onClick={() => { setActiveLayer("disagreement"); setShowLayerDropdown(false); }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-[#172A43] font-medium text-white flex items-center space-x-2"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-400" />
                      <span>Model Disagreement</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Left Controls Stack (+, -, locate, layers) */}
            <div className="absolute top-16 left-4 z-20 flex flex-col space-y-1.5">
              <button 
                onClick={() => {
                  if (selectedLocation) onSelectLocation(selectedLocation);
                }}
                className="w-8 h-8 rounded-lg bg-[#081426]/95 backdrop-blur-md border border-[#233852] hover:bg-[#172A43] text-white flex items-center justify-center shadow-lg transition"
                title="Center on Station"
              >
                <Crosshair className="w-4 h-4 text-[#00B8E6]" />
              </button>
              <button 
                onClick={() => onNavigateTab("models")}
                className="w-8 h-8 rounded-lg bg-[#081426]/95 backdrop-blur-md border border-[#233852] hover:bg-[#172A43] text-white flex items-center justify-center shadow-lg transition"
                title="Layer Settings & Spatial Weight Map"
              >
                <Layers className="w-4 h-4 text-[#9DAFC4]" />
              </button>
            </div>

            {/* Right Vertical Scale Legend */}
            <div className="absolute top-4 right-4 z-20 bg-[#081426]/95 backdrop-blur-md border border-[#233852] rounded-xl px-2.5 py-3 shadow-lg text-[10px] font-mono text-white flex flex-col items-center select-none">
              <span className="font-bold text-[9px] text-[#9DAFC4] mb-2">Rainfall (mm)</span>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-2.5 h-36 rounded-full"
                  style={{
                    background: "linear-gradient(to bottom, #9333ea, #dc2626, #ea580c, #ca8a04, #16a34a, #0284c7, #38bdf8)"
                  }}
                />
                <div className="flex flex-col justify-between h-36 text-[9px] text-[#9DAFC4]">
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

            {/* Bottom-Left Floating Location Telemetry Pill */}
            <div className="absolute bottom-4 left-4 z-20">
              <div className="bg-[#070D18]/95 backdrop-blur-md text-white rounded-xl px-3.5 py-2 shadow-2xl border border-[#233852] flex items-center space-x-3 text-xs font-mono">
                <MapPin className="w-3.5 h-3.5 text-[#00B8E6] shrink-0" />
                <span className="font-bold uppercase tracking-wider text-white">{selectedLocation ? selectedLocation.name : scopeConfig.badgeText}</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-300 font-bold">{rainValue !== null ? `${rainValue} mm` : "N/A"}</span>
                <span className="text-slate-600">|</span>
                <span>{tempValue !== null ? `${tempValue}°C` : "N/A"}</span>
                <span className="text-slate-600">|</span>
                <span>{windValue !== null ? `${windValue} km/h` : "N/A"}</span>
              </div>
            </div>

            {/* Bottom-Right Live / Forecast Segmented Toggle */}
            <div className="absolute bottom-4 right-4 z-20 bg-[#081426]/95 backdrop-blur-md border border-[#233852] rounded-full p-1 shadow-lg flex items-center text-xs font-bold">
              <button
                onClick={() => setActiveMode("live")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMode === "live"
                    ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                    : "text-[#9DAFC4] hover:text-white"
                }`}
              >
                Live
              </button>
              <button
                onClick={() => setActiveMode("forecast")}
                className={`px-3 py-1 rounded-full transition-all ${
                  activeMode === "forecast"
                    ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                    : "text-[#9DAFC4] hover:text-white"
                }`}
              >
                Forecast
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN PANELS (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: MODEL CONTRIBUTION */}
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-white">
                <span>Model Contribution</span>
                <InfoTooltip term="adaptive_weight" explanation="Percentage of consensus assigned to each system based on historical error scores." />
              </div>
              <button
                onClick={() => onNavigateTab("models")}
                className="text-xs font-semibold text-[#00B8E6] hover:underline flex items-center space-x-0.5"
              >
                <span>View details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Model Weight Horizontal Progress Bars */}
            {forecastTruth.is_data_available ? (
              <div className="space-y-3 font-mono text-xs">
                {/* IFS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-white">
                    <span className="flex items-center space-x-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#1687FF]" />
                      <span>IFS (ECMWF)</span>
                    </span>
                    <span className="font-bold">{ifsWeight}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#081426] rounded-full overflow-hidden border border-[#1E293B]">
                    <div 
                      className="h-full bg-[#1687FF] rounded-full transition-all duration-500" 
                      style={{ width: `${ifsWeight}%` }}
                    />
                  </div>
                </div>

                {/* AIFS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-white">
                    <span className="flex items-center space-x-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#00B8E6]" />
                      <span>AIFS (ECMWF)</span>
                    </span>
                    <span className="font-bold">{aifsWeight}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#081426] rounded-full overflow-hidden border border-[#1E293B]">
                    <div 
                      className="h-full bg-[#00B8E6] rounded-full transition-all duration-500" 
                      style={{ width: `${aifsWeight}%` }}
                    />
                  </div>
                </div>

                {/* GFS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-white">
                    <span className="flex items-center space-x-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                      <span>GFS (NOAA)</span>
                    </span>
                    <span className="font-bold">{gfsWeight}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#081426] rounded-full overflow-hidden border border-[#1E293B]">
                    <div 
                      className="h-full bg-[#38BDF8] rounded-full transition-all duration-500" 
                      style={{ width: `${gfsWeight}%` }}
                    />
                  </div>
                </div>

                {/* GEFS */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-white">
                    <span className="flex items-center space-x-2 font-medium">
                      <span className="w-2 h-2 rounded-full bg-[#60A5FA]" />
                      <span>GEFS (NOAA)</span>
                    </span>
                    <span className="font-bold">{gefsWeight}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#081426] rounded-full overflow-hidden border border-[#1E293B]">
                    <div 
                      className="h-full bg-[#60A5FA] rounded-full transition-all duration-500" 
                      style={{ width: `${gefsWeight}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#081426] border border-[#1E293B] rounded-lg p-3 text-xs text-[#9DAFC4] space-y-1 font-sans">
                <div className="font-bold text-white">Weights: N/A</div>
                <p>Insufficient valid upstream forecast data. Adaptive weighting is inactive until upstream model feeds report.</p>
              </div>
            )}
          </div>

          {/* Card 2: FORECAST CONFIDENCE */}
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-white">
                <span>Forecast Confidence</span>
                <InfoTooltip term="forecast_certainty" explanation="Derived objectively from multi-model spread, agreement, and historical skill." />
              </div>
              <div className={`flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${
                forecastTruth.confidence === "HIGH"
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                  : forecastTruth.confidence === "MODERATE"
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                  : forecastTruth.confidence === "LOW"
                  ? "text-red-400 bg-red-500/10 border-red-500/30"
                  : "text-slate-400 bg-slate-800 border-slate-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  forecastTruth.confidence === "HIGH" ? "bg-emerald-400" : forecastTruth.confidence === "MODERATE" ? "bg-amber-400" : forecastTruth.confidence === "LOW" ? "bg-red-400" : "bg-slate-400"
                }`} />
                <span>
                  {forecastTruth.is_data_available && forecastTruth.confidence_score !== null
                    ? `${forecastTruth.confidence} (${forecastTruth.confidence_score}%)`
                    : "N/A"}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#9DAFC4]">
              {forecastTruth.is_data_available && forecastTruth.spread !== null ? (
                <>Model agreement: <strong className="text-white">{forecastTruth.agreement_label}</strong> (Spread: &plusmn;{forecastTruth.uncertainty_pm} mm)</>
              ) : (
                <>Model agreement: <strong className="text-white">N/A</strong> (Spread: N/A — Insufficient upstream data)</>
              )}
            </div>

            {/* Dynamic agreement progress indicator */}
            <div className="w-full h-1.5 bg-[#081426] rounded-full overflow-hidden border border-[#1E293B]">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  !forecastTruth.is_data_available
                    ? "bg-slate-700"
                    : forecastTruth.confidence === "HIGH" ? "bg-emerald-400" : forecastTruth.confidence === "MODERATE" ? "bg-amber-400" : "bg-red-400"
                }`}
                style={{ width: `${forecastTruth.is_data_available && forecastTruth.confidence_score ? Math.min(100, Math.max(15, forecastTruth.confidence_score)) : 0}%` }}
              />
            </div>
          </div>

          {/* Card 3: WHY MOSAIC? */}
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-white">
                <span>Why MOSAIC?</span>
                <InfoTooltip term="bma" explanation="Bayesian Model Averaging and dynamic multi-model consensus." />
              </div>
              <button
                onClick={onOpenExplainability}
                className="text-xs font-semibold text-[#00B8E6] hover:underline flex items-center space-x-0.5"
              >
                <span>View details</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#F4F8FC]">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Combines multiple global weather models</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Uses adaptive weighting for better accuracy</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Applies bias correction and quality control</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Provides ensemble-based uncertainty</span>
              </div>
            </div>
          </div>

          {/* Card 4: DYNAMIC REGION INFORMATION & PROVENANCE */}
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-2.5">
              <div className="flex items-center space-x-1.5 font-bold text-sm text-white">
                <Globe className="w-4 h-4 text-[#00B8E6]" />
                <span>{monitoringScope === "INDIA" ? "National Domain Overview" : "Zone Surveillance Deep Dive"}</span>
              </div>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                monitoringScope === "INDIA"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
              }`}>
                {scopeConfig.badgeText}
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-[#F4F8FC]">
              <div className="flex justify-between items-center py-1 border-b border-[#1E293B]">
                <span className="text-[#9DAFC4]">Monitoring Scope</span>
                <span className="font-bold text-white">{scopeConfig.statesCountLabel}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1E293B]">
                <span className="text-[#9DAFC4]">Domain Bounding Box</span>
                <span className="font-mono text-white">{scopeConfig.geographicBounds}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1E293B]">
                <span className="text-[#9DAFC4]">Major River Basins</span>
                <span className="font-medium text-white truncate max-w-[210px]" title={scopeConfig.riverBasins}>
                  {scopeConfig.riverBasins}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1E293B]">
                <span className="text-[#9DAFC4]">Elevation Range</span>
                <span className="font-mono text-white truncate max-w-[210px]" title={scopeConfig.elevationContext}>
                  {scopeConfig.elevationContext}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#1E293B]">
                <span className="text-[#9DAFC4]">Doppler Radar Gates</span>
                <span className="font-bold font-mono text-[#00B8E6]">
                  {scopeConfig.radarStationsCount} Operational DWR Sites
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[#9DAFC4]">Active Weather Regime</span>
                <span className="font-bold text-white">
                  {currentPoint?.weather_regime || (monitoringScope === "INDIA" ? "Normal Tropical Synoptic Flow" : "Active Orographic Convection")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: FORECAST TIMELINE, WEATHER OUTLOOK, SYSTEM STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch pt-2">
        {/* Card 1: FORECAST TIMELINE (col-span-4) */}
        <div className="lg:col-span-4 bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Calendar className="w-4 h-4 text-[#00B8E6]" />
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
                      ? "bg-cyan-950/60 border-[#00B8E6] text-white shadow-sm font-bold"
                      : "bg-[#081426] border-[#1E293B] text-[#9DAFC4] hover:border-[#233852] hover:text-white"
                  }`}
                >
                  <span className="text-[11px] font-semibold">{step.label}</span>
                  <Icon className="w-4 h-4 text-[#00B8E6] my-1.5" />
                  <span className="text-[11px] font-bold text-white">{step.val} mm</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: WEATHER OUTLOOK 5-DAY (col-span-5) */}
        <div className="lg:col-span-5 bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-bold text-white">
              <CloudSun className="w-4 h-4 text-[#00B8E6]" />
              <span>Weather Outlook</span>
            </div>
            <button
              onClick={() => onNavigateTab("verification")}
              className="text-[11px] font-semibold text-[#00B8E6] hover:underline flex items-center space-x-0.5"
            >
              <span>View full forecast</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            {outlookDays.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-2 rounded-lg bg-[#081426] border border-[#1E293B] flex flex-col items-center justify-between space-y-1">
                  <div>
                    <div className="font-bold text-white text-[11px]">{item.day}</div>
                    <div className="text-[9px] text-[#667B94]">{item.date}</div>
                  </div>
                  <Icon className="w-4 h-4 text-[#00B8E6] my-1" />
                  <div>
                    <div className="font-bold font-mono text-[11px] text-white">{item.max} / {item.min}</div>
                    <div className="text-[9px] text-[#9DAFC4] truncate max-w-[50px]">{item.condition}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: SYSTEM STATUS (col-span-3) */}
        <div className="lg:col-span-3 bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-bold text-white">
              <Settings className="w-4 h-4 text-[#00B8E6]" />
              <span>System Status</span>
            </div>
            <button
              onClick={() => onNavigateTab("system")}
              className="text-[11px] font-semibold text-[#00B8E6] hover:underline flex items-center space-x-0.5"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[#9DAFC4]">
              <span className="text-[11px]">NOAA GFS (0.25°)</span>
              <span className={`flex items-center space-x-1.5 font-bold text-[10px] ${
                forecastTruth.models.gfs.status === "HEALTHY" ? "text-emerald-400" : "text-amber-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  forecastTruth.models.gfs.status === "HEALTHY" ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <span>{forecastTruth.models.gfs.status === "HEALTHY" ? "Operational" : "Degraded"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[#9DAFC4]">
              <span className="text-[11px]">ECMWF IFS (0.25°)</span>
              <span className={`flex items-center space-x-1.5 font-bold text-[10px] ${
                forecastTruth.models.ifs.status === "HEALTHY" ? "text-emerald-400" : "text-amber-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  forecastTruth.models.ifs.status === "HEALTHY" ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <span>{forecastTruth.models.ifs.status === "HEALTHY" ? "Operational" : "Degraded"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[#9DAFC4]">
              <span className="text-[11px]">ECMWF AIFS (Neural)</span>
              <span className={`flex items-center space-x-1.5 font-bold text-[10px] ${
                forecastTruth.models.aifs.status === "HEALTHY" ? "text-emerald-400" : "text-amber-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  forecastTruth.models.aifs.status === "HEALTHY" ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <span>{forecastTruth.models.aifs.status === "HEALTHY" ? "Operational" : "Degraded"}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[#9DAFC4]">
              <span className="text-[11px]">NOAA GEFS (31-M)</span>
              <span className={`flex items-center space-x-1.5 font-bold text-[10px] ${
                forecastTruth.models.gefs.status === "HEALTHY" ? "text-emerald-400" : "text-amber-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  forecastTruth.models.gefs.status === "HEALTHY" ? "bg-emerald-400" : "bg-amber-400"
                }`} />
                <span>{forecastTruth.models.gefs.status === "HEALTHY" ? "Operational" : "Degraded"}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
