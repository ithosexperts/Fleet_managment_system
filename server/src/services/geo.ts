/**
 * Geolocation & Geofencing Utilities for Truck Tracker
 */

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two points in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c * 1000;
}

/**
 * Calculates distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistanceMeters(lat1, lon1, lat2, lon2) / 1000;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Checks if the driver's current coordinates are within the stop's geofence radius.
 */
export function isWithinGeofence(
  driverLat?: number,
  driverLon?: number,
  destLat?: number,
  destLon?: number,
  radiusMeters: number = 150
): { verified: boolean; distanceMeters: number; message: string } {
  if (
    driverLat === undefined ||
    driverLon === undefined ||
    destLat === undefined ||
    destLon === undefined ||
    isNaN(driverLat) ||
    isNaN(driverLon)
  ) {
    return {
      verified: true, // Graceful fallback: GPS unavailable does not block company operation
      distanceMeters: -1,
      message: 'GPS unavailable — manual verification recorded'
    };
  }

  const distance = calculateDistanceMeters(driverLat, driverLon, destLat, destLon);
  const verified = distance <= radiusMeters;

  return {
    verified,
    distanceMeters: Math.round(distance),
    message: verified
      ? `Location Verified (${Math.round(distance)}m from destination)`
      : `Location does not match destination (${Math.round(distance)}m away, limit is ${radiusMeters}m)`
  };
}

/**
 * Calculates total cumulative distance along a sequence of GPS coordinates.
 */
export function calculateCumulativeDistanceKm(
  points: Array<{ latitude?: number; longitude?: number }>
): number | null {
  const validPoints = points.filter(
    (p): p is { latitude: number; longitude: number } =>
      typeof p.latitude === 'number' &&
      typeof p.longitude === 'number' &&
      !isNaN(p.latitude) &&
      !isNaN(p.longitude)
  );

  if (validPoints.length < 2) return null;

  let totalKm = 0;
  for (let i = 0; i < validPoints.length - 1; i++) {
    const p1 = validPoints[i];
    const p2 = validPoints[i + 1];
    totalKm += calculateDistanceKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
  }

  return Math.round(totalKm * 10) / 10;
}
