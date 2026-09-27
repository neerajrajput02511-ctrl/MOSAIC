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
    { id: "forecast",     label: "Forecast",          icon: Home },
    { id: "map",          label: "Model Reliability",  icon: Globe },
    { id: "observations", label: "Earth Obs",          icon: Activity },
    { id: "models",       label: "Models",             icon: Layers },
    { id: "verify",       label: "Verify",             icon: CheckCircle2 },
    { id: "extremes",     label: "Extremes",           icon: ShieldAlert, count: extremeEventsCount },
    { id: "research",     label: "Research",           icon: FlaskConical },
    { id: "system",       label: "System",             icon: Settings },
  ];

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-[#D9E0E7] flex flex-col justify-between select-none z-30 min-h-[calc(100vh-72px)]">
      {/* Top Navigation Links */}
      <div className="p-3 space-y-0.5">
        <div className="px-3 py-2 text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedActive === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#EFF6FF] text-[#1769AA] border border-[#BFDBFE]"
                  : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] border border-transparent"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[#1769AA]" : "text-[#94A3B8]"}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge && !isActive && (
                  <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-red-600 text-white"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}>
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Attribution Banner */}
      <div className="p-4 border-t border-[#E2E8F0]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse shrink-0" />
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              MoES / NCMRWF
            </span>
          </div>
          <h4 className="text-xs font-bold text-[#0B1F33] tracking-tight">
            MOSAIC SIH26081
          </h4>
          <p className="text-[10px] text-[#94A3B8] leading-tight">
            Hybrid AI–NWP Multi-Model Blending &amp; Verification System
          </p>
        </div>
      </div>
    </aside>
  );
};
