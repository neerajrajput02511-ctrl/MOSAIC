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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2f4d] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              System Infrastructure & Operations
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline diagnostics, service health, upstream provider registry, and auditable mathematical calculations.
          </p>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex items-center bg-[#0c1322] border border-[#1e2f4d] rounded-xl p-1">
          <button
            onClick={() => setActiveSubTab("health")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "health"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Health</span>
          </button>

          <button
            onClick={() => setActiveSubTab("pipeline")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "pipeline"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Pipeline (12 Stages)</span>
          </button>

          <button
            onClick={() => setActiveSubTab("data_sources")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "data_sources"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Data Sources</span>
          </button>

          <button
            onClick={() => setActiveSubTab("advanced")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSubTab === "advanced"
                ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
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
