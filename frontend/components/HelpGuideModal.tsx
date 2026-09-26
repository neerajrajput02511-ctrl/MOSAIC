"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  HelpCircle, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  Compass, 
  Activity, 
  ShieldCheck, 
  BookOpen 
} from "lucide-react";

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "onboarding" | "faq";
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  defaultTab = "faq"
}) => {
  const [tab, setTab] = useState<"onboarding" | "faq">(defaultTab);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const portalTarget = typeof document !== "undefined"
    ? (document.getElementById("copilot-modal-root") || document.body)
    : null;

  if (!portalTarget) return null;

  const faqs = [
    {
      q: "What is MOSAIC?",
      a: "MOSAIC (Meteorological Operations System for AI–NWP Consensus) is an operational multi-model forecast intelligence platform developed for SIH26081. It dynamically combines numerical physics models and AI weather operators to generate a single, highly accurate blended forecast."
    },
    {
      q: "What is multi-model forecast blending?",
      a: "Rather than relying on one single weather model (which can have localized or seasonal errors), MOSAIC takes predictions from ECMWF IFS, ECMWF AIFS, NOAA GFS, and NOAA GEFS, and computes an optimal weighted consensus forecast for every location."
    },
    {
      q: "What is an adaptive weight?",
      a: "An adaptive weight is the percentage of influence given to a specific model. Instead of static weights, MOSAIC dynamically adjusts each model's contribution based on recent regional performance, current weather regime (e.g. monsoon vs clear), lead time (+24h to +120h), and season."
    },
    {
      q: "What does Forecast Certainty / Uncertainty represent?",
      a: "Uncertainty is derived directly from measurable quantities: inter-model agreement and GEFS 31-member ensemble spread. When models strongly agree, certainty is High. When models diverge, certainty drops and a wider prediction range is displayed."
    },
    {
      q: "What is Model Agreement?",
      a: "Model agreement evaluates how close the individual models (IFS, AIFS, GFS, GEFS) are to one another. High agreement gives meteorologists confidence that the forecast scenario is stable."
    },
    {
      q: "What are MAE and RMSE in verification?",
      a: "MAE (Mean Absolute Error) measures the average size of forecast errors in mm or °C (lower is better). RMSE (Root Mean Square Error) gives greater mathematical penalty to large errors, penalizing severe misses."
    },
    {
      q: "Is this model guidance or an official warning?",
      a: "MOSAIC outputs automated scientific model guidance and early warning indicators. It is designed to assist meteorologists and disaster teams, but does not replace official statutory warnings issued by national authorities (e.g. IMD)."
    }
  ];

  return createPortal(
    <div 
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ isolation: "isolate" }}
    >
      {/* Full Viewport Dark/Blurred Backdrop */}
      <div 
        className="fixed inset-0 transition-opacity duration-200"
        style={{
          backgroundColor: "rgba(8, 20, 35, 0.70)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)"
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-2xl bg-white border border-[#D9E0E7] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EDF2F7] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1769AA]/10 border border-[#1769AA]/20 flex items-center justify-center text-[#1769AA]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#0B1F33] text-sm tracking-wide">
                MOSAIC SYSTEM GUIDE
              </h3>
              <p className="text-[11px] text-[#64748B] font-mono">
                SIH26081 · Hybrid AI–NWP Multi-Model Blending
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-[#D9E0E7]">
              <button
                onClick={() => setTab("onboarding")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  tab === "onboarding" ? "bg-[#1769AA] text-white font-semibold" : "text-[#64748B] hover:text-[#0B1F33]"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setTab("faq")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  tab === "faq" ? "bg-[#1769AA] text-white font-semibold" : "text-[#64748B] hover:text-[#0B1F33]"
                }`}
              >
                Glossary
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#64748B] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {tab === "onboarding" ? (
            <div className="space-y-6">
              <div className="text-center space-y-1.5 max-w-lg mx-auto">
                <h4 className="text-base font-bold text-[#0B1F33]">
                  How MOSAIC Multi-Model Blending Works
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed">
                  MOSAIC replaces guesswork by statistically optimizing inputs from leading numerical physics models and deep-learning AI weather systems.
                </p>
              </div>

              {/* 3 Step Flow mandated by Section 28 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E0E7] space-y-2 relative">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1769AA] font-bold text-xs flex items-center justify-center font-mono">
                    1
                  </div>
                  <h5 className="font-semibold text-xs text-[#0B1F33]">Multiple Models</h5>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    MOSAIC ingests global NWP physics (ECMWF IFS, NOAA GFS) and AI neural models (ECMWF AIFS, GEFS ensemble) on a 0.25° grid.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E0E7] space-y-2 relative">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1769AA] font-bold text-xs flex items-center justify-center font-mono">
                    2
                  </div>
                  <h5 className="font-semibold text-xs text-[#0B1F33]">Adaptive Blending</h5>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Dynamically determines which model receives higher weight based on regional verification skill, lead time, and active weather regime.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E0E7] space-y-2 relative">
                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center font-mono">
                    3
                  </div>
                  <h5 className="font-semibold text-xs text-[#0B1F33]">Unified Forecast</h5>
                  <p className="text-[11px] text-[#64748B] leading-relaxed">
                    Produces a single, calibrated consensus forecast with transparent uncertainty ranges and exceedance risk probabilities.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#D9E0E7] space-y-2 text-xs">
                <div className="font-semibold text-[#1769AA] text-xs flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1769AA]" />
                  <span>The SIH26081 Guarantee: Zero Fabricated Numbers</span>
                </div>
                <p className="text-[#64748B] text-[11px] leading-relaxed">
                  Every weight ($\sum w_i = 1.0000$), uncertainty spread, and blended value is mathematically derived from upstream operational model runs and historical verification error metrics.
                </p>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg bg-[#1769AA] hover:bg-[#155d97] text-white font-bold text-xs tracking-wide shadow-sm transition-all inline-flex items-center space-x-2"
                >
                  <span>Start Exploring Forecasts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-[#64748B] pb-1">
                Frequently asked questions and explanations of meteorological concepts used across MOSAIC:
              </div>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#D9E0E7] space-y-1.5">
                    <div className="font-semibold text-xs text-[#0B1F33]">
                      {faq.q}
                    </div>
                    <div className="text-[11px] text-[#64748B] leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    portalTarget
  );
};
