"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MapContainer, TileLayer, Marker, Popup, useMap, Circle, 
  Tooltip, useMapEvents 
} from "react-leaflet";
import L from "leaflet";
import { 
  Layers, MapPin, Search, Maximize2, Minimize2, Compass, 
  Wind, Thermometer, Droplets, ShieldAlert, Satellite, Globe, Mountain,
  RefreshCw, Check, AlertTriangle, Crosshair, Loader2
} from "lucide-react";
import { LocationItem } from "@/types";
import { addAndFetchMyLocation } from "@/services/locationService";
import { apiFetch, createCustomLocation } from "@/services/api";

// Basemap definitions (Zero Watermarks, 100% Free & Operational GIS tiles)
const BASEMAPS = {
  dark: {
    name: "Dark Tactical",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16
  },
  maptiler: {
    name: "MapTiler Satellite",
    url: process.env.NEXT_PUBLIC_MAPTILER_API_KEY 
      ? `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${process.env.NEXT_PUBLIC_MAPTILER_API_KEY}`
      : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; MapTiler &copy; OpenStreetMap",
    maxZoom: 20
  },
  google: {
    name: "Google Satellite",
    url: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ? `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Google Maps / Esri Imagery",
    maxZoom: 20
  },
  satellite: {
    name: "Satellite GIS",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18
  },
  topo: {
    name: "Topographic Relief",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)",
    maxZoom: 17
  },
  osm: {
    name: "Street / Administrative",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    maxZoom: 19
  }
};

type BasemapKey = keyof typeof BASEMAPS;

// Custom Leaflet GIS Pins
const createGisStationIcon = (
  isSelected: boolean,
  isNER: boolean,
  primaryValue: number | null,
  layerType: string
) => {
  let badgeColor = "#06b6d4";
  let label = "";

  if (layerType === "rainfall") {
    const val = primaryValue ?? 0;
    label = `${val.toFixed(1)}mm`;
    if (val > 64.5) badgeColor = "#ef4444"; // Extremely Heavy
    else if (val > 15.5) badgeColor = "#f97316"; // Heavy
    else if (val > 2.5) badgeColor = "#eab308"; // Moderate
    else badgeColor = "#06b6d4"; // Light
  } else if (layerType === "temperature") {
    const val = primaryValue ?? 25;
    label = `${val.toFixed(1)}°`;
    badgeColor = val > 35 ? "#ef4444" : val > 28 ? "#f97316" : val > 20 ? "#10b981" : "#3b82f6";
  } else if (layerType === "wind") {
    const val = primaryValue ?? 2;
    label = `${val.toFixed(1)}m/s`;
    badgeColor = val > 15 ? "#ef4444" : val > 8 ? "#f97316" : "#3b82f6";
  } else if (layerType === "disagreement") {
    const val = primaryValue ?? 0.5;
    label = `±${val.toFixed(1)}`;
    badgeColor = val > 2.5 ? "#ef4444" : val > 1.2 ? "#f97316" : "#10b981";
  } else {
    label = isNER ? "NER" : "NAT";
    badgeColor = isSelected ? "#06b6d4" : isNER ? "#3b82f6" : "#64748b";
  }

  const ringStyle = isSelected
    ? "border: 2.5px solid #ffffff; box-shadow: 0 0 16px #06b6d4, 0 0 30px rgba(6,182,212,0.8);"
    : "border: 1.5px solid rgba(255,255,255,0.8); box-shadow: 0 0 8px rgba(0,0,0,0.6);";

  const html = `
    <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%); cursor:pointer;">
      <div style="
        background: ${badgeColor};
        color: #ffffff;
        font-family: monospace;
        font-weight: 700;
        font-size: 10px;
        padding: 2px 5px;
        border-radius: 9999px;
        white-space: nowrap;
        margin-bottom: 2px;
        ${ringStyle}
      ">${label}</div>
      <div style="
        width: ${isSelected ? 14 : 10}px;
        height: ${isSelected ? 14 : 10}px;
        background-color: ${isSelected ? '#ffffff' : badgeColor};
        border-radius: 50%;
        border: 2px solid ${isSelected ? badgeColor : '#ffffff'};
      "></div>
    </div>
  `;

  return L.divIcon({
    className: "gis-station-pin",
    html: html,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

function MapRecenter({ lat, lng, zoom = 7 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

function MapScopeRecenter({ scope }: { scope: "NER" | "INDIA" }) {
  const map = useMap();
  useEffect(() => {
    if (scope === "INDIA") {
      map.setView([22.5, 82.0], 5, { animate: true });
    } else {
      map.setView([26.1445, 91.7362], 7, { animate: true });
    }
  }, [scope, map]);
  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapCoordinateTracker({ onMouseMove }: { onMouseMove: (lat: number, lng: number, zoom: number) => void }) {
  const map = useMapEvents({
    mousemove: (e) => {
      onMouseMove(e.latlng.lat, e.latlng.lng, map.getZoom());
    },
    zoomend: () => {
      const center = map.getCenter();
      onMouseMove(center.lat, center.lng, map.getZoom());
    }
  });
  return null;
}

interface WeatherMapInnerProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  activeLayer?: string;
  engine?: "google" | "maplibre" | "leaflet";
  onToggleEngine?: (engine: "google" | "maplibre" | "leaflet") => void;
  currentPoint?: any;
  monitoringScope?: "NER" | "INDIA";
}

export const WeatherMapInner: React.FC<WeatherMapInnerProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeLayer: propActiveLayer,
  engine,
  onToggleEngine,
  monitoringScope = "NER"
}) => {
  const [activeBasemap, setActiveBasemap] = useState<BasemapKey>("google");
  const [activeLayer, setActiveLayer] = useState<string>(propActiveLayer || "rainfall");
  const [layerOpacity, setLayerOpacity] = useState<number>(0.85);
  const [showRadius, setShowRadius] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [coordsHud, setCoordsHud] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: monitoringScope === "INDIA" ? 22.5 : 26.14,
    lng: monitoringScope === "INDIA" ? 82.0 : 91.73,
    zoom: monitoringScope === "INDIA" ? 5 : 6
  });

  const [gisData, setGisData] = useState<any>(null);
  const [layerLoading, setLayerLoading] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const myLoc = await addAndFetchMyLocation();
      if (myLoc) {
        onSelectLocation(myLoc);
      }
    } catch (err) {
      console.error("Locate Me error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const isNer = (lng >= 88.0 && lng <= 97.5 && lat >= 21.5 && lat <= 29.5);
      const customLoc = await createCustomLocation(
        lat,
        lng,
        `Point (${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E)`,
        isNer ? "Northeast India (NER)" : "All India Network"
      );
      if (customLoc) {
        onSelectLocation(customLoc);
      }
    } catch (e) {
      console.warn("Map click location registration failed:", e);
    }
  };

  // Fetch real GIS layer data from backend
  const fetchGisLayer = async (layerName: string) => {
    setLayerLoading(true);
    try {
      const scopeParam = monitoringScope ? `?scope=${monitoringScope}` : "";
      const res = await apiFetch(`/map/layers/${layerName}${scopeParam}`);
      if (res.ok) {
        const data = await res.json();
        setGisData(data);
      }
    } catch (e) {
      console.warn("GIS layer query failed:", e);
    } finally {
      setLayerLoading(false);
    }
  };

  useEffect(() => {
    fetchGisLayer(activeLayer);
  }, [activeLayer, monitoringScope]);

  // Geocoding search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiFetch(`/geocoding/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.warn("Geocoding failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    const loc: LocationItem = {
      id: item.id || 9999,
      name: item.name.split(",")[0],
      state: item.name.split(",")[1]?.trim() || "India",
      country: "India",
      latitude: item.latitude,
      longitude: item.longitude,
      elevation_m: item.elevation_m || 100,
      is_ner: item.is_ner ?? (item.longitude > 89.0 && item.latitude > 21.5 && item.latitude < 30.0)
    };
    onSelectLocation(loc);
    setSearchQuery("");
    setSearchResults([]);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Center on selected location or Guwahati, Assam default
  const defaultCenter: [number, number] = [26.1445, 91.7362];
  const center: [number, number] = selectedLocation 
    ? [selectedLocation.latitude, selectedLocation.longitude] 
    : defaultCenter;

  const currentBasemap = BASEMAPS[activeBasemap];

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full rounded-xl overflow-hidden border border-[#1e2c47] bg-[#090d16] flex flex-col map-container map-stacking-context ${
        isFullscreen ? "p-0" : ""
      }`}
      style={{ position: "relative", zIndex: 1, isolation: "isolate" }}
    >
      {/* TOP GIS COMMAND BAR */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Engine Switcher + GIS Layer Switcher */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Dual-Engine Switcher */}
          {onToggleEngine && (
            <div className="flex items-center bg-[#080d18]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg p-0.5 shadow-2xl">
              <button
                onClick={() => onToggleEngine("google")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  engine === "google"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Google Maps JavaScript API"
              >
                <span>Google Maps JS</span>
              </button>
              <button
                onClick={() => onToggleEngine("maplibre")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  engine === "maplibre"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="MapLibre GL: GPU WebGL 3D with Google Satellite"
              >
                <span>⚡ 3D (Google Sat)</span>
              </button>
              <button
                onClick={() => onToggleEngine("leaflet")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  engine === "leaflet"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Leaflet GIS: Classic 2D"
              >
                <span>Leaflet</span>
              </button>
            </div>
          )}

          {/* GIS Layer Switcher */}
          <div className="flex items-center gap-1 bg-[#0D1B2E]/95 backdrop-blur-md border border-[#233852] rounded-lg p-1 shadow-lg">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-[#00B8E6] border-r border-[#1E293B]">
              <Compass className="w-3.5 h-3.5 text-[#00B8E6]" />
              <span className="hidden sm:inline">GIS LAYER</span>
            </div>

            <button
              onClick={() => setActiveLayer("rainfall")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "rainfall"
                  ? "bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40"
                  : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
            >
              <Droplets className="w-3 h-3 text-[#00B8E6]" />
              <span>Rainfall</span>
            </button>

            <button
              onClick={() => setActiveLayer("temperature")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "temperature"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
            >
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>Thermal</span>
            </button>

            <button
              onClick={() => setActiveLayer("wind")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "wind"
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                  : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
            >
              <Wind className="w-3 h-3 text-blue-400" />
              <span>Wind</span>
            </button>

            <button
              onClick={() => setActiveLayer("disagreement")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "disagreement"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Uncertainty</span>
            </button>

            {layerLoading && (
              <RefreshCw className="w-3 h-3 text-[#00B8E6] animate-spin ml-1" />
            )}
          </div>
        </div>

        {/* Right: Search + Basemap Switcher + Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* GPS My Location Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0D1B2E]/95 hover:bg-emerald-500/10 backdrop-blur-md border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-semibold shadow-lg transition active:scale-95 disabled:opacity-50"
            title="Auto-detect current location (GPS / High Precision) & Pan Map"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            )}
            <span className="hidden sm:inline">{isLocating ? "Locating..." : "My Location"}</span>
          </button>
          
          {/* Geocoding Search */}
          <div className="relative">
            <div className="flex items-center bg-[#0D1B2E]/95 backdrop-blur-md border border-[#233852] rounded-lg px-2.5 py-1 text-xs shadow-lg focus-within:border-[#00B8E6]">
              <Search className="w-3.5 h-3.5 text-[#667B94] mr-1.5" />
              <input
                type="text"
                placeholder="Search city/station..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-[#F4F8FC] placeholder-[#667B94] focus:outline-none w-28 sm:w-36 text-xs"
              />
              {isSearching && <RefreshCw className="w-3 h-3 text-[#00B8E6] animate-spin ml-1" />}
            </div>

            {/* Search Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#0D1B2E] border border-[#233852] rounded-lg shadow-2xl overflow-hidden z-[1100] max-h-56 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 text-xs text-[#F4F8FC] hover:bg-[#14243A] border-b border-[#1E293B] flex items-center justify-between group transition"
                  >
                    <div>
                      <span className="font-semibold text-[#F4F8FC]">{item.name}</span>
                      <span className="block text-[10px] text-[#9DAFC4]">
                        {item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E
                      </span>
                    </div>
                    {item.is_ner && (
                      <span className="text-[9px] bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40 px-1.5 py-0.5 rounded font-mono">
                        NER
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Basemap Switcher (Google Default, MapTiler Selectable) */}
          <div className="bg-[#0D1B2E]/95 backdrop-blur-md border border-[#233852] rounded-lg p-0.5 flex items-center gap-1 shadow-lg">
            <button
              onClick={() => setActiveBasemap("google")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeBasemap === "google"
                  ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm"
                  : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
              title="Google Satellite (Default)"
            >
              <Globe className="w-3 h-3" />
              <span>Google 3D</span>
            </button>
            <button
              onClick={() => setActiveBasemap("maptiler")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeBasemap === "maptiler"
                  ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm"
                  : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
              title="MapTiler Satellite Imagery (Selectable)"
            >
              <Layers className="w-3 h-3" />
              <span>MapTiler</span>
            </button>
            <button
              onClick={() => setActiveBasemap("satellite")}
              className={`p-1.5 rounded transition ${
                activeBasemap === "satellite" ? "bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40" : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
              title="High-Resolution Satellite Imagery (ESRI)"
            >
              <Satellite className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveBasemap("osm")}
              className={`p-1.5 rounded text-[10px] font-medium transition ${
                activeBasemap === "osm" ? "bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40" : "text-[#9DAFC4] hover:text-[#F4F8FC]"
              }`}
              title="Standard Street / Administrative Map"
            >
              Street
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-[#0D1B2E]/95 backdrop-blur-md border border-[#233852] rounded-lg text-[#9DAFC4] hover:text-[#F4F8FC] hover:border-[#00B8E6] transition shadow-lg"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen GIS View"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>


      {/* LEAFLET MAP CONTAINER */}
      <div className="w-full h-full flex-1">
        <MapContainer
          center={center}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", background: "#0c1322" }}
        >
          {/* Active Clean Basemap (Zero Watermark) */}
          <TileLayer
            key={activeBasemap}
            url={currentBasemap.url}
            attribution={currentBasemap.attribution}
            maxZoom={currentBasemap.maxZoom}
            opacity={activeBasemap === "satellite" ? 0.95 : 1.0}
          />

          {/* Scope-based Recenter & Center Tracker */}
          {selectedLocation ? (
            <MapRecenter lat={selectedLocation.latitude} lng={selectedLocation.longitude} />
          ) : (
            <MapScopeRecenter scope={monitoringScope} />
          )}

          {/* Coordinate HUD Event Tracker */}
          <MapCoordinateTracker
            onMouseMove={(lat, lng, zoom) => setCoordsHud({ lat, lng, zoom })}
          />

          {/* Click Anywhere on Map to Inspect Location (Requirement 14) */}
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Highlight Surveillance Envelope */}
          {showRadius && (
            monitoringScope === "INDIA" ? (
              <>
                <Circle
                  center={[28.61, 77.20]} // Northern National Hub
                  radius={350000}
                  pathOptions={{
                    color: "#10b981",
                    fillColor: "#10b981",
                    fillOpacity: 0.02,
                    dashArray: "4, 8",
                    weight: 1.2,
                  }}
                />
                <Circle
                  center={[19.07, 72.87]} // Western Maritime Hub
                  radius={300000}
                  pathOptions={{
                    color: "#06b6d4",
                    fillColor: "#06b6d4",
                    fillOpacity: 0.02,
                    dashArray: "4, 8",
                    weight: 1.2,
                  }}
                />
              </>
            ) : (
              <>
                <Circle
                  center={[26.14, 91.73]}
                  radius={240000} // 240km Doppler radar radius
                  pathOptions={{
                    color: "#06b6d4",
                    fillColor: "#06b6d4",
                    fillOpacity: 0.03,
                    dashArray: "4, 8",
                    weight: 1.5,
                  }}
                />
                <Circle
                  center={[26.14, 91.73]}
                  radius={120000}
                  pathOptions={{
                    color: "#3b82f6",
                    fillColor: "#3b82f6",
                    fillOpacity: 0.02,
                    dashArray: "2, 6",
                    weight: 1.0,
                  }}
                />
              </>
            )
          )}

          {/* Render GIS Stations & Data Layers (Deduplicated so at most ONE user location exists) */}
          {(() => {
            const isUserLocItem = (l: LocationItem) =>
              l.name.includes("📍") ||
              l.name.toLowerCase().includes("my") ||
              l.district === "User Location" ||
              l.district === "Active Tracking";

            const activeUserLoc = (selectedLocation && isUserLocItem(selectedLocation))
              ? selectedLocation
              : locations.find(isUserLocItem);

            const renderedLocations: LocationItem[] = [];
            let userLocIncluded = false;
            for (const loc of locations) {
              if (isUserLocItem(loc)) {
                if (!userLocIncluded) {
                  renderedLocations.push(activeUserLoc || loc);
                  userLocIncluded = true;
                }
              } else {
                renderedLocations.push(loc);
              }
            }
            return renderedLocations;
          })().map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            
            // Find corresponding GeoJSON property if fetched
            const feat = gisData?.features?.find(
              (f: any) => f.properties?.location_id === loc.id
            );
            const props = feat?.properties || {};
            const primaryVal = props.primary_value ?? (activeLayer === "rainfall" ? 1.2 : 26.5);

            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={createGisStationIcon(isSelected, loc.is_ner, primaryVal, activeLayer)}
                eventHandlers={{
                  click: () => onSelectLocation(loc),
                }}
              >
                <Popup className="gis-custom-popup">
                  <div className="bg-[#0D1B2E] text-[#F4F8FC] p-2.5 rounded-lg space-y-2 text-xs border border-[#233852] min-w-[210px] shadow-2xl">
                    <div className="border-b border-[#1E293B] pb-1.5">
                      <div className="font-bold text-sm text-[#00B8E6] flex items-center justify-between">
                        <span>{loc.name}</span>
                        {loc.is_ner && (
                          <span className="text-[9px] bg-[#00B8E6]/20 text-[#00B8E6] border border-[#00B8E6]/40 px-1 rounded font-mono">
                            NER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#9DAFC4]">{loc.state} • Elev: {loc.elevation_m}m</div>
                      <div className="text-[10px] font-mono text-[#667B94]">
                        {loc.latitude.toFixed(4)}°N, {loc.longitude.toFixed(4)}°E
                      </div>
                    </div>

                    {/* Meteorological Variables */}
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#081426] p-2 rounded border border-[#1E293B]">
                      <div>
                        <span className="text-[#667B94] text-[10px] block">BLENDED RAIN</span>
                        <span className="font-mono font-bold text-[#00B8E6]">
                          {props.rainfall_mm != null ? `${props.rainfall_mm.toFixed(1)} mm` : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667B94] text-[10px] block">TEMPERATURE</span>
                        <span className="font-mono font-bold text-amber-400">
                          {props.temperature_c != null ? `${props.temperature_c.toFixed(1)} °C` : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667B94] text-[10px] block">WIND SPEED</span>
                        <span className="font-mono font-bold text-blue-400">
                          {props.wind_speed_ms != null ? `${props.wind_speed_ms.toFixed(1)} m/s` : "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#667B94] text-[10px] block">SPREAD (±σ)</span>
                        <span className="font-mono font-bold text-rose-400">
                          {props.disagreement_std != null ? `±${props.disagreement_std.toFixed(1)}` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {props.weather_regime && (
                      <div className="text-[10px] text-[#F4F8FC] bg-[#14243A] p-1.5 rounded border border-[#233852]">
                        <span className="font-semibold text-[#00B8E6]">Regime:</span> {props.weather_regime}
                      </div>
                    )}

                    <button 
                      onClick={() => onSelectLocation(loc)}
                      className="w-full py-1.5 px-2 text-xs font-semibold bg-gradient-to-r from-[#00B8E6] to-[#1687FF] hover:brightness-110 text-white rounded-md transition shadow-md"
                    >
                      {isSelected ? "Current Station Active" : "Analyze This Station"}
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* BOTTOM GIS STATUS & CONTROLS HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: GIS Layer Legend */}
        <div className="bg-[#0D1B2E]/95 backdrop-blur-md border border-[#233852] rounded-lg px-3 py-2 text-[11px] text-[#F4F8FC] space-y-1 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between gap-3 text-[9px] font-bold text-[#667B94] uppercase tracking-wider">
            <span>{activeLayer.toUpperCase()} CLASSIFICATION</span>
            <span className="text-[#00B8E6] font-mono">{BASEMAPS[activeBasemap].name}</span>
          </div>

          {activeLayer === "rainfall" && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#9DAFC4]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00B8E6]"></span>&lt;2.5mm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>2.5-15mm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>15-64mm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>&gt;64.5mm</span>
            </div>
          )}

          {activeLayer === "temperature" && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#9DAFC4]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>&lt;20°C</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>20-28°C</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>28-35°C</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>&gt;35°C</span>
            </div>
          )}

          {activeLayer === "disagreement" && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#9DAFC4]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>High Agreement</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Moderate Spread</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>High Disagreement</span>
            </div>
          )}

          {activeLayer === "wind" && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#9DAFC4]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Light (&lt;8 m/s)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span>Gale (8-15 m/s)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Storm (&gt;15 m/s)</span>
            </div>
          )}
        </div>

        {/* Right: Live Geographic Coordinates HUD */}
        <div className="bg-[#0D1B2E]/95 backdrop-blur-md border border-[#233852] rounded-lg px-3 py-1.5 text-[11px] font-mono text-[#F4F8FC] shadow-xl flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1 text-[#00B8E6]">
            <Crosshair className="w-3 h-3" />
            <span>LAT: {coordsHud.lat.toFixed(4)}°N</span>
            <span className="text-[#233852]">|</span>
            <span>LON: {coordsHud.lng.toFixed(4)}°E</span>
          </div>
          <span className="text-[10px] text-[#9DAFC4] bg-[#081426] border border-[#233852] px-1.5 py-0.5 rounded">
            Z: {coordsHud.zoom}
          </span>
          <button
            onClick={() => setShowRadius(!showRadius)}
            className={`text-[10px] px-2 py-0.5 rounded border transition ${
              showRadius 
                ? "bg-[#00B8E6]/20 text-[#00B8E6] border-[#00B8E6]/40" 
                : "bg-[#081426] text-[#9DAFC4] border-[#233852] hover:text-[#F4F8FC]"
            }`}
          >
            Radar Envelope
          </button>
        </div>

      </div>

    </div>
  );
};
