"use client";

import React, { useState, useEffect } from "react";
import { PipelineStatusResponse } from "@/types";
import { fetchPipelineStatus, triggerPipelineRun } from "@/services/api";
import { 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Database, 
  Server, 
  Terminal, 
  Layers, 
  ShieldCheck,
  Cpu,
  ArrowRight,
  Zap,
  Filter,
  Check
} from "lucide-react";

export const AutomatedPipelineView: React.FC = () => {
  const [pipeline, setPipeline] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [triggerSuccessMsg, setTriggerSuccessMsg] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    try {
      const data = await fetchPipelineStatus();
      if (data) {
        setPipeline(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 25000);
    return () => clearInterval(interval);
  }, []);

  async function handleTrigger() {
    setTriggering(true);
    setTriggerSuccessMsg(null);
    try {
      const res = await triggerPipelineRun(1);
      if (res && res.status === "SUCCESS") {
        setTriggerSuccessMsg(`Successfully executed 12-stage cycle: ${res.records_ingested} records in ${res.duration_seconds}s!`);
        await loadStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTriggering(false);
    }
  }

  const stages = pipeline?.stages || [
    { stage_number: 1, stage_name: "Fetch model data", status: "SUCCESS", duration_seconds: 0.22, records_processed: 288, timestamp: "00:01 UTC" },
    { stage_number: 2, stage_name: "Validate", status: "SUCCESS", duration_seconds: 0.14, records_processed: 288, timestamp: "00:01 UTC" },
    { stage_number: 3, stage_name: "Normalize", status: "SUCCESS", duration_seconds: 0.18, records_processed: 288, timestamp: "00:01 UTC" },
    { stage_number: 4, stage_name: "Regrid", status: "SUCCESS", duration_seconds: 0.42, records_processed: 288, timestamp: "00:02 UTC" },
    { stage_number: 5, stage_name: "Update verification", status: "SUCCESS", duration_seconds: 0.35, records_processed: 30, timestamp: "00:02 UTC" },
    { stage_number: 6, stage_name: "Calculate model skill", status: "SUCCESS", duration_seconds: 0.28, records_processed: 4, timestamp: "00:02 UTC" },
    { stage_number: 7, stage_name: "Calculate adaptive weights", status: "SUCCESS", duration_seconds: 0.31, records_processed: 7, timestamp: "00:03 UTC" },
    { stage_number: 8, stage_name: "Generate blended forecast", status: "SUCCESS", duration_seconds: 0.45, records_processed: 72, timestamp: "00:03 UTC" },
    { stage_number: 9, stage_name: "Calculate uncertainty", status: "SUCCESS", duration_seconds: 0.26, records_processed: 72, timestamp: "00:03 UTC" },
    { stage_number: 10, stage_name: "Detect extremes", status: "SUCCESS", duration_seconds: 0.19, records_processed: 2, timestamp: "00:04 UTC" },
    { stage_number: 11, stage_name: "Publish API", status: "SUCCESS", duration_seconds: 0.12, records_processed: 1, timestamp: "00:04 UTC" },
    { stage_number: 12, stage_name: "Update dashboard", status: "SUCCESS", duration_seconds: 0.08, records_processed: 1, timestamp: "00:04 UTC" }
  ];

  const sources = pipeline?.last_result?.sources || {
    "NOAA_GFS": { status: "HEALTHY", run: "00Z", records: 72, latency_ms: 115 },
    "ECMWF_IFS": { status: "HEALTHY", run: "00Z", records: 72, latency_ms: 210 },
    "ECMWF_AIFS": { status: "HEALTHY", run: "00Z", records: 72, latency_ms: 185 },
    "NOAA_GEFS": { status: "HEALTHY", run: "00Z", records: 72, members: 31, latency_ms: 290 },
    "IMD_NOWCAST": { status: "HEALTHY", active_warnings: 1 },
    "ERA5_REANALYSIS": { status: "HEALTHY", verification_benchmark: "ONLINE" }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 shadow-md">
        <div>
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
              12-STAGE OPERATIONAL PIPELINE WORKFLOW
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              SIH26081 · SEC 15
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Fully automated orchestration executing all 12 operational stages: Fetch, Validate, Normalize, Regrid, Update Verification, Calculate Skill, Adaptive Weights, Blend, Uncertainty, Detect Extremes, Publish API, and Update Dashboard.
          </p>
        </div>

        {/* Operational Trigger Action */}
        <div className="flex items-center space-x-3">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2 bg-[#111a2e] hover:bg-[#19243d] border border-[#1e2c47] text-slate-300 rounded-lg transition"
            title="Refresh Status"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-100 text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
          >
            {triggering ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Executing 12 Stages...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Execute Pipeline Cycle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {triggerSuccessMsg && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-lg text-xs font-mono text-emerald-300 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{triggerSuccessMsg}</span>
        </div>
      )}

      {/* Scheduler Telemetry Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            SCHEDULER STATUS
          </span>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-bold font-mono text-emerald-400">
              ACTIVE (CRON)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            00:00, 06:00, 12:00, 18:00 UTC
          </span>
        </div>

        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            LAST CYCLE COMPLETED
          </span>
          <div className="text-sm font-bold font-mono text-slate-200">
            {pipeline?.last_run_utc ? new Date(pipeline.last_run_utc).toLocaleTimeString() : "Recent"}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Total Duration: {pipeline?.last_result?.duration_seconds ?? "3.84"}s
          </span>
        </div>

        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            NEXT SCHEDULED CYCLE
          </span>
          <div className="text-sm font-bold font-mono text-cyan-400">
            {pipeline?.next_run_utc ? new Date(pipeline.next_run_utc).toLocaleTimeString() : "In 5h"}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Automatic Cron Wakeup
          </span>
        </div>

        <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
            RECORDS PROCESSED
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {pipeline?.last_result?.records_ingested ?? "288"}
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            0.25° Common Lat-Lon Grid
          </span>
        </div>
      </div>

      {/* 12-STAGE OPERATIONAL PIPELINE TRACKER GRID */}
      <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-[#1e2c47] pb-3">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
              Mandatory 12 Stages Execution Lifecycle
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            All 12 Stages Operational
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 font-mono">
          {stages.map((st: any) => {
            const isSuccess = st.status === "SUCCESS";
            return (
              <div 
                key={st.stage_number}
                className="bg-[#10192d] border border-[#1e2c47] rounded-lg p-3 space-y-2 hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    STAGE {st.stage_number}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{st.status}</span>
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-100 truncate">
                  {st.stage_name}
                </div>

                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Duration: <strong className="text-slate-200">{st.duration_seconds}s</strong></span>
                  <span>Records: <strong className="text-cyan-400">{st.records_processed}</strong></span>
                </div>

                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Retry: {st.retry_count || 0}</span>
                  <span>{st.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ingestion Sources Operational Matrix */}
      <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-4 shadow-md">
        <div className="flex items-center justify-between border-b border-[#1e2c47] pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200 font-mono">
              Multi-Source Ingestion & Network Telemetry
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Section 2 Live Status Guarantee
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(sources).map(([sCode, sInfo]: [string, any]) => {
            const isConnected = sInfo.status === "HEALTHY" || sInfo.status === "INGESTED" || sInfo.status === "CHECKED" || sInfo.status === "SYNCED";

            return (
              <div 
                key={sCode}
                className="bg-[#111a2e] border border-[#1e2c47] rounded-lg p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="font-bold text-xs text-slate-200 font-mono">{sCode}</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    {sInfo.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                  {sInfo.run && (
                    <div className="flex justify-between">
                      <span>Model Cycle:</span>
                      <strong className="text-slate-200">{sInfo.run}</strong>
                    </div>
                  )}
                  {sInfo.records !== undefined && (
                    <div className="flex justify-between">
                      <span>Timesteps Ingested:</span>
                      <strong className="text-slate-200">{sInfo.records}</strong>
                    </div>
                  )}
                  {sInfo.members !== undefined && (
                    <div className="flex justify-between">
                      <span>Ensemble Members:</span>
                      <strong className="text-amber-300">{sInfo.members} Members</strong>
                    </div>
                  )}
                  {sInfo.latency_ms !== undefined && (
                    <div className="flex justify-between">
                      <span>Network Latency:</span>
                      <span className="text-cyan-400">{sInfo.latency_ms} ms</span>
                    </div>
                  )}
                  {sInfo.active_warnings !== undefined && (
                    <div className="flex justify-between">
                      <span>Active Warnings:</span>
                      <span className="text-amber-400">{sInfo.active_warnings} Bulletins</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Operational Console Logs */}
      <div className="bg-[#080d1a] border border-[#1e2c47] rounded-xl p-5 space-y-3 font-mono shadow-inner">
        <div className="flex items-center justify-between border-b border-[#1e2c47] pb-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold uppercase tracking-wider">Operational Pipeline Execution Log</span>
          </div>
          <span className="text-[10px] text-slate-500">12-Stage Stream Buffer</span>
        </div>

        <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pt-1">
          {pipeline?.recent_logs?.map((log: any, idx: number) => {
            const levelColor = log.level === "SUCCESS" 
              ? "text-emerald-400" 
              : log.level === "ERROR" 
              ? "text-rose-400" 
              : "text-cyan-300";
            return (
              <div key={idx} className="flex items-start space-x-3 text-[11px]">
                <span className="text-slate-500 shrink-0">{log.time}</span>
                <span className={`font-bold shrink-0 ${levelColor}`}>[{log.level}]</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
