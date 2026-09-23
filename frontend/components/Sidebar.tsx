"use client";

import React from "react";
import { 
  Compass, 
  TrendingUp, 
  Map, 
  Sliders, 
  AlertTriangle, 
  FileCheck2, 
  Database, 
  HeartPulse,
  Info,
  Layers,
  Server,
  Sparkles
} from "lucide-react";

export type NavTab = 
  | "weight_map"
  | "baseline_comparison"
  | "command_center"
  | "skill_trends"
  | "pipeline_status"
  | "extreme_weather"
  | "ner_monitoring"
  | "geospatial_map"
  | "data_sources"
  | "system_health";

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
      id: "weight_map" as NavTab, 
      label: "Spatial Weight Map", 
      icon: Sliders, 
      badge: "HERO VISUAL", 
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold" 
    },
    { 
      id: "baseline_comparison" as NavTab, 
      label: "Blend vs Baselines", 
      icon: Layers, 
      badge: "SCREEN 2", 
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30" 
    },
    { 
      id: "command_center" as NavTab, 
      label: "Forecaster Console", 
      icon: Compass, 
      badge: null 
    },
    { 
      id: "skill_trends" as NavTab, 
      label: "Skill Score Trends", 
      icon: FileCheck2, 
      badge: "ERA5", 
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" 
    },
    { 
      id: "pipeline_status" as NavTab, 
      label: "Automated Pipeline", 
      icon: Server, 
      badge: "DAILY CRON", 
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
    },
    { 
      id: "extreme_weather" as NavTab, 
      label: "Extreme Weather", 
      icon: AlertTriangle, 
      badge: extremeEventsCount > 0 ? `${extremeEventsCount}` : "ALERTS", 
      badgeColor: extremeEventsCount > 0 ? "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold" : "bg-slate-800 text-slate-400 border-slate-700" 
    },
    { 
      id: "ner_monitoring" as NavTab, 
      label: "NER Multi-State Watch", 
      icon: Map, 
      badge: "8 States", 
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" 
    },
    { 
      id: "data_sources" as NavTab, 
      label: "Data Sources & Telemetry", 
      icon: Database, 
      badge: "Live" 
    },
    { 
      id: "system_health" as NavTab, 
      label: "System Health", 
      icon: HeartPulse, 
      badge: null 
    },
  ];

  return (
    <aside className="w-64 border-r border-[#1e2c47] bg-[#0c1322] flex flex-col justify-between py-4 shrink-0 hidden md:flex">
      <div className="px-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono tracking-wider text-slate-500 uppercase flex items-center justify-between">
          <span>SIH26081 · MoES TRACK</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
            v1.0
          </span>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? "bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#111a2e]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-purple-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${item.badgeColor || "bg-slate-800 text-slate-300 border-slate-700"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Operational Provenance Badge */}
      <div className="px-4 py-3 mx-3 rounded border border-[#1e2c47] bg-[#111a2e]/60 text-[11px] space-y-1.5">
        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>SCIENTIFIC INTEGRITY</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Operational models: NOAA GFS, ECMWF IFS, ECMWF AIFS & NOAA GEFS. Continuous verification against ERA5 & IMD.
        </p>
      </div>
    </aside>
  );
};
