# Relational Database Schema Specification

This document provides the definitive data dictionary for all 16 canonical relational tables managed by the TruckTracker migration runner.

---

## 1. Core Master Entities

### `users`
Operational system identities, authentication credentials, and role privileges.
- `id` (TEXT, PK): UUIDv4.
- `name` (TEXT, NOT NULL): Full human name (e.g. "Sunil Mehta").
- `email` (TEXT, UNIQUE, NOT NULL): Corporate email address in lowercase.
- `password_hash` (TEXT, NOT NULL): Bcrypt hash (work factor 10).
- `role` (TEXT, NOT NULL): Restricted to `'DRIVER'`, `'MANAGER'`, or `'ADMIN'`.
- `phone` (TEXT): Primary mobile contact number.
- `created_at` (DATETIME): Timestamp of user creation.

### `vehicles`
Commercial fleet assets and telematics link references.
- `id` (TEXT, PK): UUIDv4.
- `vehicle_number` (TEXT, UNIQUE, NOT NULL): Official RTO registration number (e.g. `DL01 TA 4920`).
- `vehicle_type` (TEXT, NOT NULL): Operational classification (e.g. `Refrigerated Express`, `Heavy Freight`).
- `model` (TEXT, NOT NULL): Manufacturer chassis model (e.g. `Tata Ultra T.7`).
- `assigned_driver_id` (TEXT, FK → `users.id`): Primary assigned driver.
- `status` (TEXT, NOT NULL): `'AVAILABLE'`, `'ON_TRIP'`, `'MAINTENANCE'`, `'INACTIVE'`.
- `fleet_unit_id` (TEXT): External ERP/SAP equipment asset identifier.
- `chassis_number` (TEXT): Vehicle Identification Number (VIN).
- `telematics_imei` (TEXT): GPS hardware IMEI identifier.
- `notes` (TEXT): Operational maintenance or regulatory remarks.
- `created_at` (DATETIME): Asset creation timestamp.

### `drivers`
Workforce metadata extending user profiles.
- `id` (TEXT, PK): UUIDv4.
- `user_id` (TEXT, UNIQUE, NOT NULL, FK → `users.id` ON DELETE CASCADE).
- `employee_id` (TEXT, UNIQUE, NOT NULL): Corporate payroll ID (e.g. `EMP-DRV-101`).
- `assigned_vehicle_id` (TEXT, FK → `vehicles.id`).
- `status` (TEXT, NOT NULL): `'AVAILABLE'`, `'ON_TRIP'`, `'OFF_DUTY'`, `'INACTIVE'`.
- `created_at` (DATETIME): Record creation timestamp.

### `destinations`
Geofenced customer drop locations and company depots.
- `id` (TEXT, PK): UUIDv4.
- `name` (TEXT, NOT NULL): Facility or customer name.
- `address` (TEXT, NOT NULL): Physical postal delivery address.
- `latitude` (REAL, NOT NULL): WGS-84 decimal latitude.
- `longitude` (REAL, NOT NULL): WGS-84 decimal longitude.
- `contact_name` (TEXT): On-site dock manager or receiving supervisor.
- `contact_number` (TEXT): Dock contact phone number.
- `geofence_radius_meters` (INTEGER, DEFAULT 150): Geofence trigger radius in meters.
- `notes` (TEXT): Delivery dock access hours and restrictions.
- `is_active` (INTEGER, DEFAULT 1): Soft-delete flag (0 = deactivated, historical data preserved).
- `created_at` (DATETIME): Record creation timestamp.

---

## 2. Fleet Compliance & Operating Costs

