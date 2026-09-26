"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  HelpCircle, 
  Bot, 
  ChevronDown, 
  Cloud 
} from "lucide-react";
import { LocationItem } from "@/types";

interface NavbarProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  onOpenHelp: () => void;
  onOpenChat?: () => void;
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
    <header className="h-[72px] bg-white border-b border-[#D9E0E7] sticky top-0 z-40 flex items-center justify-between px-6 select-none shadow-sm">
      {/* 1. LEFT: Brand Wordmark (Reference Image) */}
      <div className="flex items-center space-x-6 shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer">
          {/* Custom Stylized Weather Wave/Cloud Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
            </svg>
          </div>
          <div>
            <div className="text-xl font-black text-[#0B1F33] tracking-tight leading-none font-mono">
              MOSAIC
            </div>
            <div className="text-[9px] font-bold text-[#64748B] tracking-[0.16em] uppercase mt-1">
              WEATHERFUSION AI
            </div>
          </div>
        </div>

        {/* 2. Search Field (Reference Image center/left) */}
        <div className="relative w-80 lg:w-96 hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Search location (e.g. Mumbai, Delhi, Guwahati...)"
              className="w-full bg-[#F8FAFC] border border-[#D9E0E7] hover:border-[#CBD5E1] focus:border-[#1769AA] focus:bg-white text-xs text-[#0F172A] rounded-lg pl-9 pr-4 py-2 outline-none transition-all placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && searchQuery.length > 0 && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#D9E0E7] rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1.5"
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
                  className="px-3 py-2 text-xs rounded-lg hover:bg-[#EEF2F6] cursor-pointer flex items-center justify-between text-[#0F172A]"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-[#1769AA]" />
                    <span className="font-semibold">{loc.name}</span>
                    <span className="text-[11px] text-[#64748B]">· {loc.state}</span>
                  </div>
                  {loc.is_ner && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      NER
                    </span>
                  )}
                </div>
              ))}
              {filteredLocations.length === 0 && (
                <div className="p-3 text-xs text-center text-[#64748B]">
                  No matching station found
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRIMARY MONITORING SCOPE CONTROL (Requirement 1 & 28) */}
        <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-xl border border-[#D9E0E7] shadow-inner shrink-0">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider px-2 hidden xl:inline">
            Scope
          </span>
          <button
            onClick={() => onToggleScope && onToggleScope("NER")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              monitoringScope === "NER"
                ? "bg-white text-[#1769AA] shadow-xs border border-[#CBD5E1]"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
            title="North Eastern Region & Brahmaputra Basin"
          >
            <span className={`w-2 h-2 rounded-full ${monitoringScope === "NER" ? "bg-[#1769AA]" : "bg-slate-300"}`} />
            <span>NER</span>
          </button>
          <button
            onClick={() => onToggleScope && onToggleScope("INDIA")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              monitoringScope === "INDIA"
                ? "bg-[#0B1F33] text-white shadow-xs"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
            title="All India National Meteorological Domain"
          >
            <span className={`w-2 h-2 rounded-full ${monitoringScope === "INDIA" ? "bg-emerald-400" : "bg-slate-300"}`} />
            <span>ALL INDIA</span>
          </button>
        </div>
      </div>

      {/* 3. RIGHT: Operational Status Telemetry & Profile (Reference Image) */}
      <div className="flex items-center space-x-6 shrink-0">
        {/* Operational Status */}
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A] shrink-0" />
          <div className="text-left leading-tight hidden sm:block">
            <div className="text-xs font-bold text-[#0F172A]">
              Operational
            </div>
            <div className="text-[10px] text-[#64748B]">
              All systems normal
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-[#D9E0E7] hidden md:block" />

        {/* Last updated */}
        <div className="hidden lg:flex items-center space-x-2">
          <Clock className="w-4 h-4 text-[#64748B]" />
          <div className="text-left leading-tight">
            <div className="text-[10px] text-[#64748B]">
              Last updated
            </div>
            <div className="text-xs font-bold text-[#0F172A] font-mono">
              {lastUpdated}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-7 w-[1px] bg-[#D9E0E7] hidden lg:block" />

        {/* Forecast initialized */}
        <div className="hidden lg:flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#64748B]" />
          <div className="text-left leading-tight">
            <div className="text-[10px] text-[#64748B]">
              Forecast initialized
            </div>
            <div className="text-xs font-bold text-[#0F172A] font-mono">
              {currentTime}
            </div>
          </div>
        </div>

        {/* Meteorological Copilot Quick Button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold transition"
            title="Ask Meteorological Intelligence Copilot"
          >
            <Bot className="w-3.5 h-3.5 text-[#1769AA]" />
            <span className="hidden sm:inline">Copilot</span>
          </button>
        )}

        {/* Global Help System Button */}
        <button
          onClick={onOpenHelp}
          className="w-8 h-8 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2F6] border border-[#D9E0E7] text-[#475569] hover:text-[#0F172A] flex items-center justify-center transition-colors"
          title="MOSAIC System Guide & Glossary"
          aria-label="MOSAIC System Guide and Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* User Profile Avatar (Reference Image) */}
        <div 
          className="w-9 h-9 rounded-full bg-[#0B1F33] text-white font-bold text-xs flex items-center justify-center shadow-sm cursor-pointer select-none"
          title="Meteorological Operations Specialist"
        >
          SK
        </div>
      </div>
    </header>
  );
};
