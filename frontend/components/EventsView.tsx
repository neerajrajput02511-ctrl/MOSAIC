"use client";

import React from "react";
import { 
  ShieldAlert, 
  Info
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
    <div className="space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {monitoringScope === "INDIA" ? "India Extreme Weather Guidance" : "NER Extreme Weather Guidance"} & Early Warning
            </h1>
          </div>
          <p className="text-xs text-[#9DAFC4] mt-1">
            {monitoringScope === "INDIA"
              ? "Pan-India automated model-derived guidance for severe convection, heavy monsoonal depressions, heatwaves, and coastal squalls."
              : "Localized automated model-derived guidance for Brahmaputra flash floods, cloudbursts, and Khasi-Garo steep orographic precipitation."}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
            MOSAIC MODEL GUIDANCE
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-950/40 text-amber-300 border border-amber-800/40 hidden sm:inline">
            CROSS-REF: OFFICIAL IMD BULLETINS
          </span>
          <InfoTooltip 
            term="forecast_certainty" 
            explanation="Guidance derived from multi-model ensemble exceedance thresholds. Clearly separated from official statutory warnings from the India Meteorological Department (IMD)." 
          />
        </div>
      </div>

      {/* Advisory Banner */}
      <div className="p-4 rounded-xl bg-[#0D1B2E] border border-[#1E293B] shadow-md flex items-start space-x-3 text-xs text-[#9DAFC4]">
        <Info className="w-4 h-4 text-[#00B8E6] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white">
            Operational Notice: Guidance vs. Official Warning Protocol
          </div>
          <p className="text-[11px] text-[#9DAFC4] leading-relaxed">
            The products displayed on this page are automated meteorological guidance produced by the MOSAIC ensemble engine (GEFS 31-member dispersion + IFS/AIFS/GFS consensus). They provide early situational awareness to emergency response planners and do not replace statutory forecasts or red/orange alerts issued by national meteorological offices.
          </p>
        </div>
      </div>

      {/* Main Events Dashboard Component */}
      <ExtremeWeatherPanel
        events={events}
        locationName={selectedLocation?.name || (monitoringScope === "INDIA" ? "All India National Domain" : "Northeast India")}
        probHeavyRain={probHeavyRain}
        probVeryHeavyRain={probVeryHeavyRain}
      />
    </div>
  );
};
