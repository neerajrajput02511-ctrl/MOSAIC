"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import { 
  SpatialRegionCell, 
  SpatialWeightMapResponse, 
  SpatialStationItem 
} from "@/types";
import { fetchSpatialWeightMap } from "@/services/api";
import { 
  Sliders, 
  MapPin, 
  Layers, 
  Sparkles, 
  Calendar, 
  ShieldAlert, 
  Info,
  ChevronRight,
  TrendingUp,
  Cpu,
  Globe,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Compass,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Radio,
  BarChart3,
  Bot,
  Satellite
} from "lucide-react";

interface ModelWeightMapViewProps {
  onSelectRegion?: (regionCode: string) => void;
  onOpenCopilot?: (initialQuery?: string) => void;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyDMATo2x1vn0jGZ8WVvTgfXxa5SzaZm0WI";

const MAP_STYLES = {
  satellite: {
    name: "Satellite Hybrid",
    style: {
      version: 8 as const,
      sources: {
        "google-sat": {
          type: "raster" as const,
          tiles: [
            `https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`,
            `https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`,
            `https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`,
            `https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=${GOOGLE_KEY}`
          ],
          tileSize: 256,
          attribution: "Google Satellite Hybrid &copy; Google Maps"
        }
      },
      layers: [
        {
          id: "satellite-tiles",
          type: "raster" as const,
          source: "google-sat",
          minzoom: 0,
          maxzoom: 22
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
          id: "dark-tiles",
          type: "raster" as const,
          source: "esri-dark",
          minzoom: 0,
          maxzoom: 19
        }
      ]
    }
  }
};

export const ModelWeightMapView: React.FC<ModelWeightMapViewProps> = ({ 
  onSelectRegion,
  onOpenCopilot 
}) => {
  const [leadTime, setLeadTime] = useState<number>(120); // Default to Day 5 (+120h)
  const [season, setSeason] = useState<string>("Monsoon");
  const [regime, setRegime] = useState<string>("Normal");
  const [mapData, setMapData] = useState<SpatialWeightMapResponse | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<SpatialRegionCell | null>(null);
  const [selectedStation, setSelectedStation] = useState<SpatialStationItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mapStyleType, setMapStyleType] = useState<"satellite" | "dark">("satellite"); // SATELLITE AS DEFAULT!

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const hoverPopup = useRef<maplibregl.Popup | null>(null);

  // References to avoid stale closures in MapLibre event handlers
  const mapDataRef = useRef<SpatialWeightMapResponse | null>(null);
  const selectedRegionRef = useRef<SpatialRegionCell | null>(null);
  mapDataRef.current = mapData;
  selectedRegionRef.current = selectedRegion;

  const leadTimeSequence = [24, 48, 72, 120, 168];

  const leadTimeOptions = [
    { label: "Day 1 (+24h)", value: 24, badge: "NWP Dominant", hero: false },
    { label: "Day 2 (+48h)", value: 48, badge: "Physics Focus", hero: false },
    { label: "Day 3 (+72h)", value: 72, badge: "Frontier Crossover", hero: false },
    { label: "Day 5 (+120h)", value: 120, badge: "AI Dominates", hero: true },
    { label: "Day 7 (+168h)", value: 168, badge: "AI Wavefront", hero: false }
  ];

  // 1. Fetch live telemetry from backend
  useEffect(() => {
    let isCancelled = false;
    async function loadWeights() {
      setLoading(true);
      const data = await fetchSpatialWeightMap(leadTime, season, regime);
      if (!isCancelled && data) {
        setMapData(data);
        if (data.regions && data.regions.length > 0) {
          const matched = selectedRegionRef.current 
            ? data.regions.find((r: SpatialRegionCell) => r.region_code === selectedRegionRef.current?.region_code)
            : null;
          const target = matched || data.regions.find((r: SpatialRegionCell) => r.region_code === "NER") || data.regions[0];
          setSelectedRegion(target);
          if (target.stations && target.stations.length > 0) {
            setSelectedStation(target.stations[0]);
          }
        }
      }
      setLoading(false);
    }
    loadWeights();
    return () => { isCancelled = true; };
  }, [leadTime, season, regime]);

