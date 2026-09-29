/**
 * TruckTracker — Canonical Data Models
 * Single authoritative type definitions shared across Web, Backend, and Android API contracts.
 */

export type TripStatus =
  | 'PLANNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AT_DESTINATION'
  | 'DELAYED'
  | 'RETURNING'
  | 'COMPLETED'
  | 'CANCELLED';

export type StopStatus =
  | 'PENDING'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'FAILED';

export type ActivityType =
  | 'DELIVERY'
  | 'PICKUP'
  | 'INSPECTION'
  | 'MAINTENANCE'
  | 'SIGN_OFF';

export type ActivityStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED';

export type DelayReason =
  | 'TRAFFIC'
  | 'VEHICLE_BREAKDOWN'
  | 'WEATHER'
  | 'CUSTOMER_UNAVAILABLE'
  | 'LOADING_UNLOADING'
  | 'ROAD_CLOSURE'
  | 'POLICE_CHECK'
  | 'OTHER';

export type PhotoType =
  | 'DELIVERY_PROOF'
  | 'PICKUP_PROOF'
  | 'DELAY_PROOF'
  | 'VEHICLE_ISSUE'
  | 'DAMAGE'
  | 'LOADING_UNLOADING'
  | 'OTHER';

export type UserRole = 'MANAGER' | 'DRIVER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  employee_id?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  assigned_vehicle_id?: string;
  created_at?: string;
}

export interface Vehicle {
  id: string;
  plate_number: string;
  model: string;
  capacity_tons?: number;
  fuel_type?: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE';
  assigned_driver_id?: string;
  current_odometer?: number;
}

export interface Destination {
  id: string;
  name: string;
  address: string;
  area_code?: string;
  contact_person?: string;
  contact_phone?: string;
  latitude: number;
  longitude: number;
  geofence_radius: number; // default 100-250m
  is_base?: number; // 1 if company HQ/depot
}

export interface Activity {
  id: string;
  trip_id: string;
  stop_id?: string;
  activity_type: ActivityType;
  description?: string;
  quantity?: number;
  reference_number?: string;
  recipient_name?: string;
  recipient_phone?: string;
  signature_url?: string;
  status: ActivityStatus;
  photo_required: number; // 0 = optional, 1 = required
  started_at?: string;
  completed_at?: string;
  notes?: string;
}

export interface TripStop {
  id: string;
  trip_id: string;
  stop_number: number;
  destination_id: string;
  destination_name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  planned_arrival?: string;
  actual_arrival_time?: string;
  actual_departure_time?: string;
  status: StopStatus;
  notes?: string;
  activity?: Activity;
  photos?: Photo[];
  delays?: Delay[];
}

export interface Trip {
  id: string;
  trip_number: string;
  driver_id: string;
  driver_name?: string;
  driver_phone?: string;
  vehicle_id: string;
  vehicle_plate?: string;
  vehicle_model?: string;
  starting_location_id: string;
  starting_location_name?: string;
  planned_departure: string;
  actual_start_time?: string;
  return_start_time?: string;
  base_arrival_time?: string;
  trip_completion_time?: string;
  status: TripStatus;
  purpose?: string;
  notes?: string;
  total_distance_km?: number;
  total_delay_minutes?: number;
  stops?: TripStop[];
  created_at: string;
  updated_at: string;
}

export interface TripEvent {
  id: string;
  trip_id: string;
  stop_id?: string;
  event_type: string;
  server_timestamp: string;
  client_timestamp?: string;
  driver_id: string;
  vehicle_id: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  is_geofence_verified?: number;
  event_data?: string;
  created_at?: string;
}

export interface Delay {
  id: string;
  trip_id: string;
  stop_id?: string;
  driver_id: string;
  reason: DelayReason;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  is_resolved: number;
  latitude?: number;
  longitude?: number;
}

export interface Photo {
  id: string;
  trip_id: string;
  stop_id?: string;
  driver_id: string;
  vehicle_id: string;
  photo_type: PhotoType;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  user_name?: string;
  previous_state?: string;
  new_state?: string;
  reason?: string;
  created_at: string;
}

export interface SyncRecord {
  id: string;
  entity_type: string;
  entity_id: string;
  sheet_name: string;
  payload: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  retry_count: number;
  error_message?: string;
  synced_at?: string;
  created_at: string;
}
