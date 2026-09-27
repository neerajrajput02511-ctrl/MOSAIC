"use client";

import React, { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Layers, 
  Calendar, 
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
  mosaic_error: number;
  equal_mean_error: number;
  weights: Record<string, number>;
}

export const ForecastReplayView: React.FC = () => {
  const [cases, setCases] = useState<CaseStudy[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("remal_2024");
  const [progression, setProgression] = useState<ProgressionStep[]>([]);
  const [selectedLeadIndex, setSelectedLeadIndex] = useState<number>(2); // Default to +72h
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load available case studies
  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      const data = await fetchReplayCases();
      if (data && data.cases) {
        setCases(data.cases);
        if (data.cases.length > 0) {
          setSelectedCaseId(data.cases[0].case_id);
        }
      }
      setLoading(false);
    }
    loadCases();
  }, []);

  // Load progression when case study changes
  useEffect(() => {
    async function loadDetail() {
      if (!selectedCaseId) return;
      const detail = await fetchReplayCaseDetail(selectedCaseId);
      if (detail && detail.progression) {
        setProgression(detail.progression);
      }
    }
    loadDetail();
  }, [selectedCaseId]);

  // Handle animation timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && progression.length > 0) {
      timer = setInterval(() => {
        setSelectedLeadIndex(prev => {
          if (prev >= progression.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, progression]);

  const activeCase = cases.find(c => c.case_id === selectedCaseId) || cases[0];
  const currentStep = progression[selectedLeadIndex] || null;

  return (
    <div className="space-y-6 select-none">
      {/* Header & Mode Explanation */}
      <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Historical Extreme Event Replay Lab
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-800/40">
                HISTORICAL REPLAY · ARCHIVED EVENT (NOT LIVE FORECAST)
              </span>
            </div>
            <p className="text-xs text-[#9DAFC4] mt-1 max-w-3xl">
              Evaluate MOSAIC multi-model hindcast performance against official IMD AWS / ERA5 ground-truth observations.
              Scrub through lead times (+24h to +120h) to observe dynamic adaptive weight shifts between traditional physics NWP and AI neural operators.
            </p>
          </div>

          {/* Event Case Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#667B94] font-mono font-semibold">SELECT CASE:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-[#081426] border border-[#233852] text-white text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#00B8E6]"
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
            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md">
              <div className="text-[11px] font-mono text-[#667B94] uppercase font-semibold">EVENT / REGION</div>
              <div className="text-sm font-bold text-white mt-1 truncate">{activeCase.title}</div>
              <div className="text-xs text-[#9DAFC4] font-mono mt-0.5">{activeCase.region_name}</div>
            </div>

            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md">
              <div className="text-[11px] font-mono text-[#667B94] uppercase font-semibold">GROUND TRUTH OBSERVATION</div>
              <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">
                {activeCase.observed_value} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}
              </div>
              <div className="text-[10px] text-[#667B94] font-mono mt-0.5 truncate">{activeCase.observation_source}</div>
            </div>

            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md">
              <div className="text-[11px] font-mono text-[#667B94] uppercase font-semibold">MOSAIC ERROR VS EQUAL MEAN</div>
              <div className="text-xl font-mono font-extrabold text-[#00B8E6] mt-1">
                {activeCase.error_comparison.improvement_vs_equal_pct}% Error Reduction
              </div>
              <div className="text-[10px] text-[#667B94] font-mono mt-0.5">
                MOSAIC: ±{activeCase.error_comparison.MOSAIC_BLEND_error} | Equal: ±{activeCase.error_comparison.EQUAL_MEAN_error}
              </div>
            </div>

            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-4 shadow-md">
              <div className="text-[11px] font-mono text-[#667B94] uppercase font-semibold">PRIMARY DOMINANT MODEL</div>
              <div className="text-sm font-bold text-purple-400 mt-1 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>ECMWF AIFS (AI Neural Operator)</span>
              </div>
              <div className="text-[10px] text-[#667B94] font-mono mt-0.5">Dynamic Weight: 44% - 52%</div>
            </div>
          </div>

          {/* Lead-Time Timeline Scrubber & Animation Controls */}
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isPlaying 
                      ? "bg-red-500/20 text-red-300 border border-red-500/40" 
                      : "bg-gradient-to-r from-[#00B8E6] to-[#1687FF] text-white shadow-sm font-bold"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "PAUSE REPLAY" : "PLAY TIMELINE"}</span>
                </button>

                <button
                  onClick={() => setSelectedLeadIndex(0)}
                  className="p-1.5 rounded-lg bg-[#081426] text-[#9DAFC4] hover:text-white border border-[#233852] transition"
                  title="Reset to +24h"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono text-[#9DAFC4]">
                  CURRENT LEAD TIME: <span className="text-[#00B8E6] font-bold">+{currentStep?.lead_time_hours || 72}h</span>
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono text-[#9DAFC4]">
                <Calendar className="w-3.5 h-3.5 text-[#00B8E6]" />
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
                      ? "bg-cyan-950/60 border-[#00B8E6] text-white shadow-sm font-bold"
                      : "bg-[#081426] border-[#1E293B] text-[#9DAFC4] hover:border-[#233852] hover:text-white"
                  }`}
                >
                  <div className={`text-[10px] font-mono font-semibold uppercase ${selectedLeadIndex === idx ? "text-cyan-300" : "text-[#667B94]"}`}>{step.label}</div>
                  <div className={`text-base font-mono font-bold mt-1 ${selectedLeadIndex === idx ? "text-white" : "text-slate-200"}`}>
                    {step.MOSAIC_BLEND} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${selectedLeadIndex === idx ? "text-cyan-300" : "text-[#00B8E6]"}`}>
                    Error: ±{step.mosaic_error}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Model Benchmark Comparison Table at Current Lead Time */}
          {currentStep && (
            <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#00B8E6]" />
                  <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                    Model Predictions vs Observed Ground Truth at +{currentStep.lead_time_hours}h Lead
                  </h3>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ground Truth: {currentStep.observed_ground_truth} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1E293B] text-[#667B94] bg-[#081426]">
                      <th className="py-2.5 px-3">SOURCE / MODEL</th>
                      <th className="py-2.5 px-3">MODEL TYPE</th>
                      <th className="py-2.5 px-3">PREDICTED VALUE</th>
                      <th className="py-2.5 px-3">ABSOLUTE ERROR</th>
                      <th className="py-2.5 px-3">ADAPTIVE WEIGHT</th>
                      <th className="py-2.5 px-3">PERFORMANCE ASSESSMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {/* NOAA GFS */}
                    <tr className="hover:bg-[#111F33]">
                      <td className="py-2.5 px-3 font-semibold text-[#00B8E6]">NOAA GFS</td>
                      <td className="py-2.5 px-3 text-[#9DAFC4]">NWP (0.25° Physics)</td>
                      <td className="py-2.5 px-3 font-bold text-white">{currentStep.NOAA_GFS}</td>
                      <td className="py-2.5 px-3 text-red-400 font-semibold">
                        ±{roundErr(currentStep.NOAA_GFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#9DAFC4]">{Math.round((currentStep.weights["NOAA_GFS"] || 0.12) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#667B94]">Over-prediction wet bias</td>
                    </tr>

                    {/* ECMWF IFS */}
                    <tr className="hover:bg-[#111F33]">
                      <td className="py-2.5 px-3 font-semibold text-[#1687FF]">ECMWF IFS</td>
                      <td className="py-2.5 px-3 text-[#9DAFC4]">NWP (0.25° Physics)</td>
                      <td className="py-2.5 px-3 font-bold text-white">{currentStep.ECMWF_IFS}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">
                        ±{roundErr(currentStep.ECMWF_IFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#9DAFC4]">{Math.round((currentStep.weights["ECMWF_IFS"] || 0.36) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#667B94]">Strong terrain boundary layer</td>
                    </tr>

                    {/* ECMWF AIFS */}
                    <tr className="hover:bg-[#111F33] bg-purple-950/20">
                      <td className="py-2.5 px-3 font-semibold text-purple-300 flex items-center space-x-1.5">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span>ECMWF AIFS</span>
                      </td>
                      <td className="py-2.5 px-3 text-purple-300">AI (0.25° Graph Neural Net)</td>
                      <td className="py-2.5 px-3 font-bold text-purple-300">{currentStep.ECMWF_AIFS}</td>
                      <td className="py-2.5 px-3 text-emerald-400 font-semibold">
                        ±{roundErr(currentStep.ECMWF_AIFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-purple-300 font-bold">{Math.round((currentStep.weights["ECMWF_AIFS"] || 0.44) * 100)}%</td>
                      <td className="py-2.5 px-3 text-purple-300">Dominant: Low phase error</td>
                    </tr>

                    {/* NOAA GEFS */}
                    <tr className="hover:bg-[#111F33]">
                      <td className="py-2.5 px-3 font-semibold text-amber-400">NOAA GEFS</td>
                      <td className="py-2.5 px-3 text-[#9DAFC4]">Ensemble (31-member)</td>
                      <td className="py-2.5 px-3 font-bold text-white">{currentStep.NOAA_GEFS}</td>
                      <td className="py-2.5 px-3 text-[#667B94]">
                        ±{roundErr(currentStep.NOAA_GEFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#9DAFC4]">{Math.round((currentStep.weights["NOAA_GEFS"] || 0.08) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#667B94]">Ensemble spread baseline</td>
                    </tr>

                    {/* EQUAL-WEIGHTED MULTI-MODEL MEAN */}
                    <tr className="hover:bg-[#111F33] bg-[#081426] border-t border-[#1E293B] font-semibold">
                      <td className="py-2.5 px-3 text-[#9DAFC4]">EQUAL-WEIGHTED MEAN</td>
                      <td className="py-2.5 px-3 text-[#667B94]">Simple 25% Average Baseline</td>
                      <td className="py-2.5 px-3 text-white">{currentStep.EQUAL_MEAN}</td>
                      <td className="py-2.5 px-3 text-red-400">±{currentStep.equal_mean_error}</td>
                      <td className="py-2.5 px-3 text-[#667B94]">25.0% each</td>
                      <td className="py-2.5 px-3 text-red-400/80">Diluted by uncalibrated models</td>
                    </tr>

                    {/* MOSAIC ADAPTIVE BLEND */}
                    <tr className="bg-cyan-950/40 border-t-2 border-[#00B8E6] font-bold">
                      <td className="py-3 px-3 text-[#00B8E6] flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00B8E6]" />
                        <span>MOSAIC HYBRID BLEND</span>
                      </td>
                      <td className="py-3 px-3 text-[#00B8E6] font-mono">Dynamic Adaptive Skill Blend</td>
                      <td className="py-3 px-3 text-white text-sm">{currentStep.MOSAIC_BLEND}</td>
                      <td className="py-3 px-3 text-emerald-400 text-sm">±{currentStep.mosaic_error}</td>
                      <td className="py-3 px-3 text-[#00B8E6]">100.0% (Adaptive)</td>
                      <td className="py-3 px-3 text-emerald-400">
                        ⭐ {Math.round(((currentStep.equal_mean_error - currentStep.mosaic_error) / currentStep.equal_mean_error) * 100)}% Better than Equal Mean
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scientific Synoptic Meteorological Narrative */}
          <div className="bg-[#0D1B2E] border border-[#1E293B] rounded-xl p-5 space-y-2 shadow-md">
            <div className="flex items-center space-x-2 text-white font-bold text-sm font-mono">
              <Info className="w-4 h-4 text-[#00B8E6]" />
              <span>Synoptic Verification Analysis & Weight Attribution</span>
            </div>
            <p className="text-xs text-[#9DAFC4] leading-relaxed font-sans">
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
