"use client";

import React from "react";
import { Radio, ArrowRight, ShieldCheck, Cpu, Sliders, MapPin, Database, CheckCircle2 } from "lucide-react";

interface LandingHeroProps {
  onOpenConsole: () => void;
  onOpenMethodology: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenConsole,
  onOpenMethodology
}) => {
  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative rounded-2xl border border-[#1e2c47] bg-gradient-to-b from-[#0c1322] via-[#090f1a] to-[#060a12] p-8 md:p-14 overflow-hidden shadow-2xl">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e2c4715_1px,transparent_1px),linear-gradient(to_bottom,#1e2c4715_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            <span>SIH26081 OPERATIONAL METEOROLOGICAL PROTOTYPE</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100 leading-tight">
            One Forecast. Multiple Models. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Adaptive Multi-Model Intelligence.
            </span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
            An operational meteorological platform that dynamically combines Numerical Weather Prediction models (NOAA GFS, ECMWF IFS) and deep-learning AI forecasts (ECMWF AIFS) using region-, season-, and lead-time-aware model weighting with quantified uncertainty.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onOpenConsole}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-cyan-500/20"
            >
              <span>Open Forecast Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenMethodology}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-[#111a2e] hover:bg-[#19243d] border border-[#1e2c47] text-slate-200 font-semibold text-xs tracking-wide transition"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Explore Scientific Methodology</span>
            </button>
          </div>

          {/* Model Convergence Visual Flow */}
          <div className="pt-8 border-t border-[#1e2c47]/80 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 bg-[#111a2e]/60 rounded border border-[#1e2c47] space-y-1">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">1. NOAA GFS</span>
              <p className="text-slate-300 text-[11px]">0.25° Global NWP. 4 daily synoptic runs.</p>
            </div>
            <div className="p-3 bg-[#111a2e]/60 rounded border border-[#1e2c47] space-y-1">
              <span className="text-[10px] text-blue-400 uppercase font-bold block">2. ECMWF IFS</span>
              <p className="text-slate-300 text-[11px]">0.25° Gold-standard European NWP physics.</p>
            </div>
            <div className="p-3 bg-[#111a2e]/60 rounded border border-[#1e2c47] space-y-1">
              <span className="text-[10px] text-purple-400 uppercase font-bold block">3. ECMWF AIFS</span>
              <p className="text-slate-300 text-[11px]">Deep learning neural weather forecast model.</p>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded border border-cyan-500/40 space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase font-bold block">4. ADAPTIVE BLEND</span>
              <p className="text-cyan-200 text-[11px]">Optimal weighting: -16.8% error reduction.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
