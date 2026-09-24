import { Router, Response } from 'express';
import { query, withTransaction } from '../db';
import { requireAuth, requireRole, logAudit, AuthenticatedRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';
import { Trip, TripStop } from '../types';
import { hosexpertsSync } from '../services/hosexpertsSync';

const router = Router();

async function generateTripId(): Promise<string> {
  const year = new Date().getFullYear();
  const countRow = (await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM trips`)).rows[0];
  const nextNum = (Number(countRow.count) + 1).toString().padStart(5, '0');
  return `TR-${year}-${nextNum}`;
}

/**
 * GET /api/trips/overview/attention
 * Returns items requiring manager attention: delayed trips, overdue trips, failed activities, sync failures
 */
router.get('/overview/attention', requireAuth, requireRole('MANAGER'), async (_req, res) => {
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  // 1. Currently active delayed trips
  const delayedTrips = (await query(`
    SELECT t.id, t.status, t.total_delay_minutes, u.name as driver_name, v.vehicle_number,
           (SELECT reason FROM delays WHERE trip_id = t.id AND is_resolved = 0 ORDER BY start_time DESC LIMIT 1) as delay_reason
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.status = 'DELAYED'
  `)).rows;

  // 2. Failed activities
  const failedActivities = (await query(`
    SELECT a.*, ts.destination_name, ts.stop_number, u.name as driver_name, v.vehicle_number
    FROM activities a
    JOIN trip_stops ts ON a.stop_id = ts.id
    JOIN trips t ON a.trip_id = t.id
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE a.status = 'FAILED'
    ORDER BY a.created_at DESC LIMIT 10
  `)).rows;
  // 4. Overdue unstarted trips (Planned departure was > 30 mins ago and trip is still ASSIGNED)
  const overdueTrips = (await query(`
    SELECT t.id, t.planned_departure_time, t.date, u.name as driver_name, v.vehicle_number
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.status = 'ASSIGNED' AND t.date = $1
  `, [today])).rows as any[];

  // 5. Vehicles under maintenance or inactive
  const maintenanceVehicles = (await query(`
    SELECT id, vehicle_number, model, status, notes FROM vehicles WHERE status IN ('MAINTENANCE', 'INACTIVE')
  `)).rows;

  return res.json({
    delayedTrips,
    failedActivities,
    overdueTrips,
    maintenanceVehicles,
    totalAttentionCount: delayedTrips.length + failedActivities.length + maintenanceVehicles.length
  });
});

/**
 * GET /api/trips
 * Manager trips listing with search and filter parameters
 */
router.get('/', requireAuth, requireRole('MANAGER'), async (req, res) => {
  const { date, driverId, vehicleId, status, search, limit = 50, offset = 0 } = req.query;

  let sql = `
    SELECT t.*, u.name as driver_name, v.vehicle_number, v.model as vehicle_model,
           (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id) as total_stops,
           (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id AND status = 'COMPLETED') as completed_stops,
           (SELECT destination_name FROM trip_stops WHERE trip_id = t.id AND status IN ('PENDING', 'ARRIVED', 'IN_PROGRESS') ORDER BY stop_number ASC LIMIT 1) as current_destination
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (date) {
    sql += ` AND t.date = $${params.length + 1}`;
    params.push(date);
  }
  if (driverId) {
    sql += ` AND t.driver_id = $${params.length + 1}`;
    params.push(driverId);
  }
  if (vehicleId) {
    sql += ` AND t.vehicle_id = $${params.length + 1}`;
    params.push(vehicleId);
  }
  if (status) {
    const statuses = String(status).split(',').filter(Boolean);
    if (statuses.length === 1) {
      sql += ` AND t.status = $${params.length + 1}`;
      params.push(statuses[0]);
    } else if (statuses.length > 1) {
      const statusStart = params.length + 1;
      sql += ` AND t.status IN (${statuses.map((_, index) => `$${statusStart + index}`).join(', ')})`;
      params.push(...statuses);
    }
  }
  if (search) {
    const searchStart = params.length + 1;
    sql += ` AND (t.id LIKE $${searchStart} OR v.vehicle_number LIKE $${searchStart + 1} OR u.name LIKE $${searchStart + 2} OR t.reference_number LIKE $${searchStart + 3})`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  sql += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(parseInt(limit as string, 10), parseInt(offset as string, 10));

  const trips = (await query(sql, params)).rows;
  return res.json({ trips });
});

/**
 * GET /api/trips/:id
 * Full Manager Trip Detail View
 */
router.get('/:id', requireAuth, requireRole('MANAGER'), async (req, res) => {
  const tripId = req.params.id;

  const trip = (await query(`
    SELECT t.*, u.name as driver_name, u.phone as driver_phone, v.vehicle_number, v.vehicle_type, v.model as vehicle_model
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.id = $1
  `, [tripId])).rows[0] as any;

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  // Stops with activities and photos
  const stops = (await query(`SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY stop_number ASC`, [tripId])).rows as any[];
  for (const stop of stops) {
    stop.activities = (await query(`SELECT * FROM activities WHERE stop_id = $1`, [stop.id])).rows;
    stop.photos = (await query(`SELECT * FROM photos WHERE stop_id = $1`, [stop.id])).rows;
  }
  trip.stops = stops;

  // Complete chronological timeline events
  trip.events = (await query(`
    SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY timestamp ASC
  `, [tripId])).rows;

  // All photos taken on this trip
  trip.photos = (await query(`
    SELECT p.*, ts.destination_name, ts.stop_number 
    FROM photos p 
    LEFT JOIN trip_stops ts ON p.stop_id = ts.id
    WHERE p.trip_id = $1
    ORDER BY p.timestamp ASC
  `, [tripId])).rows;

  // All delays
  trip.delays = (await query(`
    SELECT * FROM delays WHERE trip_id = $1 ORDER BY start_time ASC
  `, [tripId])).rows;

  // Audit trail
  trip.auditLogs = (await query(`
    SELECT a.*, u.name as changed_by_name
    FROM audit_logs a
    LEFT JOIN users u ON a.changed_by = u.id
    WHERE a.trip_id = $1
    ORDER BY a.created_at DESC
  `, [tripId])).rows;

  return res.json({ trip });
});

/**
 * POST /api/trips
 * Manager creates a new trip with 1..N stops
 */
router.post('/', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const {
    date,
    driver_id,
    vehicle_id,
    starting_location = 'Company Central Depot',
    starting_latitude,
    starting_longitude,
    purpose = 'Client Delivery',
    reference_number,
    planned_departure_time,
    notes,
    stops,
    sap_shipment_num,
    erp_delivery_doc,
    cost_center
  } = req.body;

  if (!date || !driver_id || !vehicle_id || !planned_departure_time) {
    return res.status(400).json({ error: 'Date, Driver, Vehicle, and Planned Departure Time are required' });
  }

  if (!Array.isArray(stops) || stops.length === 0) {
    return res.status(400).json({ error: 'A trip must contain at least 1 destination stop' });
  }

  const tripId = await generateTripId();
  const userId = req.user!.id;
  const now = new Date().toISOString();

  // Transactionally create trip and stops
  try {
    await withTransaction(async (client) => {
      await client.query(`
      INSERT INTO trips (
        id, date, driver_id, vehicle_id, starting_location, starting_latitude, starting_longitude,
        purpose, reference_number, planned_departure_time, status, notes, created_by, created_at, updated_at,
        sap_shipment_num, erp_delivery_doc, cost_center
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ASSIGNED', $11, $12, $13, $14, $15, $16, $17)
    `, [
      tripId,
      date,
      driver_id,
      vehicle_id,
      starting_location,
      starting_latitude ?? null,
      starting_longitude ?? null,
      purpose,
      reference_number || null,
      planned_departure_time,
      notes || null,
      userId,
      now,
      now,
      sap_shipment_num || null,
      erp_delivery_doc || null,
      cost_center || null
      ]);

      const insertStopSql = `
      INSERT INTO trip_stops (
        id, trip_id, destination_id, stop_number, destination_name, address, 
        latitude, longitude, geofence_radius_meters, planned_arrival_time, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
    `;

      const createdStops: any[] = [];
      for (const [index, stop] of stops.entries()) {
        const stopId = uuidv4();
        await client.query(insertStopSql, [
          stopId,
          tripId,
          stop.destination_id || null,
          index + 1,
          stop.destination_name || `Destination ${index + 1}`,
          stop.address || 'Standard Address',
          stop.latitude || 0,
          stop.longitude || 0,
          stop.geofence_radius_meters || 150,
          stop.planned_arrival_time || planned_departure_time,
          stop.notes || null
        ]);
        createdStops.push({
          id: stopId,
          trip_id: tripId,
          destination_id: stop.destination_id || null,
          stop_number: index + 1,
          destination_name: stop.destination_name || `Destination ${index + 1}`,
          address: stop.address || 'Standard Address',
          latitude: stop.latitude || 0,
          longitude: stop.longitude || 0,
          geofence_radius_meters: stop.geofence_radius_meters || 150,
          planned_arrival_time: stop.planned_arrival_time || planned_departure_time,
          notes: stop.notes || null,
          created_at: now
        });
      }

      await client.query(`INSERT INTO audit_logs (id, trip_id, action, new_value, changed_by) VALUES ($1, $2, $3, $4, $5)`, [uuidv4(), tripId, 'TRIP_CREATED', `Trip ${tripId} created with ${stops.length} stops`, userId]);

      // Sync trip & stops with Company SQL Server via HoseXperts API Gateway
      hosexpertsSync.syncTrip('insert', {
        id: tripId,
        date,
        driver_id,
        vehicle_id,
        starting_location,
        starting_latitude,
        starting_longitude,
        purpose,
        reference_number,
        planned_departure_time,
        notes,
        created_by: userId,
        created_at: now,
        sap_shipment_num,
        erp_delivery_doc,
        cost_center
      }).catch(err => console.error('[HoseXperts Sync] Trip insert sync failed:', err));

      for (const s of createdStops) {
        hosexpertsSync.syncTripStop('insert', s).catch(err => console.error('[HoseXperts Sync] Stop insert sync failed:', err));
      }
    });
    return res.status(201).json({ message: 'Trip created successfully', tripId });
  } catch (err: any) {
    console.error('[Trips Error] Failed to create trip:', err);
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

/**
 * PUT /api/trips/:id
 * Manager edits trip information before it starts
 */
router.put('/:id', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user!.id;
  const { driver_id, vehicle_id, planned_departure_time, purpose, reference_number, notes, reason, sap_shipment_num, erp_delivery_doc, cost_center } = req.body;

  const currentTrip = (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  if (!currentTrip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (currentTrip.status === 'COMPLETED' || currentTrip.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot edit completed or cancelled trips' });
  }

  // Audit track driver change
  if (driver_id && driver_id !== currentTrip.driver_id) {
    await logAudit({
      tripId,
      action: 'DRIVER_REASSIGNED',
      fieldChanged: 'driver_id',
      originalValue: currentTrip.driver_id,
      newValue: driver_id,
      changedBy: userId,
      reason: reason || 'Manager reassigned driver'
    });
  }

  // Audit track vehicle change
  if (vehicle_id && vehicle_id !== currentTrip.vehicle_id) {
    await logAudit({
      tripId,
      action: 'VEHICLE_REASSIGNED',
      fieldChanged: 'vehicle_id',
      originalValue: currentTrip.vehicle_id,
      newValue: vehicle_id,
      changedBy: userId,
      reason: reason || 'Manager reassigned vehicle'
    });
  }

  await query(`
    UPDATE trips
    SET driver_id = COALESCE($1, driver_id),
        vehicle_id = COALESCE($2, vehicle_id),
        planned_departure_time = COALESCE($3, planned_departure_time),
        purpose = COALESCE($4, purpose),
        reference_number = COALESCE($5, reference_number),
        notes = COALESCE($6, notes),
        sap_shipment_num = COALESCE($7, sap_shipment_num),
        erp_delivery_doc = COALESCE($8, erp_delivery_doc),
        cost_center = COALESCE($9, cost_center),
        updated_at = NOW()
    WHERE id = $10
  `, [
    driver_id || null,
    vehicle_id || null,
    planned_departure_time || null,
    purpose || null,
    reference_number || null,
    notes || null,
    sap_shipment_num || null,
    erp_delivery_doc || null,
    cost_center || null,
    tripId
  ]);

  hosexpertsSync.syncTrip('update', {
    id: tripId,
    driver_id,
    vehicle_id,
    planned_departure_time,
    purpose,
    reference_number,
    notes,
    sap_shipment_num,
    erp_delivery_doc,
    cost_center
  }).catch(err => console.error('[HoseXperts Sync] Trip update sync failed:', err));

  return res.json({ message: 'Trip updated successfully' });
});

/**
 * PUT /api/trips/:id/stops/reorder
 * Manager reorders destinations before trip starts
 */
router.put('/:id/stops/reorder', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user!.id;
  const { stopIds } = req.body; // Array of stop IDs in desired order

  if (!Array.isArray(stopIds)) {
    return res.status(400).json({ error: 'stopIds array required' });
  }

  const trip = (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'ASSIGNED' && trip.status !== 'PLANNED') {
    return res.status(400).json({ error: 'Cannot reorder stops once trip has started' });
  }

  try {
    await withTransaction(async (client) => {
      for (const [index, id] of stopIds.entries()) {
        await client.query(`UPDATE trip_stops SET stop_number = $1 WHERE id = $2 AND trip_id = $3`, [
        index + 1,
        id,
        tripId
        ]);
        hosexpertsSync.syncTripStop('update', { id, stop_number: index + 1 }).catch(err => console.error('[HoseXperts Sync] Stop reorder sync failed:', err));
      }

      await client.query(`INSERT INTO audit_logs (id, trip_id, action, new_value, changed_by) VALUES ($1, $2, $3, $4, $5)`, [uuidv4(), tripId, 'STOPS_REORDERED', `Stops reordered: ${stopIds.join(' -> ')}`, userId]);
    });
    return res.json({ message: 'Stops reordered successfully' });
  } catch (err: any) {
    console.error('[Trips Error] Failed to reorder stops:', err);
    return res.status(500).json({ error: 'Failed to reorder stops' });
  }
});

/**
 * POST /api/trips/:id/stops
 * Add a destination stop before trip starts
 */
router.post('/:id/stops', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user!.id;
  const { destination_id, destination_name, address, latitude, longitude, geofence_radius_meters = 150, planned_arrival_time, notes } = req.body;

  const trip = (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'ASSIGNED' && trip.status !== 'PLANNED') {
    return res.status(400).json({ error: 'Cannot add stops once trip has started' });
  }

  const stopCountRow = (await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM trip_stops WHERE trip_id = $1`, [tripId])).rows[0];
  const nextStopNumber = Number(stopCountRow.count) + 1;
  const stopId = uuidv4();

  await query(`
    INSERT INTO trip_stops (
      id, trip_id, destination_id, stop_number, destination_name, address, 
      latitude, longitude, geofence_radius_meters, planned_arrival_time, status, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', $11)
  `, [
    stopId,
    tripId,
    destination_id || null,
    nextStopNumber,
    destination_name || `Destination ${nextStopNumber}`,
    address || 'Company Site',
    latitude || 0,
    longitude || 0,
    geofence_radius_meters,
    planned_arrival_time || trip.planned_departure_time,
    notes || null
  ]);

  await logAudit({
    tripId,
    action: 'STOP_ADDED',
    newValue: `Added Stop ${nextStopNumber}: ${destination_name}`,
    changedBy: userId
  });

  hosexpertsSync.syncTripStop('insert', {
    id: stopId,
    trip_id: tripId,
    destination_id: destination_id || null,
    stop_number: nextStopNumber,
    destination_name: destination_name || `Destination ${nextStopNumber}`,
    address: address || 'Company Site',
    latitude: latitude || 0,
    longitude: longitude || 0,
    geofence_radius_meters,
    planned_arrival_time: planned_arrival_time || trip.planned_departure_time,
    status: 'PENDING',
    notes: notes || null,
    created_at: new Date().toISOString()
  }).catch(err => console.error('[HoseXperts Sync] Stop add sync failed:', err));

  return res.status(201).json({ message: 'Stop added successfully', stopId, stop_number: nextStopNumber });
});

/**
 * PUT /api/trips/:id/stops/:stopId
 * Edit a destination stop before trip starts
 */
router.put('/:id/stops/:stopId', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id: tripId, stopId } = req.params;
  const userId = req.user!.id;
  const { destination_name, address, latitude, longitude, geofence_radius_meters, planned_arrival_time, notes } = req.body;

  const trip = (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'ASSIGNED' && trip.status !== 'PLANNED') {
    return res.status(400).json({ error: 'Cannot edit stops once trip has started' });
  }

  const currentStop = (await query<TripStop>(`SELECT * FROM trip_stops WHERE id = $1 AND trip_id = $2`, [stopId, tripId])).rows[0];
  if (!currentStop) return res.status(404).json({ error: 'Stop not found on this trip' });

  await query(`
    UPDATE trip_stops
    SET destination_name = COALESCE($1, destination_name),
        address = COALESCE($2, address),
        latitude = COALESCE($3, latitude),
        longitude = COALESCE($4, longitude),
        geofence_radius_meters = COALESCE($5, geofence_radius_meters),
        planned_arrival_time = COALESCE($6, planned_arrival_time),
        notes = COALESCE($7, notes)
    WHERE id = $8 AND trip_id = $9
  `, [
    destination_name || null,
    address || null,
    latitude ?? null,
    longitude ?? null,
    geofence_radius_meters ?? null,
    planned_arrival_time || null,
    notes || null,
    stopId,
    tripId
  ]);

  await logAudit({
    tripId,
    action: 'STOP_EDITED',
    fieldChanged: 'destination_name',
    originalValue: currentStop.destination_name,
    newValue: destination_name || currentStop.destination_name,
    changedBy: userId,
    reason: 'Manager edited stop details'
  });

  hosexpertsSync.syncTripStop('update', {
    id: stopId,
    destination_name,
    address,
    latitude,
    longitude,
    geofence_radius_meters,
    planned_arrival_time,
    notes
  }).catch(err => console.error('[HoseXperts Sync] Stop update sync failed:', err));

  return res.json({ message: 'Stop updated successfully' });
});

/**
 * DELETE /api/trips/:id/stops/:stopId
 * Remove a destination stop before trip starts
 */
router.delete('/:id/stops/:stopId', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const { id: tripId, stopId } = req.params;
  const userId = req.user!.id;

  const trip = (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'ASSIGNED' && trip.status !== 'PLANNED') {
    return res.status(400).json({ error: 'Cannot remove stops once trip has started' });
  }

  const totalStopsRow = (await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM trip_stops WHERE trip_id = $1`, [tripId])).rows[0];
  if (Number(totalStopsRow.count) <= 1) {
    return res.status(400).json({ error: 'A trip must contain at least 1 destination stop' });
  }

  const currentStop = (await query<TripStop>(`SELECT * FROM trip_stops WHERE id = $1 AND trip_id = $2`, [stopId, tripId])).rows[0];
  if (!currentStop) return res.status(404).json({ error: 'Stop not found' });

  try {
    await withTransaction(async (client) => {
      await client.query(`DELETE FROM trip_stops WHERE id = $1 AND trip_id = $2`, [stopId, tripId]);

      const remainingStops = (await client.query(`SELECT id FROM trip_stops WHERE trip_id = $1 ORDER BY stop_number ASC`, [tripId])).rows as Array<{ id: string }>;
      for (const [idx, stop] of remainingStops.entries()) {
        await client.query(`UPDATE trip_stops SET stop_number = $1 WHERE id = $2`, [idx + 1, stop.id]);
        hosexpertsSync.syncTripStop('update', { id: stop.id, stop_number: idx + 1 }).catch(err => console.error('[HoseXperts Sync] Stop renumber sync failed:', err));
      }

      await client.query(`INSERT INTO audit_logs (id, trip_id, action, original_value, changed_by) VALUES ($1, $2, $3, $4, $5)`, [uuidv4(), tripId, 'STOP_REMOVED', currentStop.destination_name, userId]);
    });

    hosexpertsSync.syncTripStop('delete', {}, stopId).catch(err => console.error('[HoseXperts Sync] Stop delete sync failed:', err));

    return res.json({ message: 'Stop removed successfully' });
  } catch (err: any) {
    console.error('[Trips Error] Failed to remove stop:', err);
    return res.status(500).json({ error: 'Failed to remove stop' });
  }
});

/**
 * POST /api/trips/:id/cancel
 * Cancel trip
 */
router.post('/:id/cancel', requireAuth, requireRole('MANAGER'), async (req: AuthenticatedRequest, res: Response) => {
  const tripId = req.params.id;
  const userId = req.user!.id;
  const { reason } = req.body;

  const trip = (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  await withTransaction(async (client) => {
    await client.query(`UPDATE trips SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [tripId]);
    await client.query(`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = $1`, [trip.vehicle_id]);
    await client.query(`UPDATE drivers SET status = 'AVAILABLE' WHERE user_id = $1`, [trip.driver_id]);
    await client.query(`INSERT INTO audit_logs (id, trip_id, action, changed_by, reason) VALUES ($1, $2, $3, $4, $5)`, [uuidv4(), tripId, 'TRIP_CANCELLED', userId, reason || 'Manager cancelled trip']);
  });

  hosexpertsSync.syncTrip('update', { id: tripId, status: 'CANCELLED' }).catch(err => console.error('[HoseXperts Sync] Trip cancel sync failed:', err));

  return res.json({ message: 'Trip cancelled' });
});

export default router;
