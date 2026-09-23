"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchLocations, 
  fetchBlendedForecast, 
  fetchWhyThisForecast 
} from "@/services/api";
import { addAndFetchMyLocation } from "@/services/locationService";
import { 
  LocationItem, 
  BlendedForecastResponse, 
  TimelinePoint, 
  WhyThisForecastData 
} from "@/types";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { WeatherMap } from "@/components/WeatherMap";
import { ForecastTimeline } from "@/components/ForecastTimeline";
import { ModelComparisonCard } from "@/components/ModelComparisonCard";
import { ExplainabilityDrawer } from "@/components/ExplainabilityDrawer";
import { ExtremeWeatherPanel } from "@/components/ExtremeWeatherPanel";
import { ScientificValidationView } from "@/components/ScientificValidationView";
import { DataSourcesView } from "@/components/DataSourcesView";
import { SystemHealthView } from "@/components/SystemHealthView";
import { LandingHero } from "@/components/LandingHero";
import { NERMonitoringView } from "@/components/NERMonitoringView";
import { MeteorologicalChatModal } from "@/components/MeteorologicalChatModal";
import { ModelWeightMapView } from "@/components/ModelWeightMapView";
import { BaselineComparisonView } from "@/components/BaselineComparisonView";
import { AutomatedPipelineView } from "@/components/AutomatedPipelineView";
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  ShieldAlert, 
  Layers, 
  HelpCircle,
  Clock,
  Compass,
  Bot,
  Sliders,
  BarChart2
} from "lucide-react";

