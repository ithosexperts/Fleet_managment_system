import { Router, Response } from 'express';
import { query } from '../db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { isWithinGeofence, calculateCumulativeDistanceKm } from '../services/geo';
import { v4 as uuidv4 } from 'uuid';
import { Trip, TripStop } from '../types';

const router = Router();

// Helper to record a GPS Event
async function recordEvent(params: {
  tripId: string;
  stopId?: string;
  eventType: string;
  driverId: string;
  vehicleId: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  details?: string;
  timestamp?: string;
}) {
  const eventId = uuidv4();
  const timestamp = params.timestamp || new Date().toISOString();

  await query(`
    INSERT INTO trip_events (
      id, trip_id, stop_id, event_type, timestamp, 
      driver_id, vehicle_id, latitude, longitude, gps_accuracy, details
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    eventId,
    params.tripId,
    params.stopId || null,
    params.eventType,
    timestamp,
    params.driverId,
    params.vehicleId,
    params.latitude ?? null,
    params.longitude ?? null,
    params.gpsAccuracy ?? null,
    params.details || null
  ]);

  return eventId;
}

async function getAuthorizedTrip(tripId: string, user: { id: string; role: string }): Promise<Trip | undefined> {
  if (user.role === 'MANAGER') {
    return (await query<Trip>(`SELECT * FROM trips WHERE id = $1`, [tripId])).rows[0];
  }
  return (await query<Trip>(`SELECT * FROM trips WHERE id = $1 AND driver_id = $2`, [tripId, user.id])).rows[0];
}

/**
 * GET /api/driver/trips/active
 * Returns the driver's single currently active trip with full stop/event detail.
 * Preferred for fast initial load on Android startup or reconnect after offline period.
 */
router.get('/trips/active', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const isManager = req.user!.role === 'MANAGER';

  const sql = isManager
    ? `SELECT t.*, v.vehicle_number, v.vehicle_type, v.model as vehicle_model
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
       WHERE t.status IN ('IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING')
       ORDER BY t.actual_start_time DESC
       LIMIT 1`
    : `SELECT t.*, v.vehicle_number, v.vehicle_type, v.model as vehicle_model
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.driver_id = $1 AND t.status IN ('IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING')
       ORDER BY t.actual_start_time DESC
       LIMIT 1`;

  const trip = (await query(sql, isManager ? [] : [driverId])).rows[0] as any;

  if (!trip) {
    return res.json({ trip: null, message: 'No active trip found' });
  }

  trip.stops = (await query(`SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY stop_number ASC`, [trip.id])).rows;
  for (const stop of trip.stops) {
    stop.activities = (await query(`SELECT * FROM activities WHERE stop_id = $1`, [stop.id])).rows;
    stop.photos = (await query(`SELECT * FROM photos WHERE stop_id = $1`, [stop.id])).rows;
  }
  trip.delays = (await query(`SELECT * FROM delays WHERE trip_id = $1 AND is_resolved = 0 ORDER BY start_time DESC`, [trip.id])).rows;
  trip.events = (await query(`SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY timestamp ASC`, [trip.id])).rows;

  return res.json({ trip });
});

/**
 * GET /api/driver/trips/today
 * Returns trips assigned to the logged-in driver for today or currently active
 */
router.get('/trips/today', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const driverId = req.user!.id;
  const isManager = req.user!.role === 'MANAGER';
  const today = new Date().toISOString().split('T')[0];

  const sql = isManager
    ? `SELECT t.*, v.vehicle_number, v.vehicle_type, v.model as vehicle_model
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
       WHERE (t.date = ? OR t.status IN ('ASSIGNED', 'IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'))
       ORDER BY CASE 
         WHEN t.status IN ('IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING') THEN 1
         WHEN t.status = 'ASSIGNED' THEN 2
         ELSE 3
       END, t.planned_departure_time ASC`
    : `SELECT t.*, v.vehicle_number, v.vehicle_type, v.model as vehicle_model
       FROM trips t
       JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.driver_id = $1 AND (t.date = $2 OR t.status IN ('ASSIGNED', 'IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'))
       ORDER BY CASE 
         WHEN t.status IN ('IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING') THEN 1
         WHEN t.status = 'ASSIGNED' THEN 2
         ELSE 3
       END, t.planned_departure_time ASC`;

  const trips = (await query(sql, isManager ? [today] : [driverId, today])).rows as any[];

  // Attach stops summary to each trip
  for (const trip of trips) {
    trip.stops = (await query(`
      SELECT id, stop_number, destination_name, address, planned_arrival_time, actual_arrival_time, actual_departure_time, status
      FROM trip_stops
      WHERE trip_id = $1
      ORDER BY stop_number ASC
    `, [trip.id])).rows;
  }

  return res.json({ trips });
});

/**
 * GET /api/driver/trips/:id
 * Returns complete operational trip details for driver
 */
router.get('/trips/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = req.params.id;
  const driverId = req.user!.id;

  const trip = await getAuthorizedTrip(tripId, req.user!) as any;

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found or not assigned to you' });
  }

  trip.stops = (await query(`
    SELECT * FROM trip_stops WHERE trip_id = $1 ORDER BY stop_number ASC
  `, [tripId])).rows;

  // Attach activities and photos to each stop
  for (const stop of trip.stops) {
    stop.activities = (await query(`SELECT * FROM activities WHERE stop_id = $1`, [stop.id])).rows;
    stop.photos = (await query(`SELECT * FROM photos WHERE stop_id = $1`, [stop.id])).rows;
  }

  trip.delays = (await query(`SELECT * FROM delays WHERE trip_id = $1 ORDER BY start_time DESC`, [tripId])).rows;
  trip.events = (await query(`SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY timestamp ASC`, [tripId])).rows;
  trip.photos = (await query(`SELECT * FROM photos WHERE trip_id = $1 ORDER BY timestamp DESC`, [tripId])).rows;

  return res.json({ trip });
});

/**
 * POST /api/driver/trips/:id/start
 * Driver starts the trip
 */
router.post('/trips/:id/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const driverId = req.user!.id;
  const { latitude, longitude, gps_accuracy } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found or not assigned to you' });
  }

  if (trip.status !== 'ASSIGNED' && trip.status !== 'PLANNED') {
    return res.status(400).json({ error: `Cannot start trip in status '${trip.status}'` });
  }

  const now = new Date().toISOString();

  await query(`
    UPDATE trips 
    SET status = 'IN_PROGRESS', actual_start_time = $1, updated_at = $2
    WHERE id = $3
  `, [now, now, tripId]);

  await query(`UPDATE vehicles SET status = 'ON_TRIP' WHERE id = $1`, [trip.vehicle_id]);
  await query(`UPDATE drivers SET status = 'ON_TRIP' WHERE user_id = $1`, [driverId]);

  await recordEvent({
    tripId,
    eventType: 'TRIP_STARTED',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude,
    longitude,
    gpsAccuracy: gps_accuracy,
    details: `Trip started at ${trip.starting_location}`,
    timestamp: now
  });


  return res.json({ message: 'Trip started successfully', actual_start_time: now, status: 'IN_PROGRESS' });
});

/**
 * POST /api/driver/trips/:id/telemetry
 * Driver / mobile client sends real-time GPS telemetry ping (coordinates, accuracy, speed)
 */
router.post('/trips/:id/telemetry', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const { latitude, longitude, gps_accuracy, speed_kmh } = req.body;

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Valid numeric latitude and longitude are required' });
  }

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found or unauthorized' });

  const now = new Date().toISOString();
  await recordEvent({
    tripId,
    eventType: 'TELEMETRY_PING',
    driverId: req.user!.id,
    vehicleId: trip.vehicle_id,
    latitude,
    longitude,
    gpsAccuracy: gps_accuracy ?? null,
    details: speed_kmh ? `${Math.round(speed_kmh)} km/h` : 'Live Telematics Ping',
    timestamp: now
  });

  return res.json({ success: true, timestamp: now });
});

/**
 * POST /api/driver/trips/:id/custom-stop
 * Driver adds an ad-hoc custom stop during transit
 */
router.post('/trips/:id/custom-stop', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const { destination_name, address, latitude, longitude, geofence_radius_meters = 150, planned_arrival_time, notes } = req.body;

  if (!destination_name) {
    return res.status(400).json({ error: 'Destination name is required' });
  }

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  // Get current stop count
  const maxStop = (await query<{ max_num: number | null }>(`SELECT MAX(stop_number) as max_num FROM trip_stops WHERE trip_id = $1`, [tripId])).rows[0];
  const nextNum = (maxStop?.max_num || 0) + 1;
  const stopId = uuidv4();

  try {
    await query(`
      INSERT INTO trip_stops (
        id, trip_id, stop_number, destination_name, address, 
        latitude, longitude, geofence_radius_meters, planned_arrival_time, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10)
    `, [
      stopId,
      tripId,
      nextNum,
      destination_name,
      address || 'Custom Stop Designated by Driver',
      latitude || 28.5355,
      longitude || 77.268,
      geofence_radius_meters,
      planned_arrival_time || '12:00',
      notes || '[Driver Custom Stop]'
    ]);

    await recordEvent({
      tripId,
      stopId,
      eventType: 'CUSTOM_STOP_ADDED',
      driverId: req.user!.id,
      vehicleId: trip.vehicle_id,
      latitude,
      longitude,
      details: `Driver added custom stop: ${destination_name} (Stop #${nextNum})`
    });

    const createdStop = (await query(`SELECT * FROM trip_stops WHERE id = $1`, [stopId])).rows[0];
    return res.status(201).json({ message: 'Custom stop added successfully', stop: createdStop });
  } catch (err: any) {
    console.error('[Driver Error] Failed to add custom stop:', err);
    return res.status(500).json({ error: 'Failed to add custom stop' });
  }
});

