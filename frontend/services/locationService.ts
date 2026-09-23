import { LocationItem } from "@/types";
import { createCustomLocation } from "./api";

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  name: string;
  state: string;
}

/**
 * Acquire user location via Browser Geolocation API with automatic IP fallback.
 */
export async function detectUserCoordinates(): Promise<GeolocationResult> {
  // 1. Try High-Accuracy Browser Geolocation
  if (typeof window !== "undefined" && "geolocation" in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 60000
        });
      });

      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // Try reverse geocoding to get human-friendly city/area name
      let name = "My Current Location";
      let state = "GPS Detected";
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const city = geoData.address?.city || geoData.address?.town || geoData.address?.suburb || geoData.address?.village || geoData.address?.county;
          const st = geoData.address?.state || geoData.address?.country;
          if (city) name = `📍 ${city}`;
          if (st) state = st;
        }
      } catch (err) {
        console.warn("Reverse geocode warning:", err);
      }

      return { latitude: lat, longitude: lon, name, state };
    } catch (geoError: any) {
      console.warn("Browser GPS unavailable or denied, falling back to IP geolocation:", geoError.message);
    }
  }

  // 2. Fallback: IP-based Geolocation
  try {
    const ipRes = await fetch("https://ipwho.is/");
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      if (ipData.success && ipData.latitude && ipData.longitude) {
        return {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          name: `📍 ${ipData.city || "My Location"} (IP)`,
          state: ipData.region || ipData.country || "Detected"
        };
      }
    }
  } catch (ipErr) {
    console.warn("IP Geolocation fallback failed:", ipErr);
  }

  // 3. Ultimate default (New Delhi / NCR)
  return {
    latitude: 28.6139,
    longitude: 77.2090,
    name: "📍 New Delhi (Default)",
    state: "Delhi"
  };
}

/**
 * Detect user location, register with MOSAIC backend, and return LocationItem.
 */
export async function addAndFetchMyLocation(): Promise<LocationItem | null> {
  const coords = await detectUserCoordinates();
  const loc = await createCustomLocation(
    coords.latitude,
    coords.longitude,
    coords.name,
    coords.state
  );
  return loc;
}

/**
 * Haversine distance in meters between two coordinates.
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Continuous high-precision GPS tracking with browser watchPosition.
 * Automatically updates coordinates and re-fetches live weather as user moves.
 */
export function startLiveGpsTracking(
  onLocationUpdate: (loc: LocationItem, accuracy: number, heading?: number | null) => void,
  onError?: (error: GeolocationPositionError) => void
): () => void {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return () => {};
  }

  let lastRegisteredLat: number | null = null;
  let lastRegisteredLon: number | null = null;
  let isRegistering = false;

  const watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const { latitude, longitude, accuracy, heading } = pos.coords;

      const distance = lastRegisteredLat !== null && lastRegisteredLon !== null
        ? getDistanceMeters(lastRegisteredLat, lastRegisteredLon, latitude, longitude)
        : Infinity;

      if (distance > 40 && !isRegistering) {
        isRegistering = true;
        try {
          const loc = await createCustomLocation(
            latitude,
            longitude,
            "📍 My Live Location (GPS)",
            "Active Tracking"
          );
          if (loc) {
            lastRegisteredLat = latitude;
            lastRegisteredLon = longitude;
            onLocationUpdate(loc, accuracy, heading);
          }
        } catch (e) {
          console.warn("Live GPS update registration failed:", e);
        } finally {
          isRegistering = false;
        }
      }
    },
    (err) => {
      console.warn("GPS watchPosition error:", err);
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 10000
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
