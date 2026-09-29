/**
 * Geospatial Normalization & Mapbox Core Type System
 * Guarantees consistent { lat, lng } structure across UI, Routing, Geocoding, and Mapbox boundaries.
 */

export interface NormalizedCoord {
  lat: number;
  lng: number;
}

export type MapTheme = 'dark' | 'light' | 'streets' | 'satellite' | 'navigation';

export interface RouteLeg {
  distanceKm: number;
  durationMinutes: number;
}

export interface RouteGeometryResult {
  coordinates: NormalizedCoord[];
  distanceKm: number;
  durationMinutes: number;
  isRealRoad: boolean;
  legs: RouteLeg[];
}

export interface MapMarkerData {
  id: string;
  coord: NormalizedCoord;
  title?: string;
  type?: 'base' | 'stop' | 'vehicle' | 'custom' | 'event';
  color?: string;
}

export interface VehicleMarkerData {
  id: string;
  vehicle_number: string;
  model: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE';
  coord: NormalizedCoord;
  heading?: number;
  speedKmh?: number;
  driverName?: string;
}

export interface StopMarkerData {
  id: string;
  stopNumber: number;
  name: string;
  address: string;
  coord: NormalizedCoord;
  status: 'PENDING' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'FAILED';
  plannedTime?: string;
  actualTime?: string;
  geofenceRadiusMeters?: number;
}

// -----------------------------------------------------------------------------
// Coordinate Normalization & Validation Utilities
// -----------------------------------------------------------------------------

export function isValidCoord(coord?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null): boolean {
  if (!coord) return false;
  const lat = typeof coord.lat === 'number' ? coord.lat : coord.latitude;
  const lng = typeof coord.lng === 'number' ? coord.lng : coord.longitude;
  return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function toNormalizedCoord(point?: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null): NormalizedCoord | null {
  if (!isValidCoord(point)) return null;
  const lat = typeof point!.lat === 'number' ? point!.lat! : point!.latitude!;
  const lng = typeof point!.lng === 'number' ? point!.lng! : point!.longitude!;
  return { lat, lng };
}

/**
 * Converts a normalized coordinate to Mapbox [lng, lat] coordinate format.
 */
export function toLngLat(coord: NormalizedCoord): [number, number] {
  return [coord.lng, coord.lat];
}

/**
 * Converts Mapbox [lng, lat] format back to normalized { lat, lng }.
 */
export function fromLngLat(lngLat: [number, number] | { lng: number; lat: number }): NormalizedCoord {
  if (Array.isArray(lngLat)) {
    return { lat: lngLat[1], lng: lngLat[0] };
  }
  return { lat: lngLat.lat, lng: lngLat.lng };
}

/**
 * Calculates Great-Circle distance in meters between two coordinates.
 */
export function haversineDistanceMeters(c1: NormalizedCoord, c2: NormalizedCoord): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (c1.lat * Math.PI) / 180;
  const phi2 = (c2.lat * Math.PI) / 180;
  const deltaPhi = ((c2.lat - c1.lat) * Math.PI) / 180;
  const deltaLambda = ((c2.lng - c1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates an approximated circle polygon coordinates in [lng, lat] format for geofence rendering.
 */
export function createGeofenceCirclePolygon(center: NormalizedCoord, radiusMeters: number, points = 48): [number, number][] {
  const coords: [number, number][] = [];
  const distanceX = radiusMeters / (111.32 * 1000 * Math.cos((center.lat * Math.PI) / 180));
  const distanceY = radiusMeters / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([center.lng + x, center.lat + y]);
  }
  coords.push(coords[0]); // Close polygon
  return coords;
}
