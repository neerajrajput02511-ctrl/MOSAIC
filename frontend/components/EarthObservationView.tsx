"use client";

import React, { useState, useEffect } from "react";
import {
  fetchImdStations,
  fetchImdObservations,
  fetchImdRainfall,
  fetchSatelliteProducts,
  fetchSatelliteCloudView,
  fetchSatelliteRainfall,
  fetchRadarStations,
  fetchRadarNowcast,
  fetchLightningObservations,
  fetchObservationConsistency,
  fetchExtremeRainfallFusion,
  fetchSourcesHealthTelemetry,
  fetchSourcesIngestionLog,
  fetchFusionDossier
} from "@/services/api";

interface EarthObservationViewProps {
  currentLat?: number;
  currentLon?: number;
  locationName?: string;
}

export default function EarthObservationView({
  currentLat = 26.1061,
  currentLon = 91.5859,
  locationName = "Guwahati (Borjhar AWS)"
}: EarthObservationViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"fusion" | "satellite" | "radar" | "stations" | "telemetry">("fusion");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStation, setSelectedStation] = useState<string>("42410"); // Guwahati

  // Data states
  const [stations, setStations] = useState<any[]>([]);
  const [observations, setObservations] = useState<any[]>([]);
  const [rainfallData, setRainfallData] = useState<any>(null);
  const [satelliteProducts, setSatelliteProducts] = useState<any[]>([]);
  const [cloudView, setCloudView] = useState<any>(null);
  const [satelliteRain, setSatelliteRain] = useState<any>(null);
  const [radarStations, setRadarStations] = useState<any[]>([]);
  const [radarNowcast, setRadarNowcast] = useState<any>(null);
  const [lightning, setLightning] = useState<any>(null);
  const [consistency, setConsistency] = useState<any>(null);
  const [extremeFusion, setExtremeFusion] = useState<any>(null);
  const [sourcesHealth, setSourcesHealth] = useState<any>(null);
  const [ingestionLog, setIngestionLog] = useState<any[]>([]);
  const [fusionDossier, setFusionDossier] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [
          stns,
          obs,
          rain,
          satProds,
          cloud,
          satR,
          radStns,
          radNc,
          lgt,
          cons,
          ext,
          health,
          log,
          dossier
        ] = await Promise.all([
          fetchImdStations(),
          fetchImdObservations(selectedStation, currentLat, currentLon),
          fetchImdRainfall(selectedStation),
          fetchSatelliteProducts(),
          fetchSatelliteCloudView(currentLat, currentLon),
          fetchSatelliteRainfall(currentLat, currentLon),
          fetchRadarStations(),
          fetchRadarNowcast(currentLat, currentLon),
          fetchLightningObservations(currentLat, currentLon),
          fetchObservationConsistency(currentLat, currentLon),
          fetchExtremeRainfallFusion(currentLat, currentLon),
          fetchSourcesHealthTelemetry(),
          fetchSourcesIngestionLog(),
          fetchFusionDossier(currentLat, currentLon)
        ]);

        if (isMounted) {
          setStations(stns || []);
          setObservations(obs || []);
          setRainfallData(rain);
          setSatelliteProducts(satProds || []);
          setCloudView(cloud);
          setSatelliteRain(satR);
          setRadarStations(radStns || []);
          setRadarNowcast(radNc);
          setLightning(lgt);
          setConsistency(cons);
          setExtremeFusion(ext);
          setSourcesHealth(health);
          setIngestionLog(log || []);
          setFusionDossier(dossier);
          setLoading(false);
        }
      } catch (err) {
        console.error("EarthObservationView load error:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [currentLat, currentLon, selectedStation]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner — white/light style */}
      <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#1769AA]">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </div>
              <h1 className="text-xl font-bold text-[#0B1F33] tracking-tight">
                Earth Observation &amp; Multi-Sensor Data Fusion Center
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD] rounded">
                EARTH OBSERVATION &amp; MULTI-SENSOR DATA FUSION
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                Multi-Source Active
              </span>
            </div>
            <p className="text-xs text-[#64748B] max-w-3xl mt-1.5">
              Authoritative ground-truth assimilation combining IMD synoptic &amp; AWS stations, ISRO MOSDAC INSAT-3DR/GSMaP, Doppler Weather Radar nowcasts (0–3h), and IITM lightning surveillance cross-verified against multi-model NWP &amp; AI forecasts.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#D9E0E7] rounded-lg p-2 text-xs shrink-0">
            <span className="text-[#64748B] font-bold uppercase text-[10px]">TARGET:</span>
            <span className="font-bold text-[#1769AA]">{locationName || "All India Domain"}</span>
            {currentLat !== undefined && currentLon !== undefined && (
              <span className="text-[#94A3B8] font-mono">({currentLat.toFixed(2)}°N, {currentLon.toFixed(2)}°E)</span>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-[#D9E0E7]">
          {[
            { id: "fusion" as const, label: "⚖️ Data Fusion Dossier" },
            { id: "satellite" as const, label: "🛰️ Satellite (INSAT & GSMaP)" },
            { id: "radar" as const, label: "📡 Radar & Lightning" },
            { id: "stations" as const, label: "📍 IMD Surface AWS" },
            { id: "telemetry" as const, label: "📊 Ingestion Audit" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === tab.id
                  ? "bg-[#1769AA] text-white shadow-sm"
                  : "bg-[#F1F5F9] text-[#64748B] border border-[#D9E0E7] hover:text-[#0F172A] hover:bg-[#EEF2F6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-12 text-center shadow-sm">
          <div className="w-10 h-10 border-2 border-[#1769AA] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0B1F33]">Synchronizing Multi-Source Meteorological Feeds...</p>
          <p className="text-xs text-[#64748B] mt-1">Ingesting IMD AWS stations, INSAT-3DR satellite telemetry, and radar sweeps</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: DATA FUSION DOSSIER & OBSERVATION CONSISTENCY                      */}
          {/* ========================================================================= */}
          {activeSubTab === "fusion" && (
            <div className="space-y-6">
              {/* Scientific Consistency Callout */}
              {consistency && (
                <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <span className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Multi-Sensor Validation</span>
                      <h2 className="text-lg font-bold text-[#0B1F33] flex items-center gap-2">
                        Observation Consistency Engine (Station vs Satellite vs Radar)
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-[#64748B]">Consistency Index</div>
                        <div className="text-lg font-black text-[#16A34A]">
                          {consistency.consistency_index ? (consistency.consistency_index * 100).toFixed(0) : "--"}%
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                        consistency.consistency_rating === "EXCELLENT"
                          ? "bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {consistency.consistency_rating}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {consistency.comparison_table?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <div className="text-xs font-semibold text-[#64748B] mb-1">{item.source}</div>
                        <div className="text-lg font-bold text-[#0B1F33] mb-0.5">
                          {item.value_mm !== null ? `${item.value_mm} mm` : "N/A"}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                          <span>{item.station || item.sensor || item.radar}</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono ${
                            item.quality === "VALID" ? "text-[#16A34A] bg-[#DCFCE7]" : "text-amber-700 bg-amber-50"
                          }`}>
                            {item.quality}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 text-xs text-[#1769AA] flex items-start gap-2.5">
                    <span className="text-sm">💡</span>
                    <div>
                      <strong className="text-[#0B1F33]">Meteorological Assessment: </strong>
                      <span className="text-[#334155]">{consistency.scientific_diagnosis}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* What MOSAIC Sees vs What MOSAIC Predicts */}
              {fusionDossier && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: What MOSAIC Sees */}
                  <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Ground Truth &amp; Telemetry</span>
                        <h3 className="text-base font-bold text-[#0B1F33]">What MOSAIC Sees (Observations)</h3>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-mono bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD] rounded">
                        5 Sensor Feeds
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-[#334155]">IMD Ground Synoptic AWS</span>
                          <span className="text-[#16A34A] font-mono text-[11px]">VALID</span>
                        </div>
                        <div className="text-sm font-bold text-[#0B1F33]">
                          {fusionDossier.what_mosaic_sees.ground_station?.station_name || "Station"}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#E2E8F0] text-xs">
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Temp</span>
                            <span className="font-semibold text-[#0F172A]">
                              {fusionDossier.what_mosaic_sees.ground_station?.temperature_c !== null
                                ? `${fusionDossier.what_mosaic_sees.ground_station?.temperature_c}°C`
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Precip</span>
                            <span className="font-semibold text-[#0F172A]">
                              {fusionDossier.what_mosaic_sees.ground_station?.precipitation_mm !== null
                                ? `${fusionDossier.what_mosaic_sees.ground_station?.precipitation_mm} mm`
                                : "0.0 mm"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Wind</span>
                            <span className="font-semibold text-[#0F172A]">
                              {fusionDossier.what_mosaic_sees.ground_station?.wind_speed_ms !== null
                                ? `${fusionDossier.what_mosaic_sees.ground_station?.wind_speed_ms} m/s`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-[#334155]">INSAT-3DR Thermal Cloud</span>
                          <span className="text-[#1769AA] font-mono text-[11px]">10.8 µm TIR</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#64748B]">Cloud Cover:</span>
                          <span className="font-bold text-[#0B1F33]">{fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_cover_pct}%</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-[#64748B]">Cloud-Top Brightness Temp:</span>
                          <span className="font-bold text-[#1769AA]">
                            {fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_top_brightness_temp_k} K ({fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_top_brightness_temp_c}°C)
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] mt-1 font-mono">
                          Class: {fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_classification}
                        </div>
                      </div>

                      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-[#334155]">Doppler Weather Radar (DWR)</span>
                          <span className="text-[#7C3AED] font-mono text-[11px]">
                            {fusionDossier.what_mosaic_sees.doppler_radar?.radar_station}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#64748B]">Base Reflectivity:</span>
                          <span className="font-bold text-[#0B1F33]">
                            {fusionDossier.what_mosaic_sees.doppler_radar?.base_reflectivity_dbz} dBZ
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-[#64748B]">Distance to Radar:</span>
                          <span className="text-[#334155]">{fusionDossier.what_mosaic_sees.doppler_radar?.distance_km} km</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: What MOSAIC Predicts */}
                  <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-xs font-bold text-[#7C3AED] uppercase tracking-wider">Predictive Synthesis</span>
                        <h3 className="text-base font-bold text-[#0B1F33]">What MOSAIC Predicts (Forecast)</h3>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-mono bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE] rounded">
                        Lead: {fusionDossier.what_mosaic_predicts.lead_time}
                      </span>
                    </div>

                    <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4 text-center">
                      <div className="text-xs text-[#64748B] mb-1">MOSAIC Hybrid Multi-Model Blend</div>
                      <div className="text-3xl font-black text-[#1769AA]">
                        {fusionDossier.what_mosaic_predicts.mosaic_blend_value} mm
                      </div>
                      <div className="text-xs text-[#64748B] mt-1">
                        Uncertainty 90% CI: [{fusionDossier.what_mosaic_predicts.uncertainty_range.lower_bound} – {fusionDossier.what_mosaic_predicts.uncertainty_range.upper_bound}] mm
                      </div>
                      <div className="mt-3 inline-block px-2.5 py-0.5 rounded text-[11px] font-mono bg-white border border-[#D9E0E7] text-[#64748B]">
                        Equal-Weight Baseline: {fusionDossier.what_mosaic_predicts.equal_weight_baseline} mm
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#64748B]">Constituent Model Contributions:</div>
                      {fusionDossier.what_mosaic_predicts.contributing_models?.map((m: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 text-xs">
                          <span className="font-semibold text-[#334155]">{m.model}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-[#64748B] font-mono">{m.forecast} mm</span>
                            <span className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD]">
                              {(m.weight * 100).toFixed(0)}% weight
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 leading-relaxed">
                      {fusionDossier.explainability_summary}
                    </div>
                  </div>
                </div>
              )}

              {/* Source Comparison Matrix Table */}
              {fusionDossier?.source_comparison_matrix && (
                <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0B1F33] mb-3 flex items-center gap-2">
                    📋 Complete Data Lineage &amp; Provenance Matrix (Requirement 27)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold bg-[#F8FAFC]">
                          <th className="py-2.5 px-3">Source Name</th>
                          <th className="py-2.5 px-3">Dataset / Identifier</th>
                          <th className="py-2.5 px-3">Value</th>
                          <th className="py-2.5 px-3">Timestamp / Valid</th>
                          <th className="py-2.5 px-3">Quality Flag</th>
                          <th className="py-2.5 px-3">Scientific Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0] font-mono">
                        {fusionDossier.source_comparison_matrix.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="py-2 px-3 font-sans font-semibold text-[#0B1F33]">{row.source}</td>
                            <td className="py-2 px-3 text-[#64748B]">{row.identifier}</td>
                            <td className="py-2 px-3 font-bold text-[#1769AA]">{row.value}</td>
                            <td className="py-2 px-3 text-[#64748B]">{row.time_utc}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                row.quality === "VALID" || row.quality === "OPTIMAL_BLEND"
                                  ? "text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0]"
                                  : "text-amber-700 bg-amber-50 border border-amber-200"
                              }`}>
                                {row.quality}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-[#334155]">{row.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SATELLITE DATA CENTER (INSAT & GSMAP)                              */}
          {/* ========================================================================= */}
          {activeSubTab === "satellite" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <span className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Earth Observation Satellite Constellation</span>
                    <h2 className="text-lg font-bold text-[#0B1F33]">ISRO MOSDAC &amp; International Satellite Catalog</h2>
                  </div>
                  <span className="text-xs text-[#64748B] font-mono">Geostationary &amp; LEO Sensors</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {satelliteProducts.map((prod, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono font-bold text-sky-400">{prod.product_id}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            prod.data_status === "LIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}>
                            {prod.data_status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#0B1F33] mb-1">{prod.product_name}</h4>
                        <p className="text-xs text-[#64748B] mb-3">{prod.scientific_role}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-[#334155] font-mono bg-white p-2.5 rounded-lg border border-[#E2E8F0]">
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Spatial Res:</span>
                            {prod.spatial_resolution}
                          </div>
                          <div>
                            <span className="text-[#94A3B8] block text-[10px]">Temporal Cadence:</span>
                            {prod.temporal_resolution}
                          </div>
                          <div className="col-span-2">
                            <span className="text-[#94A3B8] block text-[10px]">Latest Ingestion:</span>
                            {prod.latest_observation_utc}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#94A3B8] flex items-center justify-between">
                        <span>Mission: {prod.mission}</span>
                        <span className="text-[#64748B] italic">{prod.auth_note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cloud & Precipitation Deep-Dive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cloudView && (
                  <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0B1F33] mb-3 flex items-center gap-2">
                      ☁️ INSAT-3DR Cloud Top Intelligence (Target Grid)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <span className="text-xs text-[#64748B]">Cloud Fraction:</span>
                        <span className="text-lg font-bold text-[#0B1F33]">{cloudView.cloud_cover_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <span className="text-xs text-[#64748B]">Cloud-Top Brightness Temp:</span>
                        <span className="text-lg font-bold text-[#1769AA]">
                          {cloudView.cloud_top_brightness_temp_k} K ({cloudView.cloud_top_brightness_temp_c}°C)
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <span className="text-xs text-[#64748B]">Convective Signature:</span>
                        <span className="text-xs font-bold text-amber-700">{cloudView.convective_intensity}</span>
                      </div>
                      <p className="text-xs text-[#94A3B8]">
                        * Calibrated via INSAT-3DR 10.8 µm Thermal Infrared window against SAC-ISRO Level-2 CTBT retrieval.
                      </p>
                    </div>
                  </div>
                )}

                {satelliteRain && (
                  <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-[#0B1F33] mb-3 flex items-center gap-2">
                      🌧️ GSMaP-ISRO Microwave Precipitation Layer
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <span className="text-xs text-[#64748B]">Current Rain Rate (GSMaP):</span>
                        <span className="text-lg font-bold text-[#1769AA]">{satelliteRain.rain_rate_mm_per_hr} mm/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <span className="text-xs text-[#64748B]">GPM IMERG Cross-Check:</span>
                        <span className="text-lg font-bold text-[#7C3AED]">{satelliteRain.gpm_cross_check_mm_per_hr} mm/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                        <span className="text-xs text-[#64748B]">Quality Filter:</span>
                        <span className="text-xs font-bold text-[#16A34A]">{satelliteRain.quality_control}</span>
                      </div>
                      <p className="text-xs text-[#94A3B8]">
                        * Passive microwave combined with GEO-IR Kalman filter for independent verification against NWP precipitation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: RADAR NOWCASTING & LIGHTNING                                       */}
          {/* ========================================================================= */}
          {activeSubTab === "radar" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar Nowcast Display */}
                {radarNowcast ? (
                  <div className="lg:col-span-2 bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <span className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Short-Term Convective Guidance</span>
                        <h2 className="text-lg font-bold text-[#0B1F33]">0–3h Doppler Weather Radar Nowcast</h2>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-mono bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD] rounded">
                        Station: {radarNowcast.radar_station} ({radarNowcast.band})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {radarNowcast.nowcast_timeline?.map((step: any, idx: number) => (
                        <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-center">
                          <div className="text-xs font-bold text-[#1769AA] font-mono">{step.lead_time} ({step.time})</div>
                          <div className="text-xl font-black text-[#0B1F33] my-1">{step.expected_rain_mm} mm</div>
                          <div className="text-[10px] text-[#64748B]">{step.confidence}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                      <div>
                        <span className="text-[#94A3B8] block text-[10px]">Reflectivity:</span>
                        <span className="font-bold text-[#0B1F33]">{radarNowcast.base_reflectivity_dbz} dBZ</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block text-[10px]">Distance to Radar:</span>
                        <span className="font-bold text-[#334155]">{radarNowcast.distance_km} km</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block text-[10px]">Storm Motion Vector:</span>
                        <span className="font-bold text-amber-700">
                          {radarNowcast.cell_motion_vector
                            ? `${radarNowcast.cell_motion_vector.speed_kmh} km/h @ ${radarNowcast.cell_motion_vector.bearing_deg}°`
                            : "No active squall line"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-2 bg-white border border-[#D9E0E7] rounded-xl p-8 shadow-sm flex flex-col justify-center items-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                      📡
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded">
                        RADAR DATA UNAVAILABLE
                      </span>
                      <h3 className="text-sm font-bold text-[#0B1F33] mt-2">No Doppler Weather Radar within Active Scan Radius</h3>
                      <p className="text-xs text-[#64748B] max-w-md mx-auto">
                        In accordance with MOSAIC Absolute Rule #1, radar echoes are never fabricated or simulated. Target coordinates ({currentLat.toFixed(2)}°N, {currentLon.toFixed(2)}°E) are outside the 250 km operational Doppler coverage range of nearby DWR sites.
                      </p>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-left text-xs space-y-1 w-full max-w-md font-mono text-[11px]">
                      <div><span className="text-[#94A3B8]">Primary Source:</span> IMD DWR Network (S-Band / C-Band)</div>
                      <div><span className="text-[#94A3B8]">Reason:</span> Terrain beam blockage or distance &gt; 250 km</div>
                      <div><span className="text-[#94A3B8]">Fallback Source:</span> INSAT-3DR Rapid-Scan TIR1 (10.8 µm) &amp; GSMaP_ISRO Rain</div>
                    </div>
                  </div>
                )}

                {/* Lightning Monitor */}
                {lightning && (
                  <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#E2E8F0]">
                        <h3 className="text-sm font-bold text-[#0B1F33] flex items-center gap-1.5">
                          ⚡ Lightning Surveillance
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200 rounded">
                          IITM Damini
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-[#FFFBEB] p-3 rounded-lg border border-amber-200 text-center">
                          <div className="text-xs text-[#64748B] mb-1">Strokes Detected (Last 60m)</div>
                          <div className="text-3xl font-black text-amber-600">{lightning.strokes_last_60min}</div>
                          <div className="text-[11px] text-[#94A3B8] mt-1 font-mono">
                            Density: {lightning.flash_density_per_km2_hr} strokes/km²/h
                          </div>
                        </div>

                        <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] text-xs">
                          <span className="text-[#64748B] block mb-1">Convective Status:</span>
                          <span className="font-bold text-[#0B1F33]">{lightning.convective_severity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#94A3B8] mt-4 pt-2 border-t border-[#E2E8F0]">
                      Network: {lightning.sensor_network}
                    </div>
                  </div>
                )}
              </div>

              {/* DWR Stations Network List */}
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B1F33] mb-3">
                  Operational IMD Doppler Weather Radar Network (10 Sites)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  {radarStations.map((r, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 text-xs">
                      <div className="font-bold text-[#0B1F33] truncate">{r.name}</div>
                      <div className="text-[#64748B] text-[11px]">{r.state}</div>
                      <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-[#94A3B8]">
                        <span>{r.band}</span>
                        <span className="text-[#16A34A] font-bold">{r.range_km} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: IMD SURFACE AWS NETWORK & QC ENGINE                                */}
          {/* ========================================================================= */}
          {activeSubTab === "stations" && (
            <div className="space-y-6">
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <span className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Ground Observatories</span>
                    <h2 className="text-lg font-bold text-[#0B1F33]">IMD Synoptic &amp; Automated Weather Station (AWS) Network</h2>
                  </div>
                  <div className="text-xs text-[#64748B]">
                    Showing verified physical stations across India and North East Region
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                  {stations.map((stn) => (
                    <button
                      key={stn.id}
                      onClick={() => setSelectedStation(stn.id)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        selectedStation === stn.id
                          ? "bg-[#EFF6FF] border-[#1769AA] shadow-sm"
                          : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono font-bold text-[#1769AA]">{stn.id}</span>
                        {stn.is_ner && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#EDE9FE] text-[#7C3AED] font-bold">
                            NER
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-[#0B1F33] truncate">{stn.name}</div>
                      <div className="text-xs text-[#64748B]">{stn.state} ({stn.elevation_m}m)</div>
                      <div className="text-[10px] text-[#94A3B8] mt-2 truncate font-mono">{stn.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Station Detailed Observation */}
              {observations.length > 0 && (
                <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-[#0B1F33] mb-3 flex items-center gap-2">
                    🔍 Ground Telemetry &amp; Quality Control Audit: {observations[0].station_name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">Temperature</span>
                      <span className="text-xl font-bold text-[#0B1F33]">
                        {observations[0].temperature_c !== null ? `${observations[0].temperature_c}°C` : "N/A"}
                      </span>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">Precipitation (1h)</span>
                      <span className="text-xl font-bold text-[#1769AA]">
                        {observations[0].precipitation_mm !== null ? `${observations[0].precipitation_mm} mm` : "0.0 mm"}
                      </span>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">Wind Speed</span>
                      <span className="text-xl font-bold text-[#0B1F33]">
                        {observations[0].wind_speed_ms !== null ? `${observations[0].wind_speed_ms} m/s` : "N/A"}
                      </span>
                    </div>
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                      <span className="text-[#64748B] block text-xs">Relative Humidity</span>
                      <span className="text-xl font-bold text-[#7C3AED]">
                        {observations[0].humidity_pct !== null ? `${observations[0].humidity_pct}%` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {observations[0].qc_audit && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DCFCE7] text-[#16A34A] font-mono">
                          {observations[0].quality_flag}
                        </span>
                        <span className="text-[#334155]">{observations[0].qc_audit.note}</span>
                      </div>
                      <span className="text-[#94A3B8] font-mono text-[11px]">Flag: {observations[0].qc_audit.flag}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: INGESTION PIPELINE & HEALTH AUDIT                                   */}
          {/* ========================================================================= */}
          {activeSubTab === "telemetry" && (
            <div className="space-y-6">
              {/* Operational Sources Health Matrix */}
              {sourcesHealth && (
                <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <span className="text-xs font-bold text-[#1769AA] uppercase tracking-wider">Data Ingestion Telemetry</span>
                      <h2 className="text-lg font-bold text-[#0B1F33]">
                        Operational Multi-Source Health Matrix ({sourcesHealth.connected_sources}/{sourcesHealth.total_sources} Connected)
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold font-mono rounded bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]">
                      {sourcesHealth.overall_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sourcesHealth.sources?.map((s: any, idx: number) => (
                      <div key={idx} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-[#0B1F33] truncate">{s.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              s.status === "CONNECTED"
                                ? "text-[#16A34A] bg-[#DCFCE7]"
                                : "text-amber-700 bg-amber-50"
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="text-[#64748B] text-[11px] mb-2">{s.provider}</div>
                        </div>

                        <div className="border-t border-[#E2E8F0] pt-2 flex justify-between items-center text-[10px] font-mono text-[#94A3B8]">
                          <span>Latency: {s.latency_ms ? `${s.latency_ms}ms` : "--"}</span>
                          <span className="text-[#1769AA] font-bold">{s.records_available} records</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingestion Run Audit Log */}
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
                <h3 className="text-sm font-bold text-[#0B1F33] mb-3">
                  Operational Ingestion Run Audit Trail (Requirement 43 &amp; 44)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-[#64748B] font-semibold bg-[#F8FAFC]">
                        <th className="py-2 px-3">Timestamp (UTC)</th>
                        <th className="py-2 px-3">Provider</th>
                        <th className="py-2 px-3">Dataset</th>
                        <th className="py-2 px-3">Records Ingested</th>
                        <th className="py-2 px-3">Latency</th>
                        <th className="py-2 px-3">Quality / Grid Status</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] font-mono">
                      {ingestionLog.map((log, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-2 px-3 text-[#64748B]">{log.timestamp}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-[#0B1F33]">{log.provider}</td>
                          <td className="py-2 px-3 text-[#334155] font-sans">{log.dataset}</td>
                          <td className="py-2 px-3 font-bold text-[#1769AA]">{log.records_ingested.toLocaleString()}</td>
                          <td className="py-2 px-3 text-[#64748B]">{log.latency_ms} ms</td>
                          <td className="py-2 px-3 text-[#334155] text-[11px]">{log.data_quality}</td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "SUCCESS"
                                ? "text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0]"
                                : "text-amber-700 bg-amber-50 border border-amber-200"
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
