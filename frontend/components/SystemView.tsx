"use client";

import React, { useState } from "react";
import { 
  Activity, 
  Server, 
  Database, 
  Sliders, 
  ShieldCheck, 
  Info, 
  Cpu, 
  FileCode2 
} from "lucide-react";
import { SystemHealthView } from "./SystemHealthView";
import { AutomatedPipelineView } from "./AutomatedPipelineView";
import { DataSourcesView } from "./DataSourcesView";
import { ScientificIntegrityView } from "./ScientificIntegrityView";
import { InfoTooltip } from "./InfoTooltip";

export type SystemSubTab = "health" | "pipeline" | "data_sources" | "advanced";

export const SystemView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SystemSubTab>("health");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Sub-Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E0E7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#1769AA]">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#0B1F33] tracking-tight">
              System Infrastructure & Operations
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time pipeline diagnostics, service health, upstream provider registry, and auditable mathematical calculations.
          </p>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center bg-[#F1F5F9] border border-[#D9E0E7] rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab("health")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "health"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health</span>
          </button>

          <button
            onClick={() => setActiveSubTab("pipeline")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "pipeline"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Pipeline (12 Stages)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("data_sources")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "data_sources"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Sources</span>
          </button>

          <button
            onClick={() => setActiveSubTab("advanced")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "advanced"
                ? "bg-[#0B1F33] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Advanced & Math Audit</span>
          </button>
        </div>
      </div>

      {/* Render Selected Sub-View */}
      <div>
        {activeSubTab === "health" && <SystemHealthView />}
        {activeSubTab === "pipeline" && <AutomatedPipelineView />}
        {activeSubTab === "data_sources" && <DataSourcesView />}
        {activeSubTab === "advanced" && <ScientificIntegrityView />}
      </div>
    </div>
  );
};
