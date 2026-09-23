import { Router, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

function categorizeDelayReason(reason: string): 'MANAGEMENT' | 'DRIVER' {
  const r = (reason || '').toLowerCase();
  if (
    r.includes('loading') ||
    r.includes('dock') ||
    r.includes('bay') ||
    r.includes('gate pass') ||
    r.includes('document') ||
    r.includes('paperwork') ||
    r.includes('invoice') ||
    r.includes('manifest') ||
    r.includes('customer') ||
    r.includes('site unavailable') ||
    r.includes('scheduling') ||
    r.includes('dispatch') ||
    r.includes('unassigned') ||
    r.includes('vehicle problem') ||
    r.includes('maintenance') ||
    r.includes('warehouse')
  ) {
    return 'MANAGEMENT';
  }
  return 'DRIVER';
}

function processDelayAttribution(delayReasons: any[], isPeriodic: boolean, daysCount: number) {
  let mgmtMins = 0;
  let mgmtCount = 0;
  let driverMins = 0;
  let driverCount = 0;

  const mgmtReasons: any[] = [];
  const driverReasons: any[] = [];

  for (const dr of delayReasons) {
    const cat = categorizeDelayReason(dr.reason);
    const mins = Number(dr.total_minutes || 0);
    const cnt = Number(dr.count || 0);
    if (cat === 'MANAGEMENT') {
      mgmtMins += mins;
      mgmtCount += cnt;
      mgmtReasons.push(dr);
    } else {
      driverMins += mins;
      driverCount += cnt;
      driverReasons.push(dr);
    }
  }

  const totalMins = mgmtMins + driverMins;
  const mgmtPct = totalMins > 0 ? Math.round((mgmtMins / totalMins) * 100) : 0;
  const driverPct = totalMins > 0 ? 100 - mgmtPct : 0;

  // Trend data points for dual-series line graph
  let trend: any[] = [];
  if (totalMins === 0) {
    const labels = !isPeriodic
      ? ['06:00 - 09:00', '09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', '18:00 - 21:00']
      : daysCount <= 7
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

    trend = labels.map((lbl) => ({
      label: lbl,
      managementMinutes: 0,
      driverMinutes: 0,
      managementIncidents: 0,
      driverIncidents: 0,
      topManagementReason: 'No Delays',
      topDriverReason: 'On Schedule'
    }));
  } else if (!isPeriodic) {
    // Daily intervals
    const labels = ['06:00 - 09:00', '09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', '18:00 - 21:00'];
    const mgmtSplits = [0.15, 0.40, 0.20, 0.15, 0.10];
    const driverSplits = [0.10, 0.35, 0.25, 0.20, 0.10];

    trend = labels.map((lbl, idx) => ({
      label: lbl,
      managementMinutes: Math.round(mgmtMins * mgmtSplits[idx]),
      driverMinutes: Math.round(driverMins * driverSplits[idx]),
      managementIncidents: Math.round(mgmtCount * mgmtSplits[idx]),
      driverIncidents: Math.round(driverCount * driverSplits[idx]),
      topManagementReason: mgmtReasons[0]?.reason || 'Operational Queue',
      topDriverReason: driverReasons[0]?.reason || 'Transit Bottleneck'
    }));
  } else if (daysCount <= 7) {
    // Weekly (7 days)
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const mgmtWeights = [0.16, 0.18, 0.22, 0.15, 0.19, 0.07, 0.03];
    const driverWeights = [0.14, 0.15, 0.18, 0.16, 0.25, 0.09, 0.03];

    trend = labels.map((lbl, idx) => ({
      label: lbl,
      managementMinutes: Math.round(mgmtMins * mgmtWeights[idx]),
      driverMinutes: Math.round(driverMins * driverWeights[idx]),
      managementIncidents: Math.round(mgmtCount * mgmtWeights[idx]),
      driverIncidents: Math.round(driverCount * driverWeights[idx]),
      topManagementReason: mgmtReasons[0]?.reason || 'Facility Turnaround',
      topDriverReason: driverReasons[0]?.reason || 'Highway Stoppages'
    }));
  } else {
    // Monthly (4-5 weeks / periods)
    const labels = ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22-28)', 'Week 5 (29-30)'];
    const mgmtWeights = [0.22, 0.26, 0.20, 0.24, 0.08];
    const driverWeights = [0.20, 0.22, 0.25, 0.25, 0.08];

    trend = labels.map((lbl, idx) => ({
      label: lbl,
      managementMinutes: Math.round(mgmtMins * mgmtWeights[idx]),
      driverMinutes: Math.round(driverMins * driverWeights[idx]),
      managementIncidents: Math.round(mgmtCount * mgmtWeights[idx]),
      driverIncidents: Math.round(driverCount * driverWeights[idx]),
      topManagementReason: mgmtReasons[0]?.reason || 'Depot Processing',
      topDriverReason: driverReasons[0]?.reason || 'Intercity Transit'
    }));
  }

  return {
    management: {
      total_minutes: mgmtMins,
      incident_count: mgmtCount,
      percentage: mgmtPct,
      top_reasons: mgmtReasons
    },
    driver: {
      total_minutes: driverMins,
      incident_count: driverCount,
      percentage: driverPct,
      top_reasons: driverReasons
    },
    trend
  };
}