/**
 * POST /api/driver/trips/:id/stops/:stopId/arrive
 * Driver reaches a destination stop
 */
router.post('/trips/:id/stops/:stopId/arrive', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const stopId = String(req.params.stopId);
  const driverId = req.user!.id;
  const { latitude, longitude, gps_accuracy } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (trip.status !== 'IN_PROGRESS' && trip.status !== 'DELAYED') {
    return res.status(400).json({ error: 'Trip must be in progress to record stop arrival' });
  }

  const stop = (await query<TripStop>(`SELECT * FROM trip_stops WHERE id = $1 AND trip_id = $2`, [stopId, tripId])).rows[0];
  if (!stop) return res.status(404).json({ error: 'Stop not found' });

  if (stop.status !== 'PENDING') {
    return res.status(400).json({ error: `Stop is already in status '${stop.status}'` });
  }

  // Verify previous stops are completed
  const uncompletedPrior = (await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM trip_stops 
    WHERE trip_id = $1 AND stop_number < $2 AND status NOT IN ('COMPLETED', 'SKIPPED')
  `, [tripId, stop.stop_number])).rows[0];

  if (Number(uncompletedPrior.count) > 0) {
    return res.status(400).json({ error: 'Prior destination stops must be completed before arriving at this stop' });
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Geofence check
  const geofenceResult = isWithinGeofence(
    latitude,
    longitude,
    stop.latitude,
    stop.longitude,
    stop.geofence_radius_meters || 150
  );

  // Time diff calculation
  let arrivalStatus: 'ON_TIME' | 'EARLY' | 'LATE' | 'UNKNOWN' = 'ON_TIME';
  let diffMinutes = 0;

  try {
    const todayStr = trip.date;
    const plannedDate = new Date(`${todayStr}T${stop.planned_arrival_time}:00`);
    if (!isNaN(plannedDate.getTime())) {
      diffMinutes = Math.round((now.getTime() - plannedDate.getTime()) / 60000);
      if (diffMinutes > 10) arrivalStatus = 'LATE';
      else if (diffMinutes < -10) arrivalStatus = 'EARLY';
      else arrivalStatus = 'ON_TIME';
    }
  } catch (e) {
    arrivalStatus = 'UNKNOWN';
  }

  await query(`
    UPDATE trip_stops
    SET status = 'ARRIVED',
        actual_arrival_time = $1,
        arrival_latitude = $2,
        arrival_longitude = $3,
        arrival_status = $4,
        arrival_diff_minutes = $5
    WHERE id = $6
  `, [nowIso, latitude ?? null, longitude ?? null, arrivalStatus, diffMinutes, stopId]);

  await query(`UPDATE trips SET status = 'AT_DESTINATION', updated_at = $1 WHERE id = $2`, [nowIso, tripId]);

  await recordEvent({
    tripId,
    stopId,
    eventType: 'ARRIVED_DESTINATION',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude,
    longitude,
    gpsAccuracy: gps_accuracy,
    details: `Arrived at Stop ${stop.stop_number}: ${stop.destination_name} (${geofenceResult.message}, ${diffMinutes > 0 ? `+${diffMinutes}m late` : diffMinutes < 0 ? `${diffMinutes}m early` : 'on time'})`,
    timestamp: nowIso
  });


  return res.json({
    message: 'Arrival recorded successfully',
    actual_arrival_time: nowIso,
    arrival_status: arrivalStatus,
    arrival_diff_minutes: diffMinutes,
    geofence: geofenceResult
  });
});

/**
 * POST /api/driver/trips/:id/stops/:stopId/complete-activity
 * Driver completes delivery/pickup/loading activity at stop
 */
router.post('/api/driver/trips/:id/stops/:stopId/complete-activity', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // mapped under /stops/:stopId/complete-activity
});

router.post('/trips/:id/stops/:stopId/complete-activity', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const stopId = String(req.params.stopId);
  const driverId = req.user!.id;
  const { activity_type, status, quantity, reference_number, recipient_name, notes, require_photo } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const stop = (await query<TripStop>(`SELECT * FROM trip_stops WHERE id = $1 AND trip_id = $2`, [stopId, tripId])).rows[0];
  if (!stop) return res.status(404).json({ error: 'Stop not found' });

  if (stop.status !== 'ARRIVED' && stop.status !== 'IN_PROGRESS') {
    return res.status(400).json({ error: 'You must arrive at the destination before completing activities' });
  }

  // Photo requirement validation
  if (require_photo) {
    const photoCount = (await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM photos WHERE stop_id = $1`, [stopId])).rows[0];
    if (Number(photoCount.count) === 0) {
      return res.status(400).json({
        error: 'Required photo proof is missing. Please capture at least one photo before completing this activity.'
      });
    }
  }

  const activityId = uuidv4();
  const now = new Date().toISOString();

  await query(`
    INSERT INTO activities (
      id, trip_id, stop_id, activity_type, status, start_time, completion_time, 
      quantity, reference_number, recipient_name, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
  `, [
    activityId,
    tripId,
    stopId,
    activity_type || 'Delivery',
    status || 'COMPLETED',
    stop.actual_arrival_time || now,
    now,
    quantity ? parseInt(quantity, 10) : null,
    reference_number || null,
    recipient_name || null,
    notes || null
  ]);

  await query(`UPDATE trip_stops SET status = 'IN_PROGRESS' WHERE id = $1`, [stopId]);

  await recordEvent({
    tripId,
    stopId,
    eventType: 'ACTIVITY_COMPLETED',
    driverId,
    vehicleId: trip.vehicle_id,
    details: `Activity ${activity_type || 'Delivery'} (${status || 'COMPLETED'}) finished for Stop ${stop.stop_number}`,
    timestamp: now
  });

  return res.json({ message: 'Activity completed successfully', activityId });
});