### `vehicle_documents`
Regulatory certificates, commercial insurance, and road fitness compliance.
- `id` (TEXT, PK): UUIDv4.
- `vehicle_id` (TEXT, NOT NULL, FK → `vehicles.id` ON DELETE CASCADE).
- `document_type` (TEXT, NOT NULL): `'REGISTRATION_CERTIFICATE'`, `'INSURANCE_POLICY'`, `'FITNESS_CERTIFICATE'`, `'POLLUTION_UNDER_CONTROL'`, `'NATIONAL_PERMIT'`, `'OTHER'`.
- `title` (TEXT, NOT NULL): Human-readable document name.
- `document_number` (TEXT, NOT NULL): Policy or certificate number.
- `issue_date` (TEXT): Issuing date (`YYYY-MM-DD`).
- `expiry_date` (TEXT, NOT NULL): Expiration date (`YYYY-MM-DD`).
- `issuing_authority` (TEXT): E.g., RTO Authority or Insurance Carrier.
- `status` (TEXT, NOT NULL): `'VALID'`, `'EXPIRING_SOON'`, `'EXPIRED'`, `'PENDING_VERIFICATION'`.
- `file_path` (TEXT): Local file storage path.
- `notes` (TEXT): Regulatory notes.

### `maintenance_records`
Scheduled preventive maintenance and breakdown repairs.
- `id` (TEXT, PK): UUIDv4.
- `vehicle_id` (TEXT, NOT NULL, FK → `vehicles.id` ON DELETE CASCADE).
- `service_date` (TEXT, NOT NULL): Service date (`YYYY-MM-DD`).
- `odometer_km` (INTEGER, NOT NULL): Odometer reading at service.
- `maintenance_type` (TEXT, NOT NULL): `'PREVENTIVE'`, `'CORRECTIVE'`, `'TIRE_ROTATION'`, `'STATUTORY_INSPECTION'`, `'BREAKDOWN'`.
- `description` (TEXT, NOT NULL): Line-item description of repairs.
- `service_center` (TEXT, NOT NULL): Workshop name and location.
- `cost_amount` (REAL, NOT NULL): Invoice cost.
- `currency` (TEXT, DEFAULT 'INR'): Currency code.
- `invoice_reference` (TEXT): Workshop invoice number.
- `status` (TEXT, NOT NULL): `'SCHEDULED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'CANCELLED'`.
- `performed_by` (TEXT): Lead technician name.
- `next_service_due_km` (INTEGER): Future odometer target for next service.
- `next_service_due_date` (TEXT): Next scheduled date.

### `fuel_transactions`
Commercial fuel card transactions and efficiency audits.
- `id` (TEXT, PK): UUIDv4.
- `vehicle_id` (TEXT, NOT NULL, FK → `vehicles.id` ON DELETE CASCADE).
- `driver_id` (TEXT, FK → `users.id`).
- `trip_id` (TEXT, FK → `trips.id`).
- `fueling_date` (TEXT, NOT NULL): Date of fueling.
- `quantity_liters` (REAL, NOT NULL): Liters dispensed.
- `rate_per_liter` (REAL, NOT NULL): Cost per liter.
- `total_cost` (REAL, NOT NULL): Total transaction cost.
- `odometer_km` (INTEGER, NOT NULL): Vehicle odometer at pump.
- `fuel_station` (TEXT, NOT NULL): Vendor / station name.
- `payment_mode` (TEXT): `'FLEET_CARD'`, `'CASH'`, `'CORPORATE_UPI'`, `'DIRECT_BILLING'`.
- `receipt_reference` (TEXT): Fuel receipt number.
- `notes` (TEXT): Operating remarks.

---

## 3. Transactional Dispatch & Operations

