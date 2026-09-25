"use client";

import React, { useState } from "react";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CloudRain, 
  Wind, 
  Thermometer, 
  CheckCircle2, 
  Info, 
  Bell, 
  ShieldCheck 
} from "lucide-react";
import { ExtremeWeatherPanel } from "./ExtremeWeatherPanel";
import { InfoTooltip } from "./InfoTooltip";
import { ExtremeEvent, LocationItem } from "@/types";

interface EventsViewProps {
  events: ExtremeEvent[];
  selectedLocation: LocationItem | null;
  probHeavyRain?: number;
  probVeryHeavyRain?: number;
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  selectedLocation,
  probHeavyRain = 0.42,
  probVeryHeavyRain = 0.18
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2f4d] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Extreme Weather Guidance & Early Warning
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated model-derived guidance for deep convection, extreme precipitation, high winds, and temperature anomalies.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            MOSAIC MODEL GUIDANCE
          </span>
          <InfoTooltip 
            term="forecast_certainty" 
            explanation="Guidance derived from multi-model ensemble exceedance thresholds. Always cross-reference with official statutory warnings from the India Meteorological Department (IMD)." 
          />
        </div>
      </div>

      {/* Advisory Banner mandated by Sections 20, 24, 25 */}
      <div className="p-4 rounded-xl bg-[#0d1627] border border-[#1e2f4d] flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-200">
            Operational Notice: Guidance vs. Official Warning Protocol
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The products displayed on this page are automated meteorological guidance produced by the MOSAIC ensemble engine (GEFS 31-member dispersion + IFS/AIFS/GFS consensus). They provide early situational awareness to emergency response planners and do not replace statutory forecasts or red/orange alerts issued by national meteorological offices.
          </p>
        </div>
      </div>

      {/* Main Events Dashboard Component */}
      <ExtremeWeatherPanel
        events={events}
        locationName={selectedLocation?.name || "Northeast India"}
        probHeavyRain={probHeavyRain}
        probVeryHeavyRain={probVeryHeavyRain}
      />
    </div>
  );
};