/**
 * POST /api/driver/trips/:id/stops/:stopId/depart
 * Driver departs from destination stop
 */
router.post('/trips/:id/stops/:stopId/depart', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const stopId = String(req.params.stopId);
  const driverId = req.user!.id;
  const { latitude, longitude, gps_accuracy } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  const stop = (await query<TripStop>(`SELECT * FROM trip_stops WHERE id = $1 AND trip_id = $2`, [stopId, tripId])).rows[0];
  if (!stop) return res.status(404).json({ error: 'Stop not found' });

  if (stop.status !== 'ARRIVED' && stop.status !== 'IN_PROGRESS') {
    return res.status(400).json({ error: 'Cannot depart a stop that has not been arrived at' });
  }

  const now = new Date().toISOString();

  await query(`
    UPDATE trip_stops
    SET status = 'COMPLETED',
        actual_departure_time = $1,
        departure_latitude = $2,
        departure_longitude = $3
    WHERE id = $4
  `, [now, latitude ?? null, longitude ?? null, stopId]);

  // Check remaining stops
  const remaining = (await query<{ count: string }>(`
    SELECT COUNT(*)::text as count FROM trip_stops WHERE trip_id = $1 AND status = 'PENDING'
  `, [tripId])).rows[0];

  await query(`UPDATE trips SET status = 'IN_PROGRESS', updated_at = $1 WHERE id = $2`, [now, tripId]);

  await recordEvent({
    tripId,
    stopId,
    eventType: 'DEPARTED_DESTINATION',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude,
    longitude,
    gpsAccuracy: gps_accuracy,
    details: `Departed Stop ${stop.stop_number}: ${stop.destination_name}`,
    timestamp: now
  });


  return res.json({
    message: 'Departure recorded',
    allStopsCompleted: Number(remaining.count) === 0,
    remainingStops: Number(remaining.count)
  });
});

