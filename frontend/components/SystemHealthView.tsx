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
      <div className="flex items-center justify-between border-b border-[#D9E0E7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-5 h-5 text-[#16A34A]" />
            <h2 className="font-bold text-base text-[#0B1F33] uppercase tracking-wider">
              OPERATIONAL SYSTEM HEALTH & PIPELINE STATUS
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time telemetry pings for REST services, ML blending pipelines, and external meteorological gateways.
          </p>
        </div>
        <button
          onClick={refreshHealth}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0B1F33] hover:bg-[#1769AA] text-white text-xs font-semibold rounded-lg transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Ping Services</span>
        </button>
      </div>

      {health && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium">FastAPI Service</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#16A34A]">ONLINE 200 OK</div>
              <span className="text-[11px] text-[#64748B] font-mono">Uvicorn ASGI Engine</span>
            </div>

            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium">Database Engine</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#0B1F33]">
                {health.database?.engine.toUpperCase()}
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">
                {health.database?.locations_seeded} Stations Active
              </span>
            </div>

            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-medium">ML Blending Engine</span>
                <span className="w-2 h-2 rounded-full bg-[#1769AA]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#1769AA]">OPERATIONAL</div>
              <span className="text-[11px] text-[#64748B] font-mono">Softmax Constrained Σw=1</span>
            </div>
          </div>

          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F33]">
              Live Gateway Heartbeats
            </h3>
            <div className="divide-y divide-[#EDF2F7]">
              {health.data_sources?.map((ds: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center space-x-3">
                    <span className={`w-2 h-2 rounded-full ${
                      ds.status === "CONNECTED" ? "bg-[#16A34A]" : ds.status === "AUTH_REQUIRED" ? "bg-[#D97706]" : "bg-[#DC2626]"
                    }`} />
                    <span className="font-bold text-[#0F172A]">{ds.source_name}</span>
                    <span className="text-[#64748B] font-sans">{ds.message}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px]">
                    <span className="text-[#64748B]">{ds.latency_ms ? `${ds.latency_ms} ms` : "Standby"}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      ds.status === "CONNECTED" 
                        ? "bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]" 
                        : "bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
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
