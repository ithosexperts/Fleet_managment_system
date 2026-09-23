export type UserRole = 'DRIVER' | 'MANAGER';

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

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE' | 'INACTIVE';
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'INACTIVE';

export type EventType =
  | 'TRIP_STARTED'
  | 'ARRIVED_DESTINATION'
  | 'ACTIVITY_STARTED'
  | 'ACTIVITY_COMPLETED'
  | 'DEPARTED_DESTINATION'
  | 'DELAY_REPORTED'
  | 'DELAY_RESOLVED'
  | 'RETURN_STARTED'
  | 'ARRIVED_BASE'
  | 'TRIP_COMPLETED'
  | 'NOTE_ADDED';

export type ActivityType =
  | 'Delivery'
  | 'Pickup'
  | 'Loading'
  | 'Unloading'
  | 'Other';

export type ActivityStatus =
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'OTHER';

export type DelayReason =
  | 'Traffic'
  | 'Road Block'
  | 'Vehicle Problem'
  | 'Tyre / Puncture'
  | 'Loading Delay'
  | 'Unloading Delay'
  | 'Customer / Site Unavailable'
  | 'Weather'
  | 'Fuel Issue'
  | 'Documentation Issue'
  | 'Accident / Incident'
  | 'Other';

export type PhotoType =
  | 'Delivery Proof'
  | 'Pickup Proof'
  | 'Delay Proof'
  | 'Vehicle Issue'
  | 'Damage'
  | 'Loading / Unloading'
  | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone?: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
  model: string;
  assigned_driver_id?: string;
  status: VehicleStatus;
  notes?: string;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  employee_id: string;
  assigned_vehicle_id?: string;
  status: DriverStatus;
  created_at: string;
}

export interface Destination {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  contact_name?: string;
  contact_number?: string;
  geofence_radius_meters: number;
  notes?: string;
  is_active: number;
  created_at: string;
}

export interface TripStop {
  id: string;
  trip_id: string;
  destination_id?: string;
  stop_number: number;
  destination_name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  planned_arrival_time: string;
  actual_arrival_time?: string;
  actual_departure_time?: string;
  arrival_latitude?: number;
  arrival_longitude?: number;
  departure_latitude?: number;
  departure_longitude?: number;
  arrival_status?: 'ON_TIME' | 'EARLY' | 'LATE' | 'UNKNOWN';
  arrival_diff_minutes?: number;
  status: StopStatus;
  notes?: string;
  created_at: string;
  activities?: Activity[];
  photos?: Photo[];
  delays?: Delay[];
}

export interface Trip {
  id: string; // e.g. TR-2026-00124
  date: string;
  driver_id: string;
  driver_name?: string;
  vehicle_id: string;
  vehicle_number?: string;
  starting_location: string;
  starting_latitude?: number;
  starting_longitude?: number;
  purpose: string;
  reference_number?: string;
  planned_departure_time: string;
  actual_start_time?: string;
  return_start_time?: string;
  base_arrival_time?: string;
  completion_time?: string;
  status: TripStatus;
  total_delay_minutes: number;
  calculated_distance_km?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  stops?: TripStop[];
  events?: TripEvent[];
  delays?: Delay[];
  photos?: Photo[];
}

export interface Activity {
  id: string;
  trip_id: string;
  stop_id: string;
  activity_type: ActivityType;
  status: ActivityStatus;
  start_time?: string;
  completion_time?: string;
  quantity?: number;
  reference_number?: string;
  recipient_name?: string;
  notes?: string;
  created_at: string;
}

export interface Delay {
  id: string;
  trip_id: string;
  stop_id?: string;
  driver_id: string;
  vehicle_id: string;
  reason: DelayReason;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  is_resolved: number;
  photo_id?: string;
  created_at: string;
}

export interface Photo {
  id: string;
  trip_id: string;
  stop_id?: string;
  driver_id: string;
  vehicle_id: string;
  photo_type: PhotoType;
  file_path: string;
  file_size: number;
  mime_type: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  created_at: string;
}

export interface TripEvent {
  id: string;
  trip_id: string;
  stop_id?: string;
  event_type: EventType;
  timestamp: string;
  driver_id: string;
  vehicle_id: string;
  latitude?: number;
  longitude?: number;
  gps_accuracy?: number;
  details?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  trip_id?: string;
  action: string;
  field_changed?: string;
  original_value?: string;
  new_value?: string;
  changed_by: string;
  changed_by_name?: string;
  reason?: string;
  created_at: string;
}

export interface GoogleSheetSync {
  id: string;
  sheet_name: string;
  record_id: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  error_message?: string;
  last_synced_at?: string;
  created_at: string;
}
