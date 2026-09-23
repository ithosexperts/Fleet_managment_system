/**
 * TruckTracker — Canonical API Contracts
 * Request and response payloads for backend endpoints.
 */

import { User, Trip, TripStop, Vehicle, Destination, Delay, Photo, AuditLog, SyncRecord } from './models';

// Auth
export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Trips
export interface CreateTripRequest {
  driver_id: string;
  vehicle_id: string;
  starting_location_id: string;
  planned_departure: string;
  purpose?: string;
  notes?: string;
  stops: {
    destination_id: string;
    planned_arrival?: string;
    notes?: string;
    activity?: {
      activity_type: string;
      description?: string;
      quantity?: number;
      photo_required: number;
    };
  }[];
}

export interface EditTripRequest {
  driver_id?: string;
  vehicle_id?: string;
  planned_departure?: string;
  purpose?: string;
  notes?: string;
}

export interface ReorderStopsRequest {
  stop_ids: string[];
}

export interface CancelTripRequest {
  reason: string;
}

export interface AttentionRequiredResponse {
  count: number;
  items: {
    type: 'DELAY' | 'UNSTARTED' | 'FAILED_ACTIVITY' | 'VEHICLE_MAINTENANCE' | 'MISSING_PHOTO';
    message: string;
    trip_id?: string;
    trip_number?: string;
    severity: 'HIGH' | 'MEDIUM';
  }[];
}

// Driver Operational Requests
export interface DriverStartTripRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  odometer_start?: number;
}

export interface DriverArriveStopRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface DriverActivityRequest {
  status: 'COMPLETED' | 'FAILED';
  quantity?: number;
  recipient_name?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface DriverDepartStopRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface DriverReportDelayRequest {
  reason: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  stop_id?: string;
}

export interface DriverResolveDelayRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface DriverReturnRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface DriverArriveBaseRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface DriverCompleteTripRequest {
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  notes?: string;
}

// Reports
export interface ReportSummaryResponse {
  total_trips: number;
  completed_trips: number;
  delayed_trips: number;
  cancelled_trips: number;
  active_trips: number;
  total_stops: number;
  total_delay_minutes: number;
  average_delay_minutes: number;
  average_trip_duration_minutes: number;
  on_time_arrival_percentage: number;
  total_distance_km: number;
  vehicle_utilization_percentage: number;
  driver_trip_count: Record<string, number>;
  delay_reasons_breakdown: Record<string, number>;
}
