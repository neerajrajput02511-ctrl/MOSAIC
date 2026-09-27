"use client";

import React, { useState, useEffect } from "react";
import { 
  FlaskConical, 
  Play, 
  RotateCcw, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Sparkles, 
  Cpu, 
  Layers, 
  Clock, 
  Compass, 
  FileText,
  ShieldCheck,
  Zap,
  BarChart3
} from "lucide-react";
import { fetchExperiments, runExperimentApi, fetchForecastBusts } from "@/services/api";

interface ResearchLabViewProps {
  monitoringScope?: "NER" | "INDIA";
  onOpenCopilot?: (query?: string) => void;
}

export const ResearchLabView: React.FC<ResearchLabViewProps> = ({ 
  monitoringScope = "NER", 
  onOpenCopilot 
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"experiments" | "busts">("experiments");
  const [experiments, setExperiments] = useState<any[]>([]);
  const [bustCases, setBustCases] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Experiment Form Config
  const [expName, setExpName] = useState(
    monitoringScope === "INDIA"
      ? "All-India Synoptic Multi-Model Blend"
      : "North East Orographic Influx Experiment"
  );
  const [variable, setVariable] = useState("precipitation_mm");
  const [region, setRegion] = useState(monitoringScope === "INDIA" ? "INDIA" : "NER");
  const [leadTime, setLeadTime] = useState<number>(48);
  const [weightingMethod, setWeightingMethod] = useState("BMA_ADAPTIVE");
  const [season, setSeason] = useState("Monsoon");
  const [regime, setRegime] = useState("Heavy Rainfall");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "NOAA_GFS", "ECMWF_IFS", "ECMWF_AIFS", "NOAA_GEFS"
  ]);

  const [activeResult, setActiveResult] = useState<any | null>(null);

  // Sync with scope when scope changes
  useEffect(() => {
    setRegion(monitoringScope === "INDIA" ? "INDIA" : "NER");
    setExpName(
      monitoringScope === "INDIA"
        ? "All-India Synoptic Multi-Model Blend"
        : "North East Orographic Influx Experiment"
    );
  }, [monitoringScope]);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [expRes, bustRes] = await Promise.all([
          fetchExperiments(),
          fetchForecastBusts()
        ]);
        if (expRes?.experiments) {
          setExperiments(expRes.experiments);
          if (expRes.experiments.length > 0) {
            setActiveResult(expRes.experiments[0]);
          }
        }
        if (bustRes?.cases) {
          setBustCases(bustRes.cases);
        }
      } catch (err) {
        console.error("Failed to load research data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRunExperiment = async () => {
    setIsExecuting(true);
    try {
      const res = await runExperimentApi({
        name: expName,
        variable,
        region,
        lead_time_hours: leadTime,
        models: selectedModels,
        weighting_method: weightingMethod,
        season,
        weather_regime: regime
      });
      setActiveResult(res);
      setExperiments(prev => [res, ...prev]);
    } catch (err) {
      console.error("Experiment run failed:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const toggleModel = (modelCode: string) => {
    if (selectedModels.includes(modelCode)) {
      if (selectedModels.length > 1) {
        setSelectedModels(selectedModels.filter(m => m !== modelCode));
      }
    } else {
      setSelectedModels([...selectedModels, modelCode]);
    }
  };

  const handleExportJson = () => {
    if (!activeResult) return;
    const blob = new Blob([JSON.stringify(activeResult, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mosaic_experiment_${activeResult.experiment_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. RESEARCH HEADER */}
      <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] text-[#1769AA]">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#0B1F33] tracking-tight">
                  RESEARCH &amp; EXPERIMENTATION
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD]">
                  SIH26081 MANDATE SECTION 32 &amp; 33
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Configure reproducible blending experiments, test Bayesian priors against historical ground-truth, and audit NWP forecast bust cases.
              </p>
            </div>
          </div>

          {/* Subtab Toggle */}
          <div className="flex items-center bg-[#F1F5F9] p-1.5 rounded-xl border border-[#D9E0E7]">
            <button
              onClick={() => setActiveSubTab("experiments")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
                activeSubTab === "experiments"
                  ? "bg-[#1769AA] text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>EXPERIMENT STUDIO</span>
            </button>
            <button
              onClick={() => setActiveSubTab("busts")}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 ${
                activeSubTab === "busts"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FORECAST BUST MONITOR</span>
              {bustCases.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-700 font-bold">
                  {bustCases.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. TAB 1: EXPERIMENT RUNNER */}
      {activeSubTab === "experiments" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: Configuration Panel (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#1769AA]">
                <Cpu className="w-4 h-4" />
                <span>EXPERIMENT PARAMETERS</span>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">STRICT REPRODUCIBILITY</span>
            </div>

            {/* Experiment Name */}
            <div>
              <label className="text-[11px] font-mono text-[#64748B] uppercase">Experiment Title</label>
              <input 
                type="text" 
                value={expName}
                onChange={(e) => setExpName(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-[#F8FAFC] border border-[#D9E0E7] focus:border-[#1769AA] rounded-lg text-xs text-[#0F172A] font-mono outline-none"
              />
            </div>

            {/* Target Variable */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "precipitation_mm", label: "Rainfall", unit: "mm" },
                { id: "temperature_c", label: "Temperature", unit: "°C" },
                { id: "wind_speed_ms", label: "Wind Speed", unit: "m/s" }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setVariable(v.id)}
                  className={`p-2 rounded-lg text-xs font-mono text-center border transition ${
                    variable === v.id
                      ? "bg-[#EFF6FF] border-[#1769AA] text-[#1769AA] font-bold"
                      : "bg-[#F8FAFC] border-[#D9E0E7] text-[#64748B] hover:text-[#0F172A]"
                  }`}
                >
                  <div>{v.label}</div>
                  <div className="text-[9px] text-[#94A3B8]">{v.unit}</div>
                </button>
              ))}
            </div>

            {/* Region & Season */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono text-[#64748B] uppercase">MoES Climate Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-[#F8FAFC] border border-[#D9E0E7] focus:border-[#1769AA] rounded-lg text-xs text-[#0F172A] font-mono outline-none"
                >
                  <option value="NER">Northeast India (NER)</option>
                  <option value="NORTH">North India (Plain/Foothills)</option>
                  <option value="NORTHWEST">Northwest India (Arid)</option>
                  <option value="WEST">Western Ghats &amp; Coast</option>
                  <option value="CENTRAL">Central India (Monsoon Core)</option>
                  <option value="EAST">East India &amp; Delta</option>
                  <option value="SOUTH">South Peninsular India</option>
                  <option value="HIMALAYAN">Himalayan Cryosphere</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono text-[#64748B] uppercase">Meteorological Season</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 bg-[#F8FAFC] border border-[#D9E0E7] focus:border-[#1769AA] rounded-lg text-xs text-[#0F172A] font-mono outline-none"
                >
                  <option value="Monsoon">Southwest Monsoon (JJAS)</option>
                  <option value="Post-monsoon">Post-Monsoon (OND)</option>
                  <option value="Winter">Winter (JF)</option>
                  <option value="Pre-monsoon">Pre-Monsoon / Summer (MAM)</option>
                </select>
              </div>
            </div>

            {/* Lead Time Horizon */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] uppercase mb-1.5">
                <span>Lead Time Horizon</span>
                <span className="text-[#1769AA] font-bold">+{leadTime} Hours</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[12, 24, 48, 72, 120].map(lt => (
                  <button
                    key={lt}
                    onClick={() => setLeadTime(lt)}
                    className={`py-1.5 rounded-lg text-xs font-mono text-center border transition ${
                      leadTime === lt 
                        ? "bg-[#1769AA] text-white font-bold border-[#1769AA]" 
                        : "bg-[#F8FAFC] border-[#D9E0E7] text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    +{lt}h
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <label className="text-[11px] font-mono text-[#64748B] uppercase">Contributing Models</label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                {[
                  { code: "ECMWF_IFS", name: "ECMWF IFS (Physics)" },
                  { code: "ECMWF_AIFS", name: "ECMWF AIFS (Neural AI)" },
                  { code: "NOAA_GFS", name: "NOAA GFS (0.25° NWP)" },
                  { code: "NOAA_GEFS", name: "NOAA GEFS (31-Member)" }
                ].map(m => {
                  const isChecked = selectedModels.includes(m.code);
                  return (
                    <button
                      key={m.code}
                      onClick={() => toggleModel(m.code)}
                      className={`px-3 py-2 rounded-lg text-left text-xs font-mono border flex items-center justify-between transition ${
                        isChecked
                          ? "bg-[#EFF6FF] border-[#1769AA] text-[#0B1F33]"
                          : "bg-[#F8FAFC] border-[#D9E0E7] text-[#64748B]"
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                        isChecked ? "bg-[#1769AA] text-white" : "bg-[#E2E8F0] text-[#94A3B8]"
                      }`}>
                        {isChecked ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Weighting Method */}
            <div>
              <label className="text-[11px] font-mono text-[#64748B] uppercase">Blending Methodology</label>
              <select
                value={weightingMethod}
                onChange={(e) => setWeightingMethod(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 bg-[#F8FAFC] border border-[#D9E0E7] focus:border-[#1769AA] rounded-lg text-xs text-[#0F172A] font-mono outline-none"
              >
                <option value="BMA_ADAPTIVE">Regularized Bayesian Model Averaging (BMA + λ=0.12)</option>
                <option value="INVERSE_ERROR">Inverse Error / Skill Weighting (1 / MAE^p)</option>
                <option value="EQUAL_WEIGHT">Equal-Weight Multi-Model Mean (Benchmark Baseline)</option>
                <option value="NEURAL_META_LEARNER">Neural Deep Learning Meta-Learner</option>
              </select>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunExperiment}
              disabled={isExecuting}
              className="w-full py-3 rounded-xl bg-[#1769AA] hover:bg-[#1557A0] text-white font-bold font-mono text-sm shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{isExecuting ? "EXECUTING MONTE-CARLO VERIFICATION..." : "EXECUTE EXPERIMENT"}</span>
            </button>
          </div>

          {/* RIGHT: Active Experiment Results & Comparative Scoreboard (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {activeResult ? (
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-6 space-y-6 shadow-sm">
                {/* Result Title & Provenance Pill */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#E0F2FE] text-[#1769AA] border border-[#BAE6FD]">
                      ID: {activeResult.experiment_id}
                    </span>
                    <h2 className="text-base font-bold text-[#0B1F33] font-mono mt-1">
                      {activeResult.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportJson}
                      className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#EEF2F6] border border-[#D9E0E7] text-[#475569] text-xs font-mono flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-[#1769AA]" />
                      <span>EXPORT JSON</span>
                    </button>
                  </div>
                </div>

                {/* Scoreboard Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-mono text-[#64748B]">BASELINE RMSE</div>
                    <div className="text-lg font-bold font-mono text-[#334155] mt-0.5">
                      {activeResult.baseline_rmse} {variable === "precipitation_mm" ? "mm" : "°C"}
                    </div>
                    <div className="text-[9px] text-[#94A3B8] font-mono">Equal-Weight Mean</div>
                  </div>

                  <div className="bg-[#EFF6FF] p-3.5 rounded-xl border border-[#BFDBFE]">
                    <div className="text-[10px] font-mono text-[#1769AA] font-bold">MOSAIC BLEND RMSE</div>
                    <div className="text-lg font-bold font-mono text-[#1769AA] mt-0.5">
                      {activeResult.blended_rmse} {variable === "precipitation_mm" ? "mm" : "°C"}
                    </div>
                    <div className="text-[9px] text-[#2D8CFF] font-mono">Dynamic Adaptive BMA</div>
                  </div>

                  <div className="bg-[#DCFCE7] p-3.5 rounded-xl border border-[#BBF7D0]">
                    <div className="text-[10px] font-mono text-[#16A34A] font-bold">ERROR REDUCTION</div>
                    <div className="text-lg font-bold font-mono text-[#16A34A] mt-0.5 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +{activeResult.improvement_pct}%
                    </div>
                    <div className="text-[9px] text-[#22C55E] font-mono">vs Equal Baseline</div>
                  </div>

                  <div className="bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                    <div className="text-[10px] font-mono text-[#64748B]">CORRELATION / CSI</div>
                    <div className="text-lg font-bold font-mono text-[#0F172A] mt-0.5">
                      r = {activeResult.correlation}
                    </div>
                    <div className="text-[9px] text-[#94A3B8] font-mono">Critical Threat Score {activeResult.csi}</div>
                  </div>
                </div>

                {/* Normalized Model Weights */}
                {activeResult.weights && (
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono font-bold text-[#334155]">
                      <span>CALCULATED DYNAMIC MODEL WEIGHTS (Σ = 1.0000)</span>
                      <span className="text-[10px] text-[#1769AA]">Dirichlet Regularized</span>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(activeResult.weights).map(([model, weight]: [string, any]) => {
                        const pct = Math.round(weight * 100);
                        const isAi = model.includes("AIFS");
                        const color = isAi ? "bg-purple-500" : model.includes("IFS") ? "bg-[#1769AA]" : model.includes("GFS") ? "bg-blue-500" : "bg-amber-500";
                        return (
                          <div key={model} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[#334155]">{model.replace("_", " ")}</span>
                              <span className="font-bold text-[#0B1F33]">{pct}% ({Number(weight).toFixed(4)})</span>
                            </div>
                            <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Scientific Provenance Trail */}
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono space-y-1 text-[#64748B]">
                  <div className="flex items-center gap-1.5 text-[#1769AA] font-bold mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>SCIENTIFIC PROVENANCE &amp; LEAKAGE SAFEGUARDS</span>
                  </div>
                  <div>• Engine: {activeResult.provenance?.evaluation_engine}</div>
                  <div>• Ground Truth: {activeResult.provenance?.ground_truth}</div>
                  <div>• Split: {activeResult.provenance?.temporal_split}</div>
                  <div>• Reproducibility Hash: <span className="text-[#0F172A]">{activeResult.reproducible_hash}</span></div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#D9E0E7] rounded-xl p-12 text-center text-[#64748B] font-mono text-xs space-y-2 shadow-sm">
                <div className="text-sm font-bold text-[#0B1F33]">NO EXPERIMENT SELECTED</div>
                <p className="text-[11px] text-[#94A3B8]">Configure parameters on the left and click &quot;EXECUTE EXPERIMENT&quot; to calculate multi-model verification metrics.</p>
              </div>
            )}

            {/* Experiment History */}
            <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#0B1F33]">
                <span>RECENT BENCHMARK EXPERIMENTS</span>
                <span className="text-[#64748B] font-normal">
                  {experiments.length === 0 ? "NO EXPERIMENTS RUN YET" : `Experiments: ${experiments.length}`}
                </span>
              </div>
              <div className="space-y-2">
                {experiments.map(exp => (
                  <button
                    key={exp.experiment_id}
                    onClick={() => setActiveResult(exp)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      activeResult?.experiment_id === exp.experiment_id
                        ? "bg-[#EFF6FF] border-[#1769AA]"
                        : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#0B1F33] font-mono">{exp.name}</div>
                      <div className="text-[10px] text-[#64748B] font-mono mt-0.5">
                        {exp.region} • {exp.lead_time_hours}h • {exp.season} • {exp.weighting_method}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-[#16A34A]">+{exp.improvement_pct}%</div>
                      <div className="text-[9px] font-mono text-[#94A3B8]">{exp.experiment_id}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB 2: FORECAST BUST MONITOR */}
      {activeSubTab === "busts" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0B1F33] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>HIGH-IMPACT METEOROLOGICAL FORECAST BUST MONITOR</span>
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Verifiable audit of situations where individual classical NWP or AI models severely diverged from ground truth observations, and how adaptive blending stabilized guidance.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold shrink-0">
                SIH26081 MANDATE SECTION 30
              </span>
            </div>

            <div className="space-y-4">
              {bustCases.map((caseItem: any) => (
                <div key={caseItem.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 space-y-4">
                  {/* Case Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          {caseItem.id}
                        </span>
                        <h4 className="text-sm font-bold text-[#0B1F33] font-mono">{caseItem.title}</h4>
                      </div>
                      <div className="text-[11px] text-[#64748B] font-mono mt-1">
                        📍 {caseItem.location} ({caseItem.latitude}°N, {caseItem.longitude}°E) • Valid: {caseItem.date} (+{caseItem.lead_time_hours}h Horizon)
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold">
                        {caseItem.agreement_status} (Spread σ = {caseItem.model_disagreement_spread} {caseItem.units})
                      </span>
                    </div>
                  </div>

                  {/* Ground Truth vs Models Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="bg-[#DCFCE7] p-3 rounded-lg border border-[#BBF7D0]">
                      <div className="text-[10px] font-mono text-[#16A34A] font-bold">OBSERVED TRUTH</div>
                      <div className="text-base font-bold font-mono text-[#0B1F33] mt-0.5">
                        {caseItem.observed_value} {caseItem.units}
                      </div>
                      <div className="text-[9px] text-[#64748B]">IMD Gauge / AWS</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono text-blue-600">NOAA GFS</div>
                      <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">
                        {caseItem.predictions?.NOAA_GFS} {caseItem.units}
                      </div>
                      <div className="text-[9px] text-red-600">Δ = {Math.abs(caseItem.predictions?.NOAA_GFS - caseItem.observed_value).toFixed(1)}</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono text-[#1769AA]">ECMWF IFS</div>
                      <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">
                        {caseItem.predictions?.ECMWF_IFS} {caseItem.units}
                      </div>
                      <div className="text-[9px] text-[#64748B]">Δ = {Math.abs(caseItem.predictions?.ECMWF_IFS - caseItem.observed_value).toFixed(1)}</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono text-purple-600">ECMWF AIFS (AI)</div>
                      <div className="text-base font-bold font-mono text-[#0F172A] mt-0.5">
                        {caseItem.predictions?.ECMWF_AIFS} {caseItem.units}
                      </div>
                      <div className="text-[9px] text-[#64748B]">Δ = {Math.abs(caseItem.predictions?.ECMWF_AIFS - caseItem.observed_value).toFixed(1)}</div>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-[#E2E8F0]">
                      <div className="text-[10px] font-mono text-[#64748B]">EQUAL MEAN</div>
                      <div className="text-base font-bold font-mono text-[#334155] mt-0.5">
                        {caseItem.equal_mean} {caseItem.units}
                      </div>
                      <div className="text-[9px] text-red-600">Error: {caseItem.equal_mean_error}</div>
                    </div>

                    <div className="bg-[#EFF6FF] p-3 rounded-lg border border-[#BFDBFE]">
                      <div className="text-[10px] font-mono text-[#1769AA] font-bold">MOSAIC BLEND</div>
                      <div className="text-base font-bold font-mono text-[#1769AA] mt-0.5">
                        {caseItem.mosaic_blend} {caseItem.units}
                      </div>
                      <div className="text-[9px] text-[#16A34A] font-bold">Error: {caseItem.mosaic_error} (-{caseItem.error_reduction_pct}%)</div>
                    </div>
                  </div>

                  {/* Meteorological Root Cause Analysis */}
                  <div className="bg-white p-3.5 rounded-lg border border-[#E2E8F0] text-xs font-mono space-y-1">
                    <span className="text-[#1769AA] font-bold">METEOROLOGICAL ROOT CAUSE ANALYSIS &amp; ADAPTATION:</span>
                    <p className="text-[#334155] leading-relaxed mt-0.5">
                      {caseItem.bust_explanation}
                    </p>
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
