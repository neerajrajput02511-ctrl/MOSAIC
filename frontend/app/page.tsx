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
import { ForecastReplayView } from "@/components/ForecastReplayView";
import { ModelMonitorView } from "@/components/ModelMonitorView";
import { ScientificIntegrityView } from "@/components/ScientificIntegrityView";
import { OverviewView } from "@/components/OverviewView";
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
  // Default to OVERVIEW command center as specified by SIH26081 Section 23!
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
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

      // Guarantee strictly at most ONE user location in frontend state
      const cleanedLocs: LocationItem[] = [];
      let userFound = false;
      for (const l of locs) {
        const isUser = (
          l.name.includes("📍") ||
          l.name.toLowerCase().includes("my") ||
          l.district === "User Location" ||
          l.district === "Active Tracking"
        );
        if (isUser) {
          if (!userFound) {
            cleanedLocs.push(l);
            userFound = true;
          }
        } else {
          cleanedLocs.push(l);
        }
      }
      setLocations(cleanedLocs);

      if (cleanedLocs.length > 0 && !selectedLocation) {
        // Prefer any already added GPS user location, or default to Guwahati
        const userLoc = cleanedLocs.find(l => l.name.includes("📍") || l.name.toLowerCase().includes("my location"));
        if (userLoc) {
          setSelectedLocation(userLoc);
        } else {
          const guwahati = cleanedLocs.find(l => l.name === "Guwahati") || cleanedLocs[0];
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

  // 4. Robust Location Selection (guarantees strictly ONE live GPS user location in system)
  const handleSelectLocation = (loc: LocationItem) => {
    const isUser = (
      loc.name.includes("📍") ||
      loc.name.toLowerCase().includes("my") ||
      loc.district === "User Location" ||
      loc.district === "Active Tracking"
    );

    setLocations((prev) => {
      if (isUser) {
        // Drop any other previous user location so only this single live GPS location is tracked
        const nonUserLocs = prev.filter(l => !(
          l.name.includes("📍") ||
          l.name.toLowerCase().includes("my") ||
          l.district === "User Location" ||
          l.district === "Active Tracking"
        ));
        return [loc, ...nonUserLocs];
      }
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

      {/* Main Command-Center Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Operational Sidebar (11 Canonical Screens) */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setShowLanding(false);
            setActiveTab(tab);
          }}
          extremeEventsCount={forecastData?.extreme_events?.length || 0}
        />

        {/* Dynamic Center Work Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#060a12]">
          {/* LANDING / HERO INTRO MODAL */}
          {showLanding && (
            <LandingHero
              onOpenConsole={() => {
                setShowLanding(false);
                setActiveTab("overview");
              }}
              onOpenMethodology={() => {
                setShowLanding(false);
                setActiveTab("scientific_integrity");
              }}
            />
          )}

          {/* 1. OVERVIEW SCREEN (SECTION 23) */}
          {activeTab === "overview" && !showLanding && (
            <OverviewView
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              forecastData={forecastData}
              selectedLeadTime={selectedLeadTime}
              onSelectLeadTime={(lead) => setSelectedLeadTime(lead)}
              onOpenExplainability={() => handleOpenExplainability(selectedLeadTime)}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}

          {/* 2. FORECAST CONSOLE (COMMAND CENTER) */}
          {activeTab === "forecast" && !showLanding && (
            <div className="space-y-6">
              {/* Executive Location Header */}
              {selectedLocation && (
                <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c1322] border border-[#1e2c47] rounded-xl px-5 py-3 shadow-md">
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
                      onClick={() => setActiveTab("blending_engine")}
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

          {/* 3. BLENDING ENGINE (BMA MATH & BASELINES) */}
          {activeTab === "blending_engine" && !showLanding && (
            <BaselineComparisonView
              timeline={forecastData?.timeline || []}
              selectedLocation={selectedLocation}
              selectedLeadTime={selectedLeadTime}
              onSelectLeadTime={(lead) => setSelectedLeadTime(lead)}
            />
          )}

          {/* 4. WEIGHT MAP (SPATIAL WEIGHT MAP - HERO VISUAL) */}
          {activeTab === "weight_map" && !showLanding && (
            <ModelWeightMapView 
              onSelectRegion={(regCode) => {
                if (regCode === "NER" && locations.length > 0) {
                  const nerStation = locations.find(l => l.is_ner);
                  if (nerStation) setSelectedLocation(nerStation);
                }
              }}
              onOpenCopilot={() => {
                setChatModalOpen(true);
              }}
            />
          )}

          {/* 5. VERIFICATION LAB (ERA5 BENCHMARKS) */}
          {activeTab === "verification" && !showLanding && (
            <ScientificValidationView />
          )}

          {/* 6. FORECAST REPLAY (HISTORICAL CASE STUDIES) */}
          {activeTab === "forecast_replay" && !showLanding && (
            <ForecastReplayView />
          )}

          {/* 7. EXTREME WEATHER CENTER */}
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

          {/* 8. MODEL MONITOR (TELEMETRY & FALLBACK) */}
          {activeTab === "model_monitor" && !showLanding && (
            <ModelMonitorView />
          )}

          {/* 9. OPERATIONAL PIPELINE (12 STAGES) */}
          {activeTab === "pipeline" && !showLanding && (
            <AutomatedPipelineView />
          )}

          {/* 10. DATA SOURCES & PROVENANCE */}
          {activeTab === "data_sources" && !showLanding && (
            <DataSourcesView />
          )}

          {/* 11. SCIENTIFIC INTEGRITY & SIH26081 TRACEABILITY */}
          {activeTab === "scientific_integrity" && !showLanding && (
            <ScientificIntegrityView />
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
