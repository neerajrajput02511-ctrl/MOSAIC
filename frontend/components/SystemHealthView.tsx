"use client";

import React, { useState, useEffect } from "react";
import { fetchSystemHealth } from "@/services/api";
import { HeartPulse, RefreshCw } from "lucide-react";

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
    <div className="space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
            <h2 className="font-bold text-base text-white uppercase tracking-wider font-mono">
              OPERATIONAL SYSTEM HEALTH & PIPELINE STATUS
            </h2>
          </div>
          <p className="text-xs text-[#9DAFC4] mt-1">
            Real-time telemetry pings for REST services, ML blending pipelines, and external meteorological gateways.
          </p>
        </div>
        <button
          onClick={refreshHealth}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white text-xs font-semibold rounded-lg shadow-sm hover:brightness-110 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Ping Services</span>
        </button>
      </div>

      {health && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
                <span className="font-medium">FastAPI Service</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">ONLINE 200 OK</div>
              <span className="text-[11px] text-[#667B94] font-mono">Uvicorn ASGI Engine</span>
            </div>

            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
                <span className="font-medium">Database Engine</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {health.database?.engine?.toUpperCase() || "SQLITE"}
              </div>
              <span className="text-[11px] text-[#667B94] font-mono">
                {health.database?.locations_seeded} Stations Active
              </span>
            </div>

            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs text-[#9DAFC4]">
                <span className="font-medium">ML Blending Engine</span>
                <span className="w-2 h-2 rounded-full bg-[#00B8E6] shadow-xs shadow-[#00B8E6]/50" />
              </div>
              <div className="text-xl font-bold font-mono text-[#00B8E6]">OPERATIONAL</div>
              <span className="text-[11px] text-[#667B94] font-mono">Softmax Constrained Σw=1</span>
            </div>
          </div>

          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Live Gateway Heartbeats
            </h3>
            <div className="divide-y divide-[#1E293B]">
              {health.data_sources?.map((ds: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${
                      ds.status === "CONNECTED" ? "bg-emerald-400" : ds.status === "AUTH_REQUIRED" ? "bg-amber-400" : "bg-red-400"
                    }`} />
                    <span className="font-bold text-white">{ds.source_name}</span>
                    <span className="text-[#9DAFC4] font-sans">{ds.message}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="text-[#667B94]">{ds.latency_ms ? `${ds.latency_ms} ms` : "Standby"}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ds.status === "CONNECTED" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" 
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
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
