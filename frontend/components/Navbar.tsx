"use client";

import React, { useState } from "react";
import { 
  Radio, 
  Search, 
  MapPin, 
  Sun, 
  Moon, 
  Activity, 
  ShieldAlert,
  Layers,
  ChevronDown,
  Bot,
  Crosshair,
  Loader2,
  Navigation
} from "lucide-react";
import { LocationItem } from "@/types";
import { addAndFetchMyLocation, startLiveGpsTracking } from "@/services/locationService";

interface NavbarProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  nerFilter: boolean;
  onToggleNerFilter: (val: boolean) => void;
  isLightMode: boolean;
  onToggleTheme: () => void;
  lastUpdated: string;
  onOpenChat?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  nerFilter,
  onToggleNerFilter,
  isLightMode,
  onToggleTheme,
  lastUpdated,
  onOpenChat
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Real-time GPS Tracking Watcher
  React.useEffect(() => {
    if (!isLiveTracking) return;
    const cleanup = startLiveGpsTracking((loc, accuracy) => {
      onSelectLocation(loc);
      setGpsAccuracy(Math.round(accuracy));
    });
    return () => cleanup();
  }, [isLiveTracking, onSelectLocation]);

  const handleLocateMe = async () => {
    setIsLocating(true);
    try {
      const myLoc = await addAndFetchMyLocation();
      if (myLoc) {
        onSelectLocation(myLoc);
      }
    } catch (e) {
      console.error("Locate me error:", e);
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <header className="h-16 border-b border-[#1e2c47] bg-[#0c1322]/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      {/* Brand Identity */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wider text-base text-slate-100">WEATHERFUSION</span>
              <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
              HYBRID AI–NWP BLENDING & EXTREME WEATHER INTELLIGENCE
            </p>
          </div>
        </div>

        {/* Live Operational Beacon */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>LIVE FEEDS ACTIVE</span>
        </div>
      </div>

      {/* Location Selector & Quick Filter */}
      <div className="flex items-center space-x-3">
        {/* NER Focus Toggle */}
        <button
          onClick={() => onToggleNerFilter(!nerFilter)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            nerFilter 
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm" 
              : "bg-[#111a2e] text-slate-400 hover:text-slate-200 border border-[#1e2c47]"
          }`}
          title="Filter to North Eastern Region (Assam, Meghalaya, Arunachal, etc.)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>NER Watch {nerFilter ? "(ON)" : ""}</span>
        </button>

        {/* Location Dropdown */}
        <div className="relative">
          <select
            value={selectedLocation?.id || ""}
            onChange={(e) => {
              const loc = locations.find(l => l.id === Number(e.target.value));
              if (loc) onSelectLocation(loc);
            }}
            className="appearance-none bg-[#111a2e] border border-[#1e2c47] hover:border-slate-600 rounded px-3 py-1.5 pr-8 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-medium cursor-pointer"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id} className="bg-[#0c1322] text-slate-200">
                {l.name}, {l.state} {l.is_ner ? "★ (NER)" : ""}
              </option>
            ))}
          </select>
          <MapPin className="w-3.5 h-3.5 text-cyan-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* GPS Locate Me Button */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition shadow-sm active:scale-95 disabled:opacity-50"
          title="Auto-detect current location (GPS / High Precision) & Fetch Live NWP Weather"
        >
          {isLocating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          ) : (
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="hidden sm:inline">{isLocating ? "Locating..." : "My Location"}</span>
        </button>

        {/* Live GPS Continuous Tracking Toggle */}
        <button
          onClick={() => setIsLiveTracking((prev) => !prev)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-semibold transition shadow-sm active:scale-95 ${
            isLiveTracking
              ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
              : "bg-[#111a2e] text-slate-400 hover:text-emerald-300 border border-[#1e2c47]"
          }`}
          title={isLiveTracking ? "Live GPS Tracking Active - Click to Pause" : "Turn ON Continuous Live GPS Tracking (Follows your device location in real-time)"}
        >
          <Navigation className={`w-3.5 h-3.5 ${isLiveTracking ? "text-emerald-400 rotate-45" : "text-slate-400"}`} />
          <span className="hidden sm:inline">
            {isLiveTracking ? `GPS LIVE ${gpsAccuracy ? `(±${gpsAccuracy}m)` : "●"}` : "LIVE TRACK"}
          </span>
        </button>

        {/* Meteorological Copilot Button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold transition"
            title="Ask Meteorological Intelligence Copilot"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Copilot</span>
          </button>
        )}

        {/* Admin Data Sources Link */}
        <a
          href="/admin/data-sources"
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition"
          title="Data Sources Admin & Live Connection Testing"
        >
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden md:inline">Admin APIs</span>
        </a>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded bg-[#111a2e] border border-[#1e2c47] text-slate-400 hover:text-slate-200 transition-colors"
          title="Toggle Command Center Dark / Light Mode"
        >
          {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
