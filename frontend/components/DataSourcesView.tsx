"use client";

import React, { useState, useEffect } from "react";
import { DataSourceItem } from "@/types";
import { fetchDataSources } from "@/services/api";
import { Database, CheckCircle, AlertTriangle, Key, Clock, ExternalLink } from "lucide-react";

export const DataSourcesView: React.FC = () => {
  const [sources, setSources] = useState<DataSourceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSources() {
      setLoading(true);
      const data = await fetchDataSources();
      setSources(data);
      setLoading(false);
    }
    loadSources();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>CONNECTED</span>
          </span>
        );
      case "AUTH_REQUIRED":
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Key className="w-3 h-3" />
            <span>AUTH REQUIRED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-[#1e2c47] pb-4">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="font-bold text-base text-slate-100 uppercase tracking-wider">
            METEOROLOGICAL DATA SOURCES & TELEMETRY
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Full transparency registry of all upstream NWP, AI, In-Situ, and Satellite feeds. No fabricated endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((s, idx) => (
          <div key={idx} className="bg-[#0c1322] border border-[#1e2c47] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-100">{s.source_name}</h3>
                <span className="text-[11px] font-mono text-slate-400">{s.endpoint_url || "Direct System Feed"}</span>
              </div>
              {getStatusBadge(s.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-[#1e2c47]">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">LATENCY / PING</span>
                <span className="text-slate-200 font-semibold">{s.latency_ms ? `${s.latency_ms} ms` : "Standby"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">LAST ATTEMPT</span>
                <span className="text-slate-200">
                  {s.last_attempt_at ? new Date(s.last_attempt_at).toLocaleTimeString() : "Current Run"}
                </span>
              </div>
            </div>

            {s.error_message && (
              <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 space-y-1">
                <span className="font-bold block">Status Guidance:</span>
                <span>{s.error_message}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#1e2c47] text-[10px] text-slate-400 flex justify-between items-center">
              <span>License / Attribution:</span>
              <span className="text-slate-300 font-mono">{s.license_attribution || "Public Domain / CC-BY"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
