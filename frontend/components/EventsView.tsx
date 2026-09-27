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
import { fetchLandslideIntelligence } from "@/services/api";

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
  const [landslideData, setLandslideData] = React.useState<any>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadLandslide() {
      const locationId = selectedLocation?.id || (monitoringScope === "NER" ? 1 : 2);
      try {
        const data = await fetchLandslideIntelligence(locationId);
        if (isMounted) setLandslideData(data);
      } catch (err) {
        console.error("Landslide fetch error:", err);
      }
    }
    loadLandslide();
    return () => { isMounted = false; };
  }, [selectedLocation, monitoringScope]);

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

      {/* SIH26081 Section 22: Landslide Meteorological Trigger Signal Card */}
      {landslideData && (
        <div className="bg-white border border-[#D9E0E7] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold text-xs">
                🏔️
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-[#0B1F33]">
                    SIH26081 Landslide Meteorological Trigger Signal
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    STATUS: {landslideData.trigger_status}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Empirical rain-trigger analysis coupling 24h/72h rainfall, 48h antecedent moisture, and root-zone soil saturation.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#94A3B8] block font-mono">RAIN-TRIGGER INDEX</span>
              <span className="text-xl font-bold font-mono text-[#0B1F33]">
                {landslideData.rain_trigger_index_pct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg text-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-mono">24h Rainfall:</span>
              <span className="text-sm font-bold text-[#1769AA]">{landslideData.rainfall_24h_mm} mm</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg text-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-mono">48h Antecedent:</span>
              <span className="text-sm font-bold text-[#1769AA]">{landslideData.antecedent_rainfall_48h_mm} mm</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg text-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-mono">Soil Saturation:</span>
              <span className="text-sm font-bold text-[#0B1F33]">{landslideData.soil_saturation_pct}%</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-lg text-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-mono">Terrain Slope / Elev:</span>
              <span className="text-sm font-bold text-[#334155]">{landslideData.terrain_slope_deg}° / {landslideData.elevation_m}m</span>
            </div>
          </div>

          <div className="text-xs text-[#475569] bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
            <span>{landslideData.narrative_advisory}</span>
            <span className="text-[10px] font-mono text-[#94A3B8] shrink-0 ml-3">
              Prov: {landslideData.data_provenance}
            </span>
          </div>
        </div>
      )}

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
        locationName={selectedLocation?.name || (monitoringScope === "INDIA" ? "All India National Domain" : "Northeast India")}
        probHeavyRain={probHeavyRain}
        probVeryHeavyRain={probVeryHeavyRain}
      />
    </div>
  );
};
