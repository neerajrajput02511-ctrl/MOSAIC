"use client";

import React, { useState } from "react";
import { 
  FileCheck2, 
  RotateCcw, 
  BarChart3, 
  Target
} from "lucide-react";
import { ScientificValidationView } from "./ScientificValidationView";
import { ForecastReplayView } from "./ForecastReplayView";
import { BaselineComparisonView } from "./BaselineComparisonView";
import { TimelinePoint, LocationItem } from "@/types";

interface VerificationViewProps {
  timeline?: TimelinePoint[];
  selectedLocation?: LocationItem | null;
  selectedLeadTime?: number;
  onSelectLeadTime?: (lead: number) => void;
  monitoringScope?: "NER" | "INDIA";
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  timeline = [],
  selectedLocation = null,
  selectedLeadTime = 24,
  onSelectLeadTime,
  monitoringScope = "NER"
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"skill" | "replay" | "baselines">("skill");

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Verification & Ground-Truth Performance
            </h1>
          </div>
          <p className="text-xs text-[#9DAFC4] mt-1">
            Evaluate MOSAIC forecast accuracy and skill decay against official IMD AWS observations, ERA5 reanalysis, and standard baselines.
          </p>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center bg-[#081426] border border-[#1E293B] rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab("skill")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "skill"
                ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                : "text-[#9DAFC4] hover:text-white"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Skill vs Lead Time</span>
          </button>

          <button
            onClick={() => setActiveSubTab("baselines")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "baselines"
                ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                : "text-[#9DAFC4] hover:text-white"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Baseline Comparisons</span>
          </button>

          <button
            onClick={() => setActiveSubTab("replay")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "replay"
                ? "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                : "text-[#9DAFC4] hover:text-white"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Historical Replay Lab</span>
          </button>
        </div>
      </div>

      {/* Render Sub-View */}
      <div>
        {activeSubTab === "skill" && <ScientificValidationView monitoringScope={monitoringScope} />}
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
