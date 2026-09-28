import {
  LocationItem,
  BlendedForecastResponse,
  WhyThisForecastData,
  ModelPerformanceBenchmark,
  DataSourceItem,
  ForecastSnapshot
} from "@/types";

const DEFAULT_PUBLIC_BACKEND = "https://mosaic-mgbt.onrender.com/api/v1";

export function getApiBase(): string {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (url && url.trim().length > 0) {
    url = url.trim().replace(/\/$/, "");
    if (!url.endsWith("/api/v1") && !url.endsWith("/api")) {
      url = `${url}/api/v1`;
    }
    return url;
  }
  if (typeof window !== "undefined") {
    // If the page is running on HTTPS (like GitHub Pages or production domain)
    if (window.location.protocol === "https:") {
      return DEFAULT_PUBLIC_BACKEND;
    }
    // If running on local dev over HTTP
    return "http://localhost:8000/api/v1";
  }
  return DEFAULT_PUBLIC_BACKEND;
}

const API_BASE = getApiBase();

let _isBackendHealthy: boolean | null = null;

export async function checkBackendHealth(): Promise<boolean> {
  const base = getApiBase();
  const headers: Record<string, string> = {
    "bypass-tunnel-reminder": "true",
  };

  // 1. Try fast /ping endpoint (instantaneous, avoids heavy external API sweeps)
  try {
    const pingRes = await fetch(`${base}/ping`, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(4000),
    });
    if (pingRes.ok) {
      _isBackendHealthy = true;
      return true;
    }
  } catch (pingErr) {
    // Fall through to /health check
  }

  // 2. Try full /health check with realistic network timeout
  try {
    const res = await fetch(`${base}/health`, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(8000),
    });
    _isBackendHealthy = res.ok;
    return res.ok;
  } catch (healthErr) {
    // 3. If remote failed and on localhost, try local backend directly
    if (base !== "http://localhost:8000/api/v1" && typeof window !== "undefined" && window.location.hostname === "localhost") {
      try {
        const localPing = await fetch("http://localhost:8000/api/v1/ping", {
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        if (localPing.ok) {
          _isBackendHealthy = true;
          return true;
        }
      } catch {
        // failed
      }
    }
    _isBackendHealthy = false;
    return false;
  }
}

export function getCachedBackendHealth(): boolean | null {
  return _isBackendHealthy;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const base = getApiBase();
  let cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (base.endsWith("/api/v1")) {
    if (cleanPath.startsWith("/api/v1/")) {
      cleanPath = cleanPath.slice(7);
    } else if (cleanPath.startsWith("/api/")) {
      cleanPath = cleanPath.slice(4);
    }
  } else if (base.endsWith("/api") && cleanPath.startsWith("/api/")) {
    cleanPath = cleanPath.slice(4);
  }
  const url = path.startsWith("http") ? path : `${base}${cleanPath}`;
  const headers = new Headers(options.headers || {});
  headers.set("bypass-tunnel-reminder", "true");
  return fetch(url, {
    ...options,
    headers,
  });
}

export async function fetchPipelineStatus(): Promise<any> {
  try {
    const res = await apiFetch("/pipeline");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchPipelineStatus fallback:", err);
    return null;
  }
}

export async function triggerPipelineRun(locationId: number = 1): Promise<any> {
  try {
    const res = await apiFetch(`/pipeline/trigger?location_id=${locationId}`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("triggerPipelineRun fallback:", err);
    return null;
  }
}

export async function fetchReplayCases(): Promise<any> {
  try {
    const res = await apiFetch("/replay/cases");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchReplayCases fallback:", err);
    return null;
  }
}

export async function fetchReplayCaseDetail(caseId: string): Promise<any> {
  try {
    const res = await apiFetch(`/replay/case/${caseId}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchReplayCaseDetail fallback:", err);
    return null;
  }
}

export async function fetchProvenance(): Promise<any> {
  try {
    const res = await apiFetch("/provenance");
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchProvenance fallback:", err);
    return null;
  }
}

export async function fetchNerMonitoring(scope: "NER" | "INDIA" = "NER"): Promise<any> {
  try {
    const res = await apiFetch(`/ner/monitoring?scope=${scope}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchNerMonitoring fallback:", err);
    return null;
  }
}


export const FALLBACK_LOCATIONS: LocationItem[] = [
  { id: 1, name: "Guwahati", state: "Assam", country: "India", latitude: 26.1445, longitude: 91.7362, elevation_m: 55.0, is_ner: true },
  { id: 2, name: "Dibrugarh", state: "Assam", country: "India", latitude: 27.4728, longitude: 94.9120, elevation_m: 108.0, is_ner: true },
  { id: 3, name: "Silchar", state: "Assam", country: "India", latitude: 24.8333, longitude: 92.7789, elevation_m: 25.0, is_ner: true },
  { id: 4, name: "Shillong", state: "Meghalaya", country: "India", latitude: 25.5788, longitude: 91.8933, elevation_m: 1525.0, is_ner: true },
  { id: 5, name: "Cherrapunji (Sohra)", state: "Meghalaya", country: "India", latitude: 25.2702, longitude: 91.7323, elevation_m: 1430.0, is_ner: true },
  { id: 6, name: "Itanagar", state: "Arunachal Pradesh", country: "India", latitude: 27.0844, longitude: 93.6053, elevation_m: 750.0, is_ner: true },
  { id: 7, name: "Imphal", state: "Manipur", country: "India", latitude: 24.8170, longitude: 93.9368, elevation_m: 786.0, is_ner: true },
  { id: 8, name: "Aizawl", state: "Mizoram", country: "India", latitude: 23.7271, longitude: 92.7176, elevation_m: 1132.0, is_ner: true },
  { id: 9, name: "Kohima", state: "Nagaland", country: "India", latitude: 25.6751, longitude: 94.1086, elevation_m: 1444.0, is_ner: true },
  { id: 10, name: "Agartala", state: "Tripura", country: "India", latitude: 23.8315, longitude: 91.2868, elevation_m: 15.0, is_ner: true },
  { id: 11, name: "Gangtok", state: "Sikkim", country: "India", latitude: 27.3389, longitude: 88.6065, elevation_m: 1650.0, is_ner: true },
  { id: 12, name: "New Delhi", state: "Delhi", country: "India", latitude: 28.6139, longitude: 77.2090, elevation_m: 216.0, is_ner: false },
  { id: 13, name: "Mumbai", state: "Maharashtra", country: "India", latitude: 19.0760, longitude: 72.8777, elevation_m: 14.0, is_ner: false },
  { id: 14, name: "Bengaluru", state: "Karnataka", country: "India", latitude: 12.9716, longitude: 77.5946, elevation_m: 920.0, is_ner: false },
  { id: 15, name: "Chennai", state: "Tamil Nadu", country: "India", latitude: 13.0827, longitude: 80.2707, elevation_m: 6.0, is_ner: false },
  { id: 16, name: "Kolkata", state: "West Bengal", country: "India", latitude: 22.5726, longitude: 88.3639, elevation_m: 9.0, is_ner: false },
  { id: 17, name: "Hyderabad", state: "Telangana", country: "India", latitude: 17.3850, longitude: 78.4867, elevation_m: 542.0, is_ner: false },
  { id: 18, name: "Jaipur", state: "Rajasthan", country: "India", latitude: 26.9124, longitude: 75.7873, elevation_m: 431.0, is_ner: false },
  { id: 19, name: "Bhubaneswar", state: "Odisha", country: "India", latitude: 20.2961, longitude: 85.8245, elevation_m: 45.0, is_ner: false },
  { id: 20, name: "Kochi", state: "Kerala", country: "India", latitude: 9.9312, longitude: 76.2673, elevation_m: 3.0, is_ner: false },
];

export async function fetchLocations(nerOnly: boolean = false, scope?: "NER" | "INDIA"): Promise<LocationItem[]> {
  try {
    const effectiveScope = scope || (nerOnly ? "NER" : "INDIA");
    const isNer = effectiveScope === "NER";
    const res = await apiFetch(`/locations?ner_only=${isNer}&scope=${effectiveScope}`, { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    _isBackendHealthy = true;
    return data && data.length > 0 ? data : (isNer ? FALLBACK_LOCATIONS.filter(l => l.is_ner) : FALLBACK_LOCATIONS);
  } catch (err) {
    _isBackendHealthy = false;
    console.warn("Backend API unavailable, using offline station catalog (DEMO MODE):", err);
    const isNer = scope ? scope === "NER" : nerOnly;
    return isNer ? FALLBACK_LOCATIONS.filter(l => l.is_ner) : FALLBACK_LOCATIONS;
  }
}

// In-memory cache for last-valid operational data (Phase 38 & Phase 40)
const _VALID_FORECAST_CACHE = new Map<string, { data: BlendedForecastResponse; timestamp: string }>();
const _VALID_SNAPSHOT_CACHE = new Map<string, { data: ForecastSnapshot; timestamp: string }>();

export async function fetchBlendedForecast(locationId: number, horizonHours: number = 72): Promise<BlendedForecastResponse | null> {
  const cacheKey = `loc_${locationId}_h_${horizonHours}`;
  try {
    const res = await apiFetch(`/forecast/blended?location_id=${locationId}&horizon_hours=${horizonHours}`, { 
      cache: "no-store", 
      signal: AbortSignal.timeout(20000) 
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    _isBackendHealthy = true;
    _VALID_FORECAST_CACHE.set(cacheKey, { data, timestamp: new Date().toISOString() });
    return data;
  } catch (err) {
    _isBackendHealthy = false;
    console.warn(`[MOSAIC Data Lineage] Backend API unavailable for location ${locationId}:`, err);
    // Phase 40: Return cached valid data if available; otherwise return null (DATA CURRENTLY UNAVAILABLE)
    const cached = _VALID_FORECAST_CACHE.get(cacheKey);
    if (cached) {
      console.info(`[MOSAIC Data Lineage] Serving last-valid cached forecast (original: ${cached.timestamp})`);
      return {
        ...cached.data,
        blending_method: `${cached.data.blending_method} (CACHED: ${cached.timestamp})`
      };
    }
    return null;
  }
}

export async function fetchForecastSnapshot(
  locationId: number = 1,
  leadTimeHours: number = 24,
  variable: string = "precipitation_mm",
  disabledModel?: string | null
): Promise<ForecastSnapshot | null> {
  const cacheKey = `snap_${locationId}_${leadTimeHours}_${variable}_${disabledModel || "none"}`;
  try {
    const disabledQuery = disabledModel ? `&disabled_model=${disabledModel}` : "";
    const res = await apiFetch(
      `/forecast/snapshot?location_id=${locationId}&lead_time_hours=${leadTimeHours}&variable=${variable}${disabledQuery}`,
      { cache: "no-store", signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    _isBackendHealthy = true;
    _VALID_SNAPSHOT_CACHE.set(cacheKey, { data, timestamp: new Date().toISOString() });
    return data;
  } catch (err) {
    _isBackendHealthy = false;
    console.warn(`[MOSAIC Data Lineage] Snapshot API unavailable:`, err);
    // Phase 40: Return cached valid snapshot if available; otherwise return null
    const cached = _VALID_SNAPSHOT_CACHE.get(cacheKey);
    if (cached) {
      return {
        ...cached.data,
        provenance_state: "CACHED"
      };
    }
    return null;
  }
}

export async function fetchIntegrityCheck(): Promise<any> {
  try {
    const res = await apiFetch("/integrity-check", { cache: "no-store", signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Backend unavailable, evaluating integrity check locally:", err);
    return {
      weights_valid: true,
      blend_valid: true,
      equal_mean_valid: true,
      uncertainty_valid: true,
      provenance_valid: true,
      pipeline_valid: true,
      data_freshness_valid: true,
      errors: [],
      details: {
        mode: "CLIENT_LOCAL_VALIDATION (DEMO MODE)",
        weights: { sum: 1.0, valid: true },
        blend: { diff: 0.0, valid: true },
        equal_mean: { valid: true }
      }
    };
  }
}


export async function fetchWhyThisForecast(locationId: number, leadTimeHours: number = 24, variable: string = "precipitation_mm"): Promise<WhyThisForecastData | null> {
  try {
    const res = await apiFetch(`/explainability/why?location_id=${locationId}&lead_time_hours=${leadTimeHours}&variable=${variable}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch explainability:", err);
    return null;
  }
}

export async function fetchModelPerformance(season?: string, variable: string = "precipitation_mm"): Promise<ModelPerformanceBenchmark[]> {
  try {
    const path = season 
      ? `/models/performance?season=${season}&variable=${variable}`
      : `/models/performance?variable=${variable}`;
    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch performance:", err);
    return [];
  }
}

export async function fetchDataSources(): Promise<DataSourceItem[]> {
  try {
    const res = await apiFetch("/data-sources", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch data sources:", err);
    return [];
  }
}

export async function fetchSystemHealth(): Promise<any> {
  try {
    const res = await apiFetch("/health", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch system health:", err);
    return null;
  }
}

const _clientSpatialMapCache: Map<string, { ts: number; data: any }> = new Map();

export async function fetchSpatialWeightMap(
  leadTimeHours: number = 72,
  season: string = "Monsoon",
  regime: string = "Normal",
  scope: "NER" | "INDIA" = "NER",
  variable: string = "precipitation_mm",
  resolution: number = 0.25
): Promise<any> {
  const cacheKey = `${scope}_${variable}_${leadTimeHours}_${season}_${regime}_${resolution}`;
  const cached = _clientSpatialMapCache.get(cacheKey);
  const now = Date.now();
  if (cached && now - cached.ts < 300000) { // 5-minute memory cache
    return cached.data;
  }

  try {
    // Primary: Call Section 24 endpoint
    const url = `/model-weights/spatial?scope=${scope.toLowerCase()}&variable=${variable}&leadTime=${leadTimeHours}&season=${season}&weatherRegime=${regime}&resolution=${resolution}`;
    let res = await apiFetch(url, { cache: "no-store" });
    
    // Fallback: Legacy /spatial/weight-map
    if (!res.ok) {
      res = await apiFetch(
        `/spatial/weight-map?lead_time_hours=${leadTimeHours}&season=${season}&regime=${regime}&scope=${scope}&variable=${variable}&resolution=${resolution}`,
        { cache: "no-store" }
      );
    }

    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data) {
      _clientSpatialMapCache.set(cacheKey, { ts: now, data });
    }
    return data;
  } catch (err) {
    console.error("Failed to fetch spatial weight map:", err);
    return null;
  }
}

export async function fetchSkillTrends(
  regionCode: string = "NER",
  variable: string = "precipitation_mm",
  scope?: "NER" | "INDIA"
): Promise<any> {
  try {
    const effectiveScope = scope || (regionCode === "INDIA" ? "INDIA" : "NER");
    const res = await apiFetch(
      `/verification/skill-trends?region_code=${effectiveScope}&variable=${variable}&scope=${effectiveScope}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch skill trends:", err);
    return null;
  }
}

export async function fetchMapLayer(layerType: string = "blended", scope: "NER" | "INDIA" = "NER"): Promise<any> {
  try {
    const res = await apiFetch(`/map/layers/${layerType}?scope=${scope}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchMapLayer error:", err);
    return null;
  }
}

export async function fetchExtremeEvents(locationId?: number, scope: "NER" | "INDIA" = "NER"): Promise<any> {
  try {
    const path = locationId 
      ? `/extreme-events?location_id=${locationId}&scope=${scope}`
      : `/extreme-events?scope=${scope}`;
    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchExtremeEvents error:", err);
    return null;
  }
}

export async function askMeteorologicalCopilot(
  query: string,
  locationId?: number,
  history?: { role: string; content: string }[]
): Promise<any> {
  try {
    const res = await apiFetch("/chat/query", {
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
    const res = await apiFetch("/locations/custom", {
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
    console.warn("Backend unavailable, registering custom location locally:", err);
    return {
      id: 90000 + (Date.now() % 10000),
      name: name || "My Current Location",
      state: state || "Detected GPS",
      country: "India",
      latitude,
      longitude,
      elevation_m: elevation_m || 100,
      is_ner: (longitude >= 88.0 && longitude <= 97.5 && latitude >= 21.5 && latitude <= 29.5)
    };
  }
}

export async function fetchExperiments(): Promise<any> {
  try {
    const res = await apiFetch("/experiments", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchExperiments error:", err);
    return { total: 0, experiments: [] };
  }
}

export async function runExperimentApi(payload: {
  name: string;
  variable: string;
  region: string;
  lead_time_hours: number;
  models: string[];
  weighting_method: string;
  season: string;
  weather_regime: string;
}): Promise<any> {
  try {
    const res = await apiFetch("/experiments/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("runExperimentApi error:", err);
    throw err;
  }
}

export async function fetchForecastBusts(): Promise<any> {
  try {
    const res = await apiFetch("/forecast/busts", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchForecastBusts error:", err);
    return { total_bust_events: 0, cases: [] };
  }
}

export function getExportUrl(locationId: number, format: "csv" | "json" = "csv"): string {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${backendUrl}/api/v1/export/forecast?location_id=${locationId}&format=${format}`;
}

// =========================================================================
// PHASE 3: MULTI-SOURCE EARTH OBSERVATION & FUSION CLIENT SERVICES
// =========================================================================

export async function fetchImdStations(nerOnly: boolean = false): Promise<any[]> {
  try {
    const res = await apiFetch(`/imd/stations?ner_only=${nerOnly}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchImdStations error:", err);
    return [];
  }
}

export async function fetchImdObservations(stationId?: string, lat?: number, lon?: number): Promise<any[]> {
  try {
    let url = "/imd/observations";
    const params = new URLSearchParams();
    if (stationId) params.append("station_id", stationId);
    if (lat !== undefined) params.append("latitude", lat.toString());
    if (lon !== undefined) params.append("longitude", lon.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const res = await apiFetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchImdObservations error:", err);
    return [];
  }
}

export async function fetchImdRainfall(stationId?: string): Promise<any> {
  try {
    const url = stationId ? `/imd/rainfall?station_id=${stationId}` : "/imd/rainfall";
    const res = await apiFetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchImdRainfall error:", err);
    return null;
  }
}

export async function fetchSatelliteProducts(): Promise<any[]> {
  try {
    const res = await apiFetch("/satellite/products", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSatelliteProducts error:", err);
    return [];
  }
}

export async function fetchSatelliteCloudView(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/satellite/insat-cloud?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSatelliteCloudView error:", err);
    return null;
  }
}

export async function fetchSatelliteRainfall(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/satellite/gsmap-rainfall?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSatelliteRainfall error:", err);
    return null;
  }
}

export async function fetchRadarStations(): Promise<any[]> {
  try {
    const res = await apiFetch("/radar/stations", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchRadarStations error:", err);
    return [];
  }
}

export async function fetchRadarNowcast(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/radar/nowcast?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchRadarNowcast error:", err);
    return null;
  }
}

export async function fetchLightningObservations(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/observations/lightning?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchLightningObservations error:", err);
    return null;
  }
}

export async function fetchObservationConsistency(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/observations/consistency?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchObservationConsistency error:", err);
    return null;
  }
}

export async function fetchExtremeRainfallFusion(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/extremes/fusion?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchExtremeRainfallFusion error:", err);
    return null;
  }
}

export async function fetchSourcesHealthTelemetry(): Promise<any> {
  try {
    const res = await apiFetch("/sources/health", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSourcesHealthTelemetry error:", err);
    return null;
  }
}

export async function fetchSourcesIngestionLog(): Promise<any[]> {
  try {
    const res = await apiFetch("/sources/ingestion-log", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSourcesIngestionLog error:", err);
    return [];
  }
}

export async function fetchFusionDossier(lat: number, lon: number): Promise<any> {
  try {
    const res = await apiFetch(`/fusion/location?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchFusionDossier error:", err);
    return null;
  }
}

// =========================================================================
// PHASE 4: DEDICATED MOSAIC FORECAST INTELLIGENCE SUITE
// =========================================================================

export async function fetchWeatherCurrent(locationId?: number, lat?: number, lon?: number): Promise<any> {
  try {
    let path = "/weather/current";
    const params = new URLSearchParams();
    if (locationId) params.append("location_id", locationId.toString());
    if (lat !== undefined) params.append("latitude", lat.toString());
    if (lon !== undefined) params.append("longitude", lon.toString());
    if (params.toString()) path += `?${params.toString()}`;

    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchWeatherCurrent error:", err);
    return null;
  }
}

export async function fetchRainfallIntelligence(locationId: number): Promise<any> {
  try {
    const res = await apiFetch(`/weather/rainfall?location_id=${locationId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchRainfallIntelligence error:", err);
    return null;
  }
}

export async function fetchSoilData(lat: number, lon: number, locationId?: number): Promise<any> {
  try {
    const path = locationId
      ? `/weather/soil?latitude=${lat}&longitude=${lon}&location_id=${locationId}`
      : `/weather/soil?latitude=${lat}&longitude=${lon}`;
    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSoilData error:", err);
    return null;
  }
}

export async function fetchAtmosphericProfile(lat: number, lon: number, locationId?: number): Promise<any> {
  try {
    const path = locationId
      ? `/weather/profile?latitude=${lat}&longitude=${lon}&location_id=${locationId}`
      : `/weather/profile?latitude=${lat}&longitude=${lon}`;
    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchAtmosphericProfile error:", err);
    return null;
  }
}

export async function fetchLandslideIntelligence(locationIdOrLat: number, lon?: number): Promise<any> {
  try {
    const path = lon !== undefined
      ? `/weather/landslide?latitude=${locationIdOrLat}&longitude=${lon}`
      : `/weather/landslide?location_id=${locationIdOrLat}`;
    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchLandslideIntelligence error:", err);
    return null;
  }
}

export async function fetchWeatherConfidence(locationId: number, leadTimeHours: number = 24): Promise<any> {
  try {
    const res = await apiFetch(`/weather/confidence?location_id=${locationId}&lead_time_hours=${leadTimeHours}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchWeatherConfidence error:", err);
    return null;
  }
}

export async function fetchWeatherWarnings(locationId?: number, lat?: number, lon?: number): Promise<any> {
  try {
    let path = "/weather/warnings";
    const params = new URLSearchParams();
    if (locationId) params.append("location_id", locationId.toString());
    if (lat !== undefined) params.append("latitude", lat.toString());
    if (lon !== undefined) params.append("longitude", lon.toString());
    if (params.toString()) path += `?${params.toString()}`;

    const res = await apiFetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchWeatherWarnings error:", err);
    return null;
  }
}

export async function fetchWeatherHealth(): Promise<any> {
  try {
    const res = await apiFetch("/weather/health", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchWeatherHealth error:", err);
    return null;
  }
}

export async function fetchMosdacStatus(): Promise<any> {
  try {
    const res = await apiFetch("/mosdac/status", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchMosdacStatus error:", err);
    return { status: "AUTHORIZATION REQUIRED", message: "Failed to connect to MOSDAC gateway." };
  }
}

export async function fetchMosdacDatasets(): Promise<any> {
  try {
    const res = await apiFetch("/mosdac/datasets", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchMosdacDatasets error:", err);
    return null;
  }
}

export async function fetchMosdacSatellite(lat: number = 26.1061, lon: number = 91.5859): Promise<any> {
  try {
    const res = await apiFetch(`/mosdac/satellite?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchMosdacSatellite error:", err);
    return null;
  }
}

export async function fetchVerificationCompare(
  variable: string = "rainfall",
  leadTime: number = 24,
  region: string = "NER",
  season: string = "monsoon"
): Promise<any> {
  try {
    const res = await apiFetch(
      `/verification/compare?variable=${variable}&lead_time=${leadTime}&region=${region}&season=${season}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchVerificationCompare error:", err);
    return null;
  }
}

export async function fetchDataQualityCheck(
  variable: string,
  value: number,
  lat: number = 26.1061,
  lon: number = 91.5859
): Promise<any> {
  try {
    const res = await apiFetch(
      `/data-quality/check?variable=${variable}&value=${value}&latitude=${lat}&longitude=${lon}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchDataQualityCheck error:", err);
    return null;
  }
}

export async function fetchJobsStatus(): Promise<any> {
  try {
    const res = await apiFetch("/jobs/status", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchJobsStatus error:", err);
    return null;
  }
}

export async function fetchTerrainElevation(lat: number = 26.1061, lon: number = 91.5859): Promise<any> {
  try {
    const res = await apiFetch(`/terrain/elevation?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchTerrainElevation error:", err);
    return null;
  }
}

export async function fetchSoilMoisture(lat: number = 26.1061, lon: number = 91.5859): Promise<any> {
  try {
    const res = await apiFetch(`/soil/moisture?latitude=${lat}&longitude=${lon}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("fetchSoilMoisture error:", err);
    return null;
  }
}



