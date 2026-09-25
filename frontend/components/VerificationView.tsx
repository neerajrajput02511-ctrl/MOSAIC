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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2f4d] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Verification & Ground-Truth Performance
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate MOSAIC forecast accuracy and skill decay against official IMD AWS observations, ERA5 reanalysis, and standard baselines.
          </p>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center bg-[#0c1322] border border-[#1e2f4d] rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab("skill")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "skill"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Skill vs Lead Time</span>
          </button>

          <button
            onClick={() => setActiveSubTab("baselines")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "baselines"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Baseline Comparisons</span>
          </button>

          <button
            onClick={() => setActiveSubTab("replay")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "replay"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                : "text-slate-400 hover:text-slate-200"
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
