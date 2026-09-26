"use client";

import React, { useState, useEffect } from "react";
import { 
  fetchLocations, 
  fetchBlendedForecast, 
  fetchWhyThisForecast,
  checkBackendHealth
} from "@/services/api";
import { addAndFetchMyLocation } from "@/services/locationService";
import { 
  LocationItem, 
  BlendedForecastResponse, 
  WhyThisForecastData 
} from "@/types";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { ForecastHeroView } from "@/components/ForecastHeroView";
import { ModelsView } from "@/components/ModelsView";
import { VerificationView } from "@/components/VerificationView";
import { EventsView } from "@/components/EventsView";
import { SystemView } from "@/components/SystemView";
import { ExplainabilityDrawer } from "@/components/ExplainabilityDrawer";
import { HelpGuideModal } from "@/components/HelpGuideModal";
import { MeteorologicalChatModal } from "@/components/MeteorologicalChatModal";

export default function Home() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [monitoringScope, setMonitoringScope] = useState<"NER" | "INDIA">("NER");
  const [activeTab, setActiveTab] = useState<NavTab>("forecast");
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(true);

  // Modals & Drawers
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [chatModalOpen, setChatModalOpen] = useState<boolean>(false);
  const [explainDrawerOpen, setExplainDrawerOpen] = useState<boolean>(false);
  const [explainData, setExplainData] = useState<WhyThisForecastData | null>(null);
  const [loadingExplain, setLoadingExplain] = useState<boolean>(false);

  // Forecast State
  const [forecastData, setForecastData] = useState<BlendedForecastResponse | null>(null);
  const [selectedLeadTime, setSelectedLeadTime] = useState<number>(24);
  const [loadingForecast, setLoadingForecast] = useState<boolean>(true);

  // 1. Check live backend health
  useEffect(() => {
    let active = true;
    const verifyHealth = async () => {
      try {
        const ok = await checkBackendHealth();
        if (active) setIsBackendOnline(ok);
      } catch {
        if (active) setIsBackendOnline(false);
      }
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Read initial scope from URL query parameter (Requirement 29)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const scopeParam = params.get("scope");
      if (scopeParam?.toLowerCase() === "india" || scopeParam?.toLowerCase() === "all_india") {
        setMonitoringScope("INDIA");
      } else if (scopeParam?.toLowerCase() === "ner") {
        setMonitoringScope("NER");
      }
    }
  }, []);

  // 3. Scope toggle handler with URL update without page reload
  const handleToggleScope = (scope: "NER" | "INDIA") => {
    setMonitoringScope(scope);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("scope", scope.toLowerCase());
      window.history.replaceState(null, "", url.toString());
    }
  };

  // 4. Locations load respecting monitoringScope
  useEffect(() => {
    async function init() {
      const isNer = monitoringScope === "NER";
      const locs = await fetchLocations(isNer, monitoringScope);

      // Guarantee strictly at most ONE user location in frontend state
      const cleanedLocs: LocationItem[] = [];
      let userFound = false;
      for (const l of locs) {
        const isUser = (
          l.name.includes("📍") ||
          l.name.toLowerCase().includes("my") ||
          l.district === "User Location" ||
          l.district === "Active Tracking"
        );
        if (isUser) {
          if (!userFound) {
            cleanedLocs.push(l);
            userFound = true;
          }
        } else {
          cleanedLocs.push(l);
        }
      }
      setLocations(cleanedLocs);

      // If switching scope and current station does not match scope domain
      if (isNer && selectedLocation && !selectedLocation.is_ner) {
        const guwahati = cleanedLocs.find(l => l.name === "Guwahati") || cleanedLocs[0];
        if (guwahati) setSelectedLocation(guwahati);
      } else if (!selectedLocation && cleanedLocs.length > 0) {
        const defaultLoc = isNer 
          ? (cleanedLocs.find(l => l.name === "Guwahati") || cleanedLocs[0])
          : (cleanedLocs.find(l => l.name === "New Delhi") || cleanedLocs[0]);
        setSelectedLocation(defaultLoc);
      }
    }
    init();
  }, [monitoringScope]);

  // 5. Fetch blended forecast when location changes
  useEffect(() => {
    async function loadForecast() {
      if (!selectedLocation) return;
      setLoadingForecast(true);
      const data = await fetchBlendedForecast(selectedLocation.id, 72);
      setForecastData(data);
      setLoadingForecast(false);
    }
    loadForecast();
  }, [selectedLocation]);

  // 6. Handler for Explainability Drawer
  const handleOpenExplainability = async (leadTime?: number) => {
    if (!selectedLocation) return;
    const targetLead = leadTime ?? selectedLeadTime;
    setExplainDrawerOpen(true);
    setLoadingExplain(true);
    const why = await fetchWhyThisForecast(selectedLocation.id, targetLead, "precipitation_mm");
    setExplainData(why);
    setLoadingExplain(false);
  };

  // 7. Clean Location Selection
  const handleSelectLocation = (loc: LocationItem) => {
    const isUser = (
      loc.name.includes("📍") ||
      loc.name.toLowerCase().includes("my") ||
      loc.district === "User Location" ||
      loc.district === "Active Tracking"
    );

    setLocations((prev) => {
      if (isUser) {
        const nonUserLocs = prev.filter(l => !(
          l.name.includes("📍") ||
          l.name.toLowerCase().includes("my") ||
          l.district === "User Location" ||
          l.district === "Active Tracking"
        ));
        return [loc, ...nonUserLocs];
      }
      if (!prev.some((l) => l.id === loc.id)) {
        return [loc, ...prev];
      }
      return prev;
    });
    setSelectedLocation(loc);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA] text-[#0F172A] font-sans pb-16 md:pb-0">
      {/* 1. TOP HEADER (72px) */}
      <Navbar
        locations={locations}
        selectedLocation={selectedLocation}
        onSelectLocation={handleSelectLocation}
        onOpenHelp={() => setHelpModalOpen(true)}
        onOpenChat={() => setChatModalOpen(true)}
        isBackendOnline={isBackendOnline}
        monitoringScope={monitoringScope}
        onToggleScope={handleToggleScope}
      />

      {/* 2. BODY SHELL: Sidebar (240px) + Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-[calc(100vh-72px)]">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            extremeEventsCount={forecastData?.extreme_events?.length || 0}
          />
        </div>

        {/* MAIN OPERATIONAL WORKSPACE */}
        <main className="flex-1 bg-[#F5F7FA] p-4 lg:p-6 overflow-y-auto">
          {/* TAB 1: FORECAST (PRIMARY HERO VIEW) */}
          {activeTab === "forecast" && (
            <ForecastHeroView
              locations={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={handleSelectLocation}
              forecastData={forecastData}
              selectedLeadTime={selectedLeadTime}
              onSelectLeadTime={(lead) => setSelectedLeadTime(lead)}
              onOpenExplainability={() => handleOpenExplainability(selectedLeadTime)}
              nerFilter={monitoringScope === "NER"}
              onToggleNerFilter={(val: boolean) => handleToggleScope(val ? "NER" : "INDIA")}
              monitoringScope={monitoringScope}
              onToggleScope={handleToggleScope}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB 2: MODELS (MODEL PROFILES & SPATIAL WEIGHT MAP) */}
          {activeTab === "models" && (
            <ModelsView monitoringScope={monitoringScope} />
          )}

          {/* TAB 3: VERIFICATION (SKILL CURVES, BASELINES & REPLAY) */}
          {activeTab === "verification" && (
            <VerificationView
              timeline={forecastData?.timeline || []}
              selectedLocation={selectedLocation}
              selectedLeadTime={selectedLeadTime}
              onSelectLeadTime={(lead) => setSelectedLeadTime(lead)}
              monitoringScope={monitoringScope}
            />
          )}

          {/* TAB 4: EVENTS (EXTREME WEATHER GUIDANCE & EARLY WARNINGS) */}
          {activeTab === "events" && (
            <EventsView
              events={forecastData?.extreme_events || []}
              selectedLocation={selectedLocation}
              monitoringScope={monitoringScope}
            />
          )}

          {/* TAB 5: SYSTEM (HEALTH, PIPELINE, DATA SOURCES & MATH AUDIT) */}
          {activeTab === "system" && (
            <SystemView />
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-[#D9E0E7] flex items-center justify-around z-40 px-2 shadow-lg">
        {[
          { id: "forecast", label: "Forecast" },
          { id: "models", label: "Models" },
          { id: "verification", label: "Verify" },
          { id: "events", label: "Events" },
          { id: "system", label: "System" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as NavTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === t.id
                ? "bg-[#0B1F33] text-white"
                : "text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* "Why This Forecast?" Transparent Explainability Drawer */}
      <ExplainabilityDrawer
        isOpen={explainDrawerOpen}
        onClose={() => setExplainDrawerOpen(false)}
        data={explainData}
        isLoading={loadingExplain}
      />

      {/* Global System Guide & Glossary Modal */}
      <HelpGuideModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />

      {/* Meteorological AI Copilot Modal */}
      <MeteorologicalChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        activeStationId={selectedLocation?.id}
      />
    </div>
  );
}
