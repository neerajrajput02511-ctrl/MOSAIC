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
    <div className="space-y-6 text-slate-100 font-sans pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-800/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded">
                SIH26081 Phase 3 Architecture
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Multi-Source Earth Observation Active
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Earth Observation & Multi-Sensor Data Fusion Center
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1">
              Authoritative ground-truth assimilation combining IMD synoptic & AWS stations, ISRO MOSDAC INSAT-3DR/GSMaP, Doppler Weather Radar nowcasts (0-3h), and IITM lightning surveillance cross-verified against multi-model NWP & AI forecasts.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-lg p-2 text-xs">
            <span className="text-slate-400">Target Focus:</span>
            <span className="font-bold text-sky-400">{locationName}</span>
            <span className="text-slate-500">({currentLat.toFixed(2)}°N, {currentLon.toFixed(2)}°E)</span>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab("fusion")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "fusion"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            }`}
          >
            ⚖️ Data Fusion Dossier ("What MOSAIC Sees")
          </button>
          <button
            onClick={() => setActiveSubTab("satellite")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "satellite"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            }`}
          >
            🛰️ Satellite Data Center (INSAT & GSMaP)
          </button>
          <button
            onClick={() => setActiveSubTab("radar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "radar"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            }`}
          >
            📡 Radar Nowcasting & Lightning
          </button>
          <button
            onClick={() => setActiveSubTab("stations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "stations"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            }`}
          >
            📍 IMD Surface AWS Network & QC
          </button>
          <button
            onClick={() => setActiveSubTab("telemetry")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === "telemetry"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white"
            }`}
          >
            📊 Ingestion Pipeline & Health Audit
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-sky-300">Synchronizing Multi-Source Meteorological Feeds...</p>
          <p className="text-xs text-slate-500 mt-1">Ingesting IMD AWS stations, INSAT-3DR satellite telemetry, and radar sweeps</p>
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
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Multi-Sensor Validation</span>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Observation Consistency Engine (Station vs Satellite vs Radar)
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Consistency Index</div>
                        <div className="text-lg font-black text-emerald-400">
                          {consistency.consistency_index ? (consistency.consistency_index * 100).toFixed(0) : "--"}%
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded ${
                        consistency.consistency_rating === "EXCELLENT"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      }`}>
                        {consistency.consistency_rating}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {consistency.comparison_table?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
                        <div className="text-xs font-semibold text-slate-400 mb-1">{item.source}</div>
                        <div className="text-lg font-bold text-white mb-0.5">
                          {item.value_mm !== null ? `${item.value_mm} mm` : "N/A"}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{item.station || item.sensor || item.radar}</span>
                          <span className={`px-1.5 py-0.2 rounded font-mono ${
                            item.quality === "VALID" ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                          }`}>
                            {item.quality}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800/60 rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2.5">
                    <span className="text-sky-400 text-sm">💡</span>
                    <div>
                      <strong className="text-white">Meteorological Assessment: </strong>
                      {consistency.scientific_diagnosis}
                    </div>
                  </div>
                </div>
              )}

              {/* What MOSAIC Sees vs What MOSAIC Predicts */}
              {fusionDossier && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: What MOSAIC Sees */}
                  <div className="bg-slate-900/80 border border-sky-900/40 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Ground Truth & Telemetry</span>
                        <h3 className="text-base font-bold text-white">What MOSAIC Sees (Observations)</h3>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded">
                        5 Sensor Feeds
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">IMD Ground Synoptic AWS</span>
                          <span className="text-emerald-400 font-mono text-[11px]">VALID</span>
                        </div>
                        <div className="text-sm font-bold text-white">
                          {fusionDossier.what_mosaic_sees.ground_station?.station_name || "Station"}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-xs">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Temp</span>
                            <span className="font-semibold text-slate-200">
                              {fusionDossier.what_mosaic_sees.ground_station?.temperature_c !== null
                                ? `${fusionDossier.what_mosaic_sees.ground_station?.temperature_c}°C`
                                : "N/A"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Precip</span>
                            <span className="font-semibold text-slate-200">
                              {fusionDossier.what_mosaic_sees.ground_station?.precipitation_mm !== null
                                ? `${fusionDossier.what_mosaic_sees.ground_station?.precipitation_mm} mm`
                                : "0.0 mm"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Wind</span>
                            <span className="font-semibold text-slate-200">
                              {fusionDossier.what_mosaic_sees.ground_station?.wind_speed_ms !== null
                                ? `${fusionDossier.what_mosaic_sees.ground_station?.wind_speed_ms} m/s`
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">INSAT-3DR Thermal Cloud</span>
                          <span className="text-sky-400 font-mono text-[11px]">10.8 µm TIR</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Cloud Cover:</span>
                          <span className="font-bold text-white">{fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_cover_pct}%</span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-400">Cloud-Top Brightness Temp:</span>
                          <span className="font-bold text-sky-300">
                            {fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_top_brightness_temp_k} K ({fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_top_brightness_temp_c}°C)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          Class: {fusionDossier.what_mosaic_sees.satellite_cloud?.cloud_classification}
                        </div>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-300">Doppler Weather Radar (DWR)</span>
                          <span className="text-indigo-400 font-mono text-[11px]">
                            {fusionDossier.what_mosaic_sees.doppler_radar?.radar_station}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Base Reflectivity:</span>
                          <span className="font-bold text-white">
                            {fusionDossier.what_mosaic_sees.doppler_radar?.base_reflectivity_dbz} dBZ
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-slate-400">Distance to Radar:</span>
                          <span className="text-slate-300">{fusionDossier.what_mosaic_sees.doppler_radar?.distance_km} km</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: What MOSAIC Predicts */}
                  <div className="bg-slate-900/80 border border-indigo-900/40 rounded-xl p-5 shadow-lg space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Predictive Synthesis</span>
                        <h3 className="text-base font-bold text-white">What MOSAIC Predicts (Forecast)</h3>
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                        Lead: {fusionDossier.what_mosaic_predicts.lead_time}
                      </span>
                    </div>

                    <div className="bg-slate-950/90 border border-indigo-900/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-slate-400 mb-1">MOSAIC Hybrid Multi-Model Blend</div>
                      <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-300">
                        {fusionDossier.what_mosaic_predicts.mosaic_blend_value} mm
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Uncertainty 90% CI: [{fusionDossier.what_mosaic_predicts.uncertainty_range.lower_bound} - {fusionDossier.what_mosaic_predicts.uncertainty_range.upper_bound}] mm
                      </div>
                      <div className="mt-3 inline-block px-2.5 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                        Equal-Weight Baseline: {fusionDossier.what_mosaic_predicts.equal_weight_baseline} mm
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400">Constituent Model Contributions:</div>
                      {fusionDossier.what_mosaic_predicts.contributing_models?.map((m: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                          <span className="font-semibold text-slate-300">{m.model}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-mono">{m.forecast} mm</span>
                            <span className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              {(m.weight * 100).toFixed(0)}% weight
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-3 leading-relaxed">
                      {fusionDossier.explainability_summary}
                    </div>
                  </div>
                </div>
              )}

              {/* Source Comparison Matrix Table */}
              {fusionDossier?.source_comparison_matrix && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    📋 Complete Data Lineage & Provenance Matrix (Requirement 27)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                          <th className="py-2.5 px-3">Source Name</th>
                          <th className="py-2.5 px-3">Dataset / Identifier</th>
                          <th className="py-2.5 px-3">Value</th>
                          <th className="py-2.5 px-3">Timestamp / Valid</th>
                          <th className="py-2.5 px-3">Quality Flag</th>
                          <th className="py-2.5 px-3">Scientific Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {fusionDossier.source_comparison_matrix.map((row: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2 px-3 font-sans font-semibold text-white">{row.source}</td>
                            <td className="py-2 px-3 text-slate-400">{row.identifier}</td>
                            <td className="py-2 px-3 font-bold text-sky-300">{row.value}</td>
                            <td className="py-2 px-3 text-slate-400">{row.time_utc}</td>
                            <td className="py-2 px-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                row.quality === "VALID" || row.quality === "OPTIMAL_BLEND"
                                  ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                  : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                              }`}>
                                {row.quality}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-sans text-slate-300">{row.role}</td>
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
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Earth Observation Satellite Constellation</span>
                    <h2 className="text-lg font-bold text-white">ISRO MOSDAC & International Satellite Catalog</h2>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Geostationary & LEO Sensors</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {satelliteProducts.map((prod, idx) => (
                    <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
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
                        <h4 className="text-sm font-bold text-white mb-1">{prod.product_name}</h4>
                        <p className="text-xs text-slate-400 mb-3">{prod.scientific_role}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Spatial Res:</span>
                            {prod.spatial_resolution}
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Temporal Cadence:</span>
                            {prod.temporal_resolution}
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 block text-[10px]">Latest Ingestion:</span>
                            {prod.latest_observation_utc}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Mission: {prod.mission}</span>
                        <span className="text-slate-400 italic">{prod.auth_note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cloud & Precipitation Deep-Dive */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cloudView && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      ☁️ INSAT-3DR Cloud Top Intelligence (Target Grid)
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400">Cloud Fraction:</span>
                        <span className="text-lg font-bold text-white">{cloudView.cloud_cover_pct}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400">Cloud-Top Brightness Temp:</span>
                        <span className="text-lg font-bold text-sky-300">
                          {cloudView.cloud_top_brightness_temp_k} K ({cloudView.cloud_top_brightness_temp_c}°C)
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400">Convective Signature:</span>
                        <span className="text-xs font-bold text-amber-400">{cloudView.convective_intensity}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        * Calibrated via INSAT-3DR 10.8 µm Thermal Infrared window against SAC-ISRO Level-2 CTBT retrieval.
                      </p>
                    </div>
                  </div>
                )}

                {satelliteRain && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      🌧️ GSMaP-ISRO Microwave Precipitation Layer
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400">Current Rain Rate (GSMaP):</span>
                        <span className="text-lg font-bold text-sky-400">{satelliteRain.rain_rate_mm_per_hr} mm/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400">GPM IMERG Cross-Check:</span>
                        <span className="text-lg font-bold text-indigo-400">{satelliteRain.gpm_cross_check_mm_per_hr} mm/h</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                        <span className="text-xs text-slate-400">Quality Filter:</span>
                        <span className="text-xs font-bold text-emerald-400">{satelliteRain.quality_control}</span>
                      </div>
                      <p className="text-xs text-slate-500">
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
                {radarNowcast && (
                  <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Short-Term Convective Guidance</span>
                        <h2 className="text-lg font-bold text-white">0–3h Doppler Weather Radar Nowcast</h2>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded">
                        Station: {radarNowcast.radar_station} ({radarNowcast.band})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                      {radarNowcast.nowcast_timeline?.map((step: any, idx: number) => (
                        <div key={idx} className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-center">
                          <div className="text-xs font-bold text-sky-400 font-mono">{step.lead_time} ({step.time})</div>
                          <div className="text-xl font-black text-white my-1">{step.expected_rain_mm} mm</div>
                          <div className="text-[10px] text-slate-400">{step.confidence}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Reflectivity:</span>
                        <span className="font-bold text-white">{radarNowcast.base_reflectivity_dbz} dBZ</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Distance to Radar:</span>
                        <span className="font-bold text-slate-300">{radarNowcast.distance_km} km</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Storm Motion Vector:</span>
                        <span className="font-bold text-amber-400">
                          {radarNowcast.cell_motion_vector
                            ? `${radarNowcast.cell_motion_vector.speed_kmh} km/h @ ${radarNowcast.cell_motion_vector.bearing_deg}°`
                            : "No active squall line"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lightning Monitor */}
                {lightning && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                          ⚡ Lightning Surveillance
                        </h3>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                          IITM Damini
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-center">
                          <div className="text-xs text-slate-400 mb-1">Strokes Detected (Last 60m)</div>
                          <div className="text-3xl font-black text-amber-400">{lightning.strokes_last_60min}</div>
                          <div className="text-[11px] text-slate-500 mt-1 font-mono">
                            Density: {lightning.flash_density_per_km2_hr} strokes/km²/h
                          </div>
                        </div>

                        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 text-xs">
                          <span className="text-slate-400 block mb-1">Convective Status:</span>
                          <span className="font-bold text-white">{lightning.convective_severity}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-4 pt-2 border-t border-slate-800">
                      Network: {lightning.sensor_network}
                    </div>
                  </div>
                )}
              </div>

              {/* DWR Stations Network List */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-3">
                  Operational IMD Doppler Weather Radar Network (10 Sites)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                  {radarStations.map((r, idx) => (
                    <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-xs">
                      <div className="font-bold text-white truncate">{r.name}</div>
                      <div className="text-slate-400 text-[11px]">{r.state}</div>
                      <div className="flex justify-between items-center mt-2 text-[10px] font-mono text-slate-500">
                        <span>{r.band}</span>
                        <span className="text-emerald-400 font-bold">{r.range_km} km</span>
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
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Ground Observatories</span>
                    <h2 className="text-lg font-bold text-white">IMD Synoptic & Automated Weather Station (AWS) Network</h2>
                  </div>
                  <div className="text-xs text-slate-400">
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
                          ? "bg-sky-950/60 border-sky-500 shadow-md shadow-sky-500/20"
                          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-mono font-bold text-sky-400">{stn.id}</span>
                        {stn.is_ner && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
                            NER
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-white truncate">{stn.name}</div>
                      <div className="text-xs text-slate-400">{stn.state} ({stn.elevation_m}m)</div>
                      <div className="text-[10px] text-slate-500 mt-2 truncate font-mono">{stn.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Station Detailed Observation */}
              {observations.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    🔍 Ground Telemetry & Quality Control Audit: {observations[0].station_name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                      <span className="text-slate-500 block text-xs">Temperature</span>
                      <span className="text-xl font-bold text-white">
                        {observations[0].temperature_c !== null ? `${observations[0].temperature_c}°C` : "N/A"}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                      <span className="text-slate-500 block text-xs">Precipitation (1h)</span>
                      <span className="text-xl font-bold text-sky-400">
                        {observations[0].precipitation_mm !== null ? `${observations[0].precipitation_mm} mm` : "0.0 mm"}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                      <span className="text-slate-500 block text-xs">Wind Speed</span>
                      <span className="text-xl font-bold text-white">
                        {observations[0].wind_speed_ms !== null ? `${observations[0].wind_speed_ms} m/s` : "N/A"}
                      </span>
                    </div>
                    <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
                      <span className="text-slate-500 block text-xs">Relative Humidity</span>
                      <span className="text-xl font-bold text-indigo-400">
                        {observations[0].humidity_pct !== null ? `${observations[0].humidity_pct}%` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {observations[0].qc_audit && (
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 font-mono">
                          {observations[0].quality_flag}
                        </span>
                        <span className="text-slate-300">{observations[0].qc_audit.note}</span>
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">Flag: {observations[0].qc_audit.flag}</span>
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
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Data Ingestion Telemetry</span>
                      <h2 className="text-lg font-bold text-white">
                        Operational Multi-Source Health Matrix ({sourcesHealth.connected_sources}/{sourcesHealth.total_sources} Connected)
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold font-mono rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {sourcesHealth.overall_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sourcesHealth.sources?.map((s: any, idx: number) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-white truncate">{s.name}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                              s.status === "CONNECTED"
                                ? "text-emerald-400 bg-emerald-500/10"
                                : "text-amber-400 bg-amber-500/10"
                            }`}>
                              {s.status}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] mb-2">{s.provider}</div>
                        </div>

                        <div className="border-t border-slate-800/60 pt-2 flex justify-between items-center text-[10px] font-mono text-slate-500">
                          <span>Latency: {s.latency_ms ? `${s.latency_ms}ms` : "--"}</span>
                          <span className="text-sky-400 font-bold">{s.records_available} records</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingestion Run Audit Log */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
                <h3 className="text-sm font-bold text-white mb-3">
                  Operational Ingestion Run Audit Trail (Requirement 43 & 44)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-950/40">
                        <th className="py-2 px-3">Timestamp (UTC)</th>
                        <th className="py-2 px-3">Provider</th>
                        <th className="py-2 px-3">Dataset</th>
                        <th className="py-2 px-3">Records Ingested</th>
                        <th className="py-2 px-3">Latency</th>
                        <th className="py-2 px-3">Quality / Grid Status</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {ingestionLog.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2 px-3 text-slate-400">{log.timestamp}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-white">{log.provider}</td>
                          <td className="py-2 px-3 text-slate-300 font-sans">{log.dataset}</td>
                          <td className="py-2 px-3 font-bold text-sky-400">{log.records_ingested.toLocaleString()}</td>
                          <td className="py-2 px-3 text-slate-400">{log.latency_ms} ms</td>
                          <td className="py-2 px-3 text-slate-300 text-[11px]">{log.data_quality}</td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.status === "SUCCESS"
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                : "text-amber-400 bg-amber-500/10 border border-amber-500/20"
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
