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
  monitoringScope?: "NER" | "INDIA";
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  selectedLocation,
  probHeavyRain = 0.42,
  probVeryHeavyRain = 0.18,
  monitoringScope = "NER"
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9E0E7] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-[#0B1F33] tracking-tight">
              {monitoringScope === "INDIA" ? "India Extreme Weather Guidance" : "NER Extreme Weather Guidance"} & Early Warning
            </h1>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            {monitoringScope === "INDIA"
              ? "Pan-India automated model-derived guidance for severe convection, heavy monsoonal depressions, heatwaves, and coastal squalls."
              : "Localized automated model-derived guidance for Brahmaputra flash floods, cloudbursts, and Khasi-Garo steep orographic precipitation."}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#EFF6FF] text-[#1769AA] border border-[#BFDBFE]">
            MOSAIC MODEL GUIDANCE
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 hidden sm:inline">
            CROSS-REF: OFFICIAL IMD BULLETINS
          </span>
          <InfoTooltip 
            term="forecast_certainty" 
            explanation="Guidance derived from multi-model ensemble exceedance thresholds. Clearly separated from official statutory warnings from the India Meteorological Department (IMD)." 
          />
        </div>
      </div>

      {/* Advisory Banner mandated by Sections 20, 24, 25 */}
      <div className="p-4 rounded-xl bg-white border border-[#D9E0E7] shadow-sm flex items-start space-x-3 text-xs text-[#475569]">
        <Info className="w-4 h-4 text-[#1769AA] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[#0B1F33]">
            Operational Notice: Guidance vs. Official Warning Protocol
          </div>
          <p className="text-[11px] text-[#64748B] leading-relaxed">
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