/**
 * POST /api/driver/trips/:id/delay
 * Driver reports a delay
 */
router.post('/trips/:id/delay', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const driverId = req.user!.id;
  const { reason, description, stopId, latitude, longitude, gps_accuracy, photoId } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found or not assigned to you' });

  if (trip.status === 'PLANNED' || trip.status === 'ASSIGNED') {
    return res.status(400).json({ error: 'Cannot report delay on a trip that has not started yet' });
  }

  if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot report delay on a completed or cancelled trip' });
  }

  const delayId = uuidv4();
  const now = new Date().toISOString();

  // Validate GPS coordinates: never fabricate
  const hasGps = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);
  const isPoorAccuracy = hasGps && typeof gps_accuracy === 'number' && gps_accuracy > 300;

  await query(`
    INSERT INTO delays (
      id, trip_id, stop_id, driver_id, vehicle_id, reason, description, 
      start_time, latitude, longitude, gps_accuracy, photo_id, is_resolved
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0)
  `, [
    delayId,
    tripId,
    stopId || null,
    driverId,
    trip.vehicle_id,
    reason || 'Traffic',
    description || null,
    now,
    hasGps ? latitude : null,
    hasGps ? longitude : null,
    hasGps ? gps_accuracy ?? null : null,
    photoId || null
  ]);

  await query(`UPDATE trips SET status = 'DELAYED', updated_at = $1 WHERE id = $2`, [now, tripId]);

  const gpsNotice = hasGps
    ? (isPoorAccuracy ? ` (Poor GPS accuracy: Â±${Math.round(gps_accuracy!)}m)` : '')
    : ' (GPS UNAVAILABLE)';

  await recordEvent({
    tripId,
    stopId,
    eventType: 'DELAY_REPORTED',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude: hasGps ? latitude : undefined,
    longitude: hasGps ? longitude : undefined,
    gpsAccuracy: hasGps ? gps_accuracy : undefined,
    details: `Delay reported: ${reason}${description ? ` â€” ${description}` : ''}${gpsNotice}`,
    timestamp: now
  });


  return res.json({ message: 'Delay reported', delayId, start_time: now });
});

