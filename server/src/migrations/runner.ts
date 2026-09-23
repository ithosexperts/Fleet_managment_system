import { query, withTransaction } from '../db';
import { generateAreaCode } from '../services/areaCode';

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: string;
}

export interface MigrationResult {
  currentVersion: number;
  appliedCount: number;
  migrations: MigrationRecord[];
}

type MigrationClient = {
  query: (text: string, values?: unknown[]) => Promise<any>;
};
type Migration = {
  version: number;
  name: string;
  up: (client: MigrationClient) => Promise<void>;
};

/**
 * Ensures the migration catalog table exists.
 */
async function ensureMigrationCatalog(client: MigrationClient = { query }): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

/**
 * Returns all migration versions already applied to this database.
 */
export async function getAppliedMigrations(): Promise<MigrationRecord[]> {
  await ensureMigrationCatalog();
  const result = await query<MigrationRecord>(
    `SELECT version, name, applied_at FROM _schema_migrations ORDER BY version ASC`
  );
  return result.rows;
}

/**
 * Canonical ordered migrations.
 * Each migration is executed inside a single atomic transaction.
 */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: '001_initial_core_schema',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT CHECK(role IN ('DRIVER', 'MANAGER')) NOT NULL,
          phone TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS vehicles (
          id TEXT PRIMARY KEY,
          vehicle_number TEXT UNIQUE NOT NULL,
          vehicle_type TEXT NOT NULL,
          model TEXT NOT NULL,
          assigned_driver_id TEXT REFERENCES users(id),
          status TEXT CHECK(status IN ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'INACTIVE')) DEFAULT 'AVAILABLE',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS drivers (
          id TEXT PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          employee_id TEXT UNIQUE NOT NULL,
          assigned_vehicle_id TEXT REFERENCES vehicles(id),
          status TEXT CHECK(status IN ('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'INACTIVE')) DEFAULT 'AVAILABLE',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS destinations (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          contact_name TEXT,
          contact_number TEXT,
          geofence_radius_meters INTEGER DEFAULT 150,
          notes TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS trips (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          driver_id TEXT NOT NULL REFERENCES users(id),
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
          starting_location TEXT NOT NULL,
          starting_latitude REAL,
          starting_longitude REAL,
          purpose TEXT NOT NULL,
          reference_number TEXT,
          planned_departure_time TEXT NOT NULL,
          actual_start_time TEXT,
          return_start_time TEXT,
          base_arrival_time TEXT,
          completion_time TEXT,
          status TEXT CHECK(status IN ('PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING', 'COMPLETED', 'CANCELLED')) DEFAULT 'ASSIGNED',
          total_delay_minutes INTEGER DEFAULT 0,
          calculated_distance_km REAL,
          notes TEXT,
          created_by TEXT REFERENCES users(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS trip_stops (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          destination_id TEXT REFERENCES destinations(id),
          stop_number INTEGER NOT NULL,
          destination_name TEXT NOT NULL,
          address TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          geofence_radius_meters INTEGER DEFAULT 150,
          planned_arrival_time TEXT NOT NULL,
          actual_arrival_time TEXT,
          actual_departure_time TEXT,
          arrival_latitude REAL,
          arrival_longitude REAL,
          departure_latitude REAL,
          departure_longitude REAL,
          arrival_status TEXT CHECK(arrival_status IN ('ON_TIME', 'EARLY', 'LATE', 'UNKNOWN')),
          arrival_diff_minutes INTEGER,
          status TEXT CHECK(status IN ('PENDING', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED')) DEFAULT 'PENDING',
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS activities (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          stop_id TEXT NOT NULL REFERENCES trip_stops(id) ON DELETE CASCADE,
          activity_type TEXT NOT NULL,
          status TEXT CHECK(status IN ('COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'OTHER')) DEFAULT 'COMPLETED',
          start_time TEXT,
          completion_time TEXT,
          quantity INTEGER,
          reference_number TEXT,
          recipient_name TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS delays (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          stop_id TEXT REFERENCES trip_stops(id),
          driver_id TEXT NOT NULL REFERENCES users(id),
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
          reason TEXT NOT NULL,
          description TEXT,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration_minutes INTEGER,
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          is_resolved INTEGER DEFAULT 0,
          photo_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          stop_id TEXT REFERENCES trip_stops(id),
          driver_id TEXT NOT NULL REFERENCES users(id),
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
          photo_type TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS trip_events (
          id TEXT PRIMARY KEY,
          trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
          stop_id TEXT REFERENCES trip_stops(id),
          event_type TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          driver_id TEXT NOT NULL REFERENCES users(id),
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id),
          latitude REAL,
          longitude REAL,
          gps_accuracy REAL,
          details TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          trip_id TEXT,
          action TEXT NOT NULL,
          field_changed TEXT,
          original_value TEXT,
          new_value TEXT,
          changed_by TEXT NOT NULL REFERENCES users(id),
          reason TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS google_sheet_sync (
          id TEXT PRIMARY KEY,
          sheet_name TEXT NOT NULL,
          record_id TEXT NOT NULL,
          sync_status TEXT CHECK(sync_status IN ('SYNCED', 'PENDING', 'FAILED')) DEFAULT 'PENDING',
          error_message TEXT,
          last_synced_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_trips_driver_status ON trips(driver_id, status);
        CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
        CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_order ON trip_stops(trip_id, stop_number);
        CREATE INDEX IF NOT EXISTS idx_events_trip_time ON trip_events(trip_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_delays_trip ON delays(trip_id);
        CREATE INDEX IF NOT EXISTS idx_photos_trip ON photos(trip_id);
        CREATE INDEX IF NOT EXISTS idx_activities_stop ON activities(stop_id);
        CREATE INDEX IF NOT EXISTS idx_sheet_sync ON google_sheet_sync(sheet_name, sync_status);
      `);
    }
  },
  {
    version: 2,
    name: '002_add_enterprise_compliance_and_maintenance',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_documents (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
          document_type TEXT NOT NULL CHECK(document_type IN ('REGISTRATION_CERTIFICATE', 'INSURANCE_POLICY', 'FITNESS_CERTIFICATE', 'POLLUTION_UNDER_CONTROL', 'NATIONAL_PERMIT', 'OTHER')),
          title TEXT NOT NULL,
          document_number TEXT NOT NULL,
          issue_date TEXT,
          expiry_date TEXT NOT NULL,
          issuing_authority TEXT,
          status TEXT CHECK(status IN ('VALID', 'EXPIRING_SOON', 'EXPIRED', 'PENDING_VERIFICATION')) DEFAULT 'VALID',
          file_path TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS maintenance_records (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
          service_date TEXT NOT NULL,
          odometer_km INTEGER NOT NULL,
          maintenance_type TEXT NOT NULL CHECK(maintenance_type IN ('PREVENTIVE', 'CORRECTIVE', 'TIRE_ROTATION', 'STATUTORY_INSPECTION', 'BREAKDOWN')),
          description TEXT NOT NULL,
          service_center TEXT NOT NULL,
          cost_amount REAL NOT NULL,
          currency TEXT DEFAULT 'INR',
          invoice_reference TEXT,
          status TEXT CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'COMPLETED',
          performed_by TEXT,
          next_service_due_km INTEGER,
          next_service_due_date TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS fuel_transactions (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
          driver_id TEXT REFERENCES users(id),
          trip_id TEXT REFERENCES trips(id),
          fueling_date TEXT NOT NULL,
          quantity_liters REAL NOT NULL,
          rate_per_liter REAL NOT NULL,
          total_cost REAL NOT NULL,
          odometer_km INTEGER NOT NULL,
          fuel_station TEXT NOT NULL,
          payment_mode TEXT CHECK(payment_mode IN ('FLEET_CARD', 'CASH', 'CORPORATE_UPI', 'DIRECT_BILLING')) DEFAULT 'FLEET_CARD',
          receipt_reference TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS operational_exceptions (
          id TEXT PRIMARY KEY,
          severity TEXT CHECK(severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')) NOT NULL,
          category TEXT CHECK(category IN ('DELIVERY_DELAY', 'ROUTE_DEVIATION', 'EXTENDED_STOP', 'DOCUMENT_EXPIRING', 'GEOFENCE_VIOLATION', 'MAINTENANCE_DUE', 'SYSTEM_SYNC')) NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          vehicle_id TEXT REFERENCES vehicles(id),
          driver_id TEXT REFERENCES users(id),
          trip_id TEXT REFERENCES trips(id),
          location_context TEXT,
          is_acknowledged INTEGER DEFAULT 0,
          acknowledged_by TEXT REFERENCES users(id),
          acknowledged_at TIMESTAMPTZ,
          resolution_status TEXT CHECK(resolution_status IN ('OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED')) DEFAULT 'OPEN',
          resolution_notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_vehicle_docs_vehicle ON vehicle_documents(vehicle_id, expiry_date);
        CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle ON maintenance_records(vehicle_id, service_date);
        CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_transactions(vehicle_id, fueling_date);
        CREATE INDEX IF NOT EXISTS idx_exceptions_status ON operational_exceptions(resolution_status, severity);
        CREATE INDEX IF NOT EXISTS idx_exceptions_trip ON operational_exceptions(trip_id);
      `);
    }
  },
  {
    version: 3,
    name: '003_add_erp_references_and_performance_indexes',
    up: async (client) => {
      await client.query(`
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fleet_unit_id TEXT;
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS chassis_number TEXT;
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS telematics_imei TEXT;
        ALTER TABLE trips ADD COLUMN IF NOT EXISTS sap_shipment_num TEXT;
        ALTER TABLE trips ADD COLUMN IF NOT EXISTS erp_delivery_doc TEXT;
        ALTER TABLE trips ADD COLUMN IF NOT EXISTS cost_center TEXT;
        CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
        CREATE INDEX IF NOT EXISTS idx_destinations_active ON destinations(is_active);
      `);
    }
  },
  {
    version: 4,
    name: '004_add_destination_area_code',
    up: async (client) => {
      await client.query(`
        ALTER TABLE destinations ADD COLUMN IF NOT EXISTS area_code TEXT;
        CREATE INDEX IF NOT EXISTS idx_destinations_area_code ON destinations(area_code);
      `);
    }
  },
  {
    version: 5,
    name: '005_generate_destination_area_codes',
    up: async (client) => {
      const destinations = (await client.query(`
        SELECT id, name, address FROM destinations
        WHERE area_code IS NULL OR area_code = ''
        ORDER BY created_at ASC, id ASC
      `)).rows as { id: string; name: string; address: string }[];

      for (const destination of destinations) {
        await client.query(
          `UPDATE destinations SET area_code = $1 WHERE id = $2`,
          [await generateAreaCode(destination.name, destination.address), destination.id]
        );
      }

      await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_area_code_unique ON destinations(area_code)`);
    }
  },
  {
    version: 6,
    name: '006_add_driver_vehicle_docs_and_photos',
    up: async (client) => {
      await client.query(`
        ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS photo_url TEXT;
        ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT;
        ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_category TEXT;
        ALTER TABLE drivers ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
        CREATE TABLE IF NOT EXISTS driver_documents (
          id TEXT PRIMARY KEY,
          driver_id TEXT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
          document_type TEXT NOT NULL,
          title TEXT NOT NULL,
          document_number TEXT NOT NULL,
          issue_date TEXT,
          expiry_date TEXT,
          status TEXT CHECK(status IN ('VERIFIED', 'PENDING', 'EXPIRED')) DEFAULT 'VERIFIED',
          file_path TEXT,
          file_url TEXT,
          file_name TEXT,
          file_size INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_driver_docs_driver ON driver_documents(driver_id);
        ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
        ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
        ALTER TABLE vehicle_documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
      `);
    }
  },
  {
    version: 7,
    name: '007_add_vehicle_challans_and_proofs',
    up: async (client) => {
      await client.query(`
        CREATE TABLE IF NOT EXISTS vehicle_challans (
          id TEXT PRIMARY KEY,
          vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
          challan_number TEXT NOT NULL,
          date TEXT NOT NULL,
          violation_reason TEXT NOT NULL,
          amount DOUBLE PRECISION NOT NULL,
          status TEXT CHECK(status IN ('PENDING', 'PAID')) DEFAULT 'PENDING',
          location TEXT,
          payment_date TEXT,
          receipt_number TEXT,
          proof_url TEXT,
          proof_name TEXT,
          proof_size INTEGER,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_vehicle_challans_vehicle ON vehicle_challans(vehicle_id, status);
      `);
    }
  }
];

/**
 * Executes all pending schema migrations idempotently.
 */
export async function runMigrations(): Promise<MigrationResult> {
  await ensureMigrationCatalog();
  const applied = await getAppliedMigrations();
  const appliedVersions = new Set(applied.map((m) => m.version));

  let appliedCount = 0;

  for (const migration of MIGRATIONS) {
    if (!appliedVersions.has(migration.version)) {
      console.log(`[Migrations] Applying version ${migration.version}: ${migration.name}...`);
      
      await withTransaction(async (client) => {
        await migration.up(client);
        await client.query(
          `INSERT INTO _schema_migrations (version, name, applied_at) VALUES ($1, $2, NOW())`,
          [migration.version, migration.name]
        );
      });
      appliedCount++;
      console.log(`[Migrations] ✓ Version ${migration.version} applied successfully.`);
    }
  }

  const finalApplied = await getAppliedMigrations();
  const currentVersion = finalApplied.length > 0 ? finalApplied[finalApplied.length - 1].version : 0;

  return {
    currentVersion,
    appliedCount,
    migrations: finalApplied
  };
}

if (require.main === module) {
  runMigrations()
    .then((result) => {
    console.log(`[Migrations] Execution complete. Current schema version: ${result.currentVersion} (${result.appliedCount} applied this run).`);
    process.exit(0);
    })
    .catch((err) => {
    console.error('[Migrations] Execution failed:', err);
    process.exit(1);
    });
}
