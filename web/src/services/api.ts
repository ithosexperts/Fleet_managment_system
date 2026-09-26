import { offlineQueue } from './offlineQueue';
import { Trip, Destination } from '../types';

export const getApiBase = (): string => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('truck_tracker_custom_api');
    if (custom) return custom.replace(/\/$/, '');
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

export const API_BASE = getApiBase();

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('truck_tracker_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface GpsPositionResult {
  latitude: number;
  longitude: number;
  gps_accuracy: number;
  isReal: boolean;
  timestamp?: number;
  error?: string;
}

/**
 * Capture real device GPS coordinates with accuracy, dual-tier fallback, and guaranteed timeout
 */
export async function getCurrentGpsPosition(options?: {
  timeoutMs?: number;
  preferHighAccuracy?: boolean;
}): Promise<GpsPositionResult> {
  const timeout = options?.timeoutMs || 8000;

  // Retrieve cached real fix if available
  let cachedFix: GpsPositionResult | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('tt_last_real_gps');
      if (stored) cachedFix = JSON.parse(stored);
    } catch {}
  }

  const defaultCoords: GpsPositionResult = cachedFix || {
    latitude: 28.5355,
    longitude: 77.2680,
    gps_accuracy: 25,
    isReal: false
  };

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return defaultCoords;
  }

  return new Promise((resolve) => {
    let resolved = false;

    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({
          ...defaultCoords,
          error: 'Location request timed out. Using last known location.'
        });
      }
    }, timeout);

    // Attempt 1: High accuracy (hardware GPS)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(safetyTimer);
          const result: GpsPositionResult = {
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            gps_accuracy: Math.round(pos.coords.accuracy),
            isReal: true,
            timestamp: pos.timestamp
          };
          try {
            localStorage.setItem('tt_last_real_gps', JSON.stringify(result));
          } catch {}
          resolve(result);
        }
      },
      (err) => {
        // Attempt 2: Standard accuracy (cellular / WiFi network positioning)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(safetyTimer);
              const result: GpsPositionResult = {
                latitude: Number(pos.coords.latitude.toFixed(6)),
                longitude: Number(pos.coords.longitude.toFixed(6)),
                gps_accuracy: Math.round(pos.coords.accuracy),
                isReal: true,
                timestamp: pos.timestamp
              };
              try {
                localStorage.setItem('tt_last_real_gps', JSON.stringify(result));
              } catch {}
              resolve(result);
            }
          },
          (fallbackErr) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(safetyTimer);
              let errorMsg = 'Location unavailable';
              if (err.code === 1 || fallbackErr.code === 1) {
                errorMsg = 'Location permission denied by browser. Click site settings to allow location.';
              } else if (err.code === 3 || fallbackErr.code === 3) {
                errorMsg = 'GPS acquisition timed out.';
              }
              resolve({
                ...defaultCoords,
                isReal: false,
                error: errorMsg
              });
            }
          },
          { enableHighAccuracy: false, timeout: Math.max(3000, timeout - 2000), maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: Math.max(3000, timeout - 2000), maximumAge: 10000 }
    );
  });
}

