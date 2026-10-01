import { Router, Response } from 'express';
import { query } from '../db';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const AUTOMATIC_START_DELAY_REASON =
  'Late Trip Start (Operations)';

function parseReportPlannedDeparture(
  dateValue: unknown,
  timeValue: unknown
): Date | null {
  const date = String(dateValue ?? '').slice(0, 10);
  const time = String(timeValue ?? '').trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
  ) {
    return null;
  }

  const parsed = new Date(
    `${date}T${time}:00+05:30`
  );

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function parseReportActualStart(
  value: unknown
): Date | null {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  // PostgreSQL timestamp without timezone.
  // Interpret it as India local time.
  if (
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(raw)
  ) {
    const parsed = new Date(
      `${raw.replace(' ', 'T')}+05:30`
    );

    return Number.isNaN(parsed.getTime())
      ? null
      : parsed;
  }

  const parsed = new Date(raw);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function calculateAutomaticStartDelayMinutes(
  trip: any
): number {
  const planned = parseReportPlannedDeparture(
    trip?.date,
    trip?.planned_departure_time
  );

  const actual = parseReportActualStart(
    trip?.actual_start_time
  );

  if (!planned || !actual) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      (actual.getTime() - planned.getTime()) /
        60000
    )
  );
}

function calculateAutomaticStartDelay(
  trips: any[],
  explicitDelayTripIds: Set<string>
) {
  let totalMinutes = 0;
  let incidentCount = 0;
  const tripIds: string[] = [];
  const events: any[] = [];

  for (const trip of trips || []) {
    const tripId = String(trip?.id || '');

    if (!tripId) {
      continue;
    }

    // Do not double-count a trip that already has
    // an explicitly recorded delay.
    if (explicitDelayTripIds.has(tripId)) {
      continue;
    }

    const minutes =
      calculateAutomaticStartDelayMinutes(trip);

    if (minutes <= 0) {
      continue;
    }

    totalMinutes += minutes;
    incidentCount += 1;
    tripIds.push(tripId);

    // Reporting-only synthetic event.
    // The graph uses actual_start_time as the event time.
    events.push({
      id: `AUTO-START-${tripId}`,
      trip_id: tripId,
      reason: AUTOMATIC_START_DELAY_REASON,
      start_time: trip.actual_start_time,
      duration_minutes: minutes,
      automatic: true
    });
  }

  return {
    totalMinutes,
    incidentCount,
    tripIds,
    events
  };
}
function addAutomaticStartReason(
  delayReasons: any[],
  totalMinutes: number,
  incidentCount: number
) {
  if (
    totalMinutes <= 0 ||
    incidentCount <= 0
  ) {
    return;
  }

  delayReasons.push({
    reason: AUTOMATIC_START_DELAY_REASON,
    count: incidentCount,
    total_minutes: totalMinutes
  });
}

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
    r.includes('warehouse') ||
    r.includes('late trip start (operations)')
  ) {
    return 'MANAGEMENT';
  }
  return 'DRIVER';
}

/*
 * ACTUAL_EVENT_TIME_BUCKETING_STEP3
 *
 * Accountability totals are still calculated from delayReasons.
 * The graph itself is now built from REAL delay event times.
 */