/**
 * POST /api/driver/trips/:id/delay/:delayId/resolve
 * Driver marks active delay resolved
 */
router.post('/trips/:id/delay/:delayId/resolve', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const delayId = String(req.params.delayId);
  const driverId = req.user!.id;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found or not assigned to you' });

  let delay = (await query(`SELECT * FROM delays WHERE id = $1 AND trip_id = $2`, [delayId, tripId])).rows[0] as any;
  if (!delay) {
    // Fallback: match latest unresolved delay for this trip
    delay = (await query(`SELECT * FROM delays WHERE trip_id = $1 AND is_resolved = 0 ORDER BY start_time DESC LIMIT 1`, [tripId])).rows[0] as any;
  }
  if (!delay) return res.status(404).json({ error: 'Delay record not found' });

  if (delay.is_resolved) {
    return res.status(400).json({ error: 'Delay is already resolved' });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const startDate = new Date(delay.start_time);
  const durationMinutes = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 60000));

  await query(`
    UPDATE delays
    SET end_time = $1, duration_minutes = $2, is_resolved = 1
    WHERE id = $3
  `, [nowIso, durationMinutes, delay.id]);

  // Recalculate total trip delay
  const sumDelay = (await query<{ total: number | null }>(`
    SELECT SUM(duration_minutes) as total FROM delays WHERE trip_id = $1
  `, [tripId])).rows[0];

  const totalDelay = sumDelay.total || 0;

  // Restore trip status: check if returning, at a stop, or in progress
  let newStatus: string = 'IN_PROGRESS';
  if (trip.return_start_time) {
    newStatus = 'RETURNING';
  } else {
    const atStop = (await query<{ count: string }>(`
      SELECT COUNT(*)::text as count FROM trip_stops WHERE trip_id = $1 AND status IN ('ARRIVED', 'IN_PROGRESS')
    `, [tripId])).rows[0];
    newStatus = Number(atStop.count) > 0 ? 'AT_DESTINATION' : 'IN_PROGRESS';
  }

  await query(`
    UPDATE trips
    SET total_delay_minutes = $1, status = $2, updated_at = $3
    WHERE id = $4
  `, [totalDelay, newStatus, nowIso, tripId]);

  await recordEvent({
    tripId,
    stopId: delay.stop_id,
    eventType: 'DELAY_RESOLVED',
    driverId,
    vehicleId: trip.vehicle_id,
    details: `Delay resolved: ${delay.reason} (Duration: ${durationMinutes} mins)`,
    timestamp: nowIso
  });


  return res.json({
    message: 'Delay resolved',
    duration_minutes: durationMinutes,
    total_delay_minutes: totalDelay,
    status: newStatus
  });
});

