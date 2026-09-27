"use client";

import React from "react";
import { 
  Home, 
  Globe,
  Layers, 
  CheckCircle2, 
  ShieldAlert, 
  FlaskConical,
  Settings, 
  Activity,
  Cpu
} from "lucide-react";

export type NavTab = 
  | "forecast" 
  | "map" 
  | "models" 
  | "verify" 
  | "extremes" 
  | "research" 
  | "observations"
  | "system"
  | "verification"
  | "events";

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  extremeEventsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  extremeEventsCount = 0
}) => {
  // Normalize activeTab for aliases
  const normalizedActive = 
    activeTab === "verification" ? "verify" :
    activeTab === "events" ? "extremes" : activeTab;

  const navItems: { id: NavTab; label: string; icon: any; count?: number; badge?: string }[] = [
    { id: "forecast", label: "Forecast", icon: Home },
    { id: "map", label: "Model Reliability", icon: Globe },
    { id: "observations", label: "Earth Obs", icon: Activity },
    { id: "models", label: "Models", icon: Layers },
    { id: "verify", label: "Verify", icon: CheckCircle2 },
    { id: "extremes", label: "Extremes", icon: ShieldAlert, count: extremeEventsCount },
    { id: "research", label: "Research", icon: FlaskConical },
    { id: "system", label: "System", icon: Settings },
  ];

  return (
    <aside className="w-60 shrink-0 bg-[#070D18] border-r border-[#1E293B] flex flex-col justify-between select-none z-30 min-h-[calc(100vh-72px)]">
      {/* Top Navigation Links */}
      <div className="p-3.5 space-y-1.5">
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          COMMAND COCKPIT
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedActive === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10"
                  : "text-slate-400 hover:bg-[#0B1528] hover:text-white border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && !isActive && (
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-rose-500 text-white" : "bg-rose-950 text-rose-300 border border-rose-800"
                  }`}>
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Operational Attribution Banner */}
      <div className="p-4 border-t border-[#1E293B] relative overflow-hidden bg-gradient-to-b from-transparent to-[#040810]">
        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">
              MoES / NCMRWF
            </span>
          </div>
          <h4 className="text-xs font-bold text-white tracking-tight font-mono">
            MOSAIC SIH26081
          </h4>
          <p className="text-[10px] text-slate-500 font-mono leading-tight">
            Hybrid AI–NWP Multi-Model Blending & Verification System
          </p>
        </div>
      </div>
    </aside>
  );
};

