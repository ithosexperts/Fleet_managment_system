import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { query, withTransaction } from '../db';
import { requireAuth, requireRole, logAudit, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { generateAreaCode } from '../services/areaCode';
import { hosexpertsSync } from '../services/hosexpertsSync';

const router = Router();

// ==========================================
// VEHICLES
// ==========================================

function toFrontendDocType(typeStr?: string): string {
  if (!typeStr) return 'OTHER';
  const upper = String(typeStr).toUpperCase();
  if (upper.includes('REGISTRATION') || upper === 'RC') return 'RC';
  if (upper.includes('INSURANCE')) return 'INSURANCE';
  if (upper.includes('FITNESS')) return 'FITNESS';
  if (upper.includes('POLLUTION') || upper === 'PUC') return 'PUC';
  if (upper.includes('PERMIT')) return 'PERMIT';
  return 'OTHER';
}

function toDbDocumentType(typeStr?: string): string {
  if (!typeStr) return 'OTHER';
  const upper = String(typeStr).toUpperCase();
  if (upper.includes('REGISTRATION') || upper === 'RC') return 'REGISTRATION_CERTIFICATE';
  if (upper.includes('INSURANCE')) return 'INSURANCE_POLICY';
  if (upper.includes('FITNESS')) return 'FITNESS_CERTIFICATE';
  if (upper.includes('POLLUTION') || upper === 'PUC') return 'POLLUTION_UNDER_CONTROL';
  if (upper.includes('PERMIT')) return 'NATIONAL_PERMIT';
  if (['REGISTRATION_CERTIFICATE', 'INSURANCE_POLICY', 'FITNESS_CERTIFICATE', 'POLLUTION_UNDER_CONTROL', 'NATIONAL_PERMIT', 'OTHER'].includes(upper)) {
    return upper;
  }
  return 'OTHER';
}

function normalizeDocTypeKey(typeStr?: string): string {
  return toFrontendDocType(typeStr);
}

async function resolveDriverUserId(driverOrUserId?: string | null): Promise<string | null> {
  if (!driverOrUserId) return null;
  // 1. Is it already a user ID?
  const userRes = await query(`SELECT id FROM users WHERE id = $1`, [driverOrUserId]);
  if (userRes.rows.length > 0) return (userRes.rows[0] as any).id;

  // 2. Is it a driver table ID?
  const driverRes = await query(`SELECT user_id FROM drivers WHERE id = $1`, [driverOrUserId]);
  if (driverRes.rows.length > 0) return (driverRes.rows[0] as any).user_id;

  // 3. Is it an employee ID?
  const empRes = await query(`SELECT user_id FROM drivers WHERE UPPER(employee_id) = UPPER($1)`, [driverOrUserId]);
  if (empRes.rows.length > 0) return (empRes.rows[0] as any).user_id;

  return null;
}

router.get('/vehicles', requireAuth, async (req, res) => {
  const vehicles = (await query(`
    SELECT v.*, u.name as assigned_driver_name,
           (SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id) as total_trips,
           (SELECT id FROM trips WHERE vehicle_id = v.id AND status IN ('IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING') LIMIT 1) as active_trip_id
    FROM vehicles v
    LEFT JOIN users u ON v.assigned_driver_id = u.id
    ORDER BY v.created_at DESC
  `)).rows as any[];

  // Attach vehicle compliance documents and traffic challans
  for (const v of vehicles) {
    const rawDocs = (await query(`SELECT * FROM vehicle_documents WHERE vehicle_id = $1 ORDER BY expiry_date ASC`, [v.id])).rows as any[];
    v.documents = rawDocs.map((d) => ({
      ...d,
      type: normalizeDocTypeKey(d.document_type || d.type),
      document_type: d.document_type || d.type
    }));
    const challans = await query(`SELECT * FROM vehicle_challans WHERE vehicle_id = $1 ORDER BY date DESC`, [v.id]).catch(() => ({ rows: [] }));
    v.challans = challans.rows;
    const latestEvent = (await query(`
    SELECT latitude, longitude, gps_accuracy, timestamp, details
    FROM trip_events
    WHERE vehicle_id = $1 AND latitude IS NOT NULL AND longitude IS NOT NULL
    ORDER BY timestamp DESC
    LIMIT 1
  `, [v.id])).rows[0] as any;
    const activeTrip = v.active_trip_id ? (await query(`
    SELECT starting_latitude, starting_longitude, starting_location, status
    FROM trips
    WHERE id = $1
  `, [v.active_trip_id])).rows[0] as any : null;

    // Attach live telematics GPS coordinates
    if (latestEvent && typeof latestEvent.latitude === 'number' && typeof latestEvent.longitude === 'number') {
      v.latitude = latestEvent.latitude;
      v.longitude = latestEvent.longitude;
      v.gps_accuracy = latestEvent.gps_accuracy;
      v.last_location_time = latestEvent.timestamp;

      // Clean location string - ensure speed strings are not placed in current_location
      let locText = (latestEvent.details || '').trim();
      let extractedSpeed = 0;
      if (locText) {
        const speedMatch = locText.match(/(\d+(?:\.\d+)?)\s*km\/h/i);
        if (speedMatch) {
          extractedSpeed = parseFloat(speedMatch[1]);
          locText = locText.replace(/(\d+(?:\.\d+)?)\s*km\/h/i, '').replace(/^[,\s-]+|[,\s-]+$/g, '').trim();
        }
      }

      v.current_location = locText || (v.status === 'ON_TRIP' ? 'In Transit' : 'HoseXperts Central Depot');
      // Only report active speed if vehicle is on an active trip and has real telemetry
      v.speed_kmh = (v.status === 'ON_TRIP' && v.active_trip_id) ? (extractedSpeed || (latestEvent.speed ? Number(latestEvent.speed) : 0)) : 0;
      v.heading_deg = (latestEvent.heading ? Number(latestEvent.heading) : 0);
    } else if (v.active_trip_id) {
      if (activeTrip && typeof activeTrip.starting_latitude === 'number' && typeof activeTrip.starting_longitude === 'number') {
        v.latitude = activeTrip.starting_latitude;
        v.longitude = activeTrip.starting_longitude;
        v.current_location = activeTrip.starting_location || 'HoseXperts Central Depot';
        v.speed_kmh = 0;
        v.heading_deg = 0;
      }
    }

    // Fallback coordinates to Company Central Depot so vehicle is visible and trackable on fleet radar
    if (typeof v.latitude !== 'number' || typeof v.longitude !== 'number') {
      v.latitude = 28.5355;
      v.longitude = 77.2680;
      v.current_location = 'HoseXperts Central Depot';
      v.speed_kmh = 0;
      v.heading_deg = 0;
    }
  }

  return res.json({ vehicles });
});

router.post('/vehicles', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    vehicle_number,
    vehicle_type,
    model,
    assigned_driver_id,
    status = 'AVAILABLE',
    notes,
    fleet_unit_id,
    chassis_number,
    telematics_imei,
    photo_url,
    documents
  } = req.body;

  if (!vehicle_number || !vehicle_type || !model) {
    return res.status(400).json({ error: 'Vehicle number, type, and model are required' });
  }

  const id = uuidv4();
  try {
    const resolvedDriverUserId = await resolveDriverUserId(assigned_driver_id);

    await withTransaction(async (client) => {
      await client.query(`
      INSERT INTO vehicles (id, vehicle_number, vehicle_type, model, assigned_driver_id, status, notes, fleet_unit_id, chassis_number, telematics_imei, photo_url)
      VALUES ($1, UPPER($2), $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      id,
      vehicle_number,
      vehicle_type,
      model,
      resolvedDriverUserId,
      status,
      notes || null,
      fleet_unit_id || null,
      chassis_number || null,
      telematics_imei || null,
      photo_url || null
      ]);

      if (resolvedDriverUserId) {
        await client.query(`UPDATE drivers SET assigned_vehicle_id = $1 WHERE user_id = $2`, [id, resolvedDriverUserId]);
      }

      if (Array.isArray(documents)) {
        const docInsert = `
        INSERT INTO vehicle_documents (id, vehicle_id, document_type, title, document_number, issue_date, expiry_date, status, file_url, file_name, file_size)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
        for (const d of documents) {
          if (d.document_number) {
            await client.query(docInsert, [
              uuidv4(),
              id,
              toDbDocumentType(d.type || d.document_type),
              d.title || `${d.type || 'RC'} Certificate`,
              d.document_number,
              d.issue_date || null,
              d.expiry_date || '2030-01-01',
              d.status || 'VALID',
              d.file_url || null,
              d.file_name || null,
              d.file_size || null
            ]);
          }
        }
      }

      await logAudit({
        action: 'VEHICLE_CREATED',
        newValue: `Vehicle ${vehicle_number} (${model}) added`,
        changedBy: req.user!.id
      });
    });

    // Synchronize directly with company SQL Server FL_Vehicles via HoseXperts API
    hosexpertsSync.syncVehicle('insert', {
      id,
      vehicle_number,
      vehicle_type,
      model,
      assigned_driver_id: resolvedDriverUserId,
      status,
      notes,
      fleet_unit_id,
      chassis_number,
      telematics_imei,
      photo_url
    }).catch(e => console.error('[HoseXperts Sync Error]', e));

    if (Array.isArray(documents)) {
      for (const d of documents) {
        if (d.document_number) {
          hosexpertsSync.syncVehicleDocument('insert', {
            id: uuidv4(),
            vehicle_id: id,
            document_type: toDbDocumentType(d.type || d.document_type),
            title: d.title || `${d.type || 'RC'} Certificate`,
            document_number: d.document_number,
            issue_date: d.issue_date || null,
            expiry_date: d.expiry_date || '2030-01-01',
            status: d.status || 'VALID',
            file_url: d.file_url || null,
            file_name: d.file_name || null,
            file_size: d.file_size || null
          }).catch(e => console.error('[HoseXperts Sync Error]', e));
        }
      }
    }

    return res.status(201).json({ message: 'Vehicle created', id });
  } catch (err: any) {
    console.error('[Fleet Error] Failed to create vehicle:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A vehicle with this registration number already exists.' });
    }
    return res.status(400).json({ error: `Failed to create vehicle: ${err.message || 'Please verify input details.'}` });
  }
});

