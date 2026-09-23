/**
 * TruckTracker — Canonical Operational Event Model
 * Unified event types used identically across Android, Web, Server, and Google Sheets.
 */

export const OperationalEvents = {
  TRIP_START: 'TRIP_START',
  STOP_ARRIVAL: 'STOP_ARRIVAL',
  ACTIVITY_START: 'ACTIVITY_START',
  ACTIVITY_COMPLETION: 'ACTIVITY_COMPLETION',
  STOP_DEPARTURE: 'STOP_DEPARTURE',
  DELAY_START: 'DELAY_START',
  DELAY_RESOLVE: 'DELAY_RESOLVE',
  RETURN_START: 'RETURN_START',
  BASE_ARRIVAL: 'BASE_ARRIVAL',
  TRIP_COMPLETE: 'TRIP_COMPLETE',
  PHOTO_UPLOADED: 'PHOTO_UPLOADED',
  GEOFENCE_FAILED: 'GEOFENCE_FAILED',
  GPS_UNAVAILABLE: 'GPS_UNAVAILABLE',
} as const;

export type OperationalEventType = keyof typeof OperationalEvents;

export interface BaseEventPayload {
  idempotency_key: string;
  client_timestamp: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface TripStartPayload extends BaseEventPayload {
  odometer_start?: number;
}

export interface StopArrivalPayload extends BaseEventPayload {
  stop_id: string;
}

export interface ActivityCompletePayload extends BaseEventPayload {
  stop_id: string;
  activity_id: string;
  status: 'COMPLETED' | 'FAILED';
  quantity?: number;
  recipient_name?: string;
  notes?: string;
}

export interface StopDeparturePayload extends BaseEventPayload {
  stop_id: string;
}

export interface DelayReportPayload extends BaseEventPayload {
  stop_id?: string;
  reason: string;
  description?: string;
}

export interface DelayResolvePayload extends BaseEventPayload {
  delay_id: string;
}

export interface ReturnStartPayload extends BaseEventPayload {}

export interface BaseArrivalPayload extends BaseEventPayload {
  depot_id?: string;
}

export interface TripCompletePayload extends BaseEventPayload {
  odometer_end?: number;
  notes?: string;
}
