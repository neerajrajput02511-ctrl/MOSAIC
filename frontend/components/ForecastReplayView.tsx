"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Calendar, 
  Compass, 
  TrendingUp, 
  Info,
  ShieldCheck,
  Zap
} from "lucide-react";
import { fetchReplayCases, fetchReplayCaseDetail } from "@/services/api";

interface CaseStudy {
  case_id: string;
  title: string;
  event_type: string;
  region_code: string;
  region_name: string;
  event_date: string;
  initialization_time: string;
  lead_time_hours: number;
  primary_variable: string;
  observed_value: number;
  observation_source: string;
  forecast_values: {
    NOAA_GFS: number;
    ECMWF_IFS: number;
    ECMWF_AIFS: number;
    NOAA_GEFS: number;
    EQUAL_MEAN: number;
    MOSAIC_BLEND: number;
  };
  bma_weights: {
    ECMWF_AIFS: number;
    ECMWF_IFS: number;
    NOAA_GFS: number;
    NOAA_GEFS: number;
  };
  error_comparison: {
    MOSAIC_BLEND_error: number;
    EQUAL_MEAN_error: number;
    best_individual_error: number;
    improvement_vs_equal_pct: number;
  };
  synoptic_summary: string;
}

interface ProgressionStep {
  lead_time_hours: number;
  label: string;
  observed_ground_truth: number;
  NOAA_GFS: number;
  ECMWF_IFS: number;
  ECMWF_AIFS: number;
  NOAA_GEFS: number;
  EQUAL_MEAN: number;
  MOSAIC_BLEND: number;
  weights: Record<string, number>;
  mosaic_error: number;
  equal_mean_error: number;
}

