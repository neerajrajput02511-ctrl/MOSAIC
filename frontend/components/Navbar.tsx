"use client";

import React, { useState, useEffect } from "react";
import { 
  Radio, 
  HelpCircle, 
  Bot, 
  MapPin, 
  Crosshair, 
  Loader2, 
  Navigation, 
  Clock, 
  Sparkles, 
  Layers 
} from "lucide-react";
import { LocationItem } from "@/types";

export type PrimaryTab = "forecast" | "models" | "verification" | "events" | "system";

interface NavbarProps {
  activeTab: PrimaryTab;
  onSelectTab: (tab: PrimaryTab) => void;
  onOpenHelp: () => void;
  onOpenChat?: () => void;
  isBackendOnline?: boolean | null;
  selectedLocation?: LocationItem | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenHelp,
  onOpenChat,
  isBackendOnline = true,
  selectedLocation = null
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utc = now.toISOString().slice(11, 16) + " UTC";
      setCurrentTime(utc);
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  const navItems: { id: PrimaryTab; label: string }[] = [
    { id: "forecast", label: "Forecast" },
    { id: "models", label: "Models" },
    { id: "verification", label: "Verification" },
    { id: "events", label: "Events" },
    { id: "system", label: "System" },
  ];

  return (
    <header className="h-16 border-b border-[#1e2f4d] bg-[#070b14]/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 lg:px-8">
      {/* 1. LEFT: Clean Brand Identity (Section 4) */}
      <div className="flex items-center space-x-3 shrink-0">
        <div 
          onClick={() => onSelectTab("forecast")}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40 group-hover:scale-105 transition-transform">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold tracking-wider text-base text-slate-100 font-mono">
                MOSAIC
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                AI–NWP
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-tight hidden sm:block">
              Hybrid Forecast Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* 2. CENTER: Primary 5-Tab Navigation (Section 3 & 4) */}
      <nav className="hidden md:flex items-center bg-[#0c1322] border border-[#1e2f4d] rounded-xl p-1 shadow-inner">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? "bg-gradient-to-r from-blue-600/30 to-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* 3. RIGHT: Operational Telemetry & Actions (Section 4) */}
      <div className="flex items-center space-x-2.5 shrink-0">
        {/* Live Operational Status Badge */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all ${
          isBackendOnline === true
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : isBackendOnline === false
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-slate-800 border-slate-700 text-slate-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${isBackendOnline === true ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
          <span className="font-bold">
            {isBackendOnline === true ? "LIVE" : isBackendOnline === false ? "DEGRADED" : "SYNC"}
          </span>
        </div>

        {/* Region & Time Tag */}
        <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-400 bg-[#0c1322] border border-[#1e2f4d] px-3 py-1 rounded-xl">
          <span className="text-slate-300 font-semibold">
            {selectedLocation?.is_ner ? "Northeast India (NER)" : "All India"}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-cyan-400 flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{currentTime || "12:00 UTC"}</span>
          </span>
        </div>

        {/* Meteorological Copilot Button */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
            title="Ask Meteorological Intelligence Copilot"
            aria-label="Ask Meteorological Copilot"
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copilot</span>
          </button>
        )}

        {/* Global Help System Button mandated by Section 27 */}
        <button
          onClick={onOpenHelp}
          className="w-8 h-8 rounded-xl bg-[#0c1322] hover:bg-[#162238] border border-[#1e2f4d] hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center text-xs font-bold font-mono transition-colors shadow-sm"
          title="MOSAIC System Guide & Glossary"
          aria-label="MOSAIC System Guide and Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Tab Strip (Below on small screens) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080d18]/95 border-t border-[#1e2f4d] p-2 flex items-center justify-around backdrop-blur-md">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              activeTab === item.id ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
