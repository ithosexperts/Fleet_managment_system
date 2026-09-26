/**
 * Road Routing & Geometry Service (Mapbox Directions API with OSRM & Haversine Fallback)
 * Fetches high-precision road-snapped geometry, road distance, and travel duration.
 * Normalized coordinates format: NormalizedCoord ({ lat: number, lng: number }).
 */

import { NormalizedCoord, toLngLat, RouteGeometryResult } from '../components/map/types';

export type { RouteGeometryResult };

const routeCache = new Map<string, RouteGeometryResult>();

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type WaypointInput =
  | NormalizedCoord
  | { latitude: number; longitude: number }
  | { lat: number; lng: number };

function normalizePoint(p: WaypointInput): NormalizedCoord | null {
  const lat = 'lat' in p ? p.lat : (p as any).latitude;
  const lng = 'lng' in p ? p.lng : (p as any).longitude;
  if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

export async function fetchRoadRoute(
  waypoints: WaypointInput[]
): Promise<RouteGeometryResult> {
  const validPoints: NormalizedCoord[] = [];
  for (const wp of waypoints) {
    const pt = normalizePoint(wp);
    if (pt) validPoints.push(pt);
  }

  if (validPoints.length < 2) {
    return {
      coordinates: validPoints,
      distanceKm: 0,
      durationMinutes: 0,
      isRealRoad: false,
      legs: []
    };
  }

  // Generate cache key
  const cacheKey = validPoints.map((p) => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join(';');
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Coordinates string for Mapbox & OSRM: lng,lat;lng,lat
  const coordString = validPoints.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
  const mapboxToken = (import.meta.env.VITE_MAPBOX_TOKEN || '').trim();

  // 1. Try Mapbox Directions API if token exists
  if (mapboxToken && !mapboxToken.includes('your-public')) {
    try {
      const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&steps=false&access_token=${mapboxToken}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(mapboxUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // Mapbox geometry coordinates are [lng, lat]; convert to NormalizedCoord { lat, lng }
          const coordinates: NormalizedCoord[] = route.geometry.coordinates.map(
            (c: [number, number]) => ({ lat: c[1], lng: c[0] })
          );
          const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
          const durationMinutes = Math.round(route.duration / 60);

          const legs = (route.legs || []).map((leg: any) => ({
            distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
            durationMinutes: Math.round(leg.duration / 60)
          }));

          const result: RouteGeometryResult = {
            coordinates,
            distanceKm,
            durationMinutes,
            isRealRoad: true,
            legs
          };

          routeCache.set(cacheKey, result);
          return result;
        }
      }
    } catch {
      // Fall through to OSRM on Mapbox timeout or network error
    }
  }

  // 2. Try OSRM open routing engine fallback
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates: NormalizedCoord[] = route.geometry.coordinates.map(
          (c: [number, number]) => ({ lat: c[1], lng: c[0] })
        );
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMinutes = Math.round(route.duration / 60);

        const legs = (route.legs || []).map((leg: any) => ({
          distanceKm: Math.round((leg.distance / 1000) * 10) / 10,
          durationMinutes: Math.round(leg.duration / 60)
        }));

        const result: RouteGeometryResult = {
          coordinates,
          distanceKm,
          durationMinutes,
          isRealRoad: true,
          legs
        };

        routeCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {
    // Network drop or timeout — fallback gracefully to straight lines
  }

  // 3. Fallback: Haversine distance estimation along straight lines
  let totalKm = 0;
  const legs: Array<{ distanceKm: number; durationMinutes: number }> = [];
  for (let i = 0; i < validPoints.length - 1; i++) {
    const d = haversineKm(
      validPoints[i].lat,
      validPoints[i].lng,
      validPoints[i + 1].lat,
      validPoints[i + 1].lng
    );
    totalKm += d;
    // Assume average commercial fleet road speed of ~38 km/h in urban corridors
    legs.push({
      distanceKm: Math.round(d * 10) / 10,
      durationMinutes: Math.round((d / 38) * 60)
    });
  }

  const fallbackResult: RouteGeometryResult = {
    coordinates: validPoints,
    distanceKm: Math.round(totalKm * 10) / 10,
    durationMinutes: Math.round((totalKm / 38) * 60),
    isRealRoad: false,
    legs
  };

  routeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}
