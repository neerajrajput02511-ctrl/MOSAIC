"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { 
  Compass, Droplets, Thermometer, Wind, AlertTriangle, 
  Search, RefreshCw, Layers, Globe, Satellite, Mountain, 
  Maximize2, Minimize2, Crosshair, Box, Loader2, Navigation
} from "lucide-react";
import { LocationItem } from "@/types";
import { addAndFetchMyLocation } from "@/services/locationService";

interface MapLibreViewProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  activeLayer?: string;
  engine?: "google" | "maplibre" | "leaflet";
  onToggleEngine?: (engine: "google" | "maplibre" | "leaflet") => void;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";

const STYLES = {
  "maptiler-satellite": {
    name: "MapTiler 3D Satellite",
    style: MAPTILER_KEY 
      ? `https://api.maptiler.com/maps/satellite/style.json?key=${MAPTILER_KEY}`
      : "https://demotiles.maplibre.org/style.json"
  },
  "maptiler-topo": {
    name: "MapTiler 3D Relief",
    style: MAPTILER_KEY
      ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`
      : "https://demotiles.maplibre.org/style.json"
  },
  "google-satellite": {
    name: "Google 3D Satellite",
    style: {
      version: 8 as const,
      sources: {
        "google-sat": {
          type: "raster" as const,
          tiles: GOOGLE_KEY ? [
            `https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`,
            `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`,
            `https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`,
            `https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`
          ] : [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 256,
          attribution: "Imagery &copy; Google Maps"
        }
      },
      layers: [
        {
          id: "base-tiles",
          type: "raster" as const,
          source: "google-sat",
          minzoom: 0,
          maxzoom: 22
        }
      ]
    }
  },
  satellite: {
    name: "Esri Satellite GIS",
    style: {
      version: 8 as const,
      sources: {
        "esri-sat": {
          type: "raster" as const,
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 256,
          attribution: "Esri High-Resolution World Imagery"
        }
      },
      layers: [
        {
          id: "base-tiles",
          type: "raster" as const,
          source: "esri-sat",
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },
  dark: {
    name: "Dark Tactical",
    style: {
      version: 8 as const,
      sources: {
        "esri-dark": {
          type: "raster" as const,
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          ],
          tileSize: 256,
          attribution: "Esri World Dark Gray"
        }
      },
      layers: [
        {
          id: "base-tiles",
          type: "raster" as const,
          source: "esri-dark",
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  },
  topo: {
    name: "Topographic",
    style: {
      version: 8 as const,
      sources: {
        "opentopo": {
          type: "raster" as const,
          tiles: [
            "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://b.tile.opentopomap.org/{z}/{x}/{y}.png",
            "https://c.tile.opentopomap.org/{z}/{x}/{y}.png"
          ],
          tileSize: 256,
          attribution: "OpenTopoMap"
        }
      },
      layers: [
        {
          id: "base-tiles",
          type: "raster" as const,
          source: "opentopo",
          minzoom: 0,
          maxzoom: 17
        }
      ]
    }
  },
  vector: {
    name: "Vector MapLibre",
    style: "https://demotiles.maplibre.org/style.json"
  }
};

type StyleKey = keyof typeof STYLES;

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeLayer: propActiveLayer,
  engine = "maplibre",
  onToggleEngine
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // DEFAULTS: GOOGLE 3D SATELLITE AS DEFAULT, MAPTILER AS SELECTABLE, RAINFALL SCENARIO
  const [activeStyleKey, setActiveStyleKey] = useState<StyleKey>("google-satellite");
  const [activeLayer, setActiveLayer] = useState<string>(propActiveLayer || "rainfall");
  const [layerLoading, setLayerLoading] = useState<boolean>(false);
  const [is3dPitch, setIs3dPitch] = useState<boolean>(true);
  const [gisData, setGisData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [coordsHud, setCoordsHud] = useState({ lat: 26.14, lng: 91.73, zoom: 6.2, pitch: 48 });
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const myLoc = await addAndFetchMyLocation();
      if (myLoc) {
        onSelectLocation(myLoc);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [myLoc.longitude, myLoc.latitude],
            zoom: 8.5,
            pitch: 58,
            bearing: -15,
            speed: 1.4,
            curve: 1.2,
            essential: true
          });
        }
      }
    } catch (err) {
      console.error("Locate Me error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  const fetchGisLayer = async (layerName: string) => {
    setLayerLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/map/layers/${layerName}`);
      if (res.ok) {
        const data = await res.json();
        setGisData(data);
      }
    } catch (e) {
      console.warn("MapLibre layer query error:", e);
    } finally {
      setLayerLoading(false);
    }
  };

  useEffect(() => {
    fetchGisLayer(activeLayer);
  }, [activeLayer, locations.length]);

  // Initialize MapLibre GL Map with Satellite & 3D Perspective as Default
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] = selectedLocation 
      ? [selectedLocation.longitude, selectedLocation.latitude]
      : [91.7362, 26.1445];

    const currentStyle = STYLES[activeStyleKey].style;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: currentStyle,
      center: initialCenter,
      zoom: 6.2,
      pitch: is3dPitch ? 54 : 0, // Deep 3D Perspective Tilt by Default
      bearing: is3dPitch ? -18 : 0, // Real 3D oblique camera rotation
      attributionControl: false
    });

    // Add navigation controls (zoom & 3D compass)
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    // Add 3D RGB-DEM Terrain Elevation when map loads
    map.on("load", () => {
      try {
        if (!map.getSource("maptiler-terrain")) {
          map.addSource("maptiler-terrain", {
            type: "raster-dem",
            url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
            tileSize: 512,
            maxzoom: 14
          });
          map.setTerrain({ source: "maptiler-terrain", exaggeration: 1.5 });
        }
      } catch (err) {
        console.warn("MapTiler 3D Terrain init:", err);
      }
    });

    map.on("mousemove", (e) => {
      setCoordsHud({
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        zoom: Math.round(map.getZoom() * 10) / 10,
        pitch: Math.round(map.getPitch())
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [activeStyleKey]);

  // Update map center when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;
    mapRef.current.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: 7,
      essential: true,
      speed: 1.2
    });
  }, [selectedLocation]);

  // Render WebGL Markers and popups
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Helper: is this a user-originated GPS/custom location?
    const isUserLocItem = (l: LocationItem) =>
      l.name.includes("📍") ||
      l.name.toLowerCase().includes("my") ||
      l.district === "User Location" ||
      l.district === "Active Tracking";

    // 1. Identify the single active live GPS user location
    const activeUserLoc = (selectedLocation && isUserLocItem(selectedLocation))
      ? selectedLocation
      : locations.find(isUserLocItem);

    // 2. Filter locations to guarantee strictly at most ONE user location marker on the map
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

    renderedLocations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const feat = gisData?.features?.find((f: any) => f.properties?.location_id === loc.id);
      const props = feat?.properties || {};

      let badgeColor = "#06b6d4";
      let label = "";

      // ONLY the single live user GPS location gets the YOU badge & radar animation
      const isUserLocation = Boolean(activeUserLoc && loc.id === activeUserLoc.id);

      if (activeLayer === "rainfall") {
        const val = props.rainfall_mm ?? 1.2;
        label = `${val.toFixed(1)}mm`;
        if (val > 64.5) badgeColor = "#ef4444";
        else if (val > 15.5) badgeColor = "#f97316";
        else if (val > 2.5) badgeColor = "#eab308";
        else badgeColor = "#06b6d4";
      } else if (activeLayer === "temperature") {
        const val = props.temperature_c ?? 26.5;
        label = `${val.toFixed(1)}°`;
        badgeColor = val > 35 ? "#ef4444" : val > 28 ? "#f97316" : val > 20 ? "#10b981" : "#3b82f6";
      } else if (activeLayer === "wind") {
        const val = props.wind_speed_ms ?? 3.2;
        label = `${val.toFixed(1)}m/s`;
        badgeColor = val > 15 ? "#ef4444" : val > 8 ? "#f97316" : "#3b82f6";
      } else if (activeLayer === "disagreement") {
        const val = props.disagreement_std ?? 0.8;
        label = `±${val.toFixed(1)}`;
        badgeColor = val > 2.5 ? "#ef4444" : val > 1.2 ? "#f97316" : "#10b981";
      } else {
        label = loc.is_ner ? "NER" : "NAT";
      }

      // Create Custom DOM Element for MapLibre Marker
      const el = document.createElement("div");
      el.className = "maplibre-station-marker";
      el.style.display = "flex";
      el.style.flexDirection = "column";
      el.style.alignItems = "center";
      el.style.cursor = "pointer";

      const ringStyle = isSelected
        ? "border: 2px solid #ffffff; box-shadow: 0 0 16px #06b6d4, 0 0 30px rgba(6,182,212,0.8);"
        : isUserLocation
        ? "border: 2px solid #34d399; box-shadow: 0 0 16px rgba(16,185,129,0.9);"
        : "border: 1px solid rgba(255,255,255,0.7); box-shadow: 0 0 8px rgba(0,0,0,0.6);";

      const displayBadge = isUserLocation ? `📍 YOU (${label})` : label;
      const markerColor = isUserLocation ? "#10b981" : badgeColor;

      el.innerHTML = `
        <div style="
          background: ${isUserLocation ? '#059669' : badgeColor};
          color: #ffffff;
          font-family: monospace;
          font-weight: 700;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 9999px;
          white-space: nowrap;
          margin-bottom: 2px;
          ${ringStyle}
        ">${displayBadge}</div>
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          ${isUserLocation ? `
            <div style="
              position: absolute;
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: rgba(16, 185, 129, 0.35);
              border: 1.5px solid #10b981;
              box-shadow: 0 0 12px #10b981;
              pointer-events: none;
            "></div>
          ` : ''}
          <div style="
            width: ${isSelected ? 14 : isUserLocation ? 13 : 10}px;
            height: ${isSelected ? 14 : isUserLocation ? 13 : 10}px;
            background-color: ${isSelected ? '#ffffff' : markerColor};
            border-radius: 50%;
            border: 2px solid ${isSelected ? markerColor : '#ffffff'};
            z-index: 2;
          "></div>
        </div>
      `;

      // Popup Content
      const popupHtml = `
        <div style="background:#0c1322; color:#f1f5f9; padding:8px; border-radius:8px; font-size:12px; border:1px solid #1e2c47; min-width:190px;">
          <div style="border-bottom:1px solid #1e2c47; padding-bottom:4px; margin-bottom:6px;">
            <div style="font-weight:700; color:#67e8f9; font-size:13px;">${loc.name}</div>
            <div style="color:#94a3b8; font-size:11px;">${loc.state} • Elev: ${loc.elevation_m}m</div>
            <div style="color:#64748b; font-family:monospace; font-size:10px;">${loc.latitude.toFixed(4)}°N, ${loc.longitude.toFixed(4)}°E</div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:11px; margin-bottom:8px; background:#111a2e; padding:6px; border-radius:4px;">
            <div><span style="color:#94a3b8; font-size:9px; display:block;">RAIN</span><b style="color:#67e8f9;">${props.rainfall_mm != null ? props.rainfall_mm.toFixed(1) : "0.0"} mm</b></div>
            <div><span style="color:#94a3b8; font-size:9px; display:block;">TEMP</span><b style="color:#fbbf24;">${props.temperature_c != null ? props.temperature_c.toFixed(1) : "25.0"} °C</b></div>
            <div><span style="color:#94a3b8; font-size:9px; display:block;">WIND</span><b style="color:#93c5fd;">${props.wind_speed_ms != null ? props.wind_speed_ms.toFixed(1) : "3.0"} m/s</b></div>
            <div><span style="color:#94a3b8; font-size:9px; display:block;">SPREAD</span><b style="color:#f87171;">±${props.disagreement_std != null ? props.disagreement_std.toFixed(1) : "0.0"}</b></div>
          </div>
          ${props.weather_regime ? `<div style="font-size:10px; color:#cbd5e1; margin-bottom:6px; background:rgba(6,182,212,0.15); padding:3px 6px; border-radius:4px;">Regime: <b>${props.weather_regime}</b></div>` : ""}
          <button id="btn-select-${loc.id}" style="width:100%; padding:4px 8px; font-size:11px; font-weight:600; background:#0891b2; color:#ffffff; border:none; border-radius:4px; cursor:pointer;">
            ${isSelected ? "Active Station" : "Analyze Station"}
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 15, closeButton: false })
        .setHTML(popupHtml);

      popup.on("open", () => {
        const btn = document.getElementById(`btn-select-${loc.id}`);
        if (btn) {
          btn.onclick = () => onSelectLocation(loc);
        }
      });

      if (mapRef.current) {
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([loc.longitude, loc.latitude])
          .setPopup(popup)
          .addTo(mapRef.current);

        el.addEventListener("click", () => onSelectLocation(loc));
        markersRef.current.push(marker);
      }
    });
  }, [locations, selectedLocation, gisData, activeLayer]);

  // Toggle 3D Perspective Pitch
  const toggle3dPitch = () => {
    if (!mapRef.current) return;
    const nextPitch = !is3dPitch;
    setIs3dPitch(nextPitch);
    mapRef.current.easeTo({
      pitch: nextPitch ? 56 : 0,
      bearing: nextPitch ? -22 : 0,
      duration: 1000
    });
  };

  // Search handler
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`http://localhost:8000/api/geocoding/search?q=${encodeURIComponent(query)}`);
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

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-[#1e2c47] bg-[#0c1322] flex flex-col shadow-2xl">
      
      {/* TOP CONTROL BAR */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
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
                title="Google Maps 3D WebGL (Active Key)"
              >
                <Globe className="w-3 h-3 text-emerald-300" />
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

          {/* GIS Layer Switcher (Default: Rainfall) */}
          <div className="flex items-center gap-1 bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg p-1 shadow-2xl">
            <button
              onClick={() => setActiveLayer("rainfall")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "rainfall"
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Droplets className="w-3 h-3 text-cyan-400" />
              <span>Rainfall</span>
            </button>

            <button
              onClick={() => setActiveLayer("temperature")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "temperature"
                  ? "bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Thermometer className="w-3 h-3 text-amber-400" />
              <span>Temp</span>
            </button>

            <button
              onClick={() => setActiveLayer("wind")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "wind"
                  ? "bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Wind className="w-3 h-3 text-blue-400" />
              <span>Wind</span>
            </button>

            <button
              onClick={() => setActiveLayer("disagreement")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                activeLayer === "disagreement"
                  ? "bg-red-500/25 text-red-300 border border-red-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span>Spread</span>
            </button>

            {layerLoading && <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin ml-1" />}
          </div>
        </div>

        {/* Right: Geocoding Search & MapLibre Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">

          {/* GPS My Location Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0c1322]/95 hover:bg-emerald-950/40 backdrop-blur-md border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-lg text-xs font-semibold shadow-xl transition active:scale-95 disabled:opacity-50"
            title="Auto-detect current location (GPS / High Precision) & Fly 3D Camera"
          >
            {isLocating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Crosshair className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            )}
            <span className="hidden sm:inline">{isLocating ? "Locating..." : "My Location"}</span>
          </button>
          
          {/* Search Box */}
          <div className="relative">
            <div className="flex items-center bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg px-2.5 py-1 text-xs shadow-xl">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
              <input
                type="text"
                placeholder="Search station/city..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none w-28 sm:w-36 text-xs"
              />
              {isSearching && <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin ml-1" />}
            </div>

            {/* Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1.5 left-0 right-0 bg-[#0c1322] border border-[#1e2c47] rounded-lg shadow-2xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-cyan-950/60 border-b border-[#1e2c47]/50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-100">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">
                        {item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E
                      </span>
                    </div>
                    {item.is_ner && (
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded">
                        NER
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D Pitch Toggle */}
          <button
            onClick={toggle3dPitch}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-semibold transition flex items-center gap-1 shadow-xl ${
              is3dPitch 
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" 
                : "bg-[#0c1322]/95 text-slate-400 hover:text-white border-[#1e2c47]"
            }`}
            title="Toggle 3D Oblique Perspective (MapLibre WebGL)"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{is3dPitch ? "3D" : "2D"}</span>
          </button>

          {/* 3D Basemap Selector (Google 3D Default, MapTiler Selectable) */}
          <div className="bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg p-0.5 flex items-center gap-1 shadow-xl">
            <button
              onClick={() => setActiveStyleKey("google-satellite")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeStyleKey === "google-satellite"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Google 3D Satellite Imagery (Default)"
            >
              <Globe className="w-3 h-3 text-emerald-300" />
              <span>Google 3D</span>
            </button>
            <button
              onClick={() => setActiveStyleKey("maptiler-satellite")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeStyleKey === "maptiler-satellite"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="MapTiler 3D Satellite Imagery (Selectable)"
            >
              <Layers className="w-3 h-3 text-cyan-300" />
              <span>MapTiler 3D</span>
            </button>
            <button
              onClick={() => setActiveStyleKey("maptiler-topo")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeStyleKey === "maptiler-topo"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
              title="MapTiler 3D Topographic Relief (Selectable)"
            >
              <Mountain className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">MapTiler Topo</span>
            </button>
            <button
              onClick={() => setActiveStyleKey("dark")}
              className={`p-1.5 rounded text-[10px] font-mono transition ${
                activeStyleKey === "dark" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40" : "text-slate-400 hover:text-white"
              }`}
              title="Dark Tactical Style"
            >
              Dark
            </button>
          </div>
        </div>

      </div>

      {/* MAPLIBRE GL CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* BOTTOM HUD */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Classification Legend */}
        <div className="bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg px-3 py-1.5 text-[11px] text-slate-300 space-y-1 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            <span>3D WEBGL ENGINE • {activeLayer.toUpperCase()}</span>
            <span className="text-emerald-400 font-mono">⚡ {STYLES[activeStyleKey].name} (KEY ACTIVATED)</span>
          </div>

          {activeLayer === "rainfall" && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span>&lt;2.5mm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>2.5-15mm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>15-64mm</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>&gt;64.5mm</span>
            </div>
          )}

          {activeLayer === "temperature" && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>&lt;20°C</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>20-28°C</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>28-35°C</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>&gt;35°C</span>
            </div>
          )}

          {activeLayer === "wind" && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>Light</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>Gale</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Storm</span>
            </div>
          )}

          {activeLayer === "disagreement" && (
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span>Low</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span>Moderate</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>High Spread</span>
            </div>
          )}
        </div>

        {/* Live Coordinates HUD */}
        <div className="bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 shadow-2xl flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-1 text-cyan-400">
            <Crosshair className="w-3 h-3" />
            <span>LAT: {coordsHud.lat.toFixed(4)}°N</span>
            <span className="text-slate-600">|</span>
            <span>LON: {coordsHud.lng.toFixed(4)}°E</span>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded">
            Z: {coordsHud.zoom}
          </span>
          {coordsHud.pitch > 0 && (
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">
              PITCH: {coordsHud.pitch}°
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