export default function Home() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [nerFilter, setNerFilter] = useState<boolean>(false);
  // Default to Screen 1 Hero Visual as specified in the 90-second demo script!
  const [activeTab, setActiveTab] = useState<NavTab>("weight_map");
  const [isLightMode, setIsLightMode] = useState<boolean>(false);
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);

  // Forecast state
  const [forecastData, setForecastData] = useState<BlendedForecastResponse | null>(null);
  const [selectedLeadTime, setSelectedLeadTime] = useState<number>(24);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(true);

  // Explainability drawer
  const [explainDrawerOpen, setExplainDrawerOpen] = useState<boolean>(false);
  const [explainData, setExplainData] = useState<WhyThisForecastData | null>(null);
  const [loadingExplain, setLoadingExplain] = useState<boolean>(false);

  // 1. Initial locations load
  useEffect(() => {
    async function init() {
      const locs = await fetchLocations(nerFilter);
      setLocations(locs);
      if (locs.length > 0 && !selectedLocation) {
        // Prefer any already added GPS user location, or default to Guwahati
        const userLoc = locs.find(l => l.name.includes("📍") || l.name.toLowerCase().includes("my location"));
        if (userLoc) {
          setSelectedLocation(userLoc);
        } else {
          const guwahati = locs.find(l => l.name === "Guwahati") || locs[0];
          setSelectedLocation(guwahati);
          
          // Check if browser geolocation permission is already granted
          if (typeof window !== "undefined" && "geolocation" in navigator && "permissions" in navigator) {
            navigator.permissions.query({ name: "geolocation" as any }).then(async (result) => {
              if (result.state === "granted") {
                const detected = await addAndFetchMyLocation();
                if (detected) {
                  handleSelectLocation(detected);
                }
              }
            }).catch(() => {});
          }
        }
      }
    }
    init();
  }, [nerFilter]);

  // 2. Fetch forecast when location changes
  useEffect(() => {
    async function loadForecast() {
      if (!selectedLocation) return;
      setLoadingForecast(true);
      const data = await fetchBlendedForecast(selectedLocation.id, 72);
      setForecastData(data);
      setLoadingForecast(false);
    }
    loadForecast();
  }, [selectedLocation]);

  // 3. Handler for Explainability Drawer
  const handleOpenExplainability = async (leadTime?: number) => {
    if (!selectedLocation) return;
    const targetLead = leadTime ?? selectedLeadTime;
    setExplainDrawerOpen(true);
    setLoadingExplain(true);
    const why = await fetchWhyThisForecast(selectedLocation.id, targetLead, "precipitation_mm");
    setExplainData(why);
    setLoadingExplain(false);
  };

  // 4. Robust Location Selection (including newly added custom GPS stations)
  const handleSelectLocation = (loc: LocationItem) => {
    setLocations((prev) => {
      if (!prev.some((l) => l.id === loc.id)) {
        return [loc, ...prev];
      }
      return prev;
    });
    setSelectedLocation(loc);
  };

  // Current active timestep
  const currentPoint: TimelinePoint | null = forecastData?.timeline?.find(
    pt => pt.lead_time_hours === selectedLeadTime
  ) || (forecastData?.timeline ? forecastData.timeline[0] : null);

  return (
    <div className={`min-h-screen flex flex-col ${isLightMode ? "light-theme bg-slate-50 text-slate-900" : "bg-[#060a12] text-slate-100"}`}>
      {/* Top Navigation */}
      <Navbar
        locations={locations}
        selectedLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
        nerFilter={nerFilter}
        onToggleNerFilter={(val) => setNerFilter(val)}
        isLightMode={isLightMode}
        onToggleTheme={() => setIsLightMode(!isLightMode)}
        lastUpdated={forecastData?.generated_at ? new Date(forecastData.generated_at).toLocaleTimeString() : "Live"}
        onOpenChat={() => setChatModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            setShowLanding(false);
          }}
          extremeEventsCount={forecastData?.extreme_events?.length || 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Landing / Hero Toggle */}
          {showLanding && (
            <LandingHero
              onOpenConsole={() => {
                setShowLanding(false);
                setActiveTab("weight_map");
              }}
              onOpenMethodology={() => {
                setShowLanding(false);
                setActiveTab("skill_trends");
              }}
            />
          )}

          {/* SCREEN 1: SPATIAL MODEL WEIGHT MAP (HERO VISUAL) */}
          {activeTab === "weight_map" && !showLanding && (
            <ModelWeightMapView 
              onSelectRegion={(regCode) => {
                // When selecting a region, pick a station in that zone if available
                if (regCode === "NER" && locations.length > 0) {
                  const nerStation = locations.find(l => l.is_ner);
                  if (nerStation) setSelectedLocation(nerStation);
                }
              }}
              onOpenCopilot={(initialQuery) => {
                setChatModalOpen(true);
              }}
            />
          )}

          {/* SCREEN 2: BLENDED FORECAST VS. BASELINES */}
          {activeTab === "baseline_comparison" && !showLanding && (
            <BaselineComparisonView
              timeline={forecastData?.timeline || []}
              selectedLocation={selectedLocation}
              selectedLeadTime={selectedLeadTime}
              onSelectLeadTime={(lead) => setSelectedLeadTime(lead)}
            />
          )}

          {/* SCREEN 3: SKILL SCORE TRENDS (VERIFICATION AGAINST ERA5) */}
          {activeTab === "skill_trends" && !showLanding && (
            <ScientificValidationView />
          )}

          {/* SCREEN 4: AUTOMATED DAILY BLENDING PIPELINE */}
          {activeTab === "pipeline_status" && !showLanding && (
            <AutomatedPipelineView />
          )}

          {/* SCREEN 5: EXTREME WEATHER & EARLY WARNING INTELLIGENCE */}
          {activeTab === "extreme_weather" && !showLanding && (
            <div className="space-y-6">
              <ExtremeWeatherPanel
                events={forecastData?.extreme_events || []}
                locationName={selectedLocation?.name || "NER"}
                probHeavyRain={currentPoint?.gefs_prob_gt_15mm ?? 0.38}
                probVeryHeavyRain={currentPoint?.gefs_prob_gt_50mm ?? 0.15}
              />
            </div>
          )}

          {/* OPERATIONAL FORECASTER CONSOLE (COMMAND CENTER) */}
          {activeTab === "command_center" && !showLanding && (
            <div className="space-y-6">
              {/* Executive Location Header */}
              {selectedLocation && (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c1322] border border-[#1e2c47] rounded-lg px-5 py-3 shadow-md">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-xl font-bold text-slate-100 tracking-tight">
                        {selectedLocation.name}, {selectedLocation.state}
                      </h1>
                      {selectedLocation.is_ner && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          NORTH EASTERN REGION (NER)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Coordinates: {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E · Elev: {selectedLocation.elevation_m}m · Season: {forecastData?.season || "Monsoon"}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setActiveTab("weight_map")}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs rounded font-medium transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Spatial Weight Map</span>
                    </button>
                    <button
                      onClick={() => setActiveTab("baseline_comparison")}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs rounded font-medium transition"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Baselines</span>
                    </button>
                    <button
                      onClick={() => handleOpenExplainability(selectedLeadTime)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs rounded font-semibold transition"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Why This Forecast?</span>
                    </button>
                  </div>
                </div>
              )}

              {/* KPI Telemetry Tiles */}
              {currentPoint && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>BLENDED RAIN</span>
                      <CloudRain className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-cyan-400">
                      {currentPoint.blended_precipitation_mm} <span className="text-xs font-normal text-slate-400">mm</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Range: {currentPoint.uncertainty_lower_mm}-{currentPoint.uncertainty_upper_mm} mm
                    </span>
                  </div>

                  <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>TEMPERATURE</span>
                      <Thermometer className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-100">
                      {currentPoint.blended_temperature_c} <span className="text-xs font-normal text-slate-400">°C</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Spread: ±{currentPoint.model_disagreement_spread}°C
                    </span>
                  </div>

                  <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>SURFACE WIND</span>
                      <Wind className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-100">
                      {currentPoint.blended_wind_speed_ms} <span className="text-xs font-normal text-slate-400">m/s</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      ≈ {(currentPoint.blended_wind_speed_ms * 3.6).toFixed(1)} km/h
                    </span>
                  </div>

                  <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-3.5 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>HUMIDITY</span>
                      <Droplets className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-slate-100">
                      {currentPoint.blended_humidity_pct} <span className="text-xs font-normal text-slate-400">%</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Dew Saturation
                    </span>
                  </div>

                  <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-3.5 space-y-1 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span>WEATHER REGIME</span>
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-base font-bold font-mono text-amber-400 truncate">
                      {currentPoint.weather_regime}
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {currentPoint.regime_reason}
                    </span>
                  </div>
                </div>
              )}

              {/* Grid: Map + Model Consensus Card */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[460px] lg:h-[490px]">
                  <WeatherMap
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onSelectLocation={handleSelectLocation}
                    activeLayer="rainfall"
                  />
                </div>

                <div className="lg:col-span-1">
                  <ModelComparisonCard
                    currentPoint={currentPoint}
                    onOpenExplainability={() => handleOpenExplainability(selectedLeadTime)}
                  />
                </div>
              </div>

              {/* Forecast Timeline Chart */}
              <ForecastTimeline
                timeline={forecastData?.timeline || []}
                selectedLeadTime={selectedLeadTime}
                onSelectLeadTime={(lead) => {
                  setSelectedLeadTime(lead);
                  handleOpenExplainability(lead);
                }}
              />

              {/* Extreme Weather Intelligence */}
              <ExtremeWeatherPanel
                events={forecastData?.extreme_events || []}
                locationName={selectedLocation?.name || "NER"}
                probHeavyRain={currentPoint?.gefs_prob_gt_15mm ?? 0.42}
                probVeryHeavyRain={currentPoint?.gefs_prob_gt_50mm ?? 0.18}
              />
            </div>
          )}

          {/* TAB: NER MULTI-STATE SURVEILLANCE */}
          {activeTab === "ner_monitoring" && !showLanding && (
            <NERMonitoringView
              onSelectStation={(loc) => {
                setSelectedLocation(loc);
                setActiveTab("command_center");
              }}
              locations={locations}
            />
          )}

          {/* TAB: DATA SOURCES */}
          {activeTab === "data_sources" && !showLanding && (
            <DataSourcesView />
          )}

          {/* TAB: SYSTEM HEALTH */}
          {activeTab === "system_health" && !showLanding && (
            <SystemHealthView />
          )}
        </main>
      </div>

      {/* "Why This Forecast?" Explainability Side Drawer */}
      <ExplainabilityDrawer
        isOpen={explainDrawerOpen}
        onClose={() => setExplainDrawerOpen(false)}
        data={explainData}
        isLoading={loadingExplain}
      />

      {/* Meteorological Intelligence Copilot Modal */}
      <MeteorologicalChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        activeStationId={selectedLocation?.id}
      />
    </div>
  );
}