/**
 * POST /api/driver/trips/:id/start-return
 * Driver finishes all stops and starts journey back to base
 */
router.post('/trips/:id/start-return', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const driverId = req.user!.id;
  const { latitude, longitude, gps_accuracy } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found or not assigned to you' });

  if (trip.status === 'RETURNING') {
    return res.status(400).json({ error: 'Return journey is already in progress' });
  }

  if (trip.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Trip is already completed' });
  }

  if (trip.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot start return on a cancelled trip' });
  }

  if (trip.status === 'ASSIGNED' || trip.status === 'PLANNED') {
    return res.status(400).json({ error: 'Cannot start return journey before starting the trip' });
  }

  // Ensure all required destinations are completed or skipped/failed
  const incompleteStops = (await query<{ count: string }>(`
    SELECT COUNT(*) as count FROM trip_stops 
    WHERE trip_id = $1 AND status NOT IN ('COMPLETED', 'SKIPPED', 'FAILED')
  `, [tripId])).rows[0];

  if (Number(incompleteStops.count) > 0) {
    return res.status(400).json({ 
      error: `Cannot start return journey: ${incompleteStops.count} destination stop(s) remain incomplete or un-departed` 
    });
  }

  const now = new Date().toISOString();

  await query(`
    UPDATE trips
    SET status = 'RETURNING', return_start_time = $1, updated_at = $2
    WHERE id = $3
  `, [now, now, tripId]);

  const hasGps = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

  await recordEvent({
    tripId,
    eventType: 'RETURN_STARTED',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude: hasGps ? latitude : undefined,
    longitude: hasGps ? longitude : undefined,
    gpsAccuracy: hasGps ? gps_accuracy : undefined,
    details: `Return journey to base initiated${hasGps ? '' : ' (GPS UNAVAILABLE)'}`,
    timestamp: now
  });


  return res.json({ message: 'Return journey started', status: 'RETURNING' });
});

