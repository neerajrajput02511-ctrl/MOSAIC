"use client";

import React from "react";
import { 
  Home, 
  Layers, 
  CheckCircle2, 
  Bell, 
  Settings, 
  CloudSun, 
  Mountain 
} from "lucide-react";

export type NavTab = "forecast" | "models" | "verification" | "events" | "system";

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
  const navItems: { id: NavTab; label: string; icon: any; count?: number }[] = [
    { id: "forecast", label: "Forecast", icon: Home },
    { id: "models", label: "Models", icon: Layers },
    { id: "verification", label: "Verification", icon: CheckCircle2 },
    { id: "events", label: "Events", icon: Bell, count: extremeEventsCount },
    { id: "system", label: "System", icon: Settings },
  ];

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-[#D9E0E7] flex flex-col justify-between select-none z-30 min-h-[calc(100vh-72px)]">
      {/* Top Navigation Links */}
      <div className="p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0B1F33] text-white shadow-sm"
                  : "text-[#475569] hover:bg-[#EEF2F6] hover:text-[#0F172A]"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#64748B]"}`} />
                <span className="tracking-tight">{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700"
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Mission Watermark (Reference Image Aesthetic) */}
      <div className="p-5 border-t border-[#EDF2F7] relative overflow-hidden bg-gradient-to-b from-transparent to-[#F8FAFC]">
        {/* Subtle decorative mountain silhouette svg */}
        <div className="opacity-15 absolute bottom-0 right-0 left-0 pointer-events-none flex justify-center">
          <svg viewBox="0 0 240 70" fill="none" className="w-full text-[#1769AA]" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 70L45 35L80 50L135 15L175 42L210 25L240 70H0Z" fill="currentColor" opacity="0.3" />
            <path d="M30 70L85 28L120 45L165 20L205 48L240 70H30Z" fill="currentColor" opacity="0.2" />
          </svg>
        </div>

        <div className="relative z-10 space-y-1">
          <h4 className="text-xs font-bold text-[#0F172A] tracking-tight">
            Better Forecasts<br />for a Safer Tomorrow
          </h4>
          <p className="text-[11px] text-[#64748B] leading-tight">
            AI-powered meteorological intelligence for a more resilient world.
          </p>
        </div>
      </div>
    </aside>
  );
};
