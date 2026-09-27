"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

export interface TooltipProps {
  term?: string;
  explanation: string;
  children?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

// Canonical definitions as mandated by SIH26081 Section 25
export const DICTIONARY: Record<string, string> = {
  "adaptive_weight": "How much influence this forecast model currently has in the MOSAIC blend, dynamically computed from historical error and weather regime.",
  "model_agreement": "How closely the available forecast models agree with each other. High agreement increases confidence.",
  "forecast_uncertainty": "How uncertain the blended forecast is based on multi-model spread, standard deviation σ, and verified MAE.",
  "lead_time": "The forecast horizon into the future (e.g. +6h, +24h, +48h, +120h) from model initialization.",
  "nwp": "Numerical Weather Prediction: Traditional physics-based atmospheric modeling solving hydrodynamic and thermodynamic equations on supercomputers.",
  "ai_forecast": "Deep neural network planetary weather model (e.g., ECMWF AIFS) trained on 40+ years of atmospheric reanalysis data.",
  "observation": "Direct empirical ground-truth measurements recorded at surface weather stations (IMD AWS/ARG) or atmospheric soundings.",
  "satellite": "Remote sensing earth observation from geostationary (INSAT-3D/3DR) and microwave satellites providing cloud top temperature and precipitation.",
  "bias_correction": "A systematic calibration applied when an individual model historically exhibits persistent over-forecasting or under-forecasting.",
  "verification": "Rigorous scientific comparison of forecast predictions against actual ground observations to evaluate operational skill.",
  "crps": "Continuous Ranked Probability Score: A metric evaluating probabilistic forecasts by measuring distance between predicted and observed cumulative distributions.",
  "rmse": "Root Mean Square Error: Measures prediction error while penalizing larger errors more heavily. Lower values represent higher fidelity.",
  "mae": "Mean Absolute Error: The average magnitude of errors between predicted and observed values. Lower values indicate superior accuracy.",
  "model_dominance": "The individual forecast model that received the highest weight (argmax w_i) for a specific geographic region or grid cell.",
  "ensemble_spread": "Measures the divergence between the 31 ensemble members of NOAA GEFS, indicating the range of possible weather outcomes.",
  "weather_regime": "The prevailing synoptic atmospheric pattern (such as Active Monsoon, Deep Convection, Break Monsoon, or Heatwave) governing regional flow.",
  "regridding": "The mathematical transformation (e.g. bilinear interpolation) that maps disparate model resolutions (0.25°, 0.5°) onto a unified 0.25° common coordinate grid.",
  "probability": "The calibrated likelihood (0–100%) that an atmospheric threshold (e.g. rainfall >15mm or >50mm) will be exceeded.",
  "forecast_certainty": "An objective assessment of predictability derived from inter-model consensus, ensemble spread, and historical verification skill — never an arbitrary score.",
  "bma": "Bayesian Model Averaging: A statistical framework combining predictions from multiple models weighted by their posterior probabilities given historical skill.",
  "dirichlet_shrinkage": "A mathematical regularization that prevents extreme weight overfitting by gently pulling weights toward an equal-weighted prior (λ = 0.12)."
};

export const InfoTooltip: React.FC<TooltipProps> = ({
  term,
  explanation,
  children,
  position = "top",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const text = explanation || (term && DICTIONARY[term.toLowerCase().replace(/\s+/g, "_")]) || "Technical term";

  // Close on outside click on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current && 
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2"
  };

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      {children}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        aria-label={term ? `What is ${term}?` : "Help explanation"}
        className="ml-1 inline-flex items-center justify-center p-0.5 text-[#64748B] hover:text-[#1769AA] transition-colors focus:outline-none focus:ring-1 focus:ring-[#1769AA] rounded"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 w-64 max-w-[280px] p-3 bg-[#0B1F33] text-white text-xs leading-relaxed rounded-xl border border-[#1e2f4d] shadow-2xl pointer-events-auto transition-all animate-in fade-in duration-150 ${positionClasses[position]}`}
        >
          {term && (
            <div className="font-bold text-[#38BDF8] text-[11px] mb-1.5 uppercase tracking-wider flex items-center justify-between border-b border-slate-700/60 pb-1 font-mono">
              <span>{term.replace(/_/g, " ")}</span>
              <span className="text-[9px] text-slate-400">GUIDE</span>
            </div>
          )}
          <div className="text-[11px] text-slate-200 leading-normal font-sans">
            {text}
          </div>
        </div>
      )}
    </span>
  );
};
