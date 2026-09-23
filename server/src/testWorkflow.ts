import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting End-to-End Operational Workflow Test...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // 1. Manager Login
    const mgrLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'manager@company.com', password: 'manager123' })
    });
    const mgrLoginData = await mgrLoginRes.json();
    assert(mgrLoginRes.status === 200 && !!mgrLoginData.token, 'Manager Authentication');
    const mgrToken = mgrLoginData.token;

    // 2. Fetch fleet data
    const vehiclesRes = await fetch(`${BASE_URL}/fleet/vehicles`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const vehiclesData = await vehiclesRes.json();
    const availableVehicle = vehiclesData.vehicles.find((v: any) => v.status === 'AVAILABLE') || vehiclesData.vehicles[0];

    const driversRes = await fetch(`${BASE_URL}/fleet/drivers`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const driversData = await driversRes.json();
    const testDriver = driversData.drivers.find((d: any) => d.email === 'amit@company.com') || driversData.drivers[0];

    // 3. Manager Creates Multi-Destination Trip
    const today = new Date().toISOString().split('T')[0];
    const createTripRes = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mgrToken}`
      },
      body: JSON.stringify({
        date: today,
        driver_id: testDriver.user_id,
        vehicle_id: availableVehicle.id,
        starting_location: 'Company Main Logistics Hub',
        starting_latitude: 23.2500,
        starting_longitude: 77.4100,
        purpose: 'Multi-Stop Supply Dispatch',
        reference_number: 'TEST-DISP-9901',
        planned_departure_time: '09:00',
        notes: 'Automated test trip multi-destination validation',
        stops: [
          {
            destination_name: 'Alpha Hub',
            address: 'Industrial Plot 1',
            latitude: 23.2550,
            longitude: 77.4150,
            geofence_radius_meters: 200,
            planned_arrival_time: '09:30'
          },
          {
            destination_name: 'Beta Depot',
            address: 'Highway Commercial Zone',
            latitude: 23.2700,
            longitude: 77.4300,
            geofence_radius_meters: 200,
            planned_arrival_time: '10:45'
          }
        ]
      })
    });
    const createTripData = await createTripRes.json();
    assert(createTripRes.status === 201 && !!createTripData.tripId, 'Manager Creates Trip with 2 Stops', createTripData);
    const tripId = createTripData.tripId;

    // 4. Driver Login
    const drvLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testDriver.email, password: 'driver123' })
    });
    const drvLoginData = await drvLoginRes.json();
    assert(drvLoginRes.status === 200 && !!drvLoginData.token, 'Driver Authentication');
    const drvToken = drvLoginData.token;

    // 5. Driver Views Assigned Trip
    const drvTripRes = await fetch(`${BASE_URL}/driver/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${drvToken}` }
    });
    const drvTripData = await drvTripRes.json();
    assert(drvTripData.trip && drvTripData.trip.stops.length === 2, 'Driver Views Multi-Stop Trip Structure');
    const stop1 = drvTripData.trip.stops[0];
    const stop2 = drvTripData.trip.stops[1];

    // 6. Driver Starts Trip
    const startTripRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      },
      body: JSON.stringify({
        latitude: 23.2501,
        longitude: 77.4102,
        gps_accuracy: 5.0
      })
    });
    const startTripData = await startTripRes.json();
    assert(startTripRes.status === 200 && startTripData.status === 'IN_PROGRESS', 'Driver Starts Trip (IN_PROGRESS)');

    // 7. Business Rule Check: Cannot Complete Trip Before Starting/Visiting Stops
    const earlyCompleteRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      },
      body: JSON.stringify({ latitude: 23.2500, longitude: 77.4100 })
    });
    assert(earlyCompleteRes.status === 400, 'Business Rule Guard: Cannot Complete Trip Without Base Arrival');

    // 8. Driver Arrives at Stop 1
    const arriveStop1Res = await fetch(`${BASE_URL}/driver/trips/${tripId}/stops/${stop1.id}/arrive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      },
      body: JSON.stringify({
        latitude: 23.2551,
        longitude: 77.4151,
        gps_accuracy: 6.0
      })
    });
    const arriveStop1Data = await arriveStop1Res.json();
    assert(arriveStop1Res.status === 200 && arriveStop1Data.geofence.verified, 'Driver Arrives Stop 1 & Geofence Verified');

    // 9. Driver Completes Activity at Stop 1
    const actStop1Res = await fetch(`${BASE_URL}/driver/trips/${tripId}/stops/${stop1.id}/complete-activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      },
      body: JSON.stringify({
        activity_type: 'Delivery',
        status: 'COMPLETED',
        quantity: 25,
        reference_number: 'DEL-INV-001',
        recipient_name: 'Site Supervisor Vikram',
        notes: 'Handed over in sealed condition'
      })
    });
    assert(actStop1Res.status === 200, 'Driver Completes Delivery Activity at Stop 1');

    // 10. Driver Departs Stop 1
    const departStop1Res = await fetch(`${BASE_URL}/driver/trips/${tripId}/stops/${stop1.id}/depart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      },
      body: JSON.stringify({
        latitude: 23.2552,
        longitude: 77.4152,
        gps_accuracy: 5.5
      })
    });
    const departStop1Data = await departStop1Res.json();
    assert(departStop1Res.status === 200 && departStop1Data.remainingStops === 1, 'Driver Departs Stop 1 (1 Stop Remaining)');

    // 11. Driver Reports Delay on route to Stop 2
    const delayRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/delay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      },
      body: JSON.stringify({
        reason: 'Traffic',
        description: 'Level crossing railway gate closed',
        stopId: stop2.id,
        latitude: 23.2620,
        longitude: 77.4200,
        gps_accuracy: 10.0
      })
    });
    const delayData = await delayRes.json();
    assert(delayRes.status === 200 && !!delayData.delayId, 'Driver Reports Delay (Traffic)');
    const delayId = delayData.delayId;

    // 12. Driver Resolves Delay
    const resolveDelayRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/delay/${delayId}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${drvToken}`
      }
    });
    const resolveDelayData = await resolveDelayRes.json();
    assert(resolveDelayRes.status === 200 && resolveDelayData.duration_minutes >= 1, 'Driver Resolves Delay & Calculates Duration');

    // 13. Driver Arrives at Stop 2, Completes Activity, Departs
    await fetch(`${BASE_URL}/driver/trips/${tripId}/stops/${stop2.id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${drvToken}` },
      body: JSON.stringify({ latitude: 23.2701, longitude: 77.4302, gps_accuracy: 8.0 })
    });
    await fetch(`${BASE_URL}/driver/trips/${tripId}/stops/${stop2.id}/complete-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${drvToken}` },
      body: JSON.stringify({ activity_type: 'Pickup', status: 'COMPLETED', quantity: 10 })
    });
    const departStop2Res = await fetch(`${BASE_URL}/driver/trips/${tripId}/stops/${stop2.id}/depart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${drvToken}` },
      body: JSON.stringify({ latitude: 23.2705, longitude: 77.4305 })
    });
    const departStop2Data = await departStop2Res.json();
    assert(departStop2Data.allStopsCompleted === true, 'All Destination Stops Completed');

    // 14. Driver Starts Return Journey
    const returnRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/start-return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${drvToken}` },
      body: JSON.stringify({ latitude: 23.2700, longitude: 77.4300 })
    });
    assert(returnRes.status === 200, 'Driver Starts Return Journey (RETURNING)');

    // 15. Driver Arrives Back at Base
    const baseArriveRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/arrive-base`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${drvToken}` },
      body: JSON.stringify({ latitude: 23.2500, longitude: 77.4100 })
    });
    assert(baseArriveRes.status === 200, 'Driver Arrives Back at Base');

    // 16. Driver Completes Trip
    const completeTripRes = await fetch(`${BASE_URL}/driver/trips/${tripId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${drvToken}` },
      body: JSON.stringify({ latitude: 23.2500, longitude: 77.4100 })
    });
    const completeTripData = await completeTripRes.json();
    assert(completeTripRes.status === 200 && completeTripData.status === 'COMPLETED', 'Driver Completes Entire Multi-Stop Trip');

    // 17. Manager Inspects Full Trip Timeline
    const mgrTripDetailRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const mgrTripDetailData = await mgrTripDetailRes.json();
    assert(mgrTripDetailData.trip.events.length >= 8, 'Full Chronological Timeline Generated from Stored Events');
    assert(mgrTripDetailData.trip.delays.length === 1, 'Trip Delay Record Associated');

    // 18. Daily Report & CSV Generation
    const dailyReportRes = await fetch(`${BASE_URL}/reports/daily?date=${today}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const dailyReportData = await dailyReportRes.json();
    assert(dailyReportData.overview.completedTrips >= 1, 'Daily Logistics Report Includes Completed Trip');

    const csvExportRes = await fetch(`${BASE_URL}/reports/export?date=${today}`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const csvText = await csvExportRes.text();
    assert(csvExportRes.status === 200 && csvText.includes(tripId), 'Operational Report CSV Generated & Contains Trip ID');

    // 19. Google Sheets Sync Status
    const syncStatusRes = await fetch(`${BASE_URL}/google-sheets/status`, {
      headers: { Authorization: `Bearer ${mgrToken}` }
    });
    const syncStatusData = await syncStatusRes.json();
    assert(syncStatusRes.status === 200 && syncStatusData.counts.SYNCED > 0, 'Google Sheets Sync Records Generated');

    console.log(`\n🎉 Test Suite Completed: ${passed} Passed, ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err: any) {
    console.error('Fatal Test Exception:', err);
    process.exit(1);
  }
}

runTests();