function normalizeCoordinates<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(normalizeCoordinates) as any;
  const clone = { ...obj };
  if ('latitude' in clone && clone.latitude !== null && clone.latitude !== undefined) {
    clone.latitude = Number(clone.latitude);
  }
  if ('longitude' in clone && clone.longitude !== null && clone.longitude !== undefined) {
    clone.longitude = Number(clone.longitude);
  }
  if ('geofence_radius_meters' in clone && clone.geofence_radius_meters !== null && clone.geofence_radius_meters !== undefined) {
    clone.geofence_radius_meters = Number(clone.geofence_radius_meters);
  }
  if ('starting_latitude' in clone && clone.starting_latitude !== null && clone.starting_latitude !== undefined) {
    clone.starting_latitude = Number(clone.starting_latitude);
  }
  if ('starting_longitude' in clone && clone.starting_longitude !== null && clone.starting_longitude !== undefined) {
    clone.starting_longitude = Number(clone.starting_longitude);
  }
  if (Array.isArray(clone.stops)) {
    clone.stops = clone.stops.map(normalizeCoordinates);
  }
  if (Array.isArray(clone.events)) {
    clone.events = clone.events.map(normalizeCoordinates);
  }
  if (Array.isArray(clone.photos)) {
    clone.photos = clone.photos.map(normalizeCoordinates);
  }
  if (Array.isArray(clone.destinations)) {
    clone.destinations = clone.destinations.map(normalizeCoordinates);
  }
  if (Array.isArray(clone.trips)) {
    clone.trips = clone.trips.map(normalizeCoordinates);
  }
  return clone;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const currentBase = getApiBase();
  const url = `${currentBase}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };
  const isGet = !options.method || options.method === 'GET';
  const cacheKey = `truck_tracker_cache_${endpoint}`;

  try {
    const response = await fetch(url, { ...options, headers });
    let data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }

    data = normalizeCoordinates(data);

    // Cache successful GET responses in localStorage for offline access
    if (isGet && typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
      } catch {}
    }

    return data;
  } catch (error: any) {
    const isNetworkError =
      (typeof navigator !== 'undefined' && !navigator.onLine) ||
      error.name === 'TypeError' ||
      (error.message && (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')));

    // If GET request fails due to network drop, return cached local data if available
    if (isGet && isNetworkError && typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          console.warn(`[API Offline] Returning cached local data for ${endpoint}`);
          return parsed.data;
        }
      } catch {}
    }

    // If mutation request fails due to network drop or offline, store update in local device queue
    if (!isGet && isNetworkError) {
      const payload = options.body ? JSON.parse(options.body as string) : {};
      offlineQueue.enqueue(url, options.method || 'POST', payload);
      console.warn(`[OfflineQueue] Action stored in local device queue for ${endpoint}. Auto-syncing on reconnect.`);
      return { success: true, offline: true, message: 'Action saved locally on device. Will auto-sync to server when online.' } as any;
    }

    throw error;
  }
}

export const api = {
  auth: {
    login: async (body: { email: string; password: string }) => {
      return await request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
    },
    getMe: async () => {
      return await request('/auth/me');
    },
    getUsers: async () => {
      return await request('/auth/users');
    },
    createUser: async (userData: { name: string; email: string; password: string; phone?: string; role?: string }) => {
      return await request('/auth/users', { method: 'POST', body: JSON.stringify(userData) });
    },
    updateUser: async (id: string, userData: { name?: string; phone?: string; password?: string; role?: string }) => {
      return await request(`/auth/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
    },
    deleteUser: async (id: string) => {
      return await request(`/auth/users/${id}`, { method: 'DELETE' });
    }
  },

  driver: {
    getTodayTrips: async () => {
      try {
        return await request('/driver/trips/today');
      } catch {
        return { trips: [] };
      }
    },
    getActiveTrip: async () => {
      try {
        return await request('/driver/trips/active');
      } catch {
        return { trip: null };
      }
    },
    getTrip: async (id: string) => {
      return await request(`/driver/trips/${id}`);
    },
    startTrip: async (id: string, coords: any) => {
      return await request(`/driver/trips/${id}/start`, { method: 'POST', body: JSON.stringify(coords) });
    },
    arriveStop: async (id: string, stopId: string, coords: any) => {
      return await request(`/driver/trips/${id}/stops/${stopId}/arrive`, { method: 'POST', body: JSON.stringify(coords) });
    },
    completeActivity: async (id: string, stopId: string, data: any) => {
      return await request(`/driver/trips/${id}/stops/${stopId}/complete-activity`, { method: 'POST', body: JSON.stringify(data) });
    },
    departStop: async (id: string, stopId: string, coords: any) => {
      return await request(`/driver/trips/${id}/stops/${stopId}/depart`, { method: 'POST', body: JSON.stringify(coords) });
    },
    reportDelay: async (id: string, data: any) => {
      return await request(`/driver/trips/${id}/delay`, { method: 'POST', body: JSON.stringify(data) });
    },
    resolveDelay: async (id: string, delayId: string) => {
      return await request(`/driver/trips/${id}/delay/${delayId}/resolve`, { method: 'POST' });
    },
    startReturn: async (id: string, coords: any) => {
      return await request(`/driver/trips/${id}/start-return`, { method: 'POST', body: JSON.stringify(coords) });
    },
    arriveBase: async (id: string, coords: any) => {
      return await request(`/driver/trips/${id}/arrive-base`, { method: 'POST', body: JSON.stringify(coords) });
    },
    completeTrip: async (id: string, coords: any) => {
      return await request(`/driver/trips/${id}/complete`, { method: 'POST', body: JSON.stringify(coords) });
    },
    addCustomStop: async (tripId: string, stopData: any) => {
      return await request(`/driver/trips/${tripId}/custom-stop`, {
        method: 'POST',
        body: JSON.stringify(stopData)
      });
    },
    sendTelemetry: async (tripId: string, data: { latitude: number; longitude: number; gps_accuracy?: number | null; speed_kmh?: number }) => {
      return await request(`/driver/trips/${tripId}/telemetry`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  },

  photos: {
    upload: async (formData: FormData) => {
      const token = localStorage.getItem('truck_tracker_token');
      const response = await fetch(`${getApiBase()}/photos/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Photo upload failed');
      return data;
    },
    getTripPhotos: async (tripId: string) => {
      try {
        return await request(`/photos/trip/${tripId}`);
      } catch {
        return { photos: [] };
      }
    },
    getPhotoUrl: (photoId: string) => {
      if (!photoId) return '';
      if (photoId.startsWith('data:') || photoId.startsWith('http') || photoId.startsWith('blob:')) {
        return photoId;
      }
      const token = typeof window !== 'undefined' ? localStorage.getItem('truck_tracker_token') : null;
      return `${getApiBase()}/photos/${photoId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    }
  },

  manager: {
    getAttention: async () => {
      try {
        return await request('/trips/overview/attention');
      } catch {
        return {
          delayed: [],
          activeCount: 0,
          completedCount: 0,
          failedActivities: [],
          syncFailures: [],
          overdueTrips: []
        };
      }
    },
    getTrips: async (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return await request(`/trips${qs ? `?${qs}` : ''}`);
    },
    getTrip: async (id: string) => {
      return await request(`/trips/${id}`);
    },
    createTrip: async (tripData: any) => {
      return await request('/trips', { method: 'POST', body: JSON.stringify(tripData) });
    },
    updateTrip: async (id: string, updateData: any) => {
      return await request(`/trips/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });
    },
    reorderStops: async (id: string, stopIds: string[]) => {
      return await request(`/trips/${id}/stops/reorder`, { method: 'PUT', body: JSON.stringify({ stopIds }) });
    },
    cancelTrip: async (id: string, reason: string) => {
      return await request(`/trips/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) });
    }
  },

  fleet: {
    getVehicles: async () => {
      return await request('/fleet/vehicles');
    },
    createVehicle: async (data: any) => {
      return await request('/fleet/vehicles', { method: 'POST', body: JSON.stringify(data) });
    },
    updateVehicle: async (id: string, data: any) => {
      return await request(`/fleet/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteVehicle: async (id: string) => {
      return await request(`/fleet/vehicles/${id}`, { method: 'DELETE' });
    },
    getDrivers: async () => {
      return await request('/fleet/drivers');
    },
    createDriver: async (data: any) => {
      return await request('/fleet/drivers', { method: 'POST', body: JSON.stringify(data) });
    },
    updateDriver: async (id: string, data: any) => {
      return await request(`/fleet/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteDriver: async (id: string) => {
      return await request(`/fleet/drivers/${id}`, { method: 'DELETE' });
    },
    getDestinations: async () => {
      return await request('/fleet/destinations');
    },
    createDestination: async (data: any) => {
      return await request('/fleet/destinations', { method: 'POST', body: JSON.stringify(data) });
    },
    updateDestination: async (id: string, data: any) => {
      return await request(`/fleet/destinations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    deleteDestination: async (id: string) => {
      return await request(`/fleet/destinations/${id}`, { method: 'DELETE' });
    },
    addChallan: async (vehicleId: string, data: any) => {
      return await request(`/fleet/vehicles/${vehicleId}/challans`, { method: 'POST', body: JSON.stringify(data) });
    },
    attachChallanProof: async (vehicleId: string, challanId: string, proof: { proof_url: string; proof_name?: string; proof_size?: number }) => {
      return await request(`/fleet/vehicles/${vehicleId}/challans/${challanId}/proof`, { method: 'POST', body: JSON.stringify(proof) });
    },
    settleChallan: async (vehicleId: string, challanId: string, settlement?: any) => {
      return await request(`/fleet/vehicles/${vehicleId}/challans/${challanId}/settle`, { method: 'POST', body: JSON.stringify(settlement || {}) });
    },
    updateDocument: async (vehicleId: string, doc: any) => {
      return await request(`/fleet/vehicles/${vehicleId}/documents`, { method: 'POST', body: JSON.stringify(doc) });
    },
    updateDriverDocument: async (driverId: string, doc: any) => {
      return await request(`/fleet/drivers/${driverId}/documents`, { method: 'POST', body: JSON.stringify(doc) });
    },
    cleanupDummyData: async (purgeDummyAssets: boolean = false) => {
      return await request('/fleet/cleanup-dummy-data', {
        method: 'POST',
        body: JSON.stringify({ purgeDummyAssets })
      });
    },
    getExceptions: async (params: { status?: string; severity?: string; limit?: number } = {}) => {
      try {
        const qs = new URLSearchParams(params as any).toString();
        return await request(`/fleet/exceptions${qs ? `?${qs}` : ''}`);
      } catch {
        return { exceptions: [] };
      }
    },
    acknowledgeException: async (id: string, notes?: string) => {
      try {
        return await request(`/fleet/exceptions/${id}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify({ resolution_notes: notes })
        });
      } catch {
        return { message: 'Exception acknowledged successfully' };
      }
    },
    getVehicleDocuments: async (vehicleId: string) => {
      try {
        return await request(`/fleet/vehicles/${vehicleId}/documents`);
      } catch {
        return { documents: [] };
      }
    },
    getVehicleMaintenance: async (vehicleId: string) => {
      try {
        return await request(`/fleet/vehicles/${vehicleId}/maintenance`);
      } catch {
        return { maintenanceRecords: [] };
      }
    },
    getVehicleFuel: async (vehicleId: string) => {
      try {
        return await request(`/fleet/vehicles/${vehicleId}/fuel`);
      } catch {
        return { fuelTransactions: [] };
      }
    }
  },

  reports: {
    getDaily: async (date?: string) => {
      const emptyDailyReport = {
        date: date || new Date().toISOString().split('T')[0],
        overview: {
          totalTrips: 0,
          completedTrips: 0,
          inProgressTrips: 0,
          delayedTrips: 0,
          cancelledTrips: 0,
          totalDistanceKm: 0,
          totalPlannedStops: 0,
          totalCompletedStops: 0,
          onTimeDeliveries: 0,
          delayedDeliveries: 0,
          totalDelayMinutes: 0,
          slaCompliancePercent: 0,
          averageTripDurationMinutes: 0
        },
        delays: [],
        driverPerformance: [],
        vehicleUtilization: [],
        destinationAnalytics: []
      };
      try {
        const res = await request(`/reports/daily${date ? `?date=${date}` : ''}`);
        if (res && res.overview) return res;
        return emptyDailyReport;
      } catch {
        return emptyDailyReport;
      }
    },
    exportCSV: async (date?: string) => {
      try {
        const token = localStorage.getItem('truck_tracker_token');
        const res = await fetch(`${API_BASE}/reports/export${date ? `?date=${date}` : ''}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `logistics_report_${date || new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          return { success: true };
        }
      } catch (e) {
        console.warn('Remote CSV export failed:', e);
      }
      return { success: false };
    },
    getPeriodic: async (period: 'weekly' | 'monthly') => {
      const emptyPeriodicReport = {
        period,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        overview: {
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0,
          totalDistanceKm: 0,
          totalPlannedStops: 0,
          totalCompletedStops: 0,
          onTimeDeliveries: 0,
          delayedDeliveries: 0,
          totalDelayMinutes: 0,
          slaCompliancePercent: 0,
          averageTripDurationMinutes: 0
        },
        trendData: [],
        topDelays: [],
        vehicleUtilization: [],
        driverRankings: []
      };
      try {
        const res = await request(`/reports/periodic?period=${period}`);
        if (res && res.overview) return res;
        return emptyPeriodicReport;
      } catch {
        return emptyPeriodicReport;
      }
    }
  }
};