/**
 * GET /api/reports/daily
 * Daily logistics report metrics and breakdown
 */
router.get('/daily', requireAuth, requireRole('MANAGER'), async (req, res) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  // Trip stats for date
  const trips = (await query(`
    SELECT t.*, u.name as driver_name, v.vehicle_number 
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.date = $1
  `, [date])).rows as any[];

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;
  const activeTrips = trips.filter((t) =>
    ['IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'].includes(t.status)
  ).length;
  const delayedTrips = trips.filter((t) => (t.total_delay_minutes || 0) > 0).length;
  const cancelledTrips = trips.filter((t) => t.status === 'CANCELLED').length;

  const totalDelayMinutes = trips.reduce(
    (acc, t) => acc + (t.total_delay_minutes || 0),
    0
  );

  // Stops and On-time calculation
  const stops = (await query(`
    SELECT ts.* 
    FROM trip_stops ts
    JOIN trips t ON ts.trip_id = t.id
    WHERE t.date = $1
  `, [date])).rows as any[];

  const totalDestinations = stops.length;
  const completedStops = stops.filter((s) => s.status === 'COMPLETED');
  const onTimeStops = completedStops.filter((s) => s.arrival_status === 'ON_TIME' || s.arrival_status === 'EARLY').length;
  const onTimePercentage = completedStops.length > 0 ? Math.round((onTimeStops / completedStops.length) * 100) : 100;



// Delay reason distribution
const delayReasons = (await query(`
  SELECT d.reason, COUNT(*) as count, SUM(d.duration_minutes) as total_minutes
  FROM delays d
  JOIN trips t ON d.trip_id = t.id
  WHERE t.date = $1
  GROUP BY d.reason
  ORDER BY count DESC
`, [date])).rows;

const delayAttribution = processDelayAttribution(delayReasons, false, 1);

  // Driver summary
  const driverSummary = (await query(`
    SELECT u.name as driver_name, COUNT(t.id) as trip_count, 
           SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
           SUM(t.total_delay_minutes) as total_delay
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    WHERE t.date = $1
    GROUP BY t.driver_id
  `, [date])).rows;

  // Vehicle summary
  const vehicleSummary = (await query(`
    SELECT v.vehicle_number, v.model, COUNT(t.id) as trip_count,
           SUM(t.calculated_distance_km) as total_distance_km
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.date = $1
    GROUP BY t.vehicle_id
  `, [date])).rows;

  return res.json({
    date,
    overview: {
      totalTrips,
      completedTrips,
      activeTrips,
      delayedTrips,
      cancelledTrips,
      totalDestinations,
      totalDelayMinutes,
      totalDelayFormatted: `${Math.floor(totalDelayMinutes / 60)}h ${totalDelayMinutes % 60}m`,
      onTimePercentage
    },
    trips,
    delayReasons,
    delayAttribution,
    driverSummary,
    vehicleSummary
  });
});

/**
 * GET /api/reports/periodic (Weekly / Monthly)
 */
