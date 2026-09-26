"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2, AlertCircle, RefreshCw, Layers, ShieldCheck, CheckCircle2 } from "lucide-react";
import { LocationItem } from "@/types";

export type MapState = "LOADING" | "READY" | "DEGRADED" | "ERROR" | "NO DATA";

interface WeatherMapProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  activeLayer: string;
  currentPoint?: any;
  monitoringScope?: "NER" | "INDIA";
}

// Clean light enterprise loading placeholder
const MapLoadingPlaceholder = ({ message }: { message: string }) => (
  <div className="w-full h-full min-h-[420px] bg-[#F8FAFC] border border-[#D9E0E7] rounded-xl flex flex-col items-center justify-center space-y-3 text-[#64748B]">
    <Loader2 className="w-7 h-7 text-[#1769AA] animate-spin" />
    <span className="text-xs font-semibold text-[#0F172A]">{message}</span>
    <span className="text-[11px] text-[#64748B]">Calibrating high-resolution meteorological GIS grid</span>
  </div>
);

const DynamicLeafletMap = dynamic(
  () => import("./WeatherMapInner").then((mod) => mod.WeatherMapInner),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder message="Loading Leaflet GIS Basemap..." />
  }
);

const DynamicMapLibreMap = dynamic(
  () => import("./MapLibreView").then((mod) => mod.MapLibreView),
  {
    ssr: false,
    loading: () => <MapLoadingPlaceholder message="Initializing 3D Vector Map..." />
  }
);

export const WeatherMap: React.FC<WeatherMapProps> = (props) => {
  // Safe default: "leaflet" is 100% resilient across all browsers/VMs without WebGL dependency
  const [engine, setEngine] = useState<"google" | "maplibre" | "leaflet">("leaflet");
  const [mapState, setMapState] = useState<MapState>("LOADING");
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Check WebGL support on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) {
          setWebglSupported(false);
          setEngine("leaflet");
          setMapState("DEGRADED");
        } else {
          setWebglSupported(true);
          setMapState("READY");
        }
      } catch {
        setWebglSupported(false);
        setEngine("leaflet");
        setMapState("DEGRADED");
      }
    }
  }, []);

  // When engine changes, verify safety
  const handleEngineChange = (newEngine: "google" | "maplibre" | "leaflet") => {
    if ((newEngine === "maplibre" || newEngine === "google") && !webglSupported) {
      setEngine("leaflet");
      setMapState("DEGRADED");
      return;
    }
    setEngine(newEngine);
    setMapState("READY");
  };

  return (
    <div 
      className="relative w-full h-full flex flex-col map-container map-stacking-context"
      style={{ position: "relative", zIndex: 1, isolation: "isolate" }}
    >
      {/* Map Status Badge (Phase 12: Visually distinct map states) */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
        {mapState === "READY" && (
          <div className="bg-white/95 backdrop-blur-sm border border-[#D9E0E7] px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#16A34A] flex items-center space-x-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
            <span>GIS READY</span>
          </div>
        )}

        {mapState === "DEGRADED" && (
          <div className="bg-[#FFFBEB] border border-[#FDE68A] px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#D97706] flex items-center space-x-1.5 shadow-sm">
            <AlertCircle className="w-3 h-3 text-[#D97706]" />
            <span>STANDARD 2D GIS (SAFE MODE)</span>
          </div>
        )}

        {mapState === "ERROR" && (
          <div className="bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#DC2626] flex items-center space-x-1.5 shadow-sm">
            <AlertCircle className="w-3 h-3 text-[#DC2626]" />
            <span>TILES DEGRADED</span>
            <button
              onClick={() => { setEngine("leaflet"); setMapState("READY"); }}
              className="ml-1 text-[9px] underline hover:text-[#B91C1C]"
            >
              Reset
            </button>
          </div>
        )}

        {/* Engine switcher toggle */}
        <div className="bg-white/95 backdrop-blur-sm border border-[#D9E0E7] p-0.5 rounded-lg flex items-center text-[10px] font-semibold shadow-sm">
          <button
            onClick={() => handleEngineChange("leaflet")}
            className={`px-2 py-0.5 rounded transition ${
              engine === "leaflet" ? "bg-[#0B1F33] text-white shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
            }`}
            title="Reliable 2D GIS Canvas (Universal Compatibility)"
          >
            Leaflet GIS
          </button>
          <button
            onClick={() => handleEngineChange("maplibre")}
            disabled={!webglSupported}
            className={`px-2 py-0.5 rounded transition ${
              engine === "maplibre"
                ? "bg-[#0B1F33] text-white shadow-xs"
                : webglSupported
                ? "text-[#64748B] hover:text-[#0F172A]"
                : "text-slate-300 cursor-not-allowed"
            }`}
            title={webglSupported ? "3D Vector Terrain" : "WebGL not available on this browser"}
          >
            3D Vector
          </button>
        </div>
      </div>

      {/* Render Selected Engine */}
      <div className="w-full h-full flex-1">
        {engine === "maplibre" ? (
          <DynamicMapLibreMap {...props} engine={engine} onToggleEngine={handleEngineChange} />
        ) : (
          <DynamicLeafletMap {...props} engine={engine} onToggleEngine={handleEngineChange} />
        )}
      </div>
    </div>
  );
};
