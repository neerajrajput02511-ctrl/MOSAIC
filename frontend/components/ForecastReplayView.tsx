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
      <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A]">
                <RotateCcw className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-[#0B1F33] tracking-tight">
                Historical Extreme Event Replay Lab
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                HISTORICAL REPLAY · ARCHIVED EVENT (NOT LIVE FORECAST)
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-1 max-w-3xl">
              Evaluate MOSAIC multi-model hindcast performance against official IMD AWS / ERA5 ground-truth observations.
              Scrub through lead times (+24h to +120h) to observe dynamic adaptive weight shifts between traditional physics NWP and AI neural operators.
            </p>
          </div>

          {/* Event Case Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-[#64748B] font-mono font-semibold">SELECT CASE:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="bg-[#F8FAFC] border border-[#D9E0E7] text-[#0F172A] text-xs rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-[#1769AA]"
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
            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-mono text-[#64748B] uppercase font-semibold">EVENT / REGION</div>
              <div className="text-sm font-bold text-[#0B1F33] mt-1 truncate">{activeCase.title}</div>
              <div className="text-xs text-[#64748B] font-mono mt-0.5">{activeCase.region_name}</div>
            </div>

            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-mono text-[#64748B] uppercase font-semibold">GROUND TRUTH OBSERVATION</div>
              <div className="text-xl font-mono font-extrabold text-[#16A34A] mt-1">
                {activeCase.observed_value} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}
              </div>
              <div className="text-[10px] text-[#64748B] font-mono mt-0.5 truncate">{activeCase.observation_source}</div>
            </div>

            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-mono text-[#64748B] uppercase font-semibold">MOSAIC ERROR VS EQUAL MEAN</div>
              <div className="text-xl font-mono font-extrabold text-[#1769AA] mt-1">
                {activeCase.error_comparison.improvement_vs_equal_pct}% Error Reduction
              </div>
              <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                MOSAIC: ±{activeCase.error_comparison.MOSAIC_BLEND_error} | Equal: ±{activeCase.error_comparison.EQUAL_MEAN_error}
              </div>
            </div>

            <div className="bg-white border border-[#D9E0E7] rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-mono text-[#64748B] uppercase font-semibold">PRIMARY DOMINANT MODEL</div>
              <div className="text-sm font-bold text-[#7C3AED] mt-1 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>ECMWF AIFS (AI Neural Operator)</span>
              </div>
              <div className="text-[10px] text-[#64748B] font-mono mt-0.5">Dynamic Weight: 44% - 52%</div>
            </div>
          </div>

          {/* Lead-Time Timeline Scrubber & Animation Controls */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isPlaying 
                      ? "bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]" 
                      : "bg-[#0B1F33] text-white"
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? "PAUSE REPLAY" : "PLAY TIMELINE"}</span>
                </button>

                <button
                  onClick={() => setSelectedLeadIndex(0)}
                  className="p-1.5 rounded-lg bg-[#F8FAFC] text-[#64748B] hover:text-[#0F172A] border border-[#D9E0E7] transition"
                  title="Reset to +24h"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-mono text-[#64748B]">
                  CURRENT LEAD TIME: <span className="text-[#1769AA] font-bold">+{currentStep?.lead_time_hours || 72}h</span>
                </span>
              </div>

              <div className="flex items-center space-x-2 text-[11px] font-mono text-[#64748B]">
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
                      ? "bg-[#0B1F33] border-[#0B1F33] text-white shadow-sm"
                      : "bg-[#F8FAFC] border-[#D9E0E7] text-[#64748B] hover:border-[#94A3B8] hover:text-[#0F172A]"
                  }`}
                >
                  <div className={`text-[10px] font-mono font-semibold uppercase ${selectedLeadIndex === idx ? "text-slate-300" : "text-[#64748B]"}`}>{step.label}</div>
                  <div className={`text-base font-mono font-bold mt-1 ${selectedLeadIndex === idx ? "text-white" : "text-[#0B1F33]"}`}>
                    {step.MOSAIC_BLEND} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}
                  </div>
                  <div className={`text-[10px] font-mono mt-0.5 ${selectedLeadIndex === idx ? "text-cyan-300" : "text-[#1769AA]"}`}>
                    Error: ±{step.mosaic_error}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Model Benchmark Comparison Table at Current Lead Time */}
          {currentStep && (
            <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-[#1769AA]" />
                  <h3 className="text-sm font-bold text-[#0B1F33] tracking-tight uppercase">
                    Model Predictions vs Observed Ground Truth at +{currentStep.lead_time_hours}h Lead
                  </h3>
                </div>
                <div className="text-xs font-mono text-[#16A34A] font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ground Truth: {currentStep.observed_ground_truth} {activeCase.primary_variable.includes("temp") ? "°C" : "mm"}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#D9E0E7] text-[#64748B]">
                      <th className="py-2.5 px-3">SOURCE / MODEL</th>
                      <th className="py-2.5 px-3">MODEL TYPE</th>
                      <th className="py-2.5 px-3">PREDICTED VALUE</th>
                      <th className="py-2.5 px-3">ABSOLUTE ERROR</th>
                      <th className="py-2.5 px-3">ADAPTIVE WEIGHT</th>
                      <th className="py-2.5 px-3">PERFORMANCE ASSESSMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EDF2F7]">
                    {/* NOAA GFS */}
                    <tr className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-3 font-semibold text-[#1769AA]">NOAA GFS</td>
                      <td className="py-2.5 px-3 text-[#64748B]">NWP (0.25° Physics)</td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">{currentStep.NOAA_GFS}</td>
                      <td className="py-2.5 px-3 text-[#DC2626] font-semibold">
                        ±{roundErr(currentStep.NOAA_GFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#475569]">{Math.round((currentStep.weights["NOAA_GFS"] || 0.12) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#64748B]">Over-prediction wet bias</td>
                    </tr>

                    {/* ECMWF IFS */}
                    <tr className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-3 font-semibold text-[#0284C7]">ECMWF IFS</td>
                      <td className="py-2.5 px-3 text-[#64748B]">NWP (0.25° Physics)</td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">{currentStep.ECMWF_IFS}</td>
                      <td className="py-2.5 px-3 text-[#D97706] font-semibold">
                        ±{roundErr(currentStep.ECMWF_IFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#475569]">{Math.round((currentStep.weights["ECMWF_IFS"] || 0.36) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#64748B]">Strong terrain boundary layer</td>
                    </tr>

                    {/* ECMWF AIFS */}
                    <tr className="hover:bg-[#F8FAFC] bg-[#FAF5FF]">
                      <td className="py-2.5 px-3 font-semibold text-[#7C3AED] flex items-center space-x-1.5">
                        <Zap className="w-3 h-3 text-[#7C3AED]" />
                        <span>ECMWF AIFS</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#7C3AED]">AI (0.25° Graph Neural Net)</td>
                      <td className="py-2.5 px-3 font-bold text-[#7C3AED]">{currentStep.ECMWF_AIFS}</td>
                      <td className="py-2.5 px-3 text-[#16A34A] font-semibold">
                        ±{roundErr(currentStep.ECMWF_AIFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#7C3AED] font-bold">{Math.round((currentStep.weights["ECMWF_AIFS"] || 0.44) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#7C3AED]">Dominant: Low phase error</td>
                    </tr>

                    {/* NOAA GEFS */}
                    <tr className="hover:bg-[#F8FAFC]">
                      <td className="py-2.5 px-3 font-semibold text-[#D97706]">NOAA GEFS</td>
                      <td className="py-2.5 px-3 text-[#64748B]">Ensemble (31-member)</td>
                      <td className="py-2.5 px-3 font-bold text-[#0F172A]">{currentStep.NOAA_GEFS}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">
                        ±{roundErr(currentStep.NOAA_GEFS, currentStep.observed_ground_truth)}
                      </td>
                      <td className="py-2.5 px-3 text-[#475569]">{Math.round((currentStep.weights["NOAA_GEFS"] || 0.08) * 100)}%</td>
                      <td className="py-2.5 px-3 text-[#64748B]">Ensemble spread baseline</td>
                    </tr>

                    {/* EQUAL-WEIGHTED MULTI-MODEL MEAN */}
                    <tr className="hover:bg-[#F8FAFC] bg-[#F1F5F9] border-t border-[#D9E0E7] font-semibold">
                      <td className="py-2.5 px-3 text-[#475569]">EQUAL-WEIGHTED MEAN</td>
                      <td className="py-2.5 px-3 text-[#64748B]">Simple 25% Average Baseline</td>
                      <td className="py-2.5 px-3 text-[#0F172A]">{currentStep.EQUAL_MEAN}</td>
                      <td className="py-2.5 px-3 text-[#DC2626]">±{currentStep.equal_mean_error}</td>
                      <td className="py-2.5 px-3 text-[#64748B]">25.0% each</td>
                      <td className="py-2.5 px-3 text-[#DC2626]/80">Diluted by uncalibrated models</td>
                    </tr>

                    {/* MOSAIC ADAPTIVE BLEND */}
                    <tr className="bg-[#E0F2FE] border-t-2 border-[#1769AA] font-bold">
                      <td className="py-3 px-3 text-[#1769AA] flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1769AA]" />
                        <span>MOSAIC HYBRID BLEND</span>
                      </td>
                      <td className="py-3 px-3 text-[#1769AA] font-mono">Dynamic Adaptive Skill Blend</td>
                      <td className="py-3 px-3 text-[#0B1F33] text-sm">{currentStep.MOSAIC_BLEND}</td>
                      <td className="py-3 px-3 text-[#16A34A] text-sm">±{currentStep.mosaic_error}</td>
                      <td className="py-3 px-3 text-[#1769AA]">100.0% (Adaptive)</td>
                      <td className="py-3 px-3 text-[#16A34A]">
                        ⭐ {Math.round(((currentStep.equal_mean_error - currentStep.mosaic_error) / currentStep.equal_mean_error) * 100)}% Better than Equal Mean
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scientific Synoptic Meteorological Narrative */}
          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center space-x-2 text-[#0B1F33] font-bold text-sm">
              <Info className="w-4 h-4 text-[#1769AA]" />
              <span>Synoptic Verification Analysis & Weight Attribution</span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed font-sans">
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