### `trips`
Dispatch manifests coordinating routes, vehicles, and drivers.
- `id` (TEXT, PK): Human-readable format (`TR-YYYY-NNNNN`).
- `date` (TEXT, NOT NULL): Operational date (`YYYY-MM-DD`).
- `driver_id` (TEXT, NOT NULL, FK → `users.id`).
- `vehicle_id` (TEXT, NOT NULL, FK → `vehicles.id`).
- `starting_location` (TEXT, NOT NULL): Starting depot name.
- `starting_latitude` (REAL): Departure latitude.
- `starting_longitude` (REAL): Departure longitude.
- `purpose` (TEXT, NOT NULL): Delivery, restocking, inter-hub transfer.
- `reference_number` (TEXT): Purchase Order / Consignment Note.
- `planned_departure_time` (TEXT, NOT NULL): Scheduled departure time (`HH:MM`).
- `actual_start_time` (TEXT): Actual start timestamp.
- `return_start_time` (TEXT): Time driver began return leg.
- `base_arrival_time` (TEXT): Time driver re-entered home base.
- `completion_time` (TEXT): Final trip sign-off timestamp.
- `status` (TEXT, NOT NULL): `'PLANNED'`, `'ASSIGNED'`, `'IN_PROGRESS'`, `'AT_DESTINATION'`, `'DELAYED'`, `'RETURNING'`, `'COMPLETED'`, `'CANCELLED'`.
- `total_delay_minutes` (INTEGER, DEFAULT 0): Cumulative recorded delay.
- `calculated_distance_km` (REAL): GPS-accumulated route distance.
- `sap_shipment_num` (TEXT): SAP TM Shipment Number.
- `erp_delivery_doc` (TEXT): SAP Delivery Document.
- `cost_center` (TEXT): Cost allocation center.
- `notes` (TEXT): Dispatch instructions.
- `created_by` (TEXT, FK → `users.id`).
- `created_at` (DATETIME): Record creation timestamp.
- `updated_at` (DATETIME): Last update timestamp.

### `trip_stops`
Sequenced destinations for a manifest.
- `id` (TEXT, PK): UUIDv4.
- `trip_id` (TEXT, NOT NULL, FK → `trips.id` ON DELETE CASCADE).
- `destination_id` (TEXT, FK → `destinations.id`).
- `stop_number` (INTEGER, NOT NULL): Sequence order (1, 2, 3...).
- `destination_name` (TEXT, NOT NULL): Customer facility name.
- `address` (TEXT, NOT NULL): Street address.
- `latitude` (REAL, NOT NULL): Destination latitude.
- `longitude` (REAL, NOT NULL): Destination longitude.
- `geofence_radius_meters` (INTEGER, DEFAULT 150): Geofence perimeter radius.
- `planned_arrival_time` (TEXT, NOT NULL): SLA scheduled arrival (`HH:MM`).
- `actual_arrival_time` (TEXT): Geofence-triggered arrival timestamp.
- `actual_departure_time` (TEXT): Driver departure timestamp.
- `arrival_status` (TEXT): `'ON_TIME'`, `'EARLY'`, `'LATE'`, `'UNKNOWN'`.
- `arrival_diff_minutes` (INTEGER): Positive (late) or negative (early) variance in minutes.
- `status` (TEXT, NOT NULL): `'PENDING'`, `'ARRIVED'`, `'IN_PROGRESS'`, `'COMPLETED'`, `'SKIPPED'`, `'FAILED'`.
- `notes` (TEXT): Unloading or dock instructions.

### `activities`
Dock operations at a stop.
- `id` (TEXT, PK): UUIDv4.
- `trip_id` (TEXT, NOT NULL, FK → `trips.id` ON DELETE CASCADE).
- `stop_id` (TEXT, NOT NULL, FK → `trip_stops.id` ON DELETE CASCADE).
- `activity_type` (TEXT, NOT NULL): E.g. `'DELIVERY'`, `'PICKUP'`.
- `status` (TEXT, NOT NULL): `'COMPLETED'`, `'PARTIALLY_COMPLETED'`, `'FAILED'`, `'OTHER'`.
- `quantity` (INTEGER): Item count (cartons, pallets).
- `reference_number` (TEXT): Invoice or delivery challan reference.
- `recipient_name` (TEXT): Name of person signing for goods.

### `delays`
Corridor transit delays recorded during trips.
- `id` (TEXT, PK): UUIDv4.
- `trip_id` (TEXT, NOT NULL, FK → `trips.id` ON DELETE CASCADE).
- `stop_id` (TEXT, FK → `trip_stops.id`).
- `driver_id` (TEXT, NOT NULL, FK → `users.id`).
- `vehicle_id` (TEXT, NOT NULL, FK → `vehicles.id`).
- `reason` (TEXT, NOT NULL): Root cause (e.g. `Traffic Bottleneck`, `Customs Check`, `Vehicle Breakdown`).
- `description` (TEXT): Specific incident details.
- `start_time` (TEXT, NOT NULL): Delay start timestamp.
- `end_time` (TEXT): Delay resolution timestamp.
- `duration_minutes` (INTEGER): Duration in minutes.
- `is_resolved` (INTEGER, DEFAULT 0): Resolution status flag.

