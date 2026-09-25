"use client";

import React, { useState } from "react";
import { 
  FileCheck2, 
  RotateCcw, 
  BarChart3, 
  Sliders, 
  Target, 
  ShieldCheck, 
  Info 
} from "lucide-react";
import { ScientificValidationView } from "./ScientificValidationView";
import { ForecastReplayView } from "./ForecastReplayView";
import { BaselineComparisonView } from "./BaselineComparisonView";
import { InfoTooltip } from "./InfoTooltip";
import { TimelinePoint, LocationItem } from "@/types";

interface VerificationViewProps {
  timeline?: TimelinePoint[];
  selectedLocation?: LocationItem | null;
  selectedLeadTime?: number;
  onSelectLeadTime?: (lead: number) => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  timeline = [],
  selectedLocation = null,
  selectedLeadTime = 24,
  onSelectLeadTime
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"skill" | "replay" | "baselines">("skill");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E0E7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A]">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#0B1F33] tracking-tight">
              Verification & Ground-Truth Performance
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Evaluate MOSAIC forecast accuracy and skill decay against official IMD AWS observations, ERA5 reanalysis, and standard baselines.
          </p>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center bg-[#F1F5F9] border border-[#D9E0E7] rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab("skill")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "skill"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Skill vs Lead Time</span>
          </button>

          <button
            onClick={() => setActiveSubTab("baselines")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "baselines"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Baseline Comparisons</span>
          </button>

          <button
            onClick={() => setActiveSubTab("replay")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "replay"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Historical Replay Lab</span>
          </button>
        </div>
      </div>

      {/* Render Sub-View */}
      <div>
        {activeSubTab === "skill" && <ScientificValidationView />}
        {activeSubTab === "baselines" && (
          <BaselineComparisonView
            timeline={timeline}
            selectedLocation={selectedLocation}
            selectedLeadTime={selectedLeadTime}
            onSelectLeadTime={onSelectLeadTime || (() => {})}
          />
        )}
        {activeSubTab === "replay" && <ForecastReplayView />}
      </div>
    </div>
  );
};