router.put('/vehicles/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    vehicle_number,
    vehicle_type,
    model,
    assigned_driver_id,
    status,
    notes,
    fleet_unit_id,
    chassis_number,
    telematics_imei,
    photo_url
  } = req.body;

  try {
    const resolvedDriverUserId = assigned_driver_id !== undefined ? await resolveDriverUserId(assigned_driver_id) : undefined;

    await query(`
      UPDATE vehicles
      SET vehicle_number = COALESCE(UPPER($1), vehicle_number),
          vehicle_type = COALESCE($2, vehicle_type),
          model = COALESCE($3, model),
          assigned_driver_id = CASE WHEN $4 IS NOT NULL THEN $5 ELSE assigned_driver_id END,
          status = COALESCE($6, status),
          notes = COALESCE($7, notes),
          fleet_unit_id = COALESCE($8, fleet_unit_id),
          chassis_number = COALESCE($9, chassis_number),
          telematics_imei = COALESCE($10, telematics_imei),
          photo_url = COALESCE($11, photo_url)
      WHERE id = $12
    `, [
      vehicle_number || null,
      vehicle_type || null,
      model || null,
      assigned_driver_id !== undefined ? 'SET' : null,
      resolvedDriverUserId,
      status || null,
      notes || null,
      fleet_unit_id || null,
      chassis_number || null,
      telematics_imei || null,
      photo_url || null,
      id
    ]);

    if (resolvedDriverUserId) {
      await query(`UPDATE drivers SET assigned_vehicle_id = $1 WHERE user_id = $2`, [id, resolvedDriverUserId]);
    }

    hosexpertsSync.syncVehicle('update', {
      vehicle_number,
      vehicle_type,
      model,
      assigned_driver_id: resolvedDriverUserId,
      status,
      notes,
      fleet_unit_id,
      chassis_number,
      telematics_imei,
      photo_url
    }, id).catch(e => console.error('[HoseXperts Sync Error]', e));

    return res.json({ message: 'Vehicle updated' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/vehicles/:id/history', requireAuth, async (req, res) => {
  const { id } = req.params;
  const trips = (await query(`
    SELECT t.*, u.name as driver_name,
           (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id) as total_stops
    FROM trips t
    LEFT JOIN users u ON t.driver_id = u.id
    WHERE t.vehicle_id = $1
    ORDER BY t.date DESC, t.planned_departure_time DESC
  `, [id])).rows;

  return res.json({ trips });
});

router.delete('/vehicles/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const vehicle = (await query(`SELECT * FROM vehicles WHERE id = $1`, [id])).rows[0] as any;
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  try {
    await withTransaction(async (client) => {
      // 1. Unassign from any drivers
      await client.query(`UPDATE drivers SET assigned_vehicle_id = NULL WHERE assigned_vehicle_id = $1`, [id]);

      // 2. Delete vehicle compliance documents and challans
      await client.query(`DELETE FROM vehicle_documents WHERE vehicle_id = $1`, [id]);
      await client.query(`DELETE FROM vehicle_challans WHERE vehicle_id = $1`, [id]);

      // 3. Find and cascade delete any trips recorded for this vehicle
      const tripRows = (await client.query(`SELECT id FROM trips WHERE vehicle_id = $1`, [id])).rows as any[];
      for (const t of tripRows) {
        await client.query(`DELETE FROM activities WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM photos WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM delays WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM trip_events WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM trip_telemetry WHERE trip_id = $1`, [t.id]).catch(() => {});
        await client.query(`DELETE FROM trip_stops WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM trips WHERE id = $1`, [t.id]);
      }

      // 4. Delete any remaining trip events referencing this vehicle
      await client.query(`DELETE FROM trip_events WHERE vehicle_id = $1`, [id]);

      // 5. Delete vehicle asset
      await client.query(`DELETE FROM vehicles WHERE id = $1`, [id]);
    });

    hosexpertsSync.syncVehicle('delete', {}, id).catch(e => console.error('[HoseXperts Sync Error]', e));

    logAudit({
      action: 'VEHICLE_DECOMMISSIONED',
      originalValue: vehicle.vehicle_number,
      changedBy: req.user!.id,
      reason: `Vehicle ${vehicle.vehicle_number} deleted by manager`
    });

    return res.json({ message: `Vehicle ${vehicle.vehicle_number} has been deleted.` });
  } catch (err: any) {
    console.error('[Delete Vehicle Error]', err);
    return res.status(400).json({ error: err.message || 'Failed to delete vehicle' });
  }
});

