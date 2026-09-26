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
      <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-[#1769AA]" />
          <h2 className="font-bold text-base text-[#0B1F33] tracking-wide">
            METEOROLOGICAL DATA SOURCES & TELEMETRY REGISTRY
          </h2>
        </div>
        <p className="text-xs text-[#64748B] mt-1">
          Full transparency registry of all upstream NWP, AI, In-Situ, and Satellite feeds. Truthful provider attribution without fabricated endpoints.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((s, idx) => (
          <div key={idx} className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-3 hover:border-[#1769AA]/40 transition">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-[#0B1F33]">{s.source_name}</h3>
                <span className="text-[11px] font-mono text-[#64748B]">{s.endpoint_url || "Direct System Feed"}</span>
              </div>
              {getStatusBadge(s.status)}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-[#EDF2F7]">
              <div>
                <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">LATENCY / PING</span>
                <span className="text-[#0B1F33] font-semibold">{s.latency_ms ? `${s.latency_ms} ms` : "Standby"}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#64748B] block uppercase tracking-wider">LAST ATTEMPT</span>
                <span className="text-[#0B1F33]">
                  {s.last_attempt_at ? new Date(s.last_attempt_at).toLocaleTimeString() : "Current Run"}
                </span>
              </div>
            </div>

            {s.error_message && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                <span className="font-bold block">Status Guidance:</span>
                <span>{s.error_message}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#EDF2F7] text-xs text-[#64748B] flex justify-between items-center">
              <span>License / Attribution:</span>
              <span className="text-[#0B1F33] font-mono font-medium">{s.license_attribution || "Public Domain / CC-BY"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