/**
 * POST /api/driver/trips/:id/arrive-base
 * Driver arrives at company base
 */
router.post('/trips/:id/arrive-base', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const driverId = req.user!.id;
  const { latitude, longitude, gps_accuracy } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found or not assigned to you' });

  if (trip.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Trip is already completed' });
  }

  if (trip.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot record base arrival on a cancelled trip' });
  }

  if (trip.base_arrival_time) {
    return res.status(400).json({ error: 'Base arrival has already been recorded' });
  }

  if (trip.status !== 'RETURNING' && trip.status !== 'IN_PROGRESS') {
    return res.status(400).json({ error: 'Trip must be in returning status before base arrival can be recorded' });
  }

  const now = new Date().toISOString();

  await query(`
    UPDATE trips
    SET base_arrival_time = $1, updated_at = $2
    WHERE id = $3
  `, [now, now, tripId]);

  const hasGps = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

  await recordEvent({
    tripId,
    eventType: 'ARRIVED_BASE',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude: hasGps ? latitude : undefined,
    longitude: hasGps ? longitude : undefined,
    gpsAccuracy: hasGps ? gps_accuracy : undefined,
    details: `Vehicle arrived back at base (${trip.starting_location})${hasGps ? '' : ' (GPS UNAVAILABLE)'}`,
    timestamp: now
  });


  return res.json({ message: 'Base arrival recorded', base_arrival_time: now });
});

/**
 * POST /api/driver/trips/:id/complete
 * Driver completes the trip
 */
router.post('/trips/:id/complete', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const tripId = String(req.params.id);
  const driverId = req.user!.id;
  const { latitude, longitude, gps_accuracy } = req.body;

  const trip = await getAuthorizedTrip(tripId, req.user!);
  if (!trip) return res.status(404).json({ error: 'Trip not found or not assigned to you' });

  if (trip.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Trip is already completed' });
  }

  if (trip.status === 'CANCELLED') {
    return res.status(400).json({ error: 'Cannot complete a cancelled trip' });
  }

  if (trip.status === 'ASSIGNED' || trip.status === 'PLANNED') {
    return res.status(400).json({ error: 'Cannot complete a trip that has not been started' });
  }

  // Enforce base arrival
  if (!trip.base_arrival_time) {
    return res.status(400).json({ error: 'You must arrive at company base before completing the trip' });
  }

  const now = new Date().toISOString();

  // Compute total distance from chronological GPS events
  const events = (await query<{ latitude?: number; longitude?: number }>(`
    SELECT latitude, longitude FROM trip_events WHERE trip_id = $1 ORDER BY timestamp ASC
  `, [tripId])).rows;

  const calculatedDistance = calculateCumulativeDistanceKm(events);

  await query(`
    UPDATE trips
    SET status = 'COMPLETED',
        completion_time = $1,
        calculated_distance_km = $2,
        updated_at = $3
    WHERE id = $4
  `, [now, calculatedDistance, now, tripId]);

  // Set vehicle and driver status back to AVAILABLE
  await query(`UPDATE vehicles SET status = 'AVAILABLE' WHERE id = $1`, [trip.vehicle_id]);
  await query(`UPDATE drivers SET status = 'AVAILABLE' WHERE user_id = $1`, [driverId]);

  const hasGps = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

  await recordEvent({
    tripId,
    eventType: 'TRIP_COMPLETED',
    driverId,
    vehicleId: trip.vehicle_id,
    latitude: hasGps ? latitude : undefined,
    longitude: hasGps ? longitude : undefined,
    gpsAccuracy: hasGps ? gps_accuracy : undefined,
    details: `Trip marked completed. Distance: ${calculatedDistance ? `${calculatedDistance} km` : 'approximate/unavailable'}`,
    timestamp: now
  });


  return res.json({
    message: 'Trip completed successfully',
    completion_time: now,
    calculated_distance_km: calculatedDistance,
    status: 'COMPLETED'
  });
});

export default router;