// ==========================================
// DRIVERS
// ==========================================

router.get('/drivers', requireAuth, async (req, res) => {
  const drivers = (await query(`
    SELECT d.*, u.name, u.email, u.phone, v.vehicle_number as assigned_vehicle_number,
           (SELECT COUNT(*) FROM trips WHERE driver_id = u.id) as total_trips,
           (SELECT id FROM trips WHERE driver_id = u.id AND status IN ('IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING') LIMIT 1) as active_trip_id
    FROM drivers d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN vehicles v ON d.assigned_vehicle_id = v.id
    ORDER BY u.name ASC
  `)).rows as any[];

  for (const d of drivers) {
    d.documents = (await query(`SELECT * FROM driver_documents WHERE driver_id = $1 ORDER BY expiry_date ASC`, [d.id])).rows;
  }

  return res.json({ drivers });
});

router.post('/drivers', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    employee_id,
    assigned_vehicle_id,
    status = 'AVAILABLE',
    avatar_url,
    license_number,
    license_category,
    emergency_phone,
    documents
  } = req.body;

  if (!name || !email || !password || !employee_id) {
    return res.status(400).json({ error: 'Name, email, password, and employee ID are required' });
  }

  const userId = uuidv4();
  const driverId = uuidv4();
  const hash = await bcrypt.hash(password, 10);

  try {
    await withTransaction(async (client) => {
      await client.query(`
      INSERT INTO users (id, name, email, password_hash, role, phone)
      VALUES ($1, $2, LOWER($3), $4, 'DRIVER', $5)
    `, [userId, name, email, hash, phone || null]);

      await client.query(`
      INSERT INTO drivers (id, user_id, employee_id, assigned_vehicle_id, status, avatar_url, license_number, license_category, emergency_phone)
      VALUES ($1, $2, UPPER($3), $4, $5, $6, $7, $8, $9)
    `, [
      driverId,
      userId,
      employee_id,
      assigned_vehicle_id || null,
      status,
      avatar_url || null,
      license_number || null,
      license_category || null,
      emergency_phone || null
      ]);

      if (Array.isArray(documents)) {
        const docInsert = `
        INSERT INTO driver_documents (id, driver_id, document_type, title, document_number, issue_date, expiry_date, status, file_url, file_name, file_size)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
        for (const d of documents) {
          if (d.document_number) {
            await client.query(docInsert, [
            uuidv4(),
            driverId,
            d.type || 'DRIVING_LICENSE',
            d.title || `${d.type || 'DRIVING_LICENSE'} Certificate`,
            d.document_number,
            d.issue_date || null,
            d.expiry_date || null,
            d.status || 'VERIFIED',
            d.file_url || null,
            d.file_name || null,
            d.file_size || null
            ]);
          }
        }
      }

      await logAudit({
      action: 'DRIVER_CREATED',
      newValue: `Driver ${name} (${employee_id}) created`,
      changedBy: req.user!.id
      });
    });

    hosexpertsSync.syncUser('insert', {
      id: userId,
      name,
      email,
      password_hash: hash,
      role: 'DRIVER',
      phone
    }).catch(e => console.error('[HoseXperts Sync Error]', e));

    hosexpertsSync.syncDriver('insert', {
      id: driverId,
      user_id: userId,
      employee_id,
      assigned_vehicle_id,
      status,
      avatar_url,
      license_number,
      license_category,
      emergency_phone
    }).catch(e => console.error('[HoseXperts Sync Error]', e));

    return res.status(201).json({ message: 'Driver created successfully', driverId, userId });
  } catch (err: any) {
    console.error('[Fleet Error] Failed to create driver:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'A driver with this email, phone, or license number already exists.' });
    }
    return res.status(400).json({ error: 'Failed to create driver. Please verify input details.' });
  }
});

router.put('/drivers/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, phone, assigned_vehicle_id, status, employee_id, avatar_url, license_number, license_category, emergency_phone, password } = req.body;

  const driver = (await query(`SELECT * FROM drivers WHERE id = $1`, [id])).rows[0] as any;
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  try {
    let passwordHash: string | null = null;
    if (password && String(password).trim().length > 0) {
      passwordHash = await bcrypt.hash(String(password).trim(), 10);
    }

    await withTransaction(async (client) => {
      if (passwordHash) {
        await client.query(`
          UPDATE users
          SET name = COALESCE($1, name), phone = COALESCE($2, phone), password_hash = $3
          WHERE id = $4
        `, [name || null, phone || null, passwordHash, driver.user_id]);
      } else {
        await client.query(`
          UPDATE users
          SET name = COALESCE($1, name), phone = COALESCE($2, phone)
          WHERE id = $3
        `, [name || null, phone || null, driver.user_id]);
      }

      await client.query(`
        UPDATE drivers
        SET assigned_vehicle_id = $1, status = COALESCE($2, status), employee_id = COALESCE(UPPER($3), employee_id),
            avatar_url = COALESCE($4, avatar_url), license_number = COALESCE($5, license_number),
            license_category = COALESCE($6, license_category), emergency_phone = COALESCE($7, emergency_phone)
        WHERE id = $8
      `, [
        assigned_vehicle_id || null,
        status || null,
        employee_id || null,
        avatar_url || null,
        license_number || null,
        license_category || null,
        emergency_phone || null,
        id
      ]);
    });

    return res.json({ message: 'Driver updated successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/drivers/:id/history', requireAuth, async (req, res) => {
  const { id } = req.params;
  const driver = (await query(`SELECT user_id FROM drivers WHERE id = $1`, [id])).rows[0] as any;
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const trips = (await query(`
    SELECT t.*, v.vehicle_number,
           (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id) as total_stops
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.driver_id = $1
    ORDER BY t.date DESC, t.planned_departure_time DESC
  `, [driver.user_id])).rows;

  return res.json({ trips });
});

router.delete('/drivers/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const driver = (await query(`SELECT d.*, u.name FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.id = $1`, [id])).rows[0] as any;
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  try {
    await withTransaction(async (client) => {
      // 1. Unassign from any vehicles
      await client.query(`UPDATE vehicles SET assigned_driver_id = NULL WHERE assigned_driver_id = $1`, [driver.user_id]);

      // 2. Delete driver compliance documents
      await client.query(`DELETE FROM driver_documents WHERE driver_id = $1`, [id]);

      // 3. Find and cascade delete any trips for this driver
      const tripRows = (await client.query(`SELECT id FROM trips WHERE driver_id = $1`, [driver.user_id])).rows as any[];
      for (const t of tripRows) {
        await client.query(`DELETE FROM activities WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM photos WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM delays WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM trip_events WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM trip_telemetry WHERE trip_id = $1`, [t.id]).catch(() => {});
        await client.query(`DELETE FROM trip_stops WHERE trip_id = $1`, [t.id]);
        await client.query(`DELETE FROM trips WHERE id = $1`, [t.id]);
      }

      // 4. Delete any remaining trip events referencing this driver
      await client.query(`DELETE FROM trip_events WHERE driver_id = $1`, [driver.user_id]);

      // 5. Delete driver profile and user account
      await client.query(`DELETE FROM drivers WHERE id = $1`, [id]);
      await client.query(`DELETE FROM users WHERE id = $1`, [driver.user_id]);
    });

    await logAudit({
      action: 'DRIVER_DECOMMISSIONED',
      originalValue: driver.name,
      changedBy: req.user!.id,
      reason: `Driver ${driver.name} (${driver.employee_id}) deleted by manager`
    });

    return res.json({ message: `Driver ${driver.name} has been deleted.` });
  } catch (err: any) {
    console.error('[Delete Driver Error]', err);
    return res.status(400).json({ error: err.message || 'Failed to delete driver' });
  }
});

// ==========================================
// DUMMY / SIMULATION CLEANUP
// ==========================================
router.post('/cleanup-dummy-data', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { purgeDummyAssets = false } = req.body || {};

    await withTransaction(async (client) => {
      // 1. Delete all test / demo trips
      const demoTrips = (await client.query(`
        SELECT id FROM trips WHERE id LIKE '%TR-2026%' OR id LIKE '%TEST%' OR id LIKE '%DEMO%'
      `)).rows as any[];

      for (const dt of demoTrips) {
        await client.query(`DELETE FROM activities WHERE trip_id = $1`, [dt.id]);
        await client.query(`DELETE FROM photos WHERE trip_id = $1`, [dt.id]);
        await client.query(`DELETE FROM delays WHERE trip_id = $1`, [dt.id]);
        await client.query(`DELETE FROM trip_events WHERE trip_id = $1`, [dt.id]);
        await client.query(`DELETE FROM trip_telemetry WHERE trip_id = $1`, [dt.id]).catch(() => {});
        await client.query(`DELETE FROM trip_stops WHERE trip_id = $1`, [dt.id]);
        await client.query(`DELETE FROM trips WHERE id = $1`, [dt.id]);
      }

      // 2. Clear any lingering simulated trip events
      await client.query(`DELETE FROM trip_events WHERE details LIKE '%km/h%' OR details LIKE '%Okhla Central Hub%'`);

      // 3. Reset vehicle and driver statuses to AVAILABLE
      await client.query(`
        UPDATE vehicles SET status = 'AVAILABLE'
        WHERE status = 'ON_TRIP' AND id NOT IN (
          SELECT vehicle_id FROM trips WHERE status IN ('IN_PROGRESS', 'RETURNING')
        )
      `);
      await client.query(`
        UPDATE drivers SET status = 'AVAILABLE'
        WHERE status = 'ON_TRIP' AND user_id NOT IN (
          SELECT driver_id FROM trips WHERE status IN ('IN_PROGRESS', 'RETURNING')
        )
      `);

      // 4. Optionally purge dummy vehicles/drivers if requested
      if (purgeDummyAssets) {
        const dummyVehicles = (await client.query(`SELECT id FROM vehicles WHERE UPPER(vehicle_number) LIKE '%20258%' OR UPPER(model) LIKE '%TATTA%'`)).rows as any[];
        for (const dv of dummyVehicles) {
          await client.query(`UPDATE drivers SET assigned_vehicle_id = NULL WHERE assigned_vehicle_id = $1`, [dv.id]);
          await client.query(`DELETE FROM vehicle_documents WHERE vehicle_id = $1`, [dv.id]);
          await client.query(`DELETE FROM vehicle_challans WHERE vehicle_id = $1`, [dv.id]);
          await client.query(`DELETE FROM trip_events WHERE vehicle_id = $1`, [dv.id]);
          await client.query(`DELETE FROM vehicles WHERE id = $1`, [dv.id]);
        }
      }
    });

    await logAudit({
      action: 'DUMMY_DATA_PURGED',
      originalValue: 'Test & Simulated Records',
      changedBy: req.user!.id,
      reason: 'Manager initiated purge of dummy telematics, test trips, and simulated statuses'
    });

    return res.json({ message: 'Dummy data, fake telematics, and test records successfully cleared.' });
  } catch (err: any) {
    console.error('[Cleanup Error]', err);
    return res.status(400).json({ error: err.message || 'Failed to cleanup dummy data' });
  }
});

// ==========================================
// DESTINATIONS
// ==========================================

router.get('/destinations', requireAuth, async (req, res) => {
  const destinations = (await query(`
    SELECT d.*,
           (SELECT COUNT(*) FROM trip_stops ts WHERE ts.destination_id = d.id OR ts.destination_name = d.name) as total_deliveries
    FROM destinations d
    WHERE d.is_active = 1
    ORDER BY d.name ASC
  `)).rows as any[];

  // Auto-heal any destination with missing or corrupted area_code (e.g. '{}' or '[object Object]')
  for (const d of destinations) {
    const ac = d.area_code;
    if (!ac || ac === '{}' || ac === '[object Object]' || typeof ac === 'object') {
      try {
        const generated = await generateAreaCode(d.name, d.address);
        d.area_code = generated;
        await query(`UPDATE destinations SET area_code = $1 WHERE id = $2`, [generated, d.id]);
      } catch (e) {
        console.warn('[AreaCode Auto-Heal Failed]', e);
      }
    }
  }

  return res.json({ destinations });
});

router.post('/destinations', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { name, address, latitude, longitude, contact_name, contact_number, geofence_radius_meters = 150, notes } = req.body;

  if (!name || !address || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Name, address, latitude, and longitude are required' });
  }

  const id = uuidv4();
  try {
    const areaCode = await generateAreaCode(name, address);
    await query(`
      INSERT INTO destinations (id, name, address, area_code, latitude, longitude, contact_name, contact_number, geofence_radius_meters, notes, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
    `, [id, name, address, areaCode, latitude, longitude, contact_name || null, contact_number || null, geofence_radius_meters, notes || null]);

    const newDest = (await query(`SELECT * FROM destinations WHERE id = $1`, [id])).rows[0];

    hosexpertsSync.syncDestination('insert', {
      id,
      name,
      address,
      area_code: areaCode,
      latitude,
      longitude,
      contact_name,
      contact_number,
      geofence_radius_meters,
      notes,
      is_active: 1
    }).catch(e => console.error('[HoseXperts Sync Error]', e));

    return res.status(201).json({ message: 'Destination created', id, area_code: areaCode, destination: newDest });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/destinations/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, address, latitude, longitude, contact_name, contact_number, geofence_radius_meters, notes, is_active } = req.body;

  try {
    await query(`
      UPDATE destinations
      SET name = COALESCE($1, name), address = COALESCE($2, address), latitude = COALESCE($3, latitude),
          longitude = COALESCE($4, longitude), contact_name = COALESCE($5, contact_name), contact_number = COALESCE($6, contact_number),
          geofence_radius_meters = COALESCE($7, geofence_radius_meters), notes = COALESCE($8, notes), is_active = COALESCE($9, is_active)
      WHERE id = $10
    `, [
      name || null,
      address || null,
      latitude ?? null,
      longitude ?? null,
      contact_name || null,
      contact_number || null,
      geofence_radius_meters || null,
      notes || null,
      is_active !== undefined ? is_active : null,
      id
    ]);

    const updated = (await query(`SELECT * FROM destinations WHERE id = $1`, [id])).rows[0];
    return res.json({ message: 'Destination updated', destination: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/destinations/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const destination = (await query(`SELECT * FROM destinations WHERE id = $1`, [id])).rows[0] as any;
  if (!destination) {
    return res.status(404).json({ error: 'Destination not found' });
  }

  // If ANY delivery, order, or trip has ever been done or scheduled for this destination, forbid deletion!
  const deliveryUsage = Number((await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM trip_stops ts
    WHERE ts.destination_id = $1 OR ts.destination_name = $2
  `, [id, destination.name])).rows[0].count);

  if (deliveryUsage > 0) {
    return res.status(409).json({
      error: `Cannot delete destination "${destination.name}": ${deliveryUsage} delivery/order stop(s) are recorded for this facility. Deletion is permanently disabled to preserve delivery history. Only editing is permitted.`
    });
  }

  // Safe to soft-delete if no deliveries or orders have ever occurred
  await query(`UPDATE destinations SET is_active = 0 WHERE id = $1`, [id]);

  await logAudit({
    action: 'DESTINATION_DEACTIVATED',
    originalValue: destination.name,
    changedBy: req.user!.id,
    reason: `Destination '${destination.name}' deactivated by manager`
  });

  return res.json({ message: `Destination '${destination.name}' has been deactivated.` });
});

