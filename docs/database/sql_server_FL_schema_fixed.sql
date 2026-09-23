-- ==============================================================================
-- TruckTracker 2.0 — Enterprise Microsoft SQL Server (T-SQL) Schema
-- Target Database: test_operation
-- Prefix Standard: FL_*
-- Fixes:
--   1. Solves SQL Server Error 1785 (Multiple Cascade Paths / Cycles)
--   2. Safe Reverse-Dependency Drop (no foreign key lockups)
--   3. Adds Synonyms so application queries resolve seamlessly to FL_* tables
--   4. Pre-provisions root Admin Manager account
-- ==============================================================================

USE [test_operation];
GO

SET NOCOUNT ON;
GO

-- ==============================================================================
-- STEP 1: DROP ALL EXISTING FOREIGN KEYS (Prevents any lockups)
-- ==============================================================================
DECLARE @dropFkSql NVARCHAR(MAX) = N'';
SELECT @dropFkSql = @dropFkSql + N'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id)) + 
                   N'.' + QUOTENAME(OBJECT_NAME(parent_object_id)) + 
                   N' DROP CONSTRAINT ' + QUOTENAME(name) + N';' + CHAR(10)
FROM sys.foreign_keys
WHERE parent_object_id IN (SELECT object_id FROM sys.tables WHERE name LIKE N'FL[_]%')
   OR referenced_object_id IN (SELECT object_id FROM sys.tables WHERE name LIKE N'FL[_]%');

IF LEN(@dropFkSql) > 0
    EXEC sys.sp_executesql @dropFkSql;
GO

-- ==============================================================================
-- STEP 2: DROP ALL TABLES IN REVERSE-DEPENDENCY ORDER
-- ==============================================================================
DROP TABLE IF EXISTS dbo.FL_Operational_Exceptions;
DROP TABLE IF EXISTS dbo.FL_Vehicle_Challans;
DROP TABLE IF EXISTS dbo.FL_Fuel_Transactions;
DROP TABLE IF EXISTS dbo.FL_Maintenance_Records;
DROP TABLE IF EXISTS dbo.FL_Driver_Documents;
DROP TABLE IF EXISTS dbo.FL_Vehicle_Documents;
DROP TABLE IF EXISTS dbo.FL_Audit_Logs;
DROP TABLE IF EXISTS dbo.FL_Trip_Events;
DROP TABLE IF EXISTS dbo.FL_Photos;
DROP TABLE IF EXISTS dbo.FL_Delays;
DROP TABLE IF EXISTS dbo.FL_Activities;
DROP TABLE IF EXISTS dbo.FL_Trip_Stops;
DROP TABLE IF EXISTS dbo.FL_Trips;
DROP TABLE IF EXISTS dbo.FL_Destinations;
DROP TABLE IF EXISTS dbo.FL_Drivers;
DROP TABLE IF EXISTS dbo.FL_Vehicles;
DROP TABLE IF EXISTS dbo.FL_Users;
DROP TABLE IF EXISTS dbo.FL_Schema_Migrations;
GO

-- ==============================================================================
-- STEP 3: CREATE MASTER TABLES
-- ==============================================================================

-- 0. Schema Migrations Catalog
CREATE TABLE dbo.FL_Schema_Migrations (
    version INT NOT NULL CONSTRAINT PK_FL_Schema_Migrations PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    applied_at DATETIME2 NOT NULL CONSTRAINT DF_FL_migrations_applied DEFAULT SYSUTCDATETIME()
);
GO

-- 1. Users Master
CREATE TABLE dbo.FL_Users (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Users PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL CONSTRAINT UQ_FL_users_email UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) NOT NULL CONSTRAINT CK_FL_users_role CHECK (role IN ('DRIVER', 'MANAGER', 'ADMIN')),
    phone NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_users_created DEFAULT SYSUTCDATETIME()
);
GO

-- 2. Vehicles Fleet Master
CREATE TABLE dbo.FL_Vehicles (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Vehicles PRIMARY KEY,
    vehicle_number NVARCHAR(100) NOT NULL CONSTRAINT UQ_FL_vehicles_number UNIQUE,
    vehicle_type NVARCHAR(100) NOT NULL,
    model NVARCHAR(100) NOT NULL,
    assigned_driver_id NVARCHAR(255) NULL CONSTRAINT FK_FL_vehicles_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_vehicles_status DEFAULT 'AVAILABLE' CONSTRAINT CK_FL_vehicles_status CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE')),
    fleet_unit_id NVARCHAR(100) NULL,
    chassis_number NVARCHAR(100) NULL,
    telematics_imei NVARCHAR(100) NULL,
    photo_url NVARCHAR(MAX) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_vehicles_created DEFAULT SYSUTCDATETIME()
);
GO