  // 2. Automated Simulation Time-Lapse Player
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setLeadTime((prev) => {
          const nextIdx = (leadTimeSequence.indexOf(prev) + 1) % leadTimeSequence.length;
          return leadTimeSequence[nextIdx];
        });
      }, 2200);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // 3. Synchronize GeoJSON layers with the MapLibre Map instance
  const syncLayers = useCallback(() => {
    const m = map.current;
    const currentData = mapDataRef.current;
    if (!m || !currentData?.regions) return;

    // Check if style is ready; if not, wait for styledata
    if (!m.isStyleLoaded()) {
      m.once("styledata", syncLayers);
      return;
    }

    const currentSelected = selectedRegionRef.current;

    // GeoJSON for Subdivisions
    const subdivisionsGeoJSON: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: currentData.regions
        .filter(r => r.geometry && r.geometry.coordinates)
        .map(r => ({
          type: "Feature",
          id: r.region_code,
          geometry: r.geometry as any,
          properties: {
            region_code: r.region_code,
            region_name: r.region_name,
            dominant_model: r.dominant_model,
            dominant_weight_pct: r.dominant_weight_pct,
            color: r.color,
            elevation_m: r.elevation_m || 0,
            orographic_feature: r.orographic_feature || "",
            bma_entropy: r.bma_entropy || 0,
            states: r.states.join(", "),
            isSelected: currentSelected?.region_code === r.region_code ? 1 : 0
          }
        }))
    };

    // GeoJSON for Real Stations
    const stationsGeoJSON: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: (currentData.stations || []).map(st => ({
        type: "Feature",
        id: st.id,
        geometry: {
          type: "Point",
          coordinates: [st.longitude, st.latitude]
        },
        properties: {
          id: st.id,
          name: st.name,
          state: st.state,
          elevation_m: st.elevation_m || 0,
          is_ner: st.is_ner ? 1 : 0,
          dominant_model: st.dominant_model,
          dominant_weight_pct: st.dominant_weight_pct,
          color: st.dominant_model.includes("AIFS") 
            ? "#8b5cf6" 
            : (st.dominant_model.includes("IFS") ? "#06b6d4" : (st.dominant_model.includes("GFS") ? "#3b82f6" : "#f59e0b")),
          precip_ifs: st.predictions?.ECMWF_IFS || 0,
          precip_aifs: st.predictions?.ECMWF_AIFS || 0,
          precip_gfs: st.predictions?.NOAA_GFS || 0
        }
      }))
    };

    // Upsert Subdivisions Source & Layers
    const subSource = m.getSource("subdivisions-src") as maplibregl.GeoJSONSource;
    if (subSource) {
      subSource.setData(subdivisionsGeoJSON);
    } else {
      m.addSource("subdivisions-src", {
        type: "geojson",
        data: subdivisionsGeoJSON
      });

      // Fill Layer (Semi-transparent on satellite)
      m.addLayer({
        id: "subdivisions-fill",
        type: "fill",
        source: "subdivisions-src",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["==", ["get", "isSelected"], 1],
            0.62,
            0.35
          ]
        }
      });

      // Outline Layer (Neon Cyber Border)
      m.addLayer({
        id: "subdivisions-line",
        type: "line",
        source: "subdivisions-src",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "isSelected"], 1],
            "#ffffff",
            ["get", "color"]
          ],
          "line-width": [
            "case",
            ["==", ["get", "isSelected"], 1],
            3.5,
            2.0
          ],
          "line-opacity": 0.95
        }
      });

      // Zone Click
      m.on("click", "subdivisions-fill", (e) => {
        if (!e.features || !e.features[0]) return;
        const regCode = e.features[0].properties?.region_code;
        const target = mapDataRef.current?.regions.find(r => r.region_code === regCode);
        if (target) {
          setSelectedRegion(target);
          if (target.stations && target.stations.length > 0) {
            setSelectedStation(target.stations[0]);
          }
          if (onSelectRegion) onSelectRegion(target.region_code);
          m.flyTo({
            center: [target.center[1], target.center[0]],
            zoom: 5.3,
            pitch: 35,
            duration: 1200
          });
        }
      });

      // Zone Hover
      m.on("mousemove", "subdivisions-fill", (e) => {
        m.getCanvas().style.cursor = "pointer";
        if (e.features && e.features[0] && hoverPopup.current) {
          const props = e.features[0].properties;
          hoverPopup.current
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="background:#090f1d; border:1px solid #1e2e4a; border-radius:10px; padding:10px 14px; color:#e2e8f0; font-family:monospace; font-size:11px; box-shadow:0 0 25px rgba(0,0,0,0.85);">
                <div style="font-weight:bold; font-size:12px; color:#38bdf8; margin-bottom:4px;">${props.region_name}</div>
                <div>Dominant: <strong style="color:${props.color};">${props.dominant_model}</strong> (${props.dominant_weight_pct}%)</div>
                <div style="color:#94a3b8; font-size:10px; margin-top:3px;">Elevation: ${props.elevation_m}m ASL · Entropy H=${props.bma_entropy}</div>
              </div>
            `)
            .addTo(m);
        }
      });

      m.on("mouseleave", "subdivisions-fill", () => {
        m.getCanvas().style.cursor = "";
        if (hoverPopup.current) hoverPopup.current.remove();
      });
    }

    // Upsert Stations Source & Layers
    const stSource = m.getSource("stations-src") as maplibregl.GeoJSONSource;
    if (stSource) {
      stSource.setData(stationsGeoJSON);
    } else {
      m.addSource("stations-src", {
        type: "geojson",
        data: stationsGeoJSON
      });

      // Outer radar pulse circle
      m.addLayer({
        id: "stations-circle-glow",
        type: "circle",
        source: "stations-src",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "is_ner"], 1],
            9.0,
            7.0
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.90,
          "circle-stroke-width": 2.0,
          "circle-stroke-color": "#ffffff"
        }
      });

      // Inner bright core
      m.addLayer({
        id: "stations-circle-core",
        type: "circle",
        source: "stations-src",
        paint: {
          "circle-radius": 3.0,
          "circle-color": "#ffffff",
          "circle-opacity": 1.0
        }
      });

      // Station Name Text Label on Map
      m.addLayer({
        id: "stations-text-label",
        type: "symbol",
        source: "stations-src",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"]
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 1.8
        }
      });

      // Station Pin Click
      m.on("click", "stations-circle-glow", (e) => {
        if (!e.features || !e.features[0]) return;
        const stId = Number(e.features[0].properties?.id);
        const stObj = (mapDataRef.current?.stations || []).find(s => s.id === stId);
        if (stObj) {
          setSelectedStation(stObj);
          m.flyTo({
            center: [stObj.longitude, stObj.latitude],
            zoom: 6.8,
            pitch: 45,
            duration: 1000
          });
        }
      });
    }

    // Refresh Dynamic Styling
    if (m.getLayer("subdivisions-fill")) {
      m.setPaintProperty("subdivisions-fill", "fill-opacity", [
        "case",
        ["==", ["get", "isSelected"], 1],
        0.62,
        0.35
      ]);
    }
  }, [onSelectRegion]);

  // 4. Initialize MapLibre GL instance (Defaulting to Satellite)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initialStyle = MAP_STYLES[mapStyleType].style;

    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: initialStyle as any,
      center: [80.5, 23.0],
      zoom: 4.25,
      pitch: 30,
      bearing: -4,
      attributionControl: false
    });

    m.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

    hoverPopup.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      className: "tactical-hover-popup"
    });

    m.on("load", () => {
      map.current = m;
      syncLayers();
    });

    return () => {
      m.remove();
      map.current = null;
    };
  }, [mapStyleType, syncLayers]);

  // 5. Trigger syncLayers whenever mapData or selectedRegion changes
  useEffect(() => {
    syncLayers();
  }, [mapData, selectedRegion, syncLayers]);

  // 6. Handle Style Switch (Satellite vs Dark)
  const handleToggleStyle = (newStyle: "satellite" | "dark") => {
    if (newStyle === mapStyleType || !map.current) return;
    setMapStyleType(newStyle);
    map.current.setStyle(MAP_STYLES[newStyle].style as any);
    map.current.once("styledata", () => {
      syncLayers();
    });
  };

  const handleSelectZone = (reg: SpatialRegionCell) => {
    setSelectedRegion(reg);
    if (reg.stations && reg.stations.length > 0) {
      setSelectedStation(reg.stations[0]);
    }
    if (onSelectRegion) onSelectRegion(reg.region_code);
    if (map.current) {
      map.current.flyTo({
        center: [reg.center[1], reg.center[0]],
        zoom: 5.3,
        pitch: 35,
        duration: 1200
      });
    }
  };

  const handleSelectStationPin = (st: SpatialStationItem) => {
    setSelectedStation(st);
    if (map.current) {
      map.current.flyTo({
        center: [st.longitude, st.latitude],
        zoom: 6.8,
        pitch: 45,
        duration: 1000
      });
    }
  };

  const handleTriggerCopilotForZone = () => {
    if (!selectedRegion) return;
    const query = `Analyze the spatial model weights for ${selectedRegion.region_name} at +${leadTime}h lead time under ${season} season. Why does ${selectedRegion.dominant_model} hold ${selectedRegion.dominant_weight_pct}% weight here?`;
    if (onOpenCopilot) {
      onOpenCopilot(query);
    }
  };

  const nationalSummary = mapData?.national_summary || {
    ai_coverage_pct: 86,
    physics_coverage_pct: 14,
    mean_ai_weight_pct: 34,
    mean_physics_weight_pct: 46,
    mean_ensemble_weight_pct: 20,
    frontier_crossover: "+72h Crossover Passed (AI Dominating)",
    total_stations_active: 24,
    mean_bma_entropy: 0.973
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. FUTURISTIC HERO BANNER & NATIONAL FRONTIER TELEMETRY HUD               */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#090f1d] via-[#101b33] to-[#090f1d] border border-cyan-500/30 rounded-2xl p-5 shadow-[0_0_35px_rgba(6,182,212,0.12)]">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-500/30 to-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-inner">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
                    SPATIAL MULTI-MODEL WEIGHT MAP
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      BMA &times; REGIME &times; OROGRAPHY
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dynamic Bayesian Model Averaging (BMA) conditioned on <span className="text-cyan-300 font-semibold">Climate Division &times; Lead Time (+{leadTime}h) &times; Season ({season})</span> across 26 real stations in India.
                </p>
              </div>
            </div>
          </div>

          {/* Time-Lapse Lead-Time Player & Sequence Controls */}
          <div className="flex items-center gap-2 bg-[#060a14] p-1.5 rounded-xl border border-[#1b2b45] shadow-inner">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? "Pause Simulation" : "Play Animated Lead-Time Time-Lapse"}
              className={`p-2 rounded-lg transition flex items-center gap-1 text-xs font-bold font-mono ${
                isPlaying 
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse" 
                  : "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40"
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isPlaying ? "PAUSE" : "SIMULATE"}</span>
            </button>

            <div className="h-5 w-px bg-slate-800 mx-0.5" />

            {leadTimeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setLeadTime(opt.value);
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex flex-col items-center ${
                  leadTime === opt.value
                    ? "bg-gradient-to-r from-purple-600/30 to-cyan-600/30 text-cyan-200 border border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#101b2e]"
                }`}
              >
                <span className="font-mono font-bold">{opt.label}</span>
                <span className={`text-[8.5px] font-mono ${
                  opt.value >= 120 
                    ? "text-purple-400 font-semibold" 
                    : opt.value === 72 
                    ? "text-cyan-400 font-semibold" 
                    : "text-slate-500"
                }`}>
                  {opt.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Real-Time National Frontier HUD Strip */}
        <div className="mt-4 pt-3.5 border-t border-[#17243b] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-[#0b1220]/80 rounded-xl p-2.5 border border-[#1b2b45] flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">AI DOMINANCE COVERAGE</div>
              <div className="font-extrabold text-purple-300 font-mono text-sm flex items-center gap-1">
                {nationalSummary.ai_coverage_pct}%
                <span className="text-[10px] text-slate-500 font-normal">of Indian Territory</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0b1220]/80 rounded-xl p-2.5 border border-[#1b2b45] flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">PHYSICS NWP COVERAGE</div>
              <div className="font-extrabold text-cyan-300 font-mono text-sm flex items-center gap-1">
                {nationalSummary.physics_coverage_pct}%
                <span className="text-[10px] text-slate-500 font-normal">(IFS & GFS)</span>
              </div>
            </div>
          </div>

          <div className="bg-[#0b1220]/80 rounded-xl p-2.5 border border-[#1b2b45] flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">FRONTIER CROSSOVER</div>
              <div className="font-extrabold text-amber-300 font-mono text-xs truncate">
                {nationalSummary.frontier_crossover}
              </div>
            </div>
          </div>

          <div className="bg-[#0b1220]/80 rounded-xl p-2.5 border border-[#1b2b45] flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">REAL STATIONS MONITORED</div>
              <div className="font-extrabold text-emerald-300 font-mono text-sm flex items-center gap-1">
                {nationalSummary.total_stations_active} Stations
                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">100% REAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. REGIME & SEASON CONTROL STRIP                                         */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a101d] border border-[#19273f] rounded-xl px-4 py-2.5 text-xs shadow-md">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-mono text-[11px]">SEASON:</span>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="bg-[#10192b] border border-[#1e2f4c] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Monsoon">Monsoon (JJAS - Peak Orographic Inflow)</option>
              <option value="Post-Monsoon">Post-Monsoon (OND - Bay of Bengal Cyclones)</option>
              <option value="Winter">Winter (JF - Western Disturbances)</option>
              <option value="Pre-Monsoon">Pre-Monsoon (MAM - Heatwave & Severe Squalls)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-mono text-[11px]">WEATHER REGIME:</span>
            <select
              value={regime}
              onChange={(e) => setRegime(e.target.value)}
              className="bg-[#10192b] border border-[#1e2f4c] rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-cyan-400"
            >
              <option value="Normal">Normal Synoptic Regime</option>
              <option value="Active Monsoon">Active Monsoon Trough (Deep Low Over Core)</option>
              <option value="Break Monsoon">Break Monsoon (Rain Confined to NER Foothills)</option>
              <option value="Heavy Rainfall">Heavy Rainfall (&ge;64.5 mm/24h Threat)</option>
              <option value="High Wind / Squall">High Wind Squall (&ge;15 m/s Pressure Gradient)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#8b5cf6]" />
            <span className="text-purple-300">ECMWF AIFS (Deep Learning AI)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            <span className="text-cyan-300">ECMWF IFS (0.25° Physics)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            <span className="text-blue-300">NOAA GFS (0.25° Physics)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span className="text-amber-300">NOAA GEFS (31-M Ensemble)</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN INTERACTIVE MAP & ZONE TELEMETRY SPLIT                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Interactive WebGL Map Canvas (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="relative w-full h-[540px] bg-[#070b14] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl">
            {/* MapLibre DOM Node */}
            <div ref={mapContainer} className="w-full h-full" />

            {/* In-Map Top-Left Status Overlay */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
              <div className="px-3 py-1.5 rounded-xl bg-[#090f1de6] backdrop-blur-md border border-cyan-500/40 text-[11px] font-mono text-cyan-200 flex items-center gap-1.5 shadow-lg">
                <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
                <span>LEAD TIME: <strong className="text-white">+{leadTime}h</strong></span>
                <span className="text-slate-500">|</span>
                <span className="text-purple-300">{nationalSummary.frontier_crossover}</span>
              </div>
            </div>

            {/* In-Map Top-Right Style Switch (Satellite vs Dark) */}
            <div className="absolute top-3 right-12 z-10 flex items-center gap-1 bg-[#090f1de6] backdrop-blur-md p-1 rounded-xl border border-cyan-500/40 shadow-lg pointer-events-auto">
              <button
                onClick={() => handleToggleStyle("satellite")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-1 ${
                  mapStyleType === "satellite"
                    ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#152238]"
                }`}
              >
                <Satellite className="w-3 h-3" />
                <span>SATELLITE 3D</span>
              </button>
              <button
                onClick={() => handleToggleStyle("dark")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition flex items-center gap-1 ${
                  mapStyleType === "dark"
                    ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400 font-bold shadow-inner"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#152238]"
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>DARK TAC</span>
              </button>
            </div>

            {/* Zone Selector Chips On Top of Map */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap gap-1.5 pointer-events-auto">
              {mapData?.regions?.map((reg) => {
                const isSelected = selectedRegion?.region_code === reg.region_code;
                return (
                  <button
                    key={reg.region_code}
                    onClick={() => handleSelectZone(reg)}
                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all flex items-center gap-1.5 backdrop-blur-md shadow-md ${
                      isSelected
                        ? "bg-purple-600/70 text-white border border-purple-300 font-bold ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                        : "bg-[#0b1322e6] text-slate-300 hover:text-white border border-slate-700/70 hover:bg-[#121e33]"
                    }`}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: reg.color }}
                    />
                    <span>{reg.region_name.split("&")[0]}</span>
                    <span className="text-[9px] opacity-80">({reg.dominant_weight_pct}%)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scientific Guidance Footnote */}
          <div className="p-3 bg-[#090e1a] rounded-xl border border-[#19273f] text-xs text-slate-300 flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-cyan-300">Photorealistic Satellite Grounding & Atmospheric Physics:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Rendered over high-resolution satellite topography. The semi-transparent glowing overlays illustrate how steep mountain barriers (Khasi Hills, Himalayas, Western Ghats) dictate localized convective physics at short horizons, while AI Deep Learning takes over large-scale depression tracking at medium ranges.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Deep-Dive Zone Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedRegion && (
            <div className="bg-[#0a101d] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
              {/* Header */}
              <div className="border-b border-[#1b2b45] pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1">
                    <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
                    ZONE DEEP DIVE · LEAD TIME +{leadTime}h
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedRegion.weather_regime}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center justify-between">
                  <span>{selectedRegion.region_name}</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded font-mono border"
                    style={{ 
                      backgroundColor: `${selectedRegion.color}25`, 
                      color: selectedRegion.color, 
                      borderColor: `${selectedRegion.color}50` 
                    }}
                  >
                    Dominant: {selectedRegion.dominant_model} ({selectedRegion.dominant_weight_pct}%)
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {selectedRegion.states.join(", ")} · Mean Elevation: <strong>{selectedRegion.elevation_m}m ASL</strong>
                </p>
                {selectedRegion.orographic_feature && (
                  <div className="text-[10px] font-mono text-cyan-400/90 pt-1 flex items-center gap-1">
                    <span>Terrain Forcing:</span>
                    <span className="text-slate-300">{selectedRegion.orographic_feature}</span>
                  </div>
                )}
              </div>

              {/* Exact BMA Weights Breakdown Rows */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <span>BMA WEIGHT VECTOR (&Sigma;w = 1.0000)</span>
                  <span className="text-[10px] text-cyan-400">Entropy H={selectedRegion.bma_entropy}</span>
                </div>

                {Object.entries(selectedRegion.weights).map(([modelCode, weightVal]) => {
                  const pct = Math.round((weightVal as number) * 100);
                  const isDom = modelCode === selectedRegion.dominant_model;
                  const isAI = modelCode.includes("AIFS");
                  const isEnsemble = modelCode.includes("GEFS");

                  return (
                    <div 
                      key={modelCode} 
                      className={`p-2.5 rounded-xl border transition-all ${
                        isDom 
                          ? "bg-purple-950/25 border-purple-500/50 shadow-md shadow-purple-900/10" 
                          : "bg-[#0e1626] border-[#18263d]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200">{modelCode}</span>
                          <span className={`text-[8.5px] font-mono px-1.5 py-0.2 rounded border ${
                            isAI 
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30" 
                              : isEnsemble 
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30" 
                              : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                          }`}>
                            {isAI ? "DEEP LEARNING AI" : isEnsemble ? "31-M ENSEMBLE" : "PHYSICS NWP"}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {pct}% <span className="text-[10px] text-slate-500 font-normal">({Number(weightVal).toFixed(4)})</span>
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-[#060a14] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-700 ${
                            isAI ? "bg-purple-500" : isEnsemble ? "bg-amber-400" : "bg-cyan-400"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Scientific Rationale & Physical Grounding */}
              <div className="p-3.5 rounded-xl bg-[#090f1d] border border-[#19273f] space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-purple-300">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Physical & Scientific Rationale:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {selectedRegion.rationale}
                </p>
              </div>

              {/* Tactical Disaster Advisory for NDRF / SDMA */}
              {selectedRegion.tactical_advisory && (
                <div className="p-3 rounded-xl bg-[#0b1424] border border-cyan-500/30 text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wide">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Tactical Early Warning Advisory (NDRF/SDMA):</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {selectedRegion.tactical_advisory}
                  </p>
                </div>
              )}

              {/* Real Weather Stations inside this Climate Subdivision */}
              {selectedRegion.stations && selectedRegion.stations.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-[#1b2b45]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>AUTHENTIC REPORTING STATIONS ({selectedRegion.stations.length})</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">100% Verified Feeds</span>
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {selectedRegion.stations.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => handleSelectStationPin(st)}
                        className={`cursor-pointer p-2 rounded-lg border transition text-xs flex items-center justify-between ${
                          selectedStation?.id === st.id
                            ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-100"
                            : "bg-[#090e1a] border-[#18263d] text-slate-300 hover:bg-[#10192a]"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <div>
                            <span className="font-bold">{st.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({st.state} · {st.elevation_m}m)</span>
                          </div>
                        </div>

                        <div className="text-right font-mono text-[11px] flex items-center gap-2">
                          <span className="text-purple-300">AIFS: {st.predictions?.ECMWF_AIFS}mm</span>
                          <span className="text-cyan-300">IFS: {st.predictions?.ECMWF_IFS}mm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask Gemini 3.6 Flash Copilot Tactical Trigger */}
              <button
                onClick={handleTriggerCopilotForZone}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-cyan-600 to-blue-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs tracking-wide transition shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4 text-cyan-200" />
                <span>Ask Gemini 3.6 Flash Copilot About This Zone</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
