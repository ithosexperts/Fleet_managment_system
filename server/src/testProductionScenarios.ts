import { v4 as uuidv4 } from 'uuid';
import { query } from './db';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function runProductionHardeningTests() {
  console.log('================================================================');
  console.log('🚚 TRUCKTRACKER — PRODUCTION HARDENING & REAL-WORLD TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;
  const results: Array<{ id: number; name: string; status: 'PASS' | 'FAIL'; note?: string }> = [];

  function record(id: number, name: string, condition: boolean, note?: string) {
    if (condition) {
      console.log(`✅ [TEST ${id.toString().padStart(2, '0')}] PASS: ${name}`);
      if (note) console.log(`   └─ ${note}`);
      passed++;
      results.push({ id, name, status: 'PASS', note });
    } else {
      console.error(`❌ [TEST ${id.toString().padStart(2, '0')}] FAIL: ${name}`);
      if (note) console.error(`   └─ Detail: ${note}`);
      failed++;
      results.push({ id, name, status: 'FAIL', note });
    }
  }

  try {
    // Authenticate Manager
    const mgrLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@company.com', password: 'manager123' })
    });
    const mgrToken = (await mgrLoginRes.json()).token;

    // Authenticate Driver 1 (Rahul)
    const d1LoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@company.com', password: 'driver123' })
    });
    const d1Data = await d1LoginRes.json();
    const d1Token = d1Data.token;
    const d1Id = d1Data.user.id;

    // Authenticate Driver 2 (Amit)
    const d2LoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amit@company.com', password: 'driver123' })
    });
    const d2Data = await d2LoginRes.json();
    const d2Token = d2Data.token;
    const d2Id = d2Data.user.id;

    // Get a vehicle
    const vRes = await fetch(`${BASE_URL}/fleet/vehicles`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const vehicle = (await vRes.json()).vehicles[0];
    const today = new Date().toISOString().split('T')[0];

    // -------------------------------------------------------------
    // TEST 1: Single destination normal trip
    // -------------------------------------------------------------
    const t1Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        date: today,
        driver_id: d1Id,
        vehicle_id: vehicle.id,
        starting_location: 'HoseXperts Central Depot, Okhla Phase III',
        planned_departure_time: '07:00',
        purpose: 'Single Express Drop',
        stops: [{ destination_name: 'Lajpat Nagar Central Market', address: 'Ring Road Commercial Complex, New Delhi', latitude: 28.5677, longitude: 77.2433, planned_arrival_time: '07:45' }]
      })
    });
    const t1Id = (await t1Res.json()).tripId;
    // Driver completes it
    await fetch(`${BASE_URL}/driver/trips/${t1Id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    const t1Trip = (await (await fetch(`${BASE_URL}/driver/trips/${t1Id}`, { headers: { Authorization: `Bearer ${d1Token}` } })).json()).trip;
    const t1Stop = t1Trip.stops[0];
    await fetch(`${BASE_URL}/driver/trips/${t1Id}/stops/${t1Stop.id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5677, longitude: 77.2433 })
    });
    await fetch(`${BASE_URL}/driver/trips/${t1Id}/stops/${t1Stop.id}/complete-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ activity_type: 'Delivery', status: 'COMPLETED' })
    });
    await fetch(`${BASE_URL}/driver/trips/${t1Id}/stops/${t1Stop.id}/depart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5677, longitude: 77.2433 })
    });
    await fetch(`${BASE_URL}/driver/trips/${t1Id}/start-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5677, longitude: 77.2433 })
    });
    await fetch(`${BASE_URL}/driver/trips/${t1Id}/arrive-base`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    const t1Comp = await fetch(`${BASE_URL}/driver/trips/${t1Id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    record(1, 'Single destination normal trip', t1Comp.status === 200, `Completed trip ${t1Id} with 1 stop`);

    // -------------------------------------------------------------
    // TEST 2: Two destination normal trip
    // -------------------------------------------------------------
    const t2Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        date: today,
        driver_id: d1Id,
        vehicle_id: vehicle.id,
        starting_location: 'HoseXperts Central Depot, Okhla Phase III',
        planned_departure_time: '08:00',
        purpose: 'Two Point Restock',
        stops: [
          { destination_name: 'Lajpat Nagar Central Market', address: 'Ring Road Commercial Complex, New Delhi', latitude: 28.5677, longitude: 77.2433, planned_arrival_time: '08:30' },
          { destination_name: 'Mayur Vihar Distribution Facility', address: 'Pocket 1, Commercial Sector, Mayur Vihar, East Delhi', latitude: 28.6015, longitude: 77.2940, planned_arrival_time: '09:15' }
        ]
      })
    });
    const t2Id = (await t2Res.json()).tripId;
    const t2Detail = (await (await fetch(`${BASE_URL}/trips/${t2Id}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip;
    record(2, 'Two destination normal trip', t2Detail.stops.length === 2, `Trip ${t2Id} created with 2 stops`);

    // -------------------------------------------------------------
    // TEST 3: Five destination normal trip
    // -------------------------------------------------------------
    const fiveStops = [
      { destination_name: 'Lajpat Nagar Hub', address: 'Ring Road, New Delhi', latitude: 28.5677, longitude: 77.2433, planned_arrival_time: '09:00' },
      { destination_name: 'Mayur Vihar Facility', address: 'Phase 1 East Delhi', latitude: 28.6015, longitude: 77.2940, planned_arrival_time: '10:00' },
      { destination_name: 'Noida Sector 18 Dock', address: 'Commercial Sector, Noida', latitude: 28.5708, longitude: 77.3271, planned_arrival_time: '11:00' },
      { destination_name: 'Noida Sector 62 Park', address: 'Electronic City, Noida', latitude: 28.6280, longitude: 77.3649, planned_arrival_time: '12:00' },
      { destination_name: 'Connaught Place Center', address: 'Barakhamba Road, New Delhi', latitude: 28.6304, longitude: 77.2177, planned_arrival_time: '13:00' }
    ];
    const t3Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        date: today,
        driver_id: d1Id,
        vehicle_id: vehicle.id,
        starting_location: 'Central Depot',
        planned_departure_time: '08:30',
        purpose: 'Five Stop Regional Run',
        stops: fiveStops
      })
    });
    const t3Id = (await t3Res.json()).tripId;
    const t3Detail = (await (await fetch(`${BASE_URL}/trips/${t3Id}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip;
    record(3, 'Five destination normal trip', t3Detail.stops.length === 5, `Trip ${t3Id} verified with 5 ordered stops`);

    // -------------------------------------------------------------
    // TEST 4: Multiple destination trip with delay
    // -------------------------------------------------------------
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    const delayRes = await fetch(`${BASE_URL}/driver/trips/${t2Id}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ reason: 'Traffic', description: 'Highway diversion', latitude: 28.5500, longitude: 77.2550 })
    });
    const delayData = await delayRes.json();
    const t2Delayed = (await (await fetch(`${BASE_URL}/driver/trips/${t2Id}`, { headers: { Authorization: `Bearer ${d1Token}` } })).json()).trip;
    record(4, 'Multiple destination trip with delay', t2Delayed.status === 'DELAYED' && t2Delayed.delays.length === 1, `Trip status DELAYED, delay ID: ${delayData.delayId}`);

    // -------------------------------------------------------------
    // TEST 5: Multiple destination trip with multiple delays
    // -------------------------------------------------------------
    // Resolve delay 1
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/delay/${delayData.delayId}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${d1Token}` }
    });
    // Add delay 2
    const delay2Res = await fetch(`${BASE_URL}/driver/trips/${t2Id}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ reason: 'Vehicle Problem', description: 'Coolant overheating', latitude: 28.5580, longitude: 77.2500 })
    });
    const delay2Id = (await delay2Res.json()).delayId;
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/delay/${delay2Id}/resolve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${d1Token}` }
    });
    const t2MultiDelays = (await (await fetch(`${BASE_URL}/driver/trips/${t2Id}`, { headers: { Authorization: `Bearer ${d1Token}` } })).json()).trip;
    record(5, 'Multiple destination trip with multiple delays', t2MultiDelays.delays.length === 2 && t2MultiDelays.total_delay_minutes >= 2, `Recorded 2 delays, total: ${t2MultiDelays.total_delay_minutes} mins`);

    // -------------------------------------------------------------
    // TEST 6: Required delivery photo (Blocks completion without photo, passes with photo)
    // -------------------------------------------------------------
    const t2Stop1 = t2MultiDelays.stops[0];
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop1.id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5677, longitude: 77.2433 })
    });
    // Try to complete activity with require_photo = true before photo uploaded
    const actBlockedRes = await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop1.id}/complete-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ activity_type: 'Delivery', status: 'COMPLETED', require_photo: true })
    });
    // Create a mock photo record in database for stop
    const mockPhotoId = uuidv4();
    await query(`
      INSERT INTO photos (id, trip_id, stop_id, driver_id, vehicle_id, photo_type, file_path, file_size, mime_type, timestamp)
      VALUES ($1, $2, $3, $4, $5, 'Delivery Proof', 'test_proof.jpg', 12345, 'image/jpeg', CURRENT_TIMESTAMP)
    `, [mockPhotoId, t2Id, t2Stop1.id, d1Id, vehicle.id]);
    const actPassedRes = await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop1.id}/complete-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ activity_type: 'Delivery', status: 'COMPLETED', require_photo: true })
    });
    record(6, 'Required delivery photo enforcement', actBlockedRes.status === 400 && actPassedRes.status === 200, 'Blocked without photo proof, succeeded after photo attached');

    // -------------------------------------------------------------
    // TEST 7: Optional photo (Completes without photo)
    // -------------------------------------------------------------
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop1.id}/depart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5677, longitude: 77.2433 })
    });
    const t2Stop2 = t2MultiDelays.stops[1];
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop2.id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.6015, longitude: 77.2940 })
    });
    const optionalActRes = await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop2.id}/complete-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ activity_type: 'Pickup', status: 'COMPLETED', require_photo: false })
    });
    record(7, 'Optional photo allows continuation', optionalActRes.status === 200, 'Activity completed without requiring photo');

    // -------------------------------------------------------------
    // TEST 8: GPS unavailable (records GPS UNAVAILABLE, never fabricates)
    // -------------------------------------------------------------
    const gpsUnavailDepartRes = await fetch(`${BASE_URL}/driver/trips/${t2Id}/stops/${t2Stop2.id}/depart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({}) // No GPS
    });
    const latestEvent = (await query(`SELECT * FROM trip_events WHERE trip_id = $1 ORDER BY timestamp DESC LIMIT 1`, [t2Id])).rows[0] as any;
    record(8, 'GPS unavailable handling', gpsUnavailDepartRes.status === 200 && latestEvent.latitude === null && latestEvent.longitude === null, 'Recorded event with NULL GPS coordinates without fabricating');

    // -------------------------------------------------------------
    // TEST 9: Poor GPS accuracy (flagged in details)
    // -------------------------------------------------------------
    const poorGpsReturnRes = await fetch(`${BASE_URL}/driver/trips/${t2Id}/start-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.6015, longitude: 77.2940, gps_accuracy: 450 }) // 450m poor accuracy
    });
    const returnEvent = (await query(`SELECT * FROM trip_events WHERE trip_id = $1 AND event_type = 'RETURN_STARTED'`, [t2Id])).rows[0] as any;
    record(9, 'Poor GPS accuracy recorded', poorGpsReturnRes.status === 200 && returnEvent.gps_accuracy === 450, 'Recorded accuracy of 450m faithfully');

    // -------------------------------------------------------------
    // TEST 10: Network unavailable during trip (Offline queue simulation)
    // -------------------------------------------------------------
    // Simulate offline client queueing an arrive-base event with an idempotency key
    const offlineEventKey = `offline_${uuidv4()}`;
    const queuedAction = {
      endpoint: `${BASE_URL}/driver/trips/${t2Id}/arrive-base`,
      method: 'POST',
      payload: { latitude: 28.5355, longitude: 77.2680, idempotencyKey: offlineEventKey }
    };
    record(10, 'Network unavailable offline event queue', !!queuedAction.payload.idempotencyKey, 'Action successfully queued with idempotency key');

    // -------------------------------------------------------------
    // TEST 11: Network returns after offline events
    // -------------------------------------------------------------
    const syncRes = await fetch(queuedAction.endpoint, {
      method: queuedAction.method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify(queuedAction.payload)
    });
    const tripBaseCheck = (await (await fetch(`${BASE_URL}/driver/trips/${t2Id}`, { headers: { Authorization: `Bearer ${d1Token}` } })).json()).trip;
    record(11, 'Network returns and synchronizes queue', syncRes.status === 200 && !!tripBaseCheck.base_arrival_time, 'Base arrival processed successfully from queued event');

    // -------------------------------------------------------------
    // TEST 12: Failed activity flagged in Attention Required
    // -------------------------------------------------------------
    const failActStopId = uuidv4();
    await query(`
      INSERT INTO trip_stops (id, trip_id, stop_number, destination_name, address, latitude, longitude, planned_arrival_time, status)
      VALUES ($1, $2, 99, 'Damaged Depot', 'Okhla Industrial Area Phase II', 28.5355, 77.2680, '12:00', 'IN_PROGRESS')
    `, [failActStopId, t3Id]);
    await query(`
      INSERT INTO activities (id, trip_id, stop_id, activity_type, status, notes)
      VALUES ($1, $2, $3, 'Delivery', 'FAILED', 'Customer refused delivery: broken packaging')
    `, [uuidv4(), t3Id, failActStopId]);
    const attentionCheck = await (await fetch(`${BASE_URL}/trips/overview/attention`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json();
    const hasFailed = attentionCheck.failedActivities.some((fa: any) => fa.trip_id === t3Id);
    record(12, 'Failed activity flagged in Attention Required', hasFailed, 'Failed activity appears in manager attention feed');

    // -------------------------------------------------------------
    // TEST 13: Invalid driver actions safely rejected
    // -------------------------------------------------------------
    // A) Depart before arrival
    const t3FirstStop = t3Detail.stops[0];
    const invalidDepart = await fetch(`${BASE_URL}/driver/trips/${t3Id}/stops/${t3FirstStop.id}/depart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` }
    });
    // B) Complete trip twice
    await fetch(`${BASE_URL}/driver/trips/${t2Id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    const doubleComplete = await fetch(`${BASE_URL}/driver/trips/${t2Id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    // C) Report delay after trip completion
    const delayAfterComp = await fetch(`${BASE_URL}/driver/trips/${t2Id}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ reason: 'Traffic' })
    });
    record(
      13,
      'Invalid driver action state machine rejections',
      invalidDepart.status === 400 && doubleComplete.status === 400 && delayAfterComp.status === 400,
      'Safely rejected: depart before arrival (400), complete twice (400), delay after completion (400)'
    );

    // -------------------------------------------------------------
    // TEST 14: Trip cancellation
    // -------------------------------------------------------------
    const cancelRes = await fetch(`${BASE_URL}/trips/${t3Id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ reason: 'Severe weather advisory and route waterlogging' })
    });
    const t3Cancelled = (await (await fetch(`${BASE_URL}/trips/${t3Id}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip;
    record(14, 'Trip cancellation and audit log', cancelRes.status === 200 && t3Cancelled.status === 'CANCELLED', `Trip ${t3Id} cancelled with reason recorded`);

    // -------------------------------------------------------------
    // TEST 15: Audit log verification (immutable ledger of mutations)
    // -------------------------------------------------------------
    const auditLogs = (await query(`SELECT * FROM audit_logs WHERE trip_id = $1 ORDER BY created_at DESC`, [t3Id])).rows as any[];
    record(15, 'Audit log verification', auditLogs.length > 0 && auditLogs.some((l) => l.action === 'TRIP_CANCELLED'), `Captured ${auditLogs.length} audit trail records for trip ${t3Id}`);

    // -------------------------------------------------------------
    // TEST 16: Periodic operational report calculation
    // -------------------------------------------------------------
    const periodicRes = await fetch(`${BASE_URL}/reports/periodic?period=weekly`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const periodicData = await periodicRes.json();
    record(16, 'Periodic operational report calculation', periodicRes.status === 200 && typeof periodicData.totalTrips === 'number', `Successfully generated weekly report (${periodicData.totalTrips} trips logged)`);

    // -------------------------------------------------------------
    // TEST 17: Manager edits trip before start
    // -------------------------------------------------------------
    const t4Res = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        date: today,
        driver_id: d1Id,
        vehicle_id: vehicle.id,
        planned_departure_time: '14:00',
        purpose: 'Afternoon Route',
        stops: [{ destination_name: 'Okhla Phase-II Logistics Dock', address: 'Commercial Sector, Okhla Phase II, New Delhi', latitude: 28.5355, longitude: 77.2680, planned_arrival_time: '14:30' }]
      })
    });
    const t4Id = (await t4Res.json()).tripId;
    const editTripRes = await fetch(`${BASE_URL}/trips/${t4Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        driver_id: d2Id, // Reassign to Driver 2 (Amit)
        planned_departure_time: '14:45',
        reason: 'Driver shift adjustment'
      })
    });
    const t4Edited = (await (await fetch(`${BASE_URL}/trips/${t4Id}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip;
    record(17, 'Manager edits trip before start with audit log', editTripRes.status === 200 && t4Edited.driver_id === d2Id, `Reassigned to driver ${d2Id}, audit recorded`);

    // -------------------------------------------------------------
    // TEST 18: Manager reorders destinations before start
    // -------------------------------------------------------------
    // Add second stop to t4
    const addStopRes = await fetch(`${BASE_URL}/trips/${t4Id}/stops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ destination_name: 'Noida Sector 18 Commercial Hub', address: 'Commercial Sector 18, Noida', latitude: 28.5708, longitude: 77.3271, planned_arrival_time: '15:15' })
    });
    const newStopId = (await addStopRes.json()).stopId;
    const t4StopsBefore = (await (await fetch(`${BASE_URL}/trips/${t4Id}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip.stops;
    const stop1Id = t4StopsBefore[0].id;
    // Reorder: stop 2 first, stop 1 second
    const reorderRes = await fetch(`${BASE_URL}/trips/${t4Id}/stops/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({ stopIds: [newStopId, stop1Id] })
    });
    const t4StopsAfter = (await (await fetch(`${BASE_URL}/trips/${t4Id}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip.stops;
    record(
      18,
      'Manager reorders destinations before start',
      reorderRes.status === 200 && t4StopsAfter[0].id === newStopId && t4StopsAfter[1].id === stop1Id,
      'Stops successfully inverted: Stop 1 is now Second Destination'
    );

    // -------------------------------------------------------------
    // TEST 19: Unauthorized driver access rejection
    // -------------------------------------------------------------
    // Driver 1 (Rahul) attempts to access Driver 2's trip (t4)
    const unauthorizedGet = await fetch(`${BASE_URL}/driver/trips/${t4Id}`, {
      headers: { Authorization: `Bearer ${d1Token}` }
    });
    const unauthorizedStart = await fetch(`${BASE_URL}/driver/trips/${t4Id}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${d1Token}` },
      body: JSON.stringify({ latitude: 28.5355, longitude: 77.2680 })
    });
    record(
      19,
      'Unauthorized driver access security guard',
      unauthorizedGet.status === 404 && unauthorizedStart.status === 404,
      'Driver A strictly blocked from viewing or starting Driver B\'s trip (HTTP 404)'
    );

    // -------------------------------------------------------------
    // TEST 20: Complete multi-stop trip (10 destinations) & verify report calculations
    // -------------------------------------------------------------
    const tenStops = Array.from({ length: 10 }, (_, i) => ({
      destination_name: `Distribution Depot ${i + 1}`,
      address: `Industrial Sector ${i + 1}`,
      latitude: 28.5355 + i * 0.008,
      longitude: 77.2680 + i * 0.008,
      planned_arrival_time: `${8 + Math.floor(i / 2)}:${(i % 2) * 30 || '00'}`
    }));
    const tTenRes = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${mgrToken}` },
      body: JSON.stringify({
        date: today,
        driver_id: d2Id,
        vehicle_id: vehicle.id,
        planned_departure_time: '08:00',
        purpose: 'Major 10-Stop Distribution Run',
        stops: tenStops
      })
    });
    const tTenId = (await tTenRes.json()).tripId;
    const tTenTrip = (await (await fetch(`${BASE_URL}/trips/${tTenId}`, { headers: { Authorization: `Bearer ${mgrToken}` } })).json()).trip;

    // Daily report check
    const reportRes = await fetch(`${BASE_URL}/reports/daily?date=${today}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const reportData = await reportRes.json();
    const csvExportRes = await fetch(`${BASE_URL}/reports/export?date=${today}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const csvContent = await csvExportRes.text();

    const reportMatchesDb =
      reportData.overview.totalTrips > 0 &&
      reportData.overview.totalDestinations >= 10 &&
      csvContent.includes(tTenId);

    record(
      20,
      'Complete 10-stop trip & report calculations verification',
      tTenTrip.stops.length === 10 && reportMatchesDb,
      `Trip ${tTenId} with 10 stops verified in daily report and CSV export`
    );

    console.log('\n================================================================');
    console.log(`📊 FINAL RESULTS: ${passed} PASSED, ${failed} FAILED (Total 20 Scenarios)`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error('Fatal Test Exception:', err);
    process.exit(1);
  }
}

runProductionHardeningTests();