export const ForecastReplayView: React.FC = () => {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("CASE_REMAL_2024");
  const [progression, setProgression] = useState<ProgressionStep[]>([]);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number>(2); // Default to +72h
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load available case studies
  useEffect(() => {
    async function loadCases() {
      try {
        const data = await fetchReplayCases();
        if (data && data.cases) {
          setCases(data.cases || []);
        }
      } catch (e) {
        console.error("Failed to load replay cases", e);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, []);

  // Load detailed progression for selected case
  useEffect(() => {
    async function loadDetail() {
      if (!selectedCaseId) return;
      try {
        const data = await fetchReplayCaseDetail(selectedCaseId);
        if (data && data.lead_time_progression) {
          setProgression(data.lead_time_progression || []);
          setSelectedLeadIndex(2); // +72h
        }
      } catch (e) {
        console.error("Failed to load case detail", e);
      }
    }
    loadDetail();
  }, [selectedCaseId]);

  // Automated animation playback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && progression.length > 0) {
      timer = setInterval(() => {
        setSelectedLeadIndex((prev) => (prev + 1) % progression.length);
      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, progression]);

  const activeCase = cases.find(c => c.case_id === selectedCaseId) || cases[0];
  const currentStep = progression[selectedLeadIndex] || null;

  return (
    <div className="space-y-6">
      {/* Header & Mode Explanation */}
      <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Historical Extreme Event Replay Lab
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SIH26081 MANDATE · SEC 12
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Evaluate MOSAIC multi-model hindcast performance against official IMD AWS / ERA5 ground-truth observations.
              Scrub through lead times (+24h to +120h) to observe dynamic adaptive weight shifts between traditional physics NWP and AI neural operators.
            </p>
          </div>

          {/* Event Case Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">SELECT CASE:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-[#10192d] border border-[#233554] text-slate-200 text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {cases.map((c) => (
                <option key={c.case_id} value={c.case_id}>
                  {c.title} ({c.event_type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {activeCase && (
        <>
          {/* Case Overview & Ground Truth Telemetry Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">EVENT / REGION</div>
              <div className="text-sm font-bold text-slate-100 mt-1 truncate">{activeCase.title}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{activeCase.region_name}</div>
            </div>

            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">GROUND TRUTH OBSERVATION</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                {activeCase.observed_value} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{activeCase.observation_source}</div>
            </div>

            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">MOSAIC ERROR VS EQUAL MEAN</div>
              <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                {activeCase.error_comparison.improvement_vs_equal_pct}% Error Reduction
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                MOSAIC: ±{activeCase.error_comparison.MOSAIC_BLEND_error} | Equal: ±{activeCase.error_comparison.EQUAL_MEAN_error}
              </div>
            </div>

            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-4">
              <div className="text-[11px] font-mono text-slate-400 uppercase">PRIMARY DOMINANT MODEL</div>
              <div className="text-sm font-bold text-purple-300 mt-1 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>ECMWF AIFS (AI Neural Operator)</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Dynamic Weight: 44% - 52%</div>
            </div>
          </div>

          {/* Lead-Time Timeline Scrubber & Animation Controls */}
          <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isPlaying 
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30" 
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "PAUSE REPLAY" : "PLAY TIMELINE"}</span>
                </button>

                <button
                  onClick={() => setSelectedLeadIndex(0)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
                  title="Reset to +24h"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono text-slate-300">
                  CURRENT LEAD TIME: <span className="text-cyan-400 font-bold">+{currentStep?.lead_time_hours || 72}h</span>
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Event Date: {new Date(activeCase.event_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Scrubber step buttons */}
            <div className="grid grid-cols-5 gap-2">
              {progression.map((step, idx) => (
                <button
                  key={step.lead_time_hours}
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedLeadIndex(idx);
                  }}
                  className={`p-3 rounded-lg border text-left transition ${
                    selectedLeadIndex === idx
                      ? "bg-blue-600/20 border-blue-500 text-blue-200 shadow-md shadow-blue-900/30"
                      : "bg-[#090e1a] border-[#1e2c47] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  <div className="text-[10px] font-mono font-semibold uppercase">{step.label}</div>
                  <div className="text-base font-mono font-bold mt-1 text-slate-100">
                    {step.MOSAIC_BLEND} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}
                  </div>
                  <div className="text-[10px] font-mono mt-0.5 text-cyan-400">
                    Error: ±{step.mosaic_error}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Model Benchmark Comparison Table at Current Lead Time */}
          {currentStep && (
            <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight uppercase">
                    Model Predictions vs Observed Ground Truth at +{currentStep.lead_time_hours}h Lead
                  </h3>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ground Truth: {currentStep.observed_ground_truth} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2.5 px-3">SOURCE / MODEL</th>
                      <th className="py-2.5 px-3">MODEL TYPE</th>
                      <th className="py-2.5 px-3">PREDICTED VALUE</th>
                      <th className="py-2.5 px-3">ABSOLUTE ERROR</th>
                      <th className="py-2.5 px-3">ADAPTIVE WEIGHT</th>
                      <th className="py-2.5 px-3">PERFORMANCE ASSESSMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {/* NOAA GFS */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-semibold text-blue-300">NOAA GFS</td>
                      <td className="py-2.5 px-3 text-slate-400">NWP (0.25° Physics)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{currentStep.NOAA_GFS}</td>
                      <td className="py-2.5 px-3 text-rose-400 font-semibold">
                        ±{roundErr(currentStep.NOAA_GFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{Math.round((currentStep.weights["NOAA_GFS"] || 0.12) * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-400">Over-prediction wet bias</td>
                    </tr>

                    {/* ECMWF IFS */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-semibold text-cyan-300">ECMWF IFS</td>
                      <td className="py-2.5 px-3 text-slate-400">NWP (0.25° Physics)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{currentStep.ECMWF_IFS}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">
                        ±{roundErr(currentStep.ECMWF_IFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{Math.round((currentStep.weights["ECMWF_IFS"] || 0.36) * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-400">Strong terrain boundary layer</td>
                    </tr>

                    {/* ECMWF AIFS */}
                    <tr className="hover:bg-slate-800/20 bg-purple-950/10">
                      <td className="py-2.5 px-3 font-semibold text-purple-300 flex items-center space-x-1.5">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span>ECMWF AIFS</span>
                      </td>
                      <td className="py-2.5 px-3 text-purple-300/80">AI (0.25° Graph Neural Net)</td>
                      <td className="py-2.5 px-3 font-bold text-purple-200">{currentStep.ECMWF_AIFS}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                        ±{roundErr(currentStep.ECMWF_AIFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-purple-300 font-bold">{Math.round((currentStep.weights["ECMWF_AIFS"] || 0.44) * 100)}%</td>
                      <td className="py-2.5 px-3 text-purple-300">Dominant: Low phase error</td>
                    </tr>

                    {/* NOAA GEFS */}
                    <tr className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-semibold text-amber-300">NOAA GEFS</td>
                      <td className="py-2.5 px-3 text-slate-400">Ensemble (31-member)</td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">{currentStep.NOAA_GEFS}</td>
                      <td className="py-2.5 px-3 text-slate-300">
                        ±{roundErr(currentStep.NOAA_GEFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">{Math.round((currentStep.weights["NOAA_GEFS"] || 0.08) * 100)}%</td>
                      <td className="py-2.5 px-3 text-slate-400">Ensemble spread baseline</td>
                    </tr>

                    {/* EQUAL-WEIGHTED MULTI-MODEL MEAN */}
                    <tr className="hover:bg-slate-800/20 bg-slate-800/30 border-t border-slate-700 font-semibold">
                      <td className="py-2.5 px-3 text-slate-300">EQUAL-WEIGHTED MEAN</td>
                      <td className="py-2.5 px-3 text-slate-400">Simple 25% Average Baseline</td>
                      <td className="py-2.5 px-3 text-slate-100">{currentStep.EQUAL_MEAN}</td>
                      <td className="py-2.5 px-3 text-rose-400">±{currentStep.equal_mean_error}</td>
                      <td className="py-2.5 px-3 text-slate-400">25.0% each</td>
                      <td className="py-2.5 px-3 text-rose-300/80">Diluted by uncalibrated models</td>
                    </tr>

                    {/* MOSAIC ADAPTIVE BLEND */}
                    <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/60 font-bold">
                      <td className="py-3 px-3 text-emerald-300 flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>MOSAIC HYBRID BLEND</span>
                      </td>
                      <td className="py-3 px-3 text-emerald-400 font-mono">Dynamic Adaptive Skill Blend</td>
                      <td className="py-3 px-3 text-emerald-300 text-sm">{currentStep.MOSAIC_BLEND}</td>
                      <td className="py-3 px-3 text-emerald-400 text-sm">±{currentStep.mosaic_error}</td>
                      <td className="py-3 px-3 text-emerald-300">100.0% (Adaptive)</td>
                      <td className="py-3 px-3 text-emerald-300">
                        ⭐ {Math.round(((currentStep.equal_mean_error - currentStep.mosaic_error) / currentStep.equal_mean_error) * 100)}% Better than Equal Mean
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scientific Synoptic Meteorological Narrative */}
          <div className="bg-[#0c1322] border border-[#1e2c47] rounded-xl p-5 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-bold text-sm">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Synoptic Verification Analysis & Weight Attribution</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {activeCase.synoptic_summary}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

function roundErr(pred: number, obs: number): number {
  return Math.round(Math.abs(pred - obs) * 10) / 10;
}
