/**
 * Centralized Scope Configuration Engine (SIH26081 Strict Domain Integrity)
 * 
 * Ensures complete, unambiguous separation between:
 * 1. "ALL INDIA" (scope=india) -> Pan-India 36 MoES Meteorological Subdivisions,
 *    national bounding box, standard IMD grid, no NER-specific river basin or hill labels.
 * 2. "NORTH EASTERN REGION" (scope=ner) -> High-resolution NER 8 states, Brahmaputra & Barak
 *    basins, steep terrain orography, Khasi-Garo escarpment, NER DWR radar gates.
 */

export interface ScopeConfig {
  scope: "INDIA" | "NER";
  label: string;
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  domainName: string;
  geographicBounds: string;
  centerCoordinates: { lat: number; lng: number; zoom: number };
  riverBasins: string;
  elevationContext: string;
  statesCountLabel: string;
  statesListSummary: string;
  radarNetworkName: string;
  radarStationsCount: number;
  nationalStationsCount: number;
  defaultPrompt: string;
  weatherRegimeContext: string;
}

export const SCOPE_CONFIGS: Record<"INDIA" | "NER", ScopeConfig> = {
  INDIA: {
    scope: "INDIA",
    label: "ALL INDIA",
    badgeText: "ALL INDIA DOMAIN",
    heroTitle: "ALL INDIA NATIONAL WEATHER INTELLIGENCE",
    heroSubtitle: "Pan-India Multi-Model NWP & AI Blending, Spatial Verification & Hazard Guidance",
    domainName: "National Indian Subcontinent & EEZ",
    geographicBounds: "6.5°N – 37.5°N, 68.0°E – 97.5°E",
    centerCoordinates: { lat: 21.7679, lng: 78.8718, zoom: 4.5 },
    riverBasins: "Indo-Gangetic, Brahmaputra & Peninsular River Systems",
    elevationContext: "Sea Level (Coastal) to 8,586 m ASL (Himalayan Arc)",
    statesCountLabel: "36 Meteorological Subdivisions (28 States + 8 UTs)",
    statesListSummary: "All-India Coverage (North, South, East, West, Central, Northeast)",
    radarNetworkName: "IMD National Doppler Weather Radar (DWR) Operational Network",
    radarStationsCount: 37,
    nationalStationsCount: 27,
    defaultPrompt: "Click anywhere on the India map or search a city/station to inspect forecast",
    weatherRegimeContext: "Indian Tropical & Subtropical Synoptic Regimes (Monsoon Trough, Western Disturbances)"
  },
  NER: {
    scope: "NER",
    label: "NORTH EASTERN REGION",
    badgeText: "NER DOMAIN",
    heroTitle: "NORTH EASTERN REGION (NER) OPERATIONAL SURVEILLANCE",
    heroSubtitle: "High-Resolution Orographic Weather Intelligence for North East India & Brahmaputra Basin",
    domainName: "North Eastern Region (8 States)",
    geographicBounds: "21.5°N – 29.5°N, 89.5°E – 97.5°E",
    centerCoordinates: { lat: 26.2006, lng: 92.9376, zoom: 6.8 },
    riverBasins: "Brahmaputra & Barak River Basins",
    elevationContext: "50 m (Valley Plains) to 7,090 m ASL (Kangto / Eastern Himalayas)",
    statesCountLabel: "8 North Eastern States",
    statesListSummary: "Assam, Meghalaya, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura, Sikkim",
    radarNetworkName: "NER Strategic Doppler Radar Array (Cherrapunji, Mohanbari, Agartala)",
    radarStationsCount: 3,
    nationalStationsCount: 11,
    defaultPrompt: "Select a North Eastern station or click on the NER topography",
    weatherRegimeContext: "Steep Orographic Precipitation, Valley Funneling & Pre-Monsoon Convection"
  }
};

export function getScopeConfig(scope?: string | null): ScopeConfig {
  if (scope && (scope.toUpperCase() === "INDIA" || scope.toUpperCase() === "ALL_INDIA")) {
    return SCOPE_CONFIGS.INDIA;
  }
  return SCOPE_CONFIGS.NER;
}