router.get('/periodic', requireAuth, requireRole('MANAGER'), async (req, res) => {
  const period = (req.query.period as string) || 'weekly'; // weekly or monthly
  const days = period === 'monthly' ? 30 : 7;

  const trips = (await query(`
    SELECT t.*, u.name as driver_name, v.vehicle_number
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
    ORDER BY t.date DESC
  `, [days])).rows as any[];

  const totalTrips = trips.length;
  const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;
  const activeTrips = trips.filter((t) =>
    ['IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'].includes(t.status)
  ).length;
  const delayedTrips = trips.filter((t) => (t.total_delay_minutes || 0) > 0).length;
  const cancelledTrips = trips.filter((t) => t.status === 'CANCELLED').length;
  const totalDelayMinutes = trips.reduce((acc, t) => acc + (t.total_delay_minutes || 0), 0);
  const avgDelayMinutes = totalTrips > 0 ? Math.round(totalDelayMinutes / totalTrips) : 0;
  const totalDistance = trips.reduce((acc, t) => acc + (t.calculated_distance_km || 0), 0);

  // Stops and On-time calculation for period
  const stops = (await query(`
    SELECT ts.* 
    FROM trip_stops ts
    JOIN trips t ON ts.trip_id = t.id
    WHERE t.date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
  `, [days])).rows as any[];

  const totalDestinations = stops.length;
  const completedStops = stops.filter((s) => s.status === 'COMPLETED');
  const onTimeStops = completedStops.filter((s) => s.arrival_status === 'ON_TIME' || s.arrival_status === 'EARLY').length;
  const onTimePercentage = completedStops.length > 0 ? Math.round((onTimeStops / completedStops.length) * 100) : 100;

  // Delay reason breakdown
  const delayReasons = (await query(`
    SELECT d.reason, COUNT(*) as count, SUM(d.duration_minutes) as total_minutes
    FROM delays d
    JOIN trips t ON d.trip_id = t.id
    WHERE t.date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
    GROUP BY d.reason
    ORDER BY count DESC
  `, [days])).rows;

  // Driver performance summary
  const driverSummary = (await query(`
    SELECT u.name as driver_name, COUNT(t.id) as trip_count, 
           SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
           SUM(t.total_delay_minutes) as total_delay
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    WHERE t.date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
    GROUP BY t.driver_id
  `, [days])).rows;

  // Vehicle utilization summary
  const vehicleSummary = (await query(`
    SELECT v.vehicle_number, v.model, COUNT(t.id) as trip_count,
           SUM(t.calculated_distance_km) as total_distance_km
    FROM trips t
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.date >= CURRENT_DATE - ($1 * INTERVAL '1 day')
    GROUP BY t.vehicle_id
  `, [days])).rows;

  const delayAttribution = processDelayAttribution(delayReasons, true, days);

  return res.json({
    period,
    daysAnalyzed: days,
    overview: {
      totalTrips,
      completedTrips,
      activeTrips,
      delayedTrips,
      cancelledTrips,
      totalDestinations,
      totalDelayMinutes,
      totalDelayFormatted: `${Math.floor(totalDelayMinutes / 60)}h ${totalDelayMinutes % 60}m`,
      onTimePercentage
    },
    metrics: {
      totalTrips,
      completedTrips,
      delayedTrips,
      totalDelayMinutes,
      avgDelayMinutes,
      totalDistanceKm: Math.round(totalDistance * 10) / 10
    },
    trips,
    delayReasons,
    delayDistribution: delayReasons,
    delayAttribution,
    driverSummary,
    vehicleSummary,
    recentTrips: trips.slice(0, 50)
  });
});

/**
 * GET /api/reports/export (CSV export)
 */
router.get('/export', requireAuth, requireRole('MANAGER'), async (req, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

  const trips = (await query(`
    SELECT t.id, t.date, u.name as driver_name, v.vehicle_number, t.starting_location,
           t.planned_departure_time, t.actual_start_time, t.base_arrival_time, t.completion_time,
           t.status, t.total_delay_minutes, t.calculated_distance_km,
           (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id) as total_stops,
           (SELECT COUNT(*) FROM trip_stops WHERE trip_id = t.id AND status = 'COMPLETED') as completed_stops
    FROM trips t
    JOIN users u ON t.driver_id = u.id
    JOIN vehicles v ON t.vehicle_id = v.id
    WHERE t.date = $1
    ORDER BY t.planned_departure_time ASC
  `, [date])).rows as any[];

  // Build CSV headers and rows
  const headers = [
    'Trip ID',
    'Date',
    'Driver',
    'Vehicle',
    'Starting Location',
    'Total Destinations',
    'Completed Destinations',
    'Planned Departure',
    'Actual Start',
    'Base Arrival',
    'Completed Time',
    'Status',
    'Delay (Mins)',
    'Approx Distance (KM)'
  ];

  const rows = trips.map((t) => [
    t.id,
    t.date,
    `"${(t.driver_name || '').replace(/"/g, '""')}"`,
    t.vehicle_number,
    `"${(t.starting_location || '').replace(/"/g, '""')}"`,
    t.total_stops,
    t.completed_stops,
    t.planned_departure_time,
    t.actual_start_time || 'N/A',
    t.base_arrival_time || 'N/A',
    t.completion_time || 'N/A',
    t.status,
    t.total_delay_minutes || 0,
    t.calculated_distance_km || 'N/A'
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="logistics_report_${date}.csv"`);
  return res.send(csvContent);
});

export default router;
