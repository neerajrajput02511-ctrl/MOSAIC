"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Zap, Map as MapIcon } from "lucide-react";
import { LocationItem } from "@/types";

const DynamicLeafletMap = dynamic(
  () => import("./WeatherMapInner").then((mod) => mod.WeatherMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-[#0c1322] border border-[#1e2c47] rounded-xl flex flex-col items-center justify-center space-y-2 text-slate-500">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Initializing Leaflet GIS Canvas...</span>
      </div>
    ),
  }
);

const DynamicMapLibreMap = dynamic(
  () => import("./MapLibreView").then((mod) => mod.MapLibreView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-[#0c1322] border border-[#1e2c47] rounded-xl flex flex-col items-center justify-center space-y-2 text-slate-500">
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Loading MapLibre WebGL GPU Engine...</span>
      </div>
    ),
  }
);

const DynamicGoogleMap = dynamic(
  () => import("./GoogleMap3DView").then((mod) => mod.GoogleMap3DView),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[380px] bg-[#0c1322] border border-[#1e2c47] rounded-xl flex flex-col items-center justify-center space-y-2 text-slate-500">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono">Activating Google Maps 3D WebGL Engine...</span>
      </div>
    ),
  }
);

interface WeatherMapProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  activeLayer: string;
  currentPoint?: any;
}

export const WeatherMap: React.FC<WeatherMapProps> = (props) => {
  const [engine, setEngine] = useState<"google" | "maplibre" | "leaflet">("maplibre");

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Render Selected Engine */}
      <div className="w-full h-full flex-1">
        {engine === "google" ? (
          <DynamicGoogleMap {...props} engine={engine} onToggleEngine={setEngine} />
        ) : engine === "maplibre" ? (
          <DynamicMapLibreMap {...props} engine={engine} onToggleEngine={setEngine} />
        ) : (
          <DynamicLeafletMap {...props} engine={engine} onToggleEngine={setEngine} />
        )}
      </div>
    </div>
  );
};
