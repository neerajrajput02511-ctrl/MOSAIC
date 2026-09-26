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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E2EC] pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EAF3FF] border border-[#BFD9FF] flex items-center justify-center text-[#1677FF]">
              <Layers className="w-4 h-4 text-[#1677FF]" />
            </div>
            <h2 className="font-bold text-base text-[#102A43] uppercase tracking-wide">
              NORTH EASTERN REGION (NER) OPERATIONAL SURVEILLANCE
            </h2>
          </div>
          <p className="text-xs text-[#52667A] mt-1">
            Real-time multi-state meteorological intelligence across all 8 North Eastern States with high orographic precipitation vulnerability.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold font-mono text-[#1677FF] bg-[#EAF3FF] border border-[#BFD9FF] px-3 py-1.5 rounded-full">
          <span>8 STATES MONITORED</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-[#52667A]">
          <div className="w-8 h-8 border-2 border-[#1677FF] border-t-transparent rounded-full animate-spin" />
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
                className="bg-white hover:bg-[#F4F7FA]/40 border border-[#D9E2EC] hover:border-[#1677FF]/60 rounded-xl p-4 space-y-3 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-sm group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#1677FF] uppercase tracking-wider block font-mono">
                      {item.state}
                    </span>
                    <h3 className="font-bold text-sm text-[#102A43] group-hover:text-[#1677FF] transition">
                      {item.station}
                    </h3>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-[#52667A] group-hover:text-[#1677FF] transition" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                  <div className="bg-[#F4F7FA] p-2 rounded-lg border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#52667A] flex items-center space-x-1 font-sans font-bold">
                      <CloudRain className="w-3 h-3 text-[#1677FF]" />
                      <span>RAIN (24h)</span>
                    </div>
                    <div className="text-base font-bold text-[#102A43] mt-0.5">
                      {item.blended_precipitation_mm} <span className="text-[10px] text-[#52667A] font-normal">mm</span>
                    </div>
                  </div>

                  <div className="bg-[#F4F7FA] p-2 rounded-lg border border-[#D9E2EC]">
                    <div className="text-[10px] text-[#52667A] flex items-center space-x-1 font-sans font-bold">
                      <Thermometer className="w-3 h-3 text-[#B7791F]" />
                      <span>TEMP</span>
                    </div>
                    <div className="text-base font-bold text-[#102A43] mt-0.5">
                      {item.blended_temperature_c}°C
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-[#D9E2EC]">
                  <span className="text-[#52667A] font-sans">Regime:</span>
                  <span className="text-[#102A43] font-semibold">{item.weather_regime}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#52667A] font-sans">Spread (&sigma;):</span>
                  <span className="text-[#102A43]">±{item.model_disagreement_spread} mm</span>
                </div>

                <div className="pt-2 border-t border-[#D9E2EC] flex justify-between items-center text-[10px]">
                  <span className="text-[#52667A] font-mono">Elev: {item.elevation_m}m</span>
                  {hasAlert ? (
                    <span className="text-[#B7791F] font-bold flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{item.highest_alert.replace("_", " ")}</span>
                    </span>
                  ) : (
                    <span className="text-[#15966B] flex items-center space-x-1 font-semibold">
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
