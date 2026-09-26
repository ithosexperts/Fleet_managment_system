import { getDatabaseDriver, initDatabase, query, withTransaction } from './db';
import { getAppliedMigrations } from './migrations/runner';
import { v4 as uuidv4 } from 'uuid';

export async function runDatabaseIntegrityTests(): Promise<boolean> {
  let passed = 0;
  let failed = 0;
  const assert = (condition: boolean, name: string) => {
    condition ? passed++ : failed++;
    console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}`);
  };

  try {
    await initDatabase();
    const applied = await getAppliedMigrations();
    assert(applied.length >= 7, 'Migration catalog tracks all versions');
    assert([1, 2, 3, 4, 7].every((version) => applied.some((migration) => migration.version === version)), 'Required migrations are applied');

    const requiredTables = ['users', 'vehicles', 'drivers', 'destinations', 'trips', 'trip_stops', 'activities', 'delays', 'photos', 'trip_events', 'vehicle_documents', 'maintenance_records', 'fuel_transactions', 'operational_exceptions', 'audit_logs', 'google_sheet_sync', 'vehicle_challans'];
    const driver = getDatabaseDriver();
    const tables = driver === 'sqlserver'
      ? (await query<{ name: string }>(`SELECT name FROM sys.tables WHERE is_ms_shipped = 0`)).rows.map((row) => row.name)
      : driver === 'sqlite'
      ? (await query<{ name: string }>(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`)).rows.map((row) => row.name)
      : (await query<{ tablename: string }>(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`)).rows.map((row) => row.tablename);
    for (const table of requiredTables) assert(tables.includes(table), `Table exists: ${table}`);

    let foreignKeyBlocked = false;
    try {
      await query(`INSERT INTO trip_stops (id, trip_id, stop_number, destination_name, address, latitude, longitude, planned_arrival_time) VALUES ($1, 'non-existent-trip-id', 1, 'Fake Stop', 'Fake Address', 28.5, 77.2, '10:00')`, [uuidv4()]);
    } catch {
      foreignKeyBlocked = true;
    }
    assert(foreignKeyBlocked, 'Foreign key constraint rejects orphaned stops');

    const columns = async (table: string) => {
      if (driver === 'sqlite') {
        return (await query<{ name: string }>(`PRAGMA table_info(${table})`)).rows.map((row) => row.name);
      }
      if (driver === 'sqlserver') {
        return (await query<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table])).rows.map((row) => row.column_name);
      }
      return (await query<{ column_name: string }>(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1`, [table])).rows.map((row) => row.column_name);
    };
    const vehicleColumns = await columns('vehicles');
    assert(vehicleColumns.includes('fleet_unit_id') && vehicleColumns.includes('chassis_number'), 'Vehicle ERP columns exist');
    const destinationColumns = await columns('destinations');
    assert(destinationColumns.includes('area_code'), 'Destination area code exists');
    const tripColumns = await columns('trips');
    assert(tripColumns.includes('sap_shipment_num') && tripColumns.includes('cost_center'), 'Trip ERP columns exist');

    const testTripId = `TR-TEST-${Date.now()}`;
    const before = Number((await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM trips WHERE id = $1', [testTripId])).rows[0].count);
    try {
      await withTransaction(async (client) => {
        await client.query(`INSERT INTO trips (id, date, driver_id, vehicle_id, starting_location, purpose, planned_departure_time, status) SELECT $1, '2026-09-13', u.id, v.id, 'Okhla', 'Test', '08:00', 'PLANNED' FROM users u, vehicles v LIMIT 1`, [testTripId]);
        throw new Error('Simulated rollback');
      });
    } catch {
      const after = Number((await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM trips WHERE id = $1', [testTripId])).rows[0].count);
      assert(before === after, 'Transaction rollback is atomic');
    }

    const destination = (await query<{ id: string; name: string }>('SELECT id, name FROM destinations WHERE is_active = 1 LIMIT 1')).rows[0];
    if (destination) {
      const count = Number((await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM destinations WHERE id = $1 AND is_active = 1', [destination.id])).rows[0].count);
      assert(count === 1, 'Active destination query works');
    }

    console.log(`Integrity tests: ${passed} passed, ${failed} failed`);
    return failed === 0;
  } catch (error) {
    console.error('Test suite runtime failure:', error);
    return false;
  }
}

if (require.main === module) {
  runDatabaseIntegrityTests().then((ok) => process.exit(ok ? 0 : 1));
}
