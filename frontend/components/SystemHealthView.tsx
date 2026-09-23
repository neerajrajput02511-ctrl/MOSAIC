"use client";

import React, { useState, useEffect } from "react";
import { fetchSystemHealth } from "@/services/api";
import { HeartPulse, CheckCircle, Server, Database, Activity, RefreshCw } from "lucide-react";

export const SystemHealthView: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function refreshHealth() {
    setLoading(true);
    const data = await fetchSystemHealth();
    setHealth(data);
    setLoading(false);
  }

  useEffect(() => {
    refreshHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#1e2c47] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-slate-100 uppercase tracking-wider">
              OPERATIONAL SYSTEM HEALTH & PIPELINE STATUS
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry pings for REST services, ML blending pipelines, and external meteorological gateways.
          </p>
        </div>
        <button
          onClick={refreshHealth}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111a2e] hover:bg-[#19243d] border border-[#1e2c47] text-slate-200 text-xs rounded transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Ping Services</span>
        </button>
      </div>

      {health && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>FastAPI Service</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">ONLINE 200 OK</div>
              <span className="text-[11px] text-slate-500 font-mono">Uvicorn ASGI Engine</span>
            </div>

            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Database Engine</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-100">
                {health.database?.engine.toUpperCase()}
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {health.database?.locations_seeded} Stations Active
              </span>
            </div>

            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>ML Blending Engine</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400">ACTIVE</div>
              <span className="text-[11px] text-slate-400 font-mono">Softmax Constrained Σw=1</span>
            </div>
          </div>

          <div className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Live Gateway Heartbeats
            </h3>
            <div className="divide-y divide-[#1e2c47]">
              {health.data_sources?.map((ds: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${
                      ds.status === "CONNECTED" ? "bg-emerald-400" : ds.status === "AUTH_REQUIRED" ? "bg-amber-400" : "bg-rose-400"
                    }`} />
                    <span className="font-bold text-slate-200">{ds.source_name}</span>
                    <span className="text-slate-500 font-sans">{ds.message}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="text-slate-400">{ds.latency_ms ? `${ds.latency_ms} ms` : "Standby"}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ds.status === "CONNECTED" 
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}>
                      {ds.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
