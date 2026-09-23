/**
 * TruckTracker — Canonical System Constants
 */

export const GEOFENCE_CONFIG = {
  DEFAULT_RADIUS_METERS: 150,
  MIN_RADIUS_METERS: 50,
  MAX_RADIUS_METERS: 500,
  ACCURACY_THRESHOLD_METERS: 300,
};

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me',
  AUTH_LOGOUT: '/api/auth/logout',

  TRIPS: '/api/trips',
  TRIP_DETAIL: (id: string) => `/api/trips/${id}`,
  TRIP_STOPS: (tripId: string) => `/api/trips/${tripId}/stops`,
  TRIP_CANCEL: (id: string) => `/api/trips/${id}/cancel`,
  TRIP_REORDER: (id: string) => `/api/trips/${id}/reorder-stops`,
  ATTENTION_OVERVIEW: '/api/trips/overview/attention',

  DRIVER_ASSIGNED_TRIP: '/api/driver/assigned-trip',
  DRIVER_TODAYS_TRIPS: '/api/driver/todays-trips',
  DRIVER_HISTORY: '/api/driver/history',
  DRIVER_START_TRIP: (id: string) => `/api/driver/trips/${id}/start`,
  DRIVER_ARRIVE_STOP: (id: string) => `/api/driver/stops/${id}/arrive`,
  DRIVER_COMPLETE_ACTIVITY: (id: string) => `/api/driver/stops/${id}/activity`,
  DRIVER_DEPART_STOP: (id: string) => `/api/driver/stops/${id}/depart`,
  DRIVER_REPORT_DELAY: (tripId: string) => `/api/driver/trips/${tripId}/delay`,
  DRIVER_RESOLVE_DELAY: (delayId: string) => `/api/driver/delays/${delayId}/resolve`,
  DRIVER_START_RETURN: (tripId: string) => `/api/driver/trips/${tripId}/start-return`,
  DRIVER_ARRIVE_BASE: (tripId: string) => `/api/driver/trips/${tripId}/arrive-base`,
  DRIVER_COMPLETE_TRIP: (tripId: string) => `/api/driver/trips/${tripId}/complete`,

  PHOTOS_UPLOAD: '/api/photos/upload',
  PHOTOS_STREAM: (id: string) => `/api/photos/${id}/file`,

  REPORTS_SUMMARY: '/api/reports/summary',
  REPORTS_EXPORT_CSV: '/api/reports/export/csv',

  SHEETS_SYNC: '/api/sheets/sync',
  SHEETS_STATUS: '/api/sheets/status',
  SHEETS_RETRY: '/api/sheets/retry-failed',

  BACKUP_CREATE: '/api/backup/create',
  BACKUP_STATUS: '/api/backup/status',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tt_auth_token',
  AUTH_USER: 'tt_auth_user',
  OFFLINE_QUEUE: 'tt_offline_event_queue',
  PENDING_PHOTOS: 'tt_pending_photos',
};
