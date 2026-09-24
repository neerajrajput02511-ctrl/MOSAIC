"use client";

import React from "react";
import { 
  LayoutDashboard,
  Compass, 
  Layers, 
  Sliders, 
  FileCheck2, 
  RotateCcw, 
  AlertTriangle, 
  Activity, 
  Server, 
  Database, 
  ShieldCheck
} from "lucide-react";

export type NavTab = 
  | "overview"
  | "forecast"
  | "blending_engine"
  | "weight_map"
  | "verification"
  | "forecast_replay"
  | "extreme_weather"
  | "model_monitor"
  | "pipeline"
  | "data_sources"
  | "scientific_integrity";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  extremeEventsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  extremeEventsCount
}) => {
  const menuItems = [
    { 
      id: "overview" as NavTab, 
      label: "OVERVIEW", 
      icon: LayoutDashboard, 
      badge: "LIVE OPS", 
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30" 
    },
    { 
      id: "forecast" as NavTab, 
      label: "FORECAST CONSOLE", 
      icon: Compass, 
      badge: null 
    },
    { 
      id: "blending_engine" as NavTab, 
      label: "BLENDING ENGINE", 
      icon: Layers, 
      badge: "BMA MATH", 
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
    },
    { 
      id: "weight_map" as NavTab, 
      label: "WEIGHT MAP", 
      icon: Sliders, 
      badge: "HERO VISUAL", 
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold" 
    },
    { 
      id: "verification" as NavTab, 
      label: "VERIFICATION LAB", 
      icon: FileCheck2, 
      badge: "ERA5", 
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" 
    },
    { 
      id: "forecast_replay" as NavTab, 
      label: "FORECAST REPLAY", 
      icon: RotateCcw, 
      badge: "CASES", 
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold" 
    },
    { 
      id: "extreme_weather" as NavTab, 
      label: "EXTREME WEATHER", 
      icon: AlertTriangle, 
      badge: extremeEventsCount > 0 ? `${extremeEventsCount}` : "ALERTS", 
      badgeColor: extremeEventsCount > 0 ? "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold" : "bg-slate-800 text-slate-400 border-slate-700" 
    },
    { 
      id: "model_monitor" as NavTab, 
      label: "MODEL MONITOR", 
      icon: Activity, 
      badge: "SEC 16", 
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" 
    },
    { 
      id: "pipeline" as NavTab, 
      label: "PIPELINE (12 STAGES)", 
      icon: Server, 
      badge: "DAILY CRON", 
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
    },
    { 
      id: "data_sources" as NavTab, 
      label: "DATA SOURCES", 
      icon: Database, 
      badge: "PROVENANCE" 
    },
    { 
      id: "scientific_integrity" as NavTab, 
      label: "SCIENTIFIC INTEGRITY", 
      icon: ShieldCheck, 
      badge: "SIH26081", 
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30 font-bold" 
    }
  ];

  return (
    <aside 
      className="w-64 bg-[#080d19] border-r border-[#1a263d] flex flex-col shrink-0 select-none"
      role="navigation"
      aria-label="Operational Navigation"
    >
      {/* Platform Title Sub-header */}
      <div className="px-4 py-3 border-b border-[#1a263d] bg-[#0c1322]/50">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider uppercase">
            OPERATIONAL NCMRWF BLEND
          </span>
        </div>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
          MoES / SIH26081 Architecture
        </p>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition group ${
                isActive
                  ? "bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-900/20 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#10192d] border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 transition ${
                  isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-300"
                }`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase shrink-0 ml-1.5 ${
                  item.badgeColor || "bg-slate-800 text-slate-400 border-slate-700"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / NCMRWF Attribution */}
      <div className="p-3 border-t border-[#1a263d] bg-[#060a12] text-[10px] text-slate-400 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-bold">MOSAIC v2.4</span>
          <span className="text-emerald-400">● REAL DATA</span>
        </div>
        <p className="text-[9px] text-slate-400">
          MoES / NCMRWF · SIH 2026
        </p>
      </div>
    </aside>
  );
};