function processDelayAttribution(
  delayReasons: any[],
  isPeriodic: boolean,
  daysCount: number,
  delayEvents: any[] = []
) {
  let mgmtMins = 0;
  let mgmtCount = 0;
  let driverMins = 0;
  let driverCount = 0;

  const mgmtReasons: any[] = [];
  const driverReasons: any[] = [];

  for (const dr of delayReasons || []) {
    const category = categorizeDelayReason(
      String(dr?.reason || '')
    );

    const minutes = Number(
      dr?.total_minutes || 0
    );

    const count = Number(
      dr?.count || 0
    );

    if (category === 'MANAGEMENT') {
      mgmtMins += minutes;
      mgmtCount += count;
      mgmtReasons.push(dr);
    } else {
      driverMins += minutes;
      driverCount += count;
      driverReasons.push(dr);
    }
  }

  const totalMins =
    mgmtMins + driverMins;

  const mgmtPct =
    totalMins > 0
      ? Math.round(
          (mgmtMins / totalMins) * 100
        )
      : 0;

  const driverPct =
    totalMins > 0
      ? 100 - mgmtPct
      : 0;

  let labels: string[];

  if (!isPeriodic) {
    labels = [
      '06:00 - 09:00',
      '09:00 - 12:00',
      '12:00 - 15:00',
      '15:00 - 18:00',
      '18:00 - 21:00'
    ];
  } else if (daysCount <= 7) {
    labels = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun'
    ];
  } else {
    labels = [
      'Week 1 (1-7)',
      'Week 2 (8-14)',
      'Week 3 (15-21)',
      'Week 4 (22-28)',
      'Week 5 (29-30)'
    ];
  }

  const trend = labels.map((label) => ({
    label,
    managementMinutes: 0,
    driverMinutes: 0,
    managementIncidents: 0,
    driverIncidents: 0,
    topManagementReason:
      mgmtMins > 0
        ? 'Operational Queue'
        : 'No Delays',
    topDriverReason:
      driverMins > 0
        ? 'Transit Bottleneck'
        : 'On Schedule'
  }));

  const reasonBuckets = labels.map(() => ({
    management: new Map<string, number>(),
    driver: new Map<string, number>()
  }));

  const weekdayIndex: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };

  function getEventParts(value: unknown) {
    if (!value) {
      return null;
    }

    const raw = String(value).trim();

    if (!raw) {
      return null;
    }

    let parsed: Date;

    // PostgreSQL timestamp without timezone.
    // Interpret it as India local time.
    if (
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(raw)
    ) {
      parsed = new Date(
        `${raw.replace(' ', 'T')}+05:30`
      );
    } else {
      parsed = new Date(raw);
    }

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    const parts = new Intl.DateTimeFormat(
      'en-IN',
      {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }
    ).formatToParts(parsed);

    const get = (type: string) =>
      parts.find(
        (part) => part.type === type
      )?.value || '';

    return {
      weekday: get('weekday'),
      day: Number(get('day')),
      hour: Number(get('hour')),
      minute: Number(get('minute'))
    };
  }

  // =======================================================
  // PUT EACH REAL EVENT INTO ITS REAL TIME BUCKET
  // =======================================================

  for (const event of delayEvents || []) {
    const minutes = Number(
      event?.duration_minutes || 0
    );

    if (minutes <= 0) {
      continue;
    }

    const parts = getEventParts(
      event?.start_time
    );

    if (!parts) {
      continue;
    }

    const reason =
      String(
        event?.reason || 'Unspecified'
      ).trim() || 'Unspecified';

    const category =
      categorizeDelayReason(reason);

    let bucketIndex = -1;

    if (!isPeriodic) {
      // DAILY: use actual event clock time.
      if (parts.hour < 9) {
        bucketIndex = 0;
      } else if (parts.hour < 12) {
        bucketIndex = 1;
      } else if (parts.hour < 15) {
        bucketIndex = 2;
      } else if (parts.hour < 18) {
        bucketIndex = 3;
      } else {
        bucketIndex = 4;
      }
    } else if (daysCount <= 7) {
      // WEEKLY: use actual event weekday.
      bucketIndex =
        weekdayIndex[parts.weekday] ?? -1;
    } else {
      // MONTHLY: use actual calendar week.
      bucketIndex = Math.min(
        4,
        Math.floor(
          (parts.day - 1) / 7
        )
      );
    }

    if (
      bucketIndex < 0 ||
      bucketIndex >= trend.length
    ) {
      continue;
    }

    if (category === 'MANAGEMENT') {
      trend[bucketIndex].managementMinutes += minutes;
      trend[bucketIndex].managementIncidents += 1;

      const map =
        reasonBuckets[bucketIndex]
          .management;

      map.set(
        reason,
        (map.get(reason) || 0) + minutes
      );
    } else {
      trend[bucketIndex].driverMinutes += minutes;
      trend[bucketIndex].driverIncidents += 1;

      const map =
        reasonBuckets[bucketIndex]
          .driver;

      map.set(
        reason,
        (map.get(reason) || 0) + minutes
      );
    }
  }

  const getTopReason = (
    map: Map<string, number>,
    fallback: string
  ) => {
    let bestReason = '';
    let bestMinutes = -1;

    for (const [
      reason,
      minutes
    ] of map.entries()) {
      if (minutes > bestMinutes) {
        bestMinutes = minutes;
        bestReason = reason;
      }
    }

    return bestReason || fallback;
  };

  for (let i = 0; i < trend.length; i += 1) {
    trend[i].topManagementReason =
      getTopReason(
        reasonBuckets[i].management,
        mgmtMins > 0
          ? 'Operational Queue'
          : 'No Delays'
      );

    trend[i].topDriverReason =
      getTopReason(
        reasonBuckets[i].driver,
        driverMins > 0
          ? 'Transit Bottleneck'
          : 'On Schedule'
      );
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
  try {
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

    const explicitDelayTripRows = (await query(`
      SELECT DISTINCT d.trip_id
      FROM delays d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.date = $1
    `, [date])).rows as Array<{ trip_id: string }>;

    const explicitDelayTripIds = new Set(
      explicitDelayTripRows.map((row) =>
        String(row.trip_id)
      )
    );

    const delayEventsDaily = (await query(`
      SELECT d.*
      FROM delays d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.date = $1
      ORDER BY d.start_time ASC
    `, [date])).rows as any[];
    const automaticStartDelay =
      calculateAutomaticStartDelay(
        trips,
        explicitDelayTripIds
      );

    const automaticDelayedTripIds = new Set(
      automaticStartDelay.tripIds
    );

    const delayedTrips = trips.filter((t) =>
      Number(t.total_delay_minutes || 0) > 0 ||
      automaticDelayedTripIds.has(String(t.id))
    ).length;

    const cancelledTrips = trips.filter(
      (t) => t.status === 'CANCELLED'
    ).length;

    const totalDelayMinutes =
      trips.reduce(
        (acc, t) =>
          acc + Number(t.total_delay_minutes || 0),
        0
      ) +
      automaticStartDelay.totalMinutes;

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

    addAutomaticStartReason(
      delayReasons,
      automaticStartDelay.totalMinutes,
      automaticStartDelay.incidentCount
    );

    const delayAttribution =
      processDelayAttribution(
        delayReasons,
        false,
        1,
        [
          ...delayEventsDaily,
          ...(automaticStartDelay.events || [])
        ]
      );

    // Driver summary - include u.name in GROUP BY for PostgreSQL compatibility
    const driverSummary = (await query(`
      SELECT u.name as driver_name, COUNT(t.id) as trip_count, 
             SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
             COALESCE(SUM(t.total_delay_minutes), 0) as total_delay
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE t.date = $1
      GROUP BY t.driver_id, u.name
    `, [date])).rows;

    // Vehicle summary - include v.vehicle_number, v.model in GROUP BY for PostgreSQL compatibility
    const vehicleSummary = (await query(`
      SELECT v.vehicle_number, v.model, COUNT(t.id) as trip_count,
             COALESCE(SUM(t.calculated_distance_km), 0) as total_distance_km
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.date = $1
      GROUP BY t.vehicle_id, v.vehicle_number, v.model
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
  } catch (err: any) {
    console.error('[Reports Error] /daily failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate daily report' });
  }
});

/**
 * GET /api/reports/periodic (Weekly / Monthly)
 */
router.get('/periodic', requireAuth, requireRole('MANAGER'), async (req, res) => {
  try {
    const period = (req.query.period as string) || 'weekly'; // weekly or monthly
    const days = period === 'monthly' ? 30 : 7;
    // Calculate startDate string in YYYY-MM-DD format for 100% portable DB comparison
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const trips = (await query(`
      SELECT t.*, u.name as driver_name, v.vehicle_number
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.date >= $1
      ORDER BY t.date DESC
    `, [startDate])).rows as any[];

    const totalTrips = trips.length;
    const completedTrips = trips.filter((t) => t.status === 'COMPLETED').length;
    const activeTrips = trips.filter((t) =>
      ['IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'].includes(t.status)
    ).length;

    const explicitDelayTripRows = (await query(`
      SELECT DISTINCT d.trip_id
      FROM delays d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.date >= $1
    `, [startDate])).rows as Array<{ trip_id: string }>;

    const explicitDelayTripIds = new Set(
      explicitDelayTripRows.map((row) =>
        String(row.trip_id)
      )
    );

    const delayEventsPeriodic = (await query(`
      SELECT d.*
      FROM delays d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.date >= $1
      ORDER BY d.start_time ASC
    `, [startDate])).rows as any[];
    const automaticStartDelay =
      calculateAutomaticStartDelay(
        trips,
        explicitDelayTripIds
      );

    const automaticDelayedTripIds = new Set(
      automaticStartDelay.tripIds
    );

    const delayedTrips = trips.filter((t) =>
      Number(t.total_delay_minutes || 0) > 0 ||
      automaticDelayedTripIds.has(String(t.id))
    ).length;

    const cancelledTrips = trips.filter(
      (t) => t.status === 'CANCELLED'
    ).length;

    const totalDelayMinutes =
      trips.reduce(
        (acc, t) =>
          acc + Number(t.total_delay_minutes || 0),
        0
      ) +
      automaticStartDelay.totalMinutes;

    const avgDelayMinutes =
      totalTrips > 0
        ? Math.round(totalDelayMinutes / totalTrips)
        : 0;

    const totalDistance = trips.reduce(
      (acc, t) =>
        acc + Number(t.calculated_distance_km || 0),
      0
    );

    // Stops and On-time calculation for period
    const stops = (await query(`
      SELECT ts.* 
      FROM trip_stops ts
      JOIN trips t ON ts.trip_id = t.id
      WHERE t.date >= $1
    `, [startDate])).rows as any[];

    const totalDestinations = stops.length;
    const completedStops = stops.filter((s) => s.status === 'COMPLETED');
    const onTimeStops = completedStops.filter((s) => s.arrival_status === 'ON_TIME' || s.arrival_status === 'EARLY').length;
    const onTimePercentage = completedStops.length > 0 ? Math.round((onTimeStops / completedStops.length) * 100) : 100;

    // Delay reason breakdown
    const delayReasons = (await query(`
      SELECT d.reason, COUNT(*) as count, SUM(d.duration_minutes) as total_minutes
      FROM delays d
      JOIN trips t ON d.trip_id = t.id
      WHERE t.date >= $1
      GROUP BY d.reason
      ORDER BY count DESC
    `, [startDate])).rows;

    // Driver performance summary - include u.name in GROUP BY
    const driverSummary = (await query(`
      SELECT u.name as driver_name, COUNT(t.id) as trip_count, 
             SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
             COALESCE(SUM(t.total_delay_minutes), 0) as total_delay
      FROM trips t
      JOIN users u ON t.driver_id = u.id
      WHERE t.date >= $1
      GROUP BY t.driver_id, u.name
    `, [startDate])).rows;

    // Vehicle utilization summary - include v.vehicle_number, v.model in GROUP BY
    const vehicleSummary = (await query(`
      SELECT v.vehicle_number, v.model, COUNT(t.id) as trip_count,
             COALESCE(SUM(t.calculated_distance_km), 0) as total_distance_km
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.date >= $1
      GROUP BY t.vehicle_id, v.vehicle_number, v.model
    `, [startDate])).rows;

    addAutomaticStartReason(
      delayReasons,
      automaticStartDelay.totalMinutes,
      automaticStartDelay.incidentCount
    );

    const delayAttribution =
      processDelayAttribution(
        delayReasons,
        true,
        days,
        [
          ...delayEventsPeriodic,
          ...(automaticStartDelay.events || [])
        ]
      );

    return res.json({
      period,
      daysAnalyzed: days,
      totalTrips,
      completedTrips,
      activeTrips,
      delayedTrips,
      cancelledTrips,
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
  } catch (err: any) {
    console.error('[Reports Error] /periodic failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate periodic report' });
  }
});

/**
 * GET /api/reports/export (CSV export)
 */
router.get('/export', requireAuth, requireRole('MANAGER'), async (req, res: Response) => {
  try {
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
  } catch (err: any) {
    console.error('[Reports Error] /export failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to export CSV report' });
  }
});

export default router;