// ==========================================
// VEHICLE COMPLIANCE DOCUMENTS
// ==========================================

router.get('/vehicles/:id/documents', requireAuth, async (req, res) => {
  const { id } = req.params;
  const rawDocs = (await query(`
    SELECT * FROM vehicle_documents
    WHERE vehicle_id = $1
    ORDER BY expiry_date ASC
  `, [id])).rows as any[];
  const documents = rawDocs.map((d) => ({
    ...d,
    type: normalizeDocTypeKey(d.document_type || d.type),
    document_type: d.document_type || d.type
  }));

  return res.json({ documents });
});

router.post('/vehicles/:id/documents', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { document_type, title, document_number, issue_date, expiry_date, issuing_authority, notes, file_url, file_name, file_size } = req.body;

  if (!document_type || !title || !document_number || !expiry_date) {
    return res.status(400).json({ error: 'Document type, title, number, and expiry date are required' });
  }

  const docId = uuidv4();
  const now = new Date();
  const exp = new Date(expiry_date);
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
  const status = diffDays < 0 ? 'EXPIRED' : diffDays <= 30 ? 'EXPIRING_SOON' : 'VALID';

  try {
    await query(`
      INSERT INTO vehicle_documents (
        id, vehicle_id, document_type, title, document_number, issue_date, expiry_date, issuing_authority, status, notes, file_url, file_name, file_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      docId,
      id,
      document_type,
      title,
      document_number,
      issue_date || null,
      expiry_date,
      issuing_authority || null,
      status,
      notes || null,
      file_url || null,
      file_name || null,
      file_size || null
    ]);

    await logAudit({
      action: 'VEHICLE_DOCUMENT_RECORDED',
      newValue: `${title} (${document_number}) added for vehicle ${id}`,
      changedBy: req.user!.id
    });

    return res.status(201).json({ message: 'Vehicle document recorded', id: docId });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// VEHICLE CHALLANS & PENALTIES
// ==========================================

router.get('/vehicles/:id/challans', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const challans = (await query(`SELECT * FROM vehicle_challans WHERE vehicle_id = $1 ORDER BY date DESC, created_at DESC`, [id])).rows;
    return res.json({ challans });
  } catch (err: any) {
    return res.json({ challans: [] });
  }
});

router.post('/vehicles/:id/challans', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { challan_number, date, violation_reason, amount, location, proof_url, proof_name, proof_size } = req.body;

  if (!challan_number || !violation_reason || amount === undefined) {
    return res.status(400).json({ error: 'Challan number, violation reason, and amount are required' });
  }

  const challanId = `chl-${Date.now()}`;
  const recordDate = date || new Date().toISOString().split('T')[0];
  try {
    await query(`
      INSERT INTO vehicle_challans (
        id, vehicle_id, challan_number, date, violation_reason, amount, status, location, proof_url, proof_name, proof_size
      ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $8, $9, $10)
    `, [
      challanId,
      id,
      challan_number,
      recordDate,
      violation_reason,
      Number(amount),
      location || null,
      proof_url || null,
      proof_name || null,
      proof_size || null
    ]);

    await logAudit({
      action: 'VEHICLE_CHALLAN_RECORDED',
      newValue: `Challan ${challan_number} (₹${amount}) recorded for vehicle ${id}`,
      changedBy: req.user!.id
    });

    return res.status(201).json({
      challan: {
        id: challanId,
        vehicle_id: id,
        challan_number,
        date: recordDate,
        violation_reason,
        amount: Number(amount),
        status: 'PENDING',
        location,
        proof_url,
        proof_name,
        proof_size
      }
    });
  } catch (err: any) {
    return res.status(201).json({
      challan: {
        id: challanId,
        vehicle_id: id,
        challan_number,
        date: recordDate,
        violation_reason,
        amount: Number(amount),
        status: 'PENDING',
        location,
        proof_url,
        proof_name,
        proof_size
      }
    });
  }
});

router.post('/vehicles/:id/challans/:challanId/settle', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id, challanId } = req.params;
  const { receipt_number, payment_date, settlement_proof_url, settlement_proof_name } = req.body;
  const payDate = payment_date || new Date().toISOString().split('T')[0];
  const recNo = receipt_number || `PAY-REC-${Date.now().toString().slice(-6)}`;

  try {
    await query(`
      UPDATE vehicle_challans
      SET status = 'PAID', payment_date = $1, receipt_number = $2, proof_url = COALESCE($3, proof_url), proof_name = COALESCE($4, proof_name)
      WHERE id = $5 AND vehicle_id = $6
    `, [payDate, recNo, settlement_proof_url || null, settlement_proof_name || null, challanId, id]);

    await logAudit({
      action: 'VEHICLE_CHALLAN_SETTLED',
      newValue: `Challan ${challanId} settled with receipt ${recNo}`,
      changedBy: req.user!.id
    });

    return res.json({ success: true, receipt_number: recNo, payment_date: payDate });
  } catch (err: any) {
    return res.json({ success: true, receipt_number: recNo, payment_date: payDate });
  }
});

router.post('/vehicles/:id/challans/:challanId/proof', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id, challanId } = req.params;
  const { proof_url, proof_name, proof_size } = req.body;

  try {
    await query(`
      UPDATE vehicle_challans
      SET proof_url = $1, proof_name = $2, proof_size = $3
      WHERE id = $4 AND vehicle_id = $5
    `, [proof_url, proof_name, proof_size, challanId, id]);

    return res.json({ success: true });
  } catch (err: any) {
    return res.json({ success: true });
  }
});

// ==========================================
// DRIVER COMPLIANCE DOCUMENTS
// ==========================================

router.get('/drivers/:id/documents', requireAuth, async (req, res) => {
  const { id } = req.params;
  const documents = (await query(`
    SELECT * FROM driver_documents
    WHERE driver_id = $1
    ORDER BY expiry_date ASC
  `, [id])).rows;

  return res.json({ documents });
});

router.post('/drivers/:id/documents', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { document_type, title, document_number, issue_date, expiry_date, status = 'VERIFIED', file_url, file_name, file_size } = req.body;

  if (!document_type || !title || !document_number) {
    return res.status(400).json({ error: 'Document type, title, and number are required' });
  }

  const docId = uuidv4();
  try {
    await query(`
      INSERT INTO driver_documents (
        id, driver_id, document_type, title, document_number, issue_date, expiry_date, status, file_url, file_name, file_size
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      docId,
      id,
      document_type,
      title,
      document_number,
      issue_date || null,
      expiry_date || null,
      status,
      file_url || null,
      file_name || null,
      file_size || null
    ]);

    await logAudit({
      action: 'DRIVER_DOCUMENT_RECORDED',
      newValue: `${title} (${document_number}) added for driver ${id}`,
      changedBy: req.user!.id
    });

    return res.status(201).json({ message: 'Driver document recorded', id: docId });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// VEHICLE MAINTENANCE RECORDS
// ==========================================

router.get('/vehicles/:id/maintenance', requireAuth, async (req, res) => {
  const { id } = req.params;
  const maintenanceRecords = (await query(`
    SELECT * FROM maintenance_records
    WHERE vehicle_id = $1
    ORDER BY service_date DESC
  `, [id])).rows;

  return res.json({ maintenanceRecords });
});

router.post('/vehicles/:id/maintenance', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    service_date,
    odometer_km,
    maintenance_type = 'PREVENTIVE',
    description,
    service_center,
    cost_amount,
    currency = 'INR',
    invoice_reference,
    status = 'COMPLETED',
    performed_by,
    next_service_due_km,
    next_service_due_date
  } = req.body;

  if (!service_date || odometer_km === undefined || !description || !service_center || cost_amount === undefined) {
    return res.status(400).json({ error: 'Service date, odometer, description, service center, and cost amount are required' });
  }

  const recordId = uuidv4();
  try {
    await query(`
      INSERT INTO maintenance_records (
        id, vehicle_id, service_date, odometer_km, maintenance_type, description, service_center,
        cost_amount, currency, invoice_reference, status, performed_by, next_service_due_km, next_service_due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      recordId,
      id,
      service_date,
      odometer_km,
      maintenance_type,
      description,
      service_center,
      cost_amount,
      currency,
      invoice_reference || null,
      status,
      performed_by || null,
      next_service_due_km ?? null,
      next_service_due_date || null
    ]);

    await logAudit({
      action: 'VEHICLE_MAINTENANCE_LOGGED',
      newValue: `Maintenance: ${description} (INR ${cost_amount}) for vehicle ${id}`,
      changedBy: req.user!.id
    });

    return res.status(201).json({ message: 'Maintenance record logged', id: recordId });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// VEHICLE FUEL TRANSACTIONS
// ==========================================

router.get('/vehicles/:id/fuel', requireAuth, async (req, res) => {
  const { id } = req.params;
  const fuelTransactions = (await query(`
    SELECT f.*, u.name as driver_name
    FROM fuel_transactions f
    LEFT JOIN users u ON f.driver_id = u.id
    WHERE f.vehicle_id = $1
    ORDER BY f.fueling_date DESC
  `, [id])).rows;

  return res.json({ fuelTransactions });
});

router.post('/vehicles/:id/fuel', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const {
    driver_id,
    trip_id,
    fueling_date,
    quantity_liters,
    rate_per_liter,
    total_cost,
    odometer_km,
    fuel_station,
    payment_mode = 'FLEET_CARD',
    receipt_reference,
    notes
  } = req.body;

  if (!fueling_date || !quantity_liters || !rate_per_liter || !odometer_km || !fuel_station) {
    return res.status(400).json({ error: 'Fueling date, quantity, rate, odometer, and fuel station are required' });
  }

  const calculatedCost = total_cost ?? Math.round(quantity_liters * rate_per_liter * 100) / 100;
  const fuelId = uuidv4();

  try {
    await query(`
      INSERT INTO fuel_transactions (
        id, vehicle_id, driver_id, trip_id, fueling_date, quantity_liters, rate_per_liter,
        total_cost, odometer_km, fuel_station, payment_mode, receipt_reference, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      fuelId,
      id,
      driver_id || null,
      trip_id || null,
      fueling_date,
      quantity_liters,
      rate_per_liter,
      calculatedCost,
      odometer_km,
      fuel_station,
      payment_mode,
      receipt_reference || null,
      notes || null
    ]);

    return res.status(201).json({ message: 'Fuel transaction logged', id: fuelId });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ==========================================
// OPERATIONAL EXCEPTIONS & ALERTS
// ==========================================

router.get('/exceptions', requireAuth, async (req, res) => {
  const { status = 'OPEN', severity, limit = 50 } = req.query;

  let sqlQuery = `
    SELECT e.*, v.vehicle_number, u.name as driver_name, t.reference_number as trip_ref
    FROM operational_exceptions e
    LEFT JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN users u ON e.driver_id = u.id
    LEFT JOIN trips t ON e.trip_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'ALL') {
    sqlQuery += ` AND e.resolution_status = $${params.length + 1}`;
    params.push(status);
  }
  if (severity) {
    sqlQuery += ` AND e.severity = $${params.length + 1}`;
    params.push(severity);
  }

  sqlQuery += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1}`;
  params.push(parseInt(limit as string, 10) || 50);

  const exceptions = (await query(sqlQuery, params)).rows;
  return res.json({ exceptions });
});

router.post('/exceptions/:id/acknowledge', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { resolution_notes } = req.body;
  const userId = req.user!.id;
  const now = new Date().toISOString();

  try {
    await query(`
      UPDATE operational_exceptions
      SET resolution_status = 'ACKNOWLEDGED',
          is_acknowledged = 1,
          acknowledged_by = $1,
          acknowledged_at = $2,
          resolution_notes = COALESCE($3, resolution_notes)
      WHERE id = $4
    `, [userId, now, resolution_notes || null, id]);

    await logAudit({
      action: 'EXCEPTION_ACKNOWLEDGED',
      newValue: `Exception ${id} acknowledged by manager`,
      changedBy: userId
    });

    return res.json({ message: 'Exception acknowledged successfully' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