-- 3. Drivers Master Profile
CREATE TABLE dbo.FL_Drivers (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Drivers PRIMARY KEY,
    user_id NVARCHAR(255) NOT NULL CONSTRAINT UQ_FL_drivers_user UNIQUE CONSTRAINT FK_FL_drivers_user FOREIGN KEY REFERENCES dbo.FL_Users(id) ON DELETE CASCADE,
    employee_id NVARCHAR(100) NOT NULL CONSTRAINT UQ_FL_drivers_emp UNIQUE,
    assigned_vehicle_id NVARCHAR(255) NULL CONSTRAINT FK_FL_drivers_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id),
    license_number NVARCHAR(100) NULL,
    license_category NVARCHAR(100) NULL,
    emergency_phone NVARCHAR(50) NULL,
    avatar_url NVARCHAR(MAX) NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_drivers_status DEFAULT 'AVAILABLE' CONSTRAINT CK_FL_drivers_status CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'INACTIVE')),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_drivers_created DEFAULT SYSUTCDATETIME()
);
GO

-- 4. Destinations Master
CREATE TABLE dbo.FL_Destinations (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Destinations PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    contact_name NVARCHAR(255) NULL,
    contact_number NVARCHAR(50) NULL,
    geofence_radius_meters INT NULL CONSTRAINT DF_FL_dest_geofence DEFAULT 150,
    area_code NVARCHAR(50) NULL,
    notes NVARCHAR(MAX) NULL,
    is_active INT NULL CONSTRAINT DF_FL_dest_active DEFAULT 1,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_dest_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_destinations_active ON dbo.FL_Destinations(is_active);
CREATE INDEX idx_FL_destinations_area_code ON dbo.FL_Destinations(area_code);
GO

-- 5. Trips Header Table
CREATE TABLE dbo.FL_Trips (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Trips PRIMARY KEY,
    [date] NVARCHAR(50) NOT NULL,
    driver_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_trips_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_trips_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id),
    starting_location NVARCHAR(255) NOT NULL,
    starting_latitude FLOAT NULL,
    starting_longitude FLOAT NULL,
    purpose NVARCHAR(MAX) NOT NULL,
    reference_number NVARCHAR(100) NULL,
    planned_departure_time NVARCHAR(50) NOT NULL,
    actual_start_time NVARCHAR(50) NULL,
    return_start_time NVARCHAR(50) NULL,
    base_arrival_time NVARCHAR(50) NULL,
    completion_time NVARCHAR(50) NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_trips_status DEFAULT 'ASSIGNED' CONSTRAINT CK_FL_trips_status CHECK (status IN ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING', 'COMPLETED', 'CANCELLED')),
    total_delay_minutes INT NULL CONSTRAINT DF_FL_trips_delay DEFAULT 0,
    calculated_distance_km FLOAT NULL,
    sap_shipment_num NVARCHAR(100) NULL,
    erp_delivery_doc NVARCHAR(100) NULL,
    cost_center NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    created_by NVARCHAR(255) NULL CONSTRAINT FK_FL_trips_creator FOREIGN KEY REFERENCES dbo.FL_Users(id),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_trips_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_FL_trips_updated DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_trips_driver_status ON dbo.FL_Trips(driver_id, status);
CREATE INDEX idx_FL_trips_date ON dbo.FL_Trips([date]);
CREATE INDEX idx_FL_trips_created_at ON dbo.FL_Trips(created_at);
GO

-- 6. Trip Stops (Cascades on trip delete)
CREATE TABLE dbo.FL_Trip_Stops (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Trip_Stops PRIMARY KEY,
    trip_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_trip_stops_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id) ON DELETE CASCADE,
    destination_id NVARCHAR(255) NULL CONSTRAINT FK_FL_trip_stops_dest FOREIGN KEY REFERENCES dbo.FL_Destinations(id),
    stop_number INT NOT NULL,
    destination_name NVARCHAR(255) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geofence_radius_meters INT NULL CONSTRAINT DF_FL_trip_stops_geofence DEFAULT 150,
    planned_arrival_time NVARCHAR(50) NOT NULL,
    actual_arrival_time NVARCHAR(50) NULL,
    actual_departure_time NVARCHAR(50) NULL,
    arrival_latitude FLOAT NULL,
    arrival_longitude FLOAT NULL,
    departure_latitude FLOAT NULL,
    departure_longitude FLOAT NULL,
    arrival_status NVARCHAR(50) NULL CONSTRAINT CK_FL_trip_stops_arr_status CHECK (arrival_status IS NULL OR arrival_status IN ('ON_TIME', 'EARLY', 'LATE', 'UNKNOWN')),
    arrival_diff_minutes INT NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_trip_stops_status DEFAULT 'PENDING' CONSTRAINT CK_FL_trip_stops_status CHECK (status IN ('PENDING', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED')),
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_trip_stops_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_trip_stops_trip_order ON dbo.FL_Trip_Stops(trip_id, stop_number);
GO

-- 7. Stop Activities (Prevents Multiple Cascade Error 1785 by using NO ACTION on stop)
CREATE TABLE dbo.FL_Activities (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Activities PRIMARY KEY,
    trip_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_activities_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id) ON DELETE CASCADE,
    stop_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_activities_stop FOREIGN KEY REFERENCES dbo.FL_Trip_Stops(id) ON DELETE NO ACTION,
    activity_type NVARCHAR(50) NOT NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_activities_status DEFAULT 'COMPLETED' CONSTRAINT CK_FL_activities_status CHECK (status IN ('COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'OTHER')),
    start_time NVARCHAR(50) NULL,
    completion_time NVARCHAR(50) NULL,
    quantity INT NULL,
    reference_number NVARCHAR(100) NULL,
    recipient_name NVARCHAR(255) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_activities_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_activities_stop ON dbo.FL_Activities(stop_id);
CREATE INDEX idx_FL_activities_trip ON dbo.FL_Activities(trip_id);
GO

-- 8. Delays & Bottlenecks Log (NO ACTION on trip_id prevents Error 1785)
CREATE TABLE dbo.FL_Delays (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Delays PRIMARY KEY,
    trip_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_delays_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id) ON DELETE NO ACTION,
    stop_id NVARCHAR(255) NULL CONSTRAINT FK_FL_delays_stop FOREIGN KEY REFERENCES dbo.FL_Trip_Stops(id) ON DELETE NO ACTION,
    driver_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_delays_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_delays_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id),
    reason NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    start_time NVARCHAR(50) NOT NULL,
    end_time NVARCHAR(50) NULL,
    duration_minutes INT NULL,
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    gps_accuracy FLOAT NULL,
    is_resolved INT NULL CONSTRAINT DF_FL_delays_resolved DEFAULT 0,
    photo_id NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_delays_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_delays_trip ON dbo.FL_Delays(trip_id);
GO

-- 9. Photos (NO ACTION prevents Multiple Cascade Error 1785)
CREATE TABLE dbo.FL_Photos (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Photos PRIMARY KEY,
    trip_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_photos_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id) ON DELETE NO ACTION,
    stop_id NVARCHAR(255) NULL CONSTRAINT FK_FL_photos_stop FOREIGN KEY REFERENCES dbo.FL_Trip_Stops(id) ON DELETE NO ACTION,
    driver_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_photos_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_photos_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id),
    photo_type NVARCHAR(50) NOT NULL,
    file_path NVARCHAR(MAX) NOT NULL,
    file_size INT NOT NULL,
    mime_type NVARCHAR(50) NOT NULL,
    [timestamp] NVARCHAR(50) NOT NULL,
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    gps_accuracy FLOAT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_photos_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_photos_trip ON dbo.FL_Photos(trip_id);
GO

-- 10. Real-time GPS Telemetry & Events (NO ACTION prevents Error 1785)
CREATE TABLE dbo.FL_Trip_Events (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Trip_Events PRIMARY KEY,
    trip_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_trip_events_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id) ON DELETE NO ACTION,
    stop_id NVARCHAR(255) NULL CONSTRAINT FK_FL_trip_events_stop FOREIGN KEY REFERENCES dbo.FL_Trip_Stops(id) ON DELETE NO ACTION,
    event_type NVARCHAR(50) NOT NULL,
    [timestamp] NVARCHAR(50) NOT NULL,
    driver_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_trip_events_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_trip_events_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id),
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    gps_accuracy FLOAT NULL,
    details NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_trip_events_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_events_trip_time ON dbo.FL_Trip_Events(trip_id, [timestamp]);
GO

-- 11. Security Audit Logs
CREATE TABLE dbo.FL_Audit_Logs (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Audit_Logs PRIMARY KEY,
    trip_id NVARCHAR(255) NULL,
    action NVARCHAR(100) NOT NULL,
    field_changed NVARCHAR(100) NULL,
    original_value NVARCHAR(MAX) NULL,
    new_value NVARCHAR(MAX) NULL,
    changed_by NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_audit_logs_user FOREIGN KEY REFERENCES dbo.FL_Users(id),
    reason NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_audit_logs_created DEFAULT SYSUTCDATETIME()
);
GO

-- 12. Vehicle Compliance Documents
CREATE TABLE dbo.FL_Vehicle_Documents (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Vehicle_Documents PRIMARY KEY,
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_vdocs_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id) ON DELETE CASCADE,
    document_type NVARCHAR(50) NOT NULL CONSTRAINT CK_FL_vdocs_type CHECK (document_type IN ('REGISTRATION_CERTIFICATE', 'INSURANCE_POLICY', 'FITNESS_CERTIFICATE', 'POLLUTION_UNDER_CONTROL', 'NATIONAL_PERMIT', 'OTHER')),
    title NVARCHAR(255) NOT NULL,
    document_number NVARCHAR(100) NOT NULL,
    issue_date NVARCHAR(50) NULL,
    expiry_date NVARCHAR(50) NOT NULL,
    issuing_authority NVARCHAR(255) NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_vdocs_status DEFAULT 'VALID' CONSTRAINT CK_FL_vdocs_status CHECK (status IN ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'PENDING_VERIFICATION')),
    file_path NVARCHAR(MAX) NULL,
    file_url NVARCHAR(MAX) NULL,
    file_name NVARCHAR(255) NULL,
    file_size INT NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_vdocs_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_FL_vdocs_updated DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_vehicle_docs_vehicle ON dbo.FL_Vehicle_Documents(vehicle_id, expiry_date);
GO

-- 13. Driver Compliance Documents
CREATE TABLE dbo.FL_Driver_Documents (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Driver_Documents PRIMARY KEY,
    driver_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_ddocs_driver FOREIGN KEY REFERENCES dbo.FL_Drivers(id) ON DELETE CASCADE,
    document_type NVARCHAR(50) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    document_number NVARCHAR(100) NOT NULL,
    issue_date NVARCHAR(50) NULL,
    expiry_date NVARCHAR(50) NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_ddocs_status DEFAULT 'VERIFIED' CONSTRAINT CK_FL_ddocs_status CHECK (status IN ('VERIFIED', 'PENDING', 'EXPIRED')),
    file_path NVARCHAR(MAX) NULL,
    file_url NVARCHAR(MAX) NULL,
    file_name NVARCHAR(255) NULL,
    file_size INT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_ddocs_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_driver_docs_driver ON dbo.FL_Driver_Documents(driver_id);
GO

-- 14. Maintenance & Service Records
CREATE TABLE dbo.FL_Maintenance_Records (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Maintenance_Records PRIMARY KEY,
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_maint_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id) ON DELETE CASCADE,
    service_date NVARCHAR(50) NOT NULL,
    odometer_km INT NOT NULL,
    maintenance_type NVARCHAR(50) NOT NULL CONSTRAINT CK_FL_maint_type CHECK (maintenance_type IN ('PREVENTIVE', 'CORRECTIVE', 'TIRE_ROTATION', 'STATUTORY_INSPECTION', 'BREAKDOWN')),
    description NVARCHAR(MAX) NOT NULL,
    service_center NVARCHAR(255) NOT NULL,
    cost_amount FLOAT NOT NULL,
    currency NVARCHAR(10) NULL CONSTRAINT DF_FL_maint_currency DEFAULT 'INR',
    invoice_reference NVARCHAR(100) NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_maint_status DEFAULT 'COMPLETED' CONSTRAINT CK_FL_maint_status CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    performed_by NVARCHAR(255) NULL,
    next_service_due_km INT NULL,
    next_service_due_date NVARCHAR(50) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_maint_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_maintenance_vehicle ON dbo.FL_Maintenance_Records(vehicle_id, service_date);
GO

-- 15. Fuel Log Transactions
CREATE TABLE dbo.FL_Fuel_Transactions (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Fuel_Transactions PRIMARY KEY,
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_fuel_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id) ON DELETE CASCADE,
    driver_id NVARCHAR(255) NULL CONSTRAINT FK_FL_fuel_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    trip_id NVARCHAR(255) NULL CONSTRAINT FK_FL_fuel_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id),
    fueling_date NVARCHAR(50) NOT NULL,
    quantity_liters FLOAT NOT NULL,
    rate_per_liter FLOAT NOT NULL,
    total_cost FLOAT NOT NULL,
    odometer_km INT NOT NULL,
    fuel_station NVARCHAR(255) NOT NULL,
    payment_mode NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_fuel_payment DEFAULT 'FLEET_CARD' CONSTRAINT CK_FL_fuel_payment CHECK (payment_mode IN ('FLEET_CARD', 'CASH', 'CORPORATE_UPI', 'DIRECT_BILLING')),
    receipt_reference NVARCHAR(100) NULL,
    notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_fuel_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_fuel_vehicle ON dbo.FL_Fuel_Transactions(vehicle_id, fueling_date);
GO

-- 16. Traffic Challans
CREATE TABLE dbo.FL_Vehicle_Challans (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Vehicle_Challans PRIMARY KEY,
    vehicle_id NVARCHAR(255) NOT NULL CONSTRAINT FK_FL_challans_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id) ON DELETE CASCADE,
    challan_number NVARCHAR(100) NOT NULL,
    [date] NVARCHAR(50) NOT NULL,
    violation_reason NVARCHAR(MAX) NOT NULL,
    amount FLOAT NOT NULL,
    status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_challans_status DEFAULT 'PENDING' CONSTRAINT CK_FL_challans_status CHECK (status IN ('PENDING', 'PAID')),
    location NVARCHAR(255) NULL,
    payment_date NVARCHAR(50) NULL,
    receipt_number NVARCHAR(100) NULL,
    proof_url NVARCHAR(MAX) NULL,
    proof_name NVARCHAR(255) NULL,
    proof_size INT NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_challans_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL CONSTRAINT DF_FL_challans_updated DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_vehicle_challans_vehicle ON dbo.FL_Vehicle_Challans(vehicle_id, status);
GO

-- 17. Operational Exceptions & Alerts
CREATE TABLE dbo.FL_Operational_Exceptions (
    id NVARCHAR(255) NOT NULL CONSTRAINT PK_FL_Operational_Exceptions PRIMARY KEY,
    severity NVARCHAR(20) NOT NULL CONSTRAINT CK_FL_exceptions_severity CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    category NVARCHAR(50) NOT NULL CONSTRAINT CK_FL_exceptions_cat CHECK (category IN ('DELIVERY_DELAY', 'ROUTE_DEVIATION', 'EXTENDED_STOP', 'DOCUMENT_EXPIRING', 'GEOFENCE_VIOLATION', 'MAINTENANCE_DUE', 'SYSTEM_SYNC')),
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    vehicle_id NVARCHAR(255) NULL CONSTRAINT FK_FL_exceptions_vehicle FOREIGN KEY REFERENCES dbo.FL_Vehicles(id),
    driver_id NVARCHAR(255) NULL CONSTRAINT FK_FL_exceptions_driver FOREIGN KEY REFERENCES dbo.FL_Users(id),
    trip_id NVARCHAR(255) NULL CONSTRAINT FK_FL_exceptions_trip FOREIGN KEY REFERENCES dbo.FL_Trips(id),
    location_context NVARCHAR(MAX) NULL,
    is_acknowledged INT NULL CONSTRAINT DF_FL_exceptions_ack DEFAULT 0,
    acknowledged_by NVARCHAR(255) NULL CONSTRAINT FK_FL_exceptions_ack_user FOREIGN KEY REFERENCES dbo.FL_Users(id),
    acknowledged_at DATETIME2 NULL,
    resolution_status NVARCHAR(50) NOT NULL CONSTRAINT DF_FL_exceptions_status DEFAULT 'OPEN' CONSTRAINT CK_FL_exceptions_res CHECK (resolution_status IN ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED')),
    resolution_notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_FL_exceptions_created DEFAULT SYSUTCDATETIME()
);
CREATE INDEX idx_FL_exceptions_status ON dbo.FL_Operational_Exceptions(resolution_status, severity);
CREATE INDEX idx_FL_exceptions_trip ON dbo.FL_Operational_Exceptions(trip_id);
GO

-- ==============================================================================
-- STEP 4: CREATE SYNONYMS (Allows code to query 'users' or 'trips' seamlessly)
-- ==============================================================================
DROP SYNONYM IF EXISTS dbo.users;
DROP SYNONYM IF EXISTS dbo.vehicles;
DROP SYNONYM IF EXISTS dbo.drivers;
DROP SYNONYM IF EXISTS dbo.destinations;
DROP SYNONYM IF EXISTS dbo.trips;
DROP SYNONYM IF EXISTS dbo.trip_stops;
DROP SYNONYM IF EXISTS dbo.activities;
DROP SYNONYM IF EXISTS dbo.delays;
DROP SYNONYM IF EXISTS dbo.photos;
DROP SYNONYM IF EXISTS dbo.trip_events;
DROP SYNONYM IF EXISTS dbo.audit_logs;
DROP SYNONYM IF EXISTS dbo.vehicle_documents;
DROP SYNONYM IF EXISTS dbo.driver_documents;
DROP SYNONYM IF EXISTS dbo.maintenance_records;
DROP SYNONYM IF EXISTS dbo.fuel_transactions;
DROP SYNONYM IF EXISTS dbo.vehicle_challans;
DROP SYNONYM IF EXISTS dbo.operational_exceptions;
DROP SYNONYM IF EXISTS dbo._schema_migrations;
GO

CREATE SYNONYM dbo.users FOR dbo.FL_Users;
CREATE SYNONYM dbo.vehicles FOR dbo.FL_Vehicles;
CREATE SYNONYM dbo.drivers FOR dbo.FL_Drivers;
CREATE SYNONYM dbo.destinations FOR dbo.FL_Destinations;
CREATE SYNONYM dbo.trips FOR dbo.FL_Trips;
CREATE SYNONYM dbo.trip_stops FOR dbo.FL_Trip_Stops;
CREATE SYNONYM dbo.activities FOR dbo.FL_Activities;
CREATE SYNONYM dbo.delays FOR dbo.FL_Delays;
CREATE SYNONYM dbo.photos FOR dbo.FL_Photos;
CREATE SYNONYM dbo.trip_events FOR dbo.FL_Trip_Events;
CREATE SYNONYM dbo.audit_logs FOR dbo.FL_Audit_Logs;
CREATE SYNONYM dbo.vehicle_documents FOR dbo.FL_Vehicle_Documents;
CREATE SYNONYM dbo.driver_documents FOR dbo.FL_Driver_Documents;
CREATE SYNONYM dbo.maintenance_records FOR dbo.FL_Maintenance_Records;
CREATE SYNONYM dbo.fuel_transactions FOR dbo.FL_Fuel_Transactions;
CREATE SYNONYM dbo.vehicle_challans FOR dbo.FL_Vehicle_Challans;
CREATE SYNONYM dbo.operational_exceptions FOR dbo.FL_Operational_Exceptions;
CREATE SYNONYM dbo._schema_migrations FOR dbo.FL_Schema_Migrations;
GO

-- ==============================================================================
-- STEP 5: PROVISION INITIAL OPERATIONS MANAGER (admin@hosexperts.com / Admin123)
-- ==============================================================================
IF NOT EXISTS (SELECT 1 FROM dbo.FL_Users WHERE email = 'admin@hosexperts.com')
BEGIN
    INSERT INTO dbo.FL_Users (id, name, email, password_hash, role, phone)
    VALUES (
        NEWID(),
        N'Operations Manager',
        N'admin@hosexperts.com',
        N'$2a$10$0d0K.bO6yV6sF0xU2b5mquL6sYtEHzqQ1c0pQd1G3mXyZ4vA8jG2S', -- Admin123 bcrypt hash
        N'MANAGER',
        N'+91 98100 00000'
    );
END
GO

PRINT '==============================================================================';
PRINT '🎉 SUCCESS: All FL_* tables, indexes, and synonyms created in test_operation!';
PRINT '==============================================================================';
GO
