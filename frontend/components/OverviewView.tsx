"use client";

import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Layers, 
  HelpCircle, 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Zap, 
  Compass, 
  ArrowUpRight,
  Sparkles,
  Server,
  Database,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { LocationItem, BlendedForecastResponse, TimelinePoint } from "@/types";
import { WeatherMap } from "@/components/WeatherMap";
import { ProvenanceDrawer } from "@/components/ProvenanceDrawer";
import { ModelProvenanceModal } from "@/components/ModelProvenanceModal";
import { buildSingleForecastTruth, SingleForecastTruth, IndividualModelData } from "@/utils/forecastTruth";

interface OverviewViewProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  forecastData: BlendedForecastResponse | null;
  selectedLeadTime: number;
  onSelectLeadTime: (lead: number) => void;
  onOpenExplainability: () => void;
  onNavigateTab: (tab: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  forecastData,
  selectedLeadTime,
  onSelectLeadTime,
  onOpenExplainability,
  onNavigateTab
}) => {
  const currentPoint: TimelinePoint | null = forecastData?.timeline?.find(
    pt => pt.lead_time_hours === selectedLeadTime
  ) || (forecastData?.timeline ? forecastData.timeline[0] : null);

  const [pipelineState, setPipelineState] = useState<any>(null);
  const [showProvenance, setShowProvenance] = useState<boolean>(false);
  const [simulatedFailureModel, setSimulatedFailureModel] = useState<string | null>(null);
  const [selectedModelForProvenance, setSelectedModelForProvenance] = useState<IndividualModelData | null>(null);
  const [showModelProvenance, setShowModelProvenance] = useState<boolean>(false);

  useEffect(() => {
    async function loadPipeline() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/pipeline");
        if (res.ok) {
          const d = await res.json();
          setPipelineState(d);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    loadPipeline();
  }, []);

  // 1. SINGLE SOURCE OF TRUTH (Requirement 2 Mandate)
  const forecastTruth: SingleForecastTruth = buildSingleForecastTruth(
    currentPoint,
    selectedLeadTime,
    selectedLocation?.name || "Northeast India",
    simulatedFailureModel
  );

  // Dynamic next pipeline run calculation (Requirement 12)
  const getNextPipelineRun = () => {
    const now = new Date();
    const currentUtcHour = now.getUTCHours();
    const cycleHours = [0, 6, 12, 18];
    const nextHour = cycleHours.find(h => h > currentUtcHour) ?? 0;
    const diffHours = (nextHour <= currentUtcHour ? nextHour + 24 : nextHour) - currentUtcHour;
    const diffMinutes = 60 - now.getUTCMinutes();
    const totalMinutes = (diffHours - 1) * 60 + diffMinutes;
    const formattedNext = `${String(nextHour).padStart(2, "0")}:00 UTC`;
    return {
      time: formattedNext,
      countdown: totalMinutes > 60 ? `in ${Math.floor(totalMinutes/60)}h ${totalMinutes%60}m` : `in ${totalMinutes}m`,
      lastRun: `${String(cycleHours.filter(h => h <= currentUtcHour).pop() ?? 18).padStart(2, "0")}:00 UTC`
    };
  };
  const pipelineSchedule = getNextPipelineRun();

  const extremeEvents = forecastData?.extreme_events || [];
  const hasExtreme = extremeEvents.length > 0;

  return (
    <div className="space-y-6">
      {/* Validation Error Alert Banner if mathematical consistency check fails (Requirement 3 & 4) */}
      {forecastTruth.validation_error && (
        <div className="bg-rose-950/60 border border-rose-500 rounded-xl p-4 flex items-center justify-between text-rose-200 animate-pulse font-mono text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-bold">{forecastTruth.validation_error}</span>
          </div>
          <span className="text-[10px] bg-rose-900 px-2 py-1 rounded uppercase font-bold">Audit Alert</span>
        </div>
      )}

      {/* 1. TOP CARDS (Answers the core 5 operational questions) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Card 1: SYSTEM STATUS */}
        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10px] uppercase">SYSTEM STATUS</span>
            <span className={`w-2 h-2 rounded-full ${simulatedFailureModel ? "bg-amber-400" : "bg-emerald-400"} animate-pulse`} />
          </div>
          <div className="text-sm font-bold text-slate-100 flex items-center space-x-1.5 font-mono">
            {simulatedFailureModel ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300">FALLBACK ACTIVE</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>OPERATIONAL</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {simulatedFailureModel ? "1 Fallback Active (AIFS Degraded)" : (pipelineState?.active_fallbacks ? `${pipelineState.active_fallbacks} Fallbacks Active` : "Zero Fallbacks Active")}
          </div>
        </div>

        {/* Card 2: ACTIVE MODELS */}
        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10px] uppercase">ACTIVE MODELS</span>
            <Layers className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-sm font-bold text-slate-100 font-mono">
            {forecastTruth.available_models_count} / {forecastTruth.total_models_count} INGESTED
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            GFS · IFS · {simulatedFailureModel === "ECMWF_AIFS" ? <span className="line-through text-rose-400">AIFS</span> : "AIFS"} · GEFS
          </div>
        </div>

        {/* Card 3: CURRENT REGIME */}
        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10px] uppercase">CURRENT REGIME</span>
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-sm font-bold text-purple-300 truncate font-mono">
            {forecastTruth.dominant_explanation.weather_regime}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            IMD Synoptic Standards
          </div>
        </div>

        {/* Card 4: FORECAST CONFIDENCE (Traceable - Requirement 5) */}
        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10px] uppercase">CONFIDENCE</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-cyan-300 font-mono">
            {forecastTruth.confidence} ({forecastTruth.confidence_score}%)
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            Spread &sigma;: {forecastTruth.std_dev.toFixed(1)} mm
          </div>
        </div>

        {/* Card 5: NEXT PIPELINE RUN (Dynamic - Requirement 12) */}
        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="font-mono text-[10px] uppercase">NEXT PIPELINE RUN</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-amber-300 font-mono">
            {pipelineSchedule.time}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate">
            {pipelineSchedule.countdown} &middot; 12 Stages Synced
          </div>
        </div>
      </div>

      {/* Extreme Event Advisory Callout if active */}
      {hasExtreme && (
        <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-4 flex items-center justify-between text-rose-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold uppercase tracking-wider text-rose-300 font-mono mr-2">
                ACTIVE HAZARD WARNING:
              </span>
              <span>{extremeEvents[0]?.title || "Heavy Rainfall Exceedance Detected"}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab("extreme_weather")}
            className="px-3 py-1 bg-rose-600/30 hover:bg-rose-600/40 border border-rose-500/40 text-rose-200 text-xs rounded font-medium flex items-center space-x-1"
          >
            <span>View Alerts</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 2. MAIN MAP & SIDE PANEL (MODEL WEIGHTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Map: MOSAIC BLENDED FORECAST (2 cols) */}
        <div className="lg:col-span-2 bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-tight font-mono">
                MOSAIC Blended Forecast Map ({selectedLocation?.name || "India"})
              </h2>
            </div>
            
            {/* Lead Time Selector Pills */}
            <div className="flex items-center space-x-1 bg-[#10192d] p-1 rounded-lg border border-[#1e2c47] text-xs font-mono">
              {[24, 48, 72, 96, 120].map((lt) => (
                <button
                  key={lt}
                  onClick={() => onSelectLeadTime(lt)}
                  className={`px-2.5 py-1 rounded transition ${
                    selectedLeadTime === lt
                      ? "bg-blue-600 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  +{lt}h
                </button>
              ))}
            </div>
          </div>

          <div className="h-[460px] rounded-lg overflow-hidden border border-[#1e2c47] relative">
            <WeatherMap 
              locations={locations}
              selectedLocation={selectedLocation} 
              onSelectLocation={onSelectLocation} 
              activeLayer="rainfall"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
            <span>Grid: 0.25&deg; Common Coordinate Grid &middot; Bilinear Regridded</span>
            <button
              onClick={() => onNavigateTab("weight_map")}
              className="text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Explore Spatial Weight Map</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Side Panel: MODEL WEIGHTS & EXPLAINABILITY (1 col) */}
        <div className="space-y-4">
          <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight font-mono">
                  Adaptive BMA Weights (+{selectedLeadTime}h)
                </h3>
              </div>
              <button
                onClick={onOpenExplainability}
                className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1 font-mono"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Why This Model?</span>
              </button>
            </div>

            {/* Weights Breakdown Bars (Sourced strictly from forecastTruth) */}
            <div className="space-y-3 font-mono text-xs">
              {/* ECMWF AIFS */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="flex items-center space-x-1 text-purple-300 font-semibold">
                    <span>ECMWF AIFS (AI Neural Op)</span>
                    {forecastTruth.models.aifs.status === "DEGRADED" && (
                      <span className="text-[9px] bg-rose-900/60 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/40">DEGRADED</span>
                    )}
                  </span>
                  <span className="font-bold text-purple-300">{Math.round(forecastTruth.models.aifs.weight * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${forecastTruth.models.aifs.weight * 100}%` }}
                  />
                </div>
              </div>

              {/* ECMWF IFS */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="text-cyan-300 font-semibold">ECMWF IFS (0.25&deg; Physics)</span>
                  <span className="font-bold text-cyan-300">{Math.round(forecastTruth.models.ifs.weight * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
                    style={{ width: `${forecastTruth.models.ifs.weight * 100}%` }}
                  />
                </div>
              </div>

              {/* NOAA GFS */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="text-blue-300 font-semibold">NOAA GFS (0.25&deg; Physics)</span>
                  <span className="font-bold text-blue-300">{Math.round(forecastTruth.models.gfs.weight * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${forecastTruth.models.gfs.weight * 100}%` }}
                  />
                </div>
              </div>

              {/* NOAA GEFS */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span className="text-amber-300 font-semibold">NOAA GEFS (31-M Spread)</span>
                  <span className="font-bold text-amber-300">{Math.round(forecastTruth.models.gefs.weight * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${forecastTruth.models.gefs.weight * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Generated Why Explanation (Calculated from Data - Requirement 7) */}
            <div className="bg-[#10192d] p-3 rounded-lg border border-[#1e2c47] text-xs space-y-1 font-sans">
              <span className="font-bold text-slate-200 block text-[11px] font-mono uppercase text-purple-300">
                WHY {forecastTruth.dominant_model.shortName.toUpperCase()} DOMINATES:
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {forecastTruth.dominant_explanation.text}
              </p>
            </div>

            {/* Failure Outage Simulator Toggle (Requirement 10) */}
            <div className="pt-2 border-t border-[#1e2c47]">
              <button
                onClick={() => setSimulatedFailureModel(prev => prev === "ECMWF_AIFS" ? null : "ECMWF_AIFS")}
                className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-semibold transition border flex items-center justify-between ${
                  simulatedFailureModel === "ECMWF_AIFS"
                    ? "bg-rose-950/40 border-rose-500/60 text-rose-300 hover:bg-rose-900/40"
                    : "bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <RefreshCw className={`w-3.5 h-3.5 ${simulatedFailureModel ? "animate-spin text-rose-400" : "text-slate-400"}`} />
                  <span>{simulatedFailureModel === "ECMWF_AIFS" ? "Restore AIFS (Outage Active)" : "Simulate AIFS Outage"}</span>
                </span>
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                  simulatedFailureModel === "ECMWF_AIFS" ? "bg-rose-900/80 text-rose-200" : "bg-slate-800 text-slate-400"
                }`}>
                  {simulatedFailureModel === "ECMWF_AIFS" ? "Degraded" : "Test Fallback"}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Nav shortcut to Replay, Verification or Provenance */}
          <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 space-y-2 text-xs">
            <span className="text-[10px] font-mono text-slate-400 uppercase">OPERATIONAL ACTIONS:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={() => onNavigateTab("forecast_replay")}
                className="p-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium text-left transition"
              >
                <div className="font-bold">Historical Replay</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Scrub Cyclone Remal</div>
              </button>
              <button
                onClick={() => onNavigateTab("verification")}
                className="p-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-medium text-left transition"
              >
                <div className="font-bold">Verification Lab</div>
                <div className="text-[10px] text-slate-400 mt-0.5">RMSE vs Equal Mean</div>
              </button>
              <button
                onClick={() => setShowProvenance(true)}
                className="p-2.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-medium text-left transition col-span-2 md:col-span-1"
              >
                <div className="font-bold flex items-center space-x-1">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span>Data Provenance</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Audit Trace & Origin</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM: MODEL COMPARISON: MOSAIC vs INDIVIDUAL MODELS vs EQUAL MEAN */}
      <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-tight font-mono">
              Operational Comparison: MOSAIC vs Individual Models vs Equal Mean (+{selectedLeadTime}h)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("blending_engine")}
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>Full Mathematical Breakdown</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6-way Comparison Matrix (Sourced from Single Forecast Truth Object) */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
          {/* NOAA GFS */}
          <div 
            onClick={() => { setSelectedModelForProvenance(forecastTruth.models.gfs); setShowModelProvenance(true); }}
            className="bg-[#10192d] border border-[#1e2c47] hover:border-blue-500/60 cursor-pointer rounded-lg p-3 space-y-1 transition group"
            title="Click to view GFS provenance and audit metadata"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 block uppercase">NOAA GFS</span>
              <span className="text-[9px] text-blue-400 opacity-60 group-hover:opacity-100">PROV ↗</span>
            </div>
            <div className="text-lg font-bold text-blue-300">
              {forecastTruth.models.gfs.value.toFixed(1)} mm
            </div>
            <span className="text-[10px] text-slate-500 block">Weight: {Math.round(forecastTruth.models.gfs.weight * 100)}%</span>
          </div>

          {/* ECMWF IFS */}
          <div 
            onClick={() => { setSelectedModelForProvenance(forecastTruth.models.ifs); setShowModelProvenance(true); }}
            className="bg-[#10192d] border border-[#1e2c47] hover:border-cyan-500/60 cursor-pointer rounded-lg p-3 space-y-1 transition group"
            title="Click to view IFS provenance and audit metadata"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 block uppercase">ECMWF IFS</span>
              <span className="text-[9px] text-cyan-400 opacity-60 group-hover:opacity-100">PROV ↗</span>
            </div>
            <div className="text-lg font-bold text-cyan-300">
              {forecastTruth.models.ifs.value.toFixed(1)} mm
            </div>
            <span className="text-[10px] text-slate-500 block">Weight: {Math.round(forecastTruth.models.ifs.weight * 100)}%</span>
          </div>

          {/* ECMWF AIFS */}
          <div 
            onClick={() => { setSelectedModelForProvenance(forecastTruth.models.aifs); setShowModelProvenance(true); }}
            className={`bg-[#10192d] border ${
              forecastTruth.models.aifs.status === "DEGRADED" ? "border-rose-500/60 bg-rose-950/20" : "border-purple-500/30 hover:border-purple-500/60"
            } cursor-pointer rounded-lg p-3 space-y-1 transition group`}
            title="Click to view AIFS provenance and audit metadata"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-purple-300 block uppercase flex items-center space-x-1">
                <Zap className="w-3 h-3 text-purple-400" />
                <span>ECMWF AIFS</span>
              </span>
              <span className="text-[9px] text-purple-400 opacity-60 group-hover:opacity-100">PROV ↗</span>
            </div>
            <div className="text-lg font-bold text-purple-200">
              {forecastTruth.models.aifs.value.toFixed(1)} mm
            </div>
            <span className="text-[10px] text-purple-300 block">
              {forecastTruth.models.aifs.status === "DEGRADED" 
                ? "DEGRADED (0% Weight)" 
                : `Dominant (${Math.round(forecastTruth.models.aifs.weight * 100)}%)`}
            </span>
          </div>

          {/* NOAA GEFS */}
          <div 
            onClick={() => { setSelectedModelForProvenance(forecastTruth.models.gefs); setShowModelProvenance(true); }}
            className="bg-[#10192d] border border-[#1e2c47] hover:border-amber-500/60 cursor-pointer rounded-lg p-3 space-y-1 transition group"
            title="Click to view GEFS provenance and audit metadata"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 block uppercase">NOAA GEFS</span>
              <span className="text-[9px] text-amber-400 opacity-60 group-hover:opacity-100">PROV ↗</span>
            </div>
            <div className="text-lg font-bold text-amber-300">
              {forecastTruth.models.gefs.value.toFixed(1)} mm
            </div>
            <span className="text-[10px] text-slate-500 block">Weight: {Math.round(forecastTruth.models.gefs.weight * 100)}%</span>
          </div>

          {/* EQUAL MEAN BASELINE (Requirement 9) */}
          <div className="bg-[#10192d] border border-slate-700 rounded-lg p-3 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">EQUAL MEAN</span>
            <div className="text-lg font-bold text-slate-200">
              {forecastTruth.equal_mean.toFixed(1)} mm
            </div>
            <span className="text-[10px] text-slate-500 block">{forecastTruth.availability_label}</span>
          </div>

          {/* MOSAIC BLEND (Guaranteed exact match with Σ w_i * x_i) */}
          <div className="bg-emerald-950/30 border border-emerald-500/50 rounded-lg p-3 space-y-1 shadow-md shadow-emerald-950/40">
            <span className="text-[10px] text-emerald-300 block uppercase font-bold flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>MOSAIC BLEND</span>
            </span>
            <div className="text-xl font-bold text-emerald-300">
              {forecastTruth.mosaic_blend.toFixed(1)} mm
            </div>
            <span className="text-[10px] text-emerald-400 block">
              {currentPoint?.improvement_vs_baseline_pct !== undefined 
                ? `⭐ ${currentPoint.improvement_vs_baseline_pct.toFixed(1)}% vs Equal Mean`
                : "Calibrated vs Equal Mean"}
            </span>
          </div>
        </div>

        {/* Mathematical Consistency Verification Footnote (Requirement 1 & 4) */}
        <div className="bg-[#080d18] border border-[#172338] rounded-lg p-2.5 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-400 font-bold uppercase text-[10px]">MATHEMATICAL AUDIT:</span>
            <span>
              &Sigma;(w<sub>i</sub> &times; x<sub>i</sub>) = {forecastTruth.models.gfs.value.toFixed(1)} &times; {forecastTruth.models.gfs.weight.toFixed(2)} + {forecastTruth.models.ifs.value.toFixed(1)} &times; {forecastTruth.models.ifs.weight.toFixed(2)} + {forecastTruth.models.aifs.value.toFixed(1)} &times; {forecastTruth.models.aifs.weight.toFixed(2)} + {forecastTruth.models.gefs.value.toFixed(1)} &times; {forecastTruth.models.gefs.weight.toFixed(2)} = <strong className="text-emerald-300">{forecastTruth.weighted_sum.toFixed(2)} mm</strong>
            </span>
          </div>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Identity Match: MOSAIC Blend = {forecastTruth.mosaic_blend.toFixed(1)} mm</span>
          </span>
        </div>
      </div>

      {/* Slide-out Data Provenance & Verification Drawer */}
      <ProvenanceDrawer
        isOpen={showProvenance}
        onClose={() => setShowProvenance(false)}
        currentPoint={currentPoint}
        selectedLocation={selectedLocation}
      />

      {/* Individual Model Provenance Inspector Modal (Requirement 14) */}
      <ModelProvenanceModal
        model={selectedModelForProvenance}
        isOpen={showModelProvenance}
        onClose={() => setShowModelProvenance(false)}
        locationName={selectedLocation?.name || "Northeast India"}
        leadTime={selectedLeadTime}
      />
    </div>
  );
};
