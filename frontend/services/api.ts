import {
  LocationItem,
  BlendedForecastResponse,
  WhyThisForecastData,
  ModelPerformanceBenchmark,
  DataSourceItem
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchLocations(nerOnly: boolean = false): Promise<LocationItem[]> {
  try {
    const res = await fetch(`${API_BASE}/locations?ner_only=${nerOnly}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch locations:", err);
    return [];
  }
}

export async function fetchBlendedForecast(locationId: number, horizonHours: number = 72): Promise<BlendedForecastResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/forecast/blended?location_id=${locationId}&horizon_hours=${horizonHours}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch blended forecast:", err);
    return null;
  }
}

export async function fetchWhyThisForecast(locationId: number, leadTimeHours: number = 24, variable: string = "precipitation_mm"): Promise<WhyThisForecastData | null> {
  try {
    const res = await fetch(`${API_BASE}/explainability/why?location_id=${locationId}&lead_time_hours=${leadTimeHours}&variable=${variable}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch explainability:", err);
    return null;
  }
}

export async function fetchModelPerformance(season?: string, variable: string = "precipitation_mm"): Promise<ModelPerformanceBenchmark[]> {
  try {
    const url = season 
      ? `${API_BASE}/models/performance?season=${season}&variable=${variable}`
      : `${API_BASE}/models/performance?variable=${variable}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch performance:", err);
    return [];
  }
}

export async function fetchDataSources(): Promise<DataSourceItem[]> {
  try {
    const res = await fetch(`${API_BASE}/data-sources`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch data sources:", err);
    return [];
  }
}

export async function fetchSystemHealth(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch system health:", err);
    return null;
  }
}

export async function fetchSpatialWeightMap(
  leadTimeHours: number = 72,
  season: string = "Monsoon",
  regime: string = "Normal"
): Promise<any> {
  try {
    const res = await fetch(
      `${API_BASE}/spatial/weight-map?lead_time_hours=${leadTimeHours}&season=${season}&regime=${regime}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch spatial weight map:", err);
    return null;
  }
}

export async function fetchSkillTrends(
  regionCode: string = "NER",
  variable: string = "precipitation_mm"
): Promise<any> {
  try {
    const res = await fetch(
      `${API_BASE}/verification/skill-trends?region_code=${regionCode}&variable=${variable}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch skill trends:", err);
    return null;
  }
}

export async function fetchPipelineStatus(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/pipeline/status`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch pipeline status:", err);
    return null;
  }
}

export async function triggerPipelineRun(locationId: number = 1): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/pipeline/trigger?location_id=${locationId}`, {
      method: "POST",
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to trigger pipeline run:", err);
    return null;
  }
}

export async function askMeteorologicalCopilot(
  query: string,
  locationId?: number,
  history?: { role: string; content: string }[]
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/chat/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        location_id: locationId || 1,
        history: history || []
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to query meteorological copilot:", err);
    throw err;
  }
}

export async function createCustomLocation(
  latitude: number,
  longitude: number,
  name?: string,
  state?: string,
  elevation_m?: number
): Promise<LocationItem | null> {
  try {
    const res = await fetch(`${API_BASE}/locations/custom`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude,
        longitude,
        name: name || "My Current Location",
        state: state || "Detected GPS",
        elevation_m: elevation_m || 0.0
      })
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to register custom location:", err);
    return null;
  }
}
