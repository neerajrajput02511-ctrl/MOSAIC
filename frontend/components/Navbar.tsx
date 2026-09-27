"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Clock, 
  Calendar, 
  MapPin, 
  HelpCircle, 
  Bot
} from "lucide-react";
import { LocationItem } from "@/types";

interface NavbarProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  onOpenHelp: () => void;
  onOpenChat?: () => void;
  onOpenSihDemo?: () => void;
  isBackendOnline?: boolean | null;
  lastUpdated?: string;
  monitoringScope?: "NER" | "INDIA";
  onToggleScope?: (scope: "NER" | "INDIA") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onOpenHelp,
  onOpenChat,
  onOpenSihDemo,
  isBackendOnline = true,
  lastUpdated = "4 min ago",
  monitoringScope = "NER",
  onToggleScope
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("06:00 UTC");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utcHours = String(now.getUTCHours()).padStart(2, "0");
      const utcMinutes = String(now.getUTCMinutes()).padStart(2, "0");
      setCurrentTime(`${utcHours}:${utcMinutes} UTC`);
    };
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="h-[72px] bg-[#070D18] border-b border-[#1E293B] sticky top-0 z-40 flex items-center justify-between px-6 select-none shadow-md backdrop-blur-md">
      {/* 1. LEFT: Brand Wordmark (Reference Image) */}
      <div className="flex items-center space-x-6 shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer">
          {/* Custom Stylized Weather Wave/Cloud Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00B8E6] via-[#0284c7] to-[#1687FF] flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-black text-white tracking-tight leading-none font-mono">
              MOSAIC
            </div>
            <div className="text-[9px] font-bold text-[#667B94] tracking-[0.12em] uppercase mt-1">
              MoES / NCMRWF &bull; SIH26081
            </div>
          </div>
        </div>

        {/* 2. Search Field */}
        <div className="relative w-80 lg:w-96 hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#667B94] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={monitoringScope === "INDIA" ? "Search any Indian city/station (e.g. Delhi, Mumbai, Kolkata...)" : "Search NER station (e.g. Guwahati, Shillong, Agartala...)"}
              className="w-full bg-[#0D1B2E] border border-[#233852] hover:border-[#00B8E6]/40 focus:border-[#00B8E6] focus:bg-[#111F33] text-xs text-[#F4F8FC] rounded-lg pl-9 pr-4 py-2 outline-none transition-all placeholder:text-[#667B94]"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchQuery.length > 0 && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 bg-[#0D1B2E] border border-[#233852] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50 p-1.5"
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              {filteredLocations.slice(0, 8).map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc);
                    setSearchQuery("");
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-xs rounded-lg hover:bg-[#172A43] cursor-pointer flex items-center justify-between text-[#F4F8FC]"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-[#00B8E6]" />
                    <span className="font-semibold">{loc.name}</span>
                    <span className="text-[11px] text-[#9DAFC4]">· {loc.state}</span>
                  </div>
                  {loc.is_ner && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                      NER
                    </span>
                  )}
                </div>
              ))}
              {filteredLocations.length === 0 && (
                <div className="p-3 text-xs text-center text-[#667B94]">
                  No matching station found
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRIMARY MONITORING SCOPE CONTROL */}
        <div className="flex items-center gap-1 bg-[#0D1B2E] p-1 rounded-xl border border-[#233852] shadow-inner shrink-0">
          <span className="text-[10px] font-bold text-[#667B94] uppercase tracking-wider px-2 hidden xl:inline">
            Scope
          </span>
          <button
            onClick={() => onToggleScope && onToggleScope("NER")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              monitoringScope === "NER"
                ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                : "text-[#9DAFC4] hover:text-white"
            }`}
            title="North Eastern Region & Brahmaputra Basin"
          >
            <span className={`w-2 h-2 rounded-full ${monitoringScope === "NER" ? "bg-white" : "bg-slate-500"}`} />
            <span>NER</span>
          </button>
          <button
            onClick={() => onToggleScope && onToggleScope("INDIA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              monitoringScope === "INDIA"
                ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                : "text-[#9DAFC4] hover:text-white"
            }`}
            title="All India National Meteorological Domain"
          >
            <span className={`w-2 h-2 rounded-full ${monitoringScope === "INDIA" ? "bg-white" : "bg-slate-500"}`} />
            <span>ALL INDIA</span>
          </button>
        </div>
      </div>

      {/* 3. RIGHT: Operational Status Telemetry & Profile */}
      <div className="flex items-center space-x-6 shrink-0">
        {/* Operational Status */}
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-xs font-bold text-[#F4F8FC]">
              Operational
            </div>
            <div className="text-[10px] text-[#667B94]">
              All systems normal
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-[#1E293B] hidden md:block" />

        {/* Last updated */}
        <div className="hidden lg:flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#00B8E6]" />
          <div className="text-left leading-tight">
            <div className="text-[10px] text-[#667B94]">
              Telemetry Sync
            </div>
            <div className="text-xs font-bold text-[#F4F8FC] font-mono">
              {currentTime}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-[#1E293B] hidden lg:block" />

        {/* Forecast initialized */}
        <div className="hidden lg:flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#00B8E6]" />
          <div className="text-left leading-tight">
            <div className="text-[10px] text-[#667B94]">
              Forecast Cycle
            </div>
            <div className="text-xs font-bold text-[#F4F8FC] font-mono">
              00Z Operational Run
            </div>
          </div>
        </div>

        {/* SIH26081 System Architecture Specification */}
        {onOpenSihDemo && (
          <button
            onClick={onOpenSihDemo}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0D1B2E] hover:bg-[#172A43] text-white text-xs font-bold font-mono shadow-sm transition border border-[#233852]"
            title="Inspect SIH26081 Multi-Model Forecast Blending System Architecture & Verification"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="tracking-wide">SYSTEM ARCHITECTURE</span>
          </button>
        )}

        {/* Meteorological Copilot Quick Button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#0D1B2E] hover:bg-[#172A43] border border-[#233852] text-[#F4F8FC] text-xs font-semibold transition"
            title="Ask Meteorological Intelligence Copilot"
          >
            <Bot className="w-3.5 h-3.5 text-[#00B8E6]" />
            <span className="hidden sm:inline">Copilot</span>
          </button>
        )}

        {/* Global Help System Button */}
        <button
          onClick={onOpenHelp}
          className="w-8 h-8 rounded-lg bg-[#0D1B2E] hover:bg-[#172A43] border border-[#233852] text-[#9DAFC4] hover:text-[#F4F8FC] flex items-center justify-center transition-colors"
          title="MOSAIC System Guide & Glossary"
          aria-label="MOSAIC System Guide and Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <div 
          className="w-9 h-9 rounded-full bg-[#111F33] border border-[#233852] text-[#00B8E6] font-bold text-xs flex items-center justify-center shadow-sm cursor-pointer select-none"
          title="Meteorological Operations Specialist"
        >
          SK
        </div>
      </div>
    </header>
  );
};
