"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  Compass, Droplets, Thermometer, Wind, AlertTriangle, 
  Search, RefreshCw, Layers, Globe, Satellite, Mountain, 
  Maximize2, Minimize2, Crosshair, Box, CheckCircle2, ShieldCheck, Zap,
  Loader2
} from "lucide-react";
import { LocationItem } from "@/types";
import { addAndFetchMyLocation } from "@/services/locationService";

export interface GoogleMap3DViewProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  activeLayer?: string;
  engine?: "google" | "maplibre" | "leaflet";
  onToggleEngine?: (engine: "google" | "maplibre" | "leaflet") => void;
}

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDMATo2x1vn0jGZ8WVvTgfXxa5SzaZm0WI";

// Helper to load Google Maps script once
function loadGoogleMaps(apiKey: string): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if ((window as any).google?.maps) {
      resolve((window as any).google);
      return;
    }

    const scriptId = "google-maps-api-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve((window as any).google);
      script.onerror = (e) => reject(new Error("Failed to load Google Maps script"));
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => resolve((window as any).google));
      script.addEventListener("error", (e) => reject(e));
    }
  });
}

export const GoogleMap3DView: React.FC<GoogleMap3DViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  activeLayer: propActiveLayer,
  engine = "google",
  onToggleEngine
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const [activeLayer, setActiveLayer] = useState<string>(propActiveLayer || "rainfall");
  const [layerLoading, setLayerLoading] = useState<boolean>(false);
  const [is3dPitch, setIs3dPitch] = useState<boolean>(true);
  const [gisData, setGisData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [coordsHud, setCoordsHud] = useState({ lat: 26.14, lng: 91.73, zoom: 7.0, tilt: 45, heading: -14 });
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const myLoc = await addAndFetchMyLocation();
      if (myLoc) {
        onSelectLocation(myLoc);
        if (mapRef.current) {
          mapRef.current.panTo({ lat: myLoc.latitude, lng: myLoc.longitude });
          mapRef.current.setZoom(10);
        }
      }
    } catch (err) {
      console.error("Locate Me error:", err);
    } finally {
      setIsLocating(false);
    }
  };

  // Fetch real GIS layer data from backend
  const fetchGisLayer = async (layerName: string) => {
    setLayerLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/map/layers/${layerName}`);
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
  }, [activeLayer]);

  // Initialize Google Maps in 3D Satellite / Hybrid mode
  useEffect(() => {
    let isCancelled = false;

    loadGoogleMaps(GOOGLE_API_KEY)
      .then((google) => {
        if (isCancelled || !mapContainerRef.current) return;

        const initialCenter = selectedLocation 
          ? { lat: selectedLocation.latitude, lng: selectedLocation.longitude }
          : { lat: 26.1445, lng: 91.7362 }; // Guwahati, Assam (NER hub)

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 7,
          mapId: "DEMO_MAP_ID", // Enables WebGL vector rendering
          mapTypeId: "hybrid", // Satellite Imagery + Road & Boundary Labels
          tilt: is3dPitch ? 45 : 0, // 3D Perspective Tilt by Default
          heading: is3dPitch ? -14 : 0, // 3D Camera Oblique Heading
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          rotateControl: true,
          backgroundColor: "#080d18"
        });

        infoWindowRef.current = new google.maps.InfoWindow();

        map.addListener("center_changed", () => {
          const c = map.getCenter();
          if (c) {
            setCoordsHud(prev => ({
              ...prev,
              lat: Math.round(c.lat() * 100) / 100,
              lng: Math.round(c.lng() * 100) / 100,
              zoom: Math.round((map.getZoom() || 7) * 10) / 10,
              tilt: map.getTilt() || 0,
              heading: Math.round(map.getHeading() || 0)
            }));
          }
        });

        mapRef.current = map;
        setMapLoaded(true);
      })
      .catch((err) => {
        console.error("Google Maps load failed:", err);
        setMapError(err.message || "Failed to load Google Maps 3D WebGL engine");
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update center when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;
    mapRef.current.panTo({
      lat: selectedLocation.latitude,
      lng: selectedLocation.longitude
    });
    mapRef.current.setZoom(8);
  }, [selectedLocation]);

  // Update Weather Station Markers on the Google 3D Map
  useEffect(() => {
    if (!mapRef.current || !(window as any).google?.maps) return;
    const google = (window as any).google;

    // Clear existing markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // Helper to get real layer value
    const getLayerVal = (loc: LocationItem) => {
      if (!gisData || !gisData.features) return null;
      const feat = gisData.features.find((f: any) => 
        Math.abs(f.geometry.coordinates[1] - loc.latitude) < 0.05 &&
        Math.abs(f.geometry.coordinates[0] - loc.longitude) < 0.05
      );
      if (feat && feat.properties) {
        if (activeLayer === "rainfall") return feat.properties.precip_mm ?? feat.properties.rainfall_mm;
        if (activeLayer === "temperature") return feat.properties.temp_c;
        if (activeLayer === "wind") return feat.properties.wind_speed_ms;
        if (activeLayer === "disagreement") return feat.properties.disagreement_std;
      }
      return null;
    };

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const val = getLayerVal(loc);

      // Determine Badge Label and Color
      let label = "";
      let pinColor = "#06b6d4";

      if (activeLayer === "rainfall") {
        const v = val ?? 0;
        label = `${v.toFixed(1)}mm`;
        if (v > 64.5) pinColor = "#ef4444";      // Extremely Heavy (IMD Red)
        else if (v > 15.5) pinColor = "#f97316"; // Heavy (Orange)
        else if (v > 2.5) pinColor = "#eab308";  // Moderate (Yellow)
        else pinColor = "#06b6d4";               // Light (Cyan)
      } else if (activeLayer === "temperature") {
        const v = val ?? 24;
        label = `${v.toFixed(1)}°`;
        pinColor = v > 35 ? "#ef4444" : v > 28 ? "#f97316" : v > 20 ? "#10b981" : "#3b82f6";
      } else if (activeLayer === "wind") {
        const v = val ?? 3;
        label = `${v.toFixed(1)}m/s`;
        pinColor = v > 15 ? "#ef4444" : v > 8 ? "#f97316" : "#3b82f6";
      } else {
        label = `±${(val ?? 0.5).toFixed(1)}`;
        pinColor = (val ?? 0) > 2.5 ? "#ef4444" : "#10b981";
      }

      // SVG Icon with value badge
      const markerSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="38" viewBox="0 0 60 38">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${pinColor}" flood-opacity="0.8"/>
            </filter>
          </defs>
          <g filter="url(#glow)">
            <rect x="2" y="2" width="56" height="20" rx="10" fill="${pinColor}" stroke="#ffffff" stroke-width="${isSelected ? '2.5' : '1.2'}"/>
            <text x="30" y="16" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">${label}</text>
          </g>
          <circle cx="30" cy="29" r="${isSelected ? '6' : '4'}" fill="#ffffff" stroke="${pinColor}" stroke-width="2"/>
        </svg>
      `;

      const marker = new google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapRef.current,
        title: `${loc.name} (${label})`,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
          scaledSize: new google.maps.Size(60, 38),
          anchor: new google.maps.Point(30, 29)
        },
        zIndex: isSelected ? 999 : 100
      });

      marker.addListener("click", () => {
        onSelectLocation(loc);

        const content = `
          <div style="background:#0c1322; color:#ffffff; padding:12px; border-radius:8px; border:1px solid #1e2c47; font-family:sans-serif; min-width:200px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-weight:bold; font-size:14px; color:#38bdf8;">${loc.name}</span>
              <span style="background:${loc.is_ner ? '#0284c7' : '#475569'}; color:#fff; font-size:9px; padding:2px 6px; border-radius:4px; font-weight:bold;">
                ${loc.is_ner ? 'NER REGION' : 'NATIONAL'}
              </span>
            </div>
            <div style="font-size:11px; color:#94a3b8; margin-bottom:8px;">
              ${loc.state} &bull; ${loc.latitude.toFixed(2)}°N, ${loc.longitude.toFixed(2)}°E &bull; Elev: ${loc.elevation_m}m
            </div>
            <div style="background:#111c33; padding:8px; border-radius:6px; font-family:monospace; font-size:11px; display:flex; justify-content:space-between; margin-bottom:8px;">
              <span style="color:#94a3b8;">${activeLayer.toUpperCase()}:</span>
              <span style="color:${pinColor}; font-weight:bold;">${label}</span>
            </div>
            <div style="font-size:10px; color:#64748b; text-align:center;">
              ⚡ Google Maps 3D WebGL Satellite Active
            </div>
          </div>
        `;

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(mapRef.current, marker);
        }
      });

      markersRef.current.push(marker);
    });
  }, [locations, selectedLocation, gisData, activeLayer, mapLoaded]);

  // Toggle 3D Perspective Tilt
  const toggle3dPitch = () => {
    if (!mapRef.current) return;
    const next3d = !is3dPitch;
    setIs3dPitch(next3d);
    mapRef.current.setTilt(next3d ? 45 : 0);
    mapRef.current.setHeading(next3d ? -14 : 0);
  };

  // Recenter on default NER coordinates
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.panTo({ lat: 26.1445, lng: 91.7362 });
    mapRef.current.setZoom(7);
    mapRef.current.setTilt(is3dPitch ? 45 : 0);
    mapRef.current.setHeading(is3dPitch ? -14 : 0);
  };

  // Geocoding search handler
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
          {/* Engine Switcher */}
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
                <Zap className="w-3 h-3" />
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
              title="Precipitation Scenario (IMD/GFS 0.25°)"
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
              <span>Uncertainty</span>
            </button>

            {layerLoading && (
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin ml-1" />
            )}
          </div>
        </div>

        {/* Right: Search, 3D Pitch Toggle, Recenter */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* GPS My Location Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0c1322]/95 hover:bg-emerald-950/40 backdrop-blur-md border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 rounded-lg text-xs font-semibold shadow-xl transition active:scale-95 disabled:opacity-50"
            title="Auto-detect current location (GPS / High Precision) & Pan 3D Camera"
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
            <div className="flex items-center bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] rounded-lg px-2.5 py-1 text-xs shadow-xl">
              <Search className="w-3 h-3 text-slate-400 mr-1.5" />
              <input
                type="text"
                placeholder="Search station/city..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 w-28 sm:w-36 text-xs"
              />
              {isSearching && <RefreshCw className="w-2.5 h-2.5 text-cyan-400 animate-spin ml-1" />}
            </div>

            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 right-0 w-60 bg-[#0c1322] border border-[#1e2c47] rounded-lg shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-[#15233e] border-b border-[#15233e]/50 flex flex-col"
                  >
                    <span className="font-semibold text-white">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3D Perspective Toggle */}
          <button
            onClick={toggle3dPitch}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-md transition shadow-xl ${
              is3dPitch
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-emerald-950/30"
                : "bg-[#0c1322]/95 text-slate-300 border-[#1e2c47] hover:bg-[#15233e]"
            }`}
            title="Toggle Google 3D Perspective Tilt"
          >
            <Box className="w-3.5 h-3.5 text-emerald-400" />
            <span>{is3dPitch ? "3D Active (45°)" : "2D"}</span>
          </button>

          {/* Recenter */}
          <button
            onClick={handleRecenter}
            className="p-1.5 rounded-lg bg-[#0c1322]/95 backdrop-blur-md border border-[#1e2c47] text-slate-400 hover:text-white transition shadow-xl"
            title="Recenter Map on North-East Region"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ERROR FALLBACK BANNER (if API script blocked) */}
      {mapError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#090d16]/90 p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
          <h3 className="text-base font-bold text-white mb-1">Google Maps 3D Initialization</h3>
          <p className="text-xs text-slate-400 max-w-md mb-4">{mapError}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onToggleEngine && onToggleEngine("maplibre")}
              className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow"
            >
              Switch to MapLibre 3D WebGL
            </button>
          </div>
        </div>
      )}

      {/* MAP CONTAINER */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ minHeight: "420px" }} />

      {/* BOTTOM COORDINATES & STATUS HUD */}
      <div className="absolute bottom-2 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Telemetry HUD */}
        <div className="flex items-center gap-2 bg-[#080d18]/90 backdrop-blur-md border border-[#1e2c47] rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400 shadow-xl pointer-events-auto">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>GOOGLE MAPS 3D ACTIVATED</span>
          </div>
          <span className="text-slate-600">|</span>
          <span>LAT: <strong className="text-slate-200">{coordsHud.lat}°N</strong></span>
          <span>LNG: <strong className="text-slate-200">{coordsHud.lng}°E</strong></span>
          <span>ZOOM: <strong className="text-slate-200">{coordsHud.zoom}</strong></span>
          <span>TILT: <strong className="text-emerald-300">{coordsHud.tilt}°</strong></span>
          <span>SCENARIO: <strong className="text-cyan-400 uppercase">{activeLayer}</strong></span>
        </div>

        {/* Right Station Count & Legend */}
        <div className="flex items-center gap-2 bg-[#080d18]/90 backdrop-blur-md border border-[#1e2c47] rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400 shadow-xl pointer-events-auto">
          <span>STATIONS: <strong className="text-white">{locations.length}</strong></span>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
            <span className="text-[9px] text-slate-400">&lt;2.5mm</span>
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="text-[9px] text-slate-400">2.5-15.5</span>
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500"></span>
            <span className="text-[9px] text-slate-400">15.5-64.5</span>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-[9px] text-slate-400">&gt;64.5mm</span>
          </div>
        </div>
      </div>
    </div>
  );
};
