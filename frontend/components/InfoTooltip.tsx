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

// Canonical definitions as mandated by SIH26081 Section 5
export const DICTIONARY: Record<string, string> = {
  "adaptive_weight": "The percentage of influence dynamically assigned to each forecast model based on how well it has performed for this specific location, weather regime, lead time, and season.",
  "model_agreement": "Measures how closely the different forecasting systems agree with each other. Higher disagreement indicates greater atmospheric uncertainty.",
  "ensemble_spread": "Measures the divergence between the 31 ensemble members of NOAA GEFS, indicating the range of possible weather outcomes.",
  "forecast_lead": "The time horizon into the future for which the prediction is generated (e.g. +24h, +48h, +72h, +120h).",
  "weather_regime": "The prevailing synoptic atmospheric pattern (such as Active Monsoon, Deep Convection, Break Monsoon, or Heatwave) governing regional flow.",
  "bias_correction": "A systematic calibration applied when an individual numerical model historically exhibits persistent over-forecasting or under-forecasting.",
  "regridding": "The mathematical transformation (e.g. bilinear interpolation) that maps disparate model resolutions (0.25°, 0.5°) onto a unified 0.25° common coordinate grid.",
  "mae": "Mean Absolute Error: The average magnitude of errors between predicted and observed values. Lower values indicate superior accuracy.",
  "rmse": "Root Mean Square Error: Measures prediction error while penalizing larger errors more heavily. Lower values represent higher fidelity.",
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
        className="ml-1 inline-flex items-center justify-center p-0.5 text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded"
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 w-64 max-w-[280px] p-2.5 bg-[#0f172a] text-slate-200 text-xs leading-relaxed rounded-lg border border-[#334155] shadow-2xl backdrop-blur-md pointer-events-auto transition-all animate-in fade-in duration-150 ${positionClasses[position]}`}
        >
          {term && (
            <div className="font-semibold text-cyan-300 text-[11px] mb-1 uppercase tracking-wider flex items-center justify-between border-b border-slate-700/60 pb-1">
              <span>{term}</span>
              <span className="text-[9px] text-slate-500 font-mono">MOSAIC GUIDE</span>
            </div>
          )}
          <div className="text-[11px] text-slate-300 font-sans">
            {text}
          </div>
        </div>
      )}
    </span>
  );
};
