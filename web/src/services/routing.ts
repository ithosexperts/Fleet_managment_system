/**
 * OSRM Road Routing & Geometry Service (Ola Maps / Turn-by-Turn Visualizer)
 * Fetches real road-snapped geometry, road distance, and travel duration.
 * Falls back to haversine interpolation if offline or network drops.
 */

export interface RouteGeometryResult {
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  distanceKm: number;
  durationMinutes: number;
  isRealRoad: boolean;
  legs: Array<{
    distanceKm: number;
    durationMinutes: number;
  }>;
}

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

export async function fetchRoadRoute(
  waypoints: Array<{ latitude: number; longitude: number }>
): Promise<RouteGeometryResult> {
  const validPoints = waypoints.filter(
    (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  if (validPoints.length < 2) {
    const coords: [number, number][] = validPoints.map((p) => [p.latitude, p.longitude]);
    return {
      coordinates: coords,
      distanceKm: 0,
      durationMinutes: 0,
      isRealRoad: false,
      legs: []
    };
  }

  // Generate cache key
  const cacheKey = validPoints.map((p) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`).join(';');
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // Build OSRM coordinates query: lng,lat;lng,lat
  const coordString = validPoints.map((p) => `${p.longitude.toFixed(6)},${p.latitude.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson&steps=false`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000); // 4s timeout for fast UI response

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM coordinates are [lng, lat]; convert to Leaflet [lat, lng]
        const coordinates: [number, number][] = route.geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
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

  // Fallback: Haversine distance estimation along straight lines
  let totalKm = 0;
  const legs: Array<{ distanceKm: number; durationMinutes: number }> = [];
  for (let i = 0; i < validPoints.length - 1; i++) {
    const d = haversineKm(
      validPoints[i].latitude,
      validPoints[i].longitude,
      validPoints[i + 1].latitude,
      validPoints[i + 1].longitude
    );
    totalKm += d;
    // Assume average commercial fleet road speed of ~38 km/h in urban corridors
    legs.push({
      distanceKm: Math.round(d * 10) / 10,
      durationMinutes: Math.round((d / 38) * 60)
    });
  }

  const fallbackResult: RouteGeometryResult = {
    coordinates: validPoints.map((p) => [p.latitude, p.longitude]),
    distanceKm: Math.round(totalKm * 10) / 10,
    durationMinutes: Math.round((totalKm / 38) * 60),
    isRealRoad: false,
    legs
  };

  routeCache.set(cacheKey, fallbackResult);
  return fallbackResult;
}