### `photos`
Proof-of-delivery photos and damage evidence.
- `id` (TEXT, PK): UUIDv4.
- `trip_id` (TEXT, NOT NULL, FK → `trips.id` ON DELETE CASCADE).
- `stop_id` (TEXT, FK → `trip_stops.id`).
- `driver_id` (TEXT, NOT NULL, FK → `users.id`).
- `photo_type` (TEXT, NOT NULL): E.g. `Delivery Proof`, `Delay Proof`.
- `file_path` (TEXT, NOT NULL): Relative disk storage path.
- `file_size` (INTEGER, NOT NULL): File size in bytes.
- `mime_type` (TEXT, NOT NULL): MIME type (e.g. `image/jpeg`).
- `timestamp` (TEXT, NOT NULL): Capture timestamp.

### `trip_events`
Chronological telemetry event stream.
- `id` (TEXT, PK): UUIDv4.
- `trip_id` (TEXT, NOT NULL, FK → `trips.id` ON DELETE CASCADE).
- `event_type` (TEXT, NOT NULL): E.g. `TRIP_START`, `GEOFENCE_ARRIVE`, `DELIVERY_SIGN_OFF`.
- `timestamp` (TEXT, NOT NULL): Event ISO timestamp.
- `driver_id` (TEXT, NOT NULL, FK → `users.id`).
- `vehicle_id` (TEXT, NOT NULL, FK → `vehicles.id`).
- `details` (TEXT): Contextual message.

### `operational_exceptions`
Escalated operational alerts requiring manager attention.
- `id` (TEXT, PK): UUIDv4.
- `severity` (TEXT, NOT NULL): `'CRITICAL'`, `'HIGH'`, `'MEDIUM'`, `'LOW'`.
- `category` (TEXT, NOT NULL): `'DELIVERY_DELAY'`, `'ROUTE_DEVIATION'`, `'DOCUMENT_EXPIRING'`, `'GEOFENCE_VIOLATION'`.
- `title` (TEXT, NOT NULL): Brief alert title.
- `description` (TEXT, NOT NULL): Detailed context.
- `vehicle_id` (TEXT, FK → `vehicles.id`).
- `driver_id` (TEXT, FK → `users.id`).
- `trip_id` (TEXT, FK → `trips.id`).
- `is_acknowledged` (INTEGER, DEFAULT 0): Manager acknowledgement flag.
- `acknowledged_by` (TEXT, FK → `users.id`).
- `acknowledged_at` (DATETIME): Acknowledgement timestamp.
- `resolution_status` (TEXT, NOT NULL): `'OPEN'`, `'ACKNOWLEDGED'`, `'IN_PROGRESS'`, `'RESOLVED'`, `'DISMISSED'`.
- `resolution_notes` (TEXT): Resolution explanation.

### `audit_logs`
Managerial change tracking for compliance.
- `id` (TEXT, PK): UUIDv4.
- `trip_id` (TEXT): Optional manifest reference.
- `action` (TEXT, NOT NULL): Action identifier (e.g. `TRIP_CANCELLED`, `DESTINATION_DEACTIVATED`).
- `field_changed` (TEXT): Specific attribute modified.
- `original_value` (TEXT): Value prior to change.
- `new_value` (TEXT): Value following change.
- `changed_by` (TEXT, NOT NULL, FK → `users.id`).
- `reason` (TEXT): Business justification.

### `google_sheet_sync`
Outbound synchronization status tracking for Google Sheets tabs.
- `id` (TEXT, PK): UUIDv4.
- `sheet_name` (TEXT, NOT NULL): Target spreadsheet tab name.
- `record_id` (TEXT, NOT NULL): Synced SQLite record UUID.
- `sync_status` (TEXT, NOT NULL): `'SYNCED'`, `'PENDING'`, `'FAILED'`.
- `error_message` (TEXT): Error message if sync failed.
- `last_synced_at` (DATETIME): Timestamp of successful sync.
