"use client";

import React, { useState, useEffect } from "react";
import { Layers, AlertTriangle, ShieldCheck, CloudRain, Thermometer, Wind, ArrowUpRight } from "lucide-react";
import { LocationItem } from "@/types";
import { fetchNerMonitoring } from "@/services/api";

interface NERStationSummary {
  location_id: number;
  station: string;
  state: string;
  coordinates: [number, number];
  elevation_m: number;
  blended_precipitation_mm: number;
  blended_temperature_c: number;
  weather_regime: string;
  model_disagreement_spread: number;
  active_alerts_count: number;
  highest_alert: string;
}

interface NERMonitoringViewProps {
  onSelectStation: (loc: LocationItem) => void;
  locations: LocationItem[];
}

export const NERMonitoringView: React.FC<NERMonitoringViewProps> = ({
  onSelectStation,
  locations
}) => {
  const [data, setData] = useState<NERStationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadNER() {
      setLoading(true);
      try {
        const result = await fetchNerMonitoring();
        if (result && result.states) {
          setData(result.states || []);
        }
      } catch (err) {
        console.error("Failed to load NER monitoring:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNER();
  }, []);

  const nerStates = [
    "Assam",
    "Meghalaya",
    "Arunachal Pradesh",
    "Manipur",
    "Mizoram",
    "Nagaland",
    "Tripura",
    "Sikkim"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2c47] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-slate-100 uppercase tracking-wider">
              NORTH EASTERN REGION (NER) OPERATIONAL SURVEILLANCE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-state meteorological intelligence across all 8 North Eastern States with high orographic precipitation vulnerability.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded">
          <span>8 STATES MONITORED</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Aggregating telemetry across all North Eastern stations...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.map((item) => {
            const hasAlert = item.active_alerts_count > 0;
            const fullLoc = locations.find(l => l.id === item.location_id);

            return (
              <div
                key={item.location_id}
                onClick={() => fullLoc && onSelectStation(fullLoc)}
                className="bg-[#0c1322] hover:bg-[#111a2e] border border-[#1e2c47] hover:border-cyan-500/50 rounded-lg p-4 space-y-3 cursor-pointer transition-all duration-200 shadow-md group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      {item.state}
                    </span>
                    <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition">
                      {item.station}
                    </h3>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-[#111a2e]/60 p-2 rounded border border-[#1e2c47]">
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <CloudRain className="w-3 h-3 text-cyan-400" />
                      <span>RAIN (24h)</span>
                    </div>
                    <div className="text-base font-bold text-cyan-300 mt-0.5">
                      {item.blended_precipitation_mm} <span className="text-[10px] text-slate-400 font-normal">mm</span>
                    </div>
                  </div>

                  <div className="bg-[#111a2e]/60 p-2 rounded border border-[#1e2c47]">
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                      <Thermometer className="w-3 h-3 text-amber-400" />
                      <span>TEMP</span>
                    </div>
                    <div className="text-base font-bold text-slate-200 mt-0.5">
                      {item.blended_temperature_c}°C
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-[#1e2c47]">
                  <span className="text-slate-400">Regime:</span>
                  <span className="text-slate-200 font-medium">{item.weather_regime}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Spread (σ):</span>
                  <span className="text-slate-300">±{item.model_disagreement_spread} mm</span>
                </div>

                <div className="pt-2 border-t border-[#1e2c47] flex justify-between items-center text-[10px]">
                  <span className="text-slate-500 font-mono">Elev: {item.elevation_m}m</span>
                  {hasAlert ? (
                    <span className="text-amber-400 font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{item.highest_alert.replace("_", " ")}</span>
                    </span>
                  ) : (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Normal Guidance</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
