/**
 * Enterprise Fleet Timing, Delivery Estimation, and Delay Calculation Utility
 * Provides standardized real-time clock formatting, ETA computation,
 * delivery time projection, and delay variance tracking across Manager & Driver interfaces.
 */

import { Trip, TripStop } from '../types';

/**
 * Format any timestamp (ISO string, HH:mm 24-hr string, or Date) to standard 12-hour display.
 * e.g., '08:00' -> '08:00 AM', '14:30' -> '02:30 PM', ISO -> '08:07 AM'
 */
export function formatClockTime(val?: string | Date | null): string {
  if (!val) return '—';

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '—';
    return val.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const str = String(val).trim();
  if (!str) return '—';

  // Check if it's already HH:mm or HH:mm:ss format
  const timeRegex = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
  const match = str.match(timeRegex);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hourStr}:${minute} ${ampm}`;
  }

  // Try parsing as ISO date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return str;
}

/**
 * Parses a HH:mm string or ISO string into a today's Date object
 */
export function parseTimeToTodayDate(val?: string | null): Date | null {
  if (!val) return null;
  const str = String(val).trim();

  const timeRegex = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
  const match = str.match(timeRegex);
  if (match) {
    const d = new Date();
    d.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
    return d;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return null;
}

/**
 * Real-time clock delivery time calculator based on live road routing duration
 * Returns formatted "Delivery by HH:mm AM/PM" and the target Date object.
 */
export function computeRealtimeDeliveryTime(durationMinutes?: number | null): {
  deliveryTimeStr: string;
  clockTime: string;
  targetDate: Date;
} {
  const mins = Math.max(1, Math.round(durationMinutes || 0));
  const targetDate = new Date(Date.now() + mins * 60000);
  const clockTime = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return {
    deliveryTimeStr: `Delivery by ${clockTime}`,
    clockTime,
    targetDate
  };
}

/**
 * Calculates dynamic delivery timing for a specific stop, factoring in:
 * - Actual arrival if completed / arrived
 * - Road route duration if active next stop
 * - Trip delay minutes applied to planned arrival time if pending
 */
export interface StopTimingResult {
  status: 'COMPLETED' | 'ARRIVED' | 'PENDING' | 'IN_PROGRESS';
  isDelivered: boolean;
  plannedTimeStr: string;
  expectedDeliveryStr: string;
  actualTimeStr: string | null;
  delayVarianceMinutes: number;
  varianceLabel: string;
  isDelayed: boolean;
}

export function calculateStopDeliveryTiming(
  stop: TripStop,
  tripDelayMinutes: number = 0,
  liveEtaMinutes?: number | null
): StopTimingResult {
  const plannedTimeStr = formatClockTime(stop.planned_arrival_time);
  const isDelivered = stop.status === 'COMPLETED';
  const isArrived = stop.status === 'ARRIVED' || stop.status === 'IN_PROGRESS';

  // 1. Completed Stop
  if (isDelivered && stop.actual_arrival_time) {
    const actualTimeStr = formatClockTime(stop.actual_arrival_time);
    const variance = stop.arrival_diff_minutes ?? 0;
    const varianceLabel =
      variance > 0 ? `+${variance}m Late` : variance < 0 ? `${Math.abs(variance)}m Early` : 'On Time';
    return {
      status: 'COMPLETED',
      isDelivered: true,
      plannedTimeStr,
      expectedDeliveryStr: actualTimeStr,
      actualTimeStr,
      delayVarianceMinutes: variance,
      varianceLabel,
      isDelayed: variance > 0
    };
  }

  // 2. Currently Arrived / Docking
  if (isArrived && stop.actual_arrival_time) {
    const actualTimeStr = formatClockTime(stop.actual_arrival_time);
    const variance = stop.arrival_diff_minutes ?? tripDelayMinutes;
    const varianceLabel =
      variance > 0 ? `+${variance}m Late` : variance < 0 ? `${Math.abs(variance)}m Early` : 'On Time';
    return {
      status: 'ARRIVED',
      isDelivered: false,
      plannedTimeStr,
      expectedDeliveryStr: `Arrived at ${actualTimeStr}`,
      actualTimeStr,
      delayVarianceMinutes: variance,
      varianceLabel,
      isDelayed: variance > 0
    };
  }

  // 3. Pending Stop with live road ETA
  if (typeof liveEtaMinutes === 'number' && liveEtaMinutes > 0) {
    const { clockTime } = computeRealtimeDeliveryTime(liveEtaMinutes);
    const isDelayed = tripDelayMinutes > 0;
    const varianceLabel = isDelayed ? `+${tripDelayMinutes}m delay` : 'On Schedule';
    return {
      status: 'PENDING',
      isDelivered: false,
      plannedTimeStr,
      expectedDeliveryStr: `Delivery by ${clockTime}`,
      actualTimeStr: null,
      delayVarianceMinutes: tripDelayMinutes,
      varianceLabel,
      isDelayed
    };
  }

  // 4. Pending Stop projected from planned arrival + trip delay
  const plannedDate = parseTimeToTodayDate(stop.planned_arrival_time);
  if (plannedDate) {
    const projectedDate = new Date(plannedDate.getTime() + (tripDelayMinutes || 0) * 60000);
    const clockTime = projectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isDelayed = tripDelayMinutes > 0;
    const varianceLabel = isDelayed ? `+${tripDelayMinutes}m delay` : 'On Schedule';
    return {
      status: 'PENDING',
      isDelivered: false,
      plannedTimeStr,
      expectedDeliveryStr: isDelayed ? `Exp: ${clockTime}` : plannedTimeStr,
      actualTimeStr: null,
      delayVarianceMinutes: tripDelayMinutes,
      varianceLabel,
      isDelayed
    };
  }

  return {
    status: 'PENDING',
    isDelivered: false,
    plannedTimeStr: plannedTimeStr || 'TBD',
    expectedDeliveryStr: plannedTimeStr || 'TBD',
    actualTimeStr: null,
    delayVarianceMinutes: tripDelayMinutes,
    varianceLabel: tripDelayMinutes > 0 ? `+${tripDelayMinutes}m` : 'On Schedule',
    isDelayed: tripDelayMinutes > 0
  };
}

/**
 * Delay status badge metadata helper
 */
export interface DelayBadgeInfo {
  label: string;
  isDelayed: boolean;
  severity: 'success' | 'warning' | 'critical';
  bgColor: string;
  textColor: string;
  borderColor: string;
  reason?: string;
}

export function getDelayBadgeInfo(delayMinutes: number = 0, reason?: string): DelayBadgeInfo {
  if (delayMinutes > 0) {
    const isCritical = delayMinutes >= 30;
    return {
      label: `+${delayMinutes} min Delay`,
      isDelayed: true,
      severity: isCritical ? 'critical' : 'warning',
      bgColor: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
      textColor: isCritical ? '#ef4444' : '#f59e0b',
      borderColor: isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)',
      reason: reason || undefined
    };
  }

  return {
    label: 'On Schedule',
    isDelayed: false,
    severity: 'success',
    bgColor: 'rgba(16, 185, 129, 0.12)',
    textColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.35)'
  };
}

/**
 * Summary timing calculations for an entire Trip
 */
export interface TripTimingSummary {
  plannedDeparture: string;
  actualStart: string | null;
  completionTime: string | null;
  totalDelayMinutes: number;
  delayBadge: DelayBadgeInfo;
  completedStopsCount: number;
  totalStopsCount: number;
  progressPercent: number;
  expectedFinalDelivery: string;
  currentDestinationName: string;
}

export function calculateTripTimingSummary(trip: Trip): TripTimingSummary {
  const plannedDeparture = formatClockTime(trip.planned_departure_time);
  const actualStart = trip.actual_start_time ? formatClockTime(trip.actual_start_time) : null;
  const completionTime = trip.completion_time ? formatClockTime(trip.completion_time) : null;
  const totalDelayMinutes = trip.total_delay_minutes || 0;

  // Active delay reason if present in trip.delays
  const activeDelay = trip.delays?.find((d) => !d.is_resolved) || trip.delays?.[0];
  const delayBadge = getDelayBadgeInfo(totalDelayMinutes, activeDelay?.reason);

  const stops = trip.stops || [];
  const completedStopsCount = stops.filter((s) => s.status === 'COMPLETED').length;
  const totalStopsCount = stops.length || (trip as any).total_stops || 0;
  const progressPercent = totalStopsCount > 0 ? Math.round((completedStopsCount / totalStopsCount) * 100) : 0;

  // Find next stop or final stop
  const pendingStops = stops.filter((s) => s.status !== 'COMPLETED');
  const currentDest = pendingStops[0]?.destination_name || stops[stops.length - 1]?.destination_name || 'Destination';

  // Expected final delivery
  let expectedFinalDelivery = '—';
  if (trip.status === 'COMPLETED' && trip.completion_time) {
    expectedFinalDelivery = `Completed at ${formatClockTime(trip.completion_time)}`;
  } else if (stops.length > 0) {
    const lastStop = stops[stops.length - 1];
    if (lastStop.status === 'COMPLETED' && lastStop.actual_arrival_time) {
      expectedFinalDelivery = `Delivered at ${formatClockTime(lastStop.actual_arrival_time)}`;
    } else {
      const timing = calculateStopDeliveryTiming(lastStop, totalDelayMinutes);
      expectedFinalDelivery = timing.expectedDeliveryStr;
    }
  } else if (trip.planned_departure_time) {
    expectedFinalDelivery = `Est. ~2-3 hrs`;
  }

  return {
    plannedDeparture,
    actualStart,
    completionTime,
    totalDelayMinutes,
    delayBadge,
    completedStopsCount,
    totalStopsCount,
    progressPercent,
    expectedFinalDelivery,
    currentDestinationName: currentDest
  };
}
