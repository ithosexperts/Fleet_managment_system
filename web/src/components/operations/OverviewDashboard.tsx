import React, { useMemo, useState } from 'react';
import {
  Truck,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Eye,
  Navigation,
  Plus,
  Radio,
  FileCheck
} from 'lucide-react';
import { Trip, Driver, Vehicle, OperationalException } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { LeafletMap } from '../LeafletMap';
import { calculateTripTimingSummary, formatClockTime } from '../../utils/timing';

interface OverviewDashboardProps {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  exceptions: OperationalException[];
  theme: 'dark' | 'light';
  onNavigateSection: (section: any) => void;
  onOpenCreateTrip: () => void;
  onOpenTripDetails: (tripId: string) => void;
  onOpenAssignment: (trip: Trip) => void;
  onTrackVehicle?: (vehicle: Vehicle) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  trips,
  drivers,
  vehicles,
  exceptions,
  theme,
  onNavigateSection,
  onOpenCreateTrip,
  onOpenTripDetails,
  onOpenAssignment,
  onTrackVehicle
}) => {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [focusedVehicleId, setFocusedVehicleId] = useState<string>('ALL');

  const focusedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === focusedVehicleId) || null;
  }, [vehicles, focusedVehicleId]);

  const focusedLocation = useMemo(() => {
    if (focusedVehicle?.latitude && focusedVehicle?.longitude) {
      return { latitude: focusedVehicle.latitude, longitude: focusedVehicle.longitude };
    }
    return null;
  }, [focusedVehicle]);

  // Operational metrics
  const unassignedTrips = useMemo(
    () => trips.filter((t) => t.status === 'PLANNED' || !t.driver_id),
    [trips]
  );

  const activeMovingTrips = useMemo(
    () => trips.filter((t) => ['IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'].includes(t.status)),
    [trips]
  );

  const delayedTrips = useMemo(
    () => trips.filter((t) => t.status === 'DELAYED' || (t.delays && t.delays.some((d) => !d.is_resolved))),
    [trips]
  );

  const availableDrivers = useMemo(
    () => drivers.filter((d) => d.status === 'AVAILABLE'),
    [drivers]
  );

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'AVAILABLE'),
    [vehicles]
  );

  const completedToday = useMemo(
    () => trips.filter((t) => t.status === 'COMPLETED'),
    [trips]
  );

  const totalStopsToday = useMemo(() => {
    let count = 0;
    trips.forEach((t) => {
      if (t.stops) count += t.stops.length;
    });
    return count;
  }, [trips]);

  const deliveredStopsToday = useMemo(() => {
    let count = 0;
    trips.forEach((t) => {
      if (t.stops) {
        count += t.stops.filter((s) => s.status === 'COMPLETED').length;
      }
    });
    return count;
  }, [trips]);

  // Open critical exceptions
  const openExceptions = useMemo(
    () => exceptions.filter((e) => !e.is_acknowledged && e.resolution_status !== 'ACKNOWLEDGED'),
    [exceptions]
  );

  // Focused vehicle active trip for route visualization
  const activeTripForFocusedVehicle = useMemo(() => {
    if (!focusedVehicle) return null;
    return trips.find((t) => (t.vehicle_id === focusedVehicle.id || t.vehicle_number === focusedVehicle.vehicle_number) && t.status !== 'COMPLETED' && t.status !== 'CANCELLED') || null;
  }, [trips, focusedVehicle]);

  // Memoized overview stops for focused vehicle's route
  const overviewStops = useMemo(() => {
    if (activeTripForFocusedVehicle && activeTripForFocusedVehicle.stops) {
      return activeTripForFocusedVehicle.stops;
    }
    return [];
  }, [activeTripForFocusedVehicle]);

  const overviewBaseLocation = useMemo(() => {
    if (activeTripForFocusedVehicle && typeof activeTripForFocusedVehicle.starting_latitude === 'number' && typeof activeTripForFocusedVehicle.starting_longitude === 'number') {
      return {
        name: activeTripForFocusedVehicle.starting_location || 'Central Depot',
        latitude: activeTripForFocusedVehicle.starting_latitude,
        longitude: activeTripForFocusedVehicle.starting_longitude
      };
    }
    return undefined;
  }, [activeTripForFocusedVehicle]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
      {/* Top Banner with Quick Actions */}
      <div
        className="overview-top-banner"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <h1 className="overview-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            HoseXperts Operations Control Center
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Live fleet coordination, dispatch scheduling, and SLA exceptions
          </p>
        </div>

        <div className="overview-banner-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigateSection('map')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
          >
            <Navigation size={15} />
            <span>Live Fleet Radar</span>
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onNavigateSection('schedule')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
          >
            <Calendar size={15} />
            <span>Today's Schedule</span>
          </button>
        </div>
      </div>

      {/* Decision-Making Operational KPI Cards */}
      <div
        className="overview-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}
      >
        {/* Unassigned Work */}
        <div
          onClick={() => onNavigateSection('dispatch')}
          className="card-elevation-1"
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: unassignedTrips.length > 0 ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
              Needs Assignment
            </span>
            <UserCheck size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {unassignedTrips.length} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>trips</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Open Dispatch Board</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Active Trips On Route */}
        <div
          onClick={() => onNavigateSection('map')}
          className="card-elevation-1"
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
              Currently Moving
            </span>
            <Radio size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {activeMovingTrips.length} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>on route</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Track on Live Map</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Delayed Trips */}
        <div
          onClick={() => onNavigateSection('exceptions')}
          className="card-elevation-1"
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: delayedTrips.length > 0 ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase' }}>
              Delayed Trips
            </span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {delayedTrips.length} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>delays</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Triage in Exceptions</span>
            <ArrowRight size={12} />
          </div>
        </div>

        {/* Available Drivers */}
        <div
          onClick={() => onNavigateSection('drivers')}
          className="card-elevation-1"
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Available Drivers
            </span>
            <Users size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {availableDrivers.length} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ {drivers.length}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Ready for dispatch assignment
          </div>
        </div>

        {/* Deliveries Today */}
        <div
          onClick={() => onNavigateSection('trips')}
          className="card-elevation-1"
          style={{
            padding: '16px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>
              Stops Delivered Today
            </span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {deliveredStopsToday} <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>/ {totalStopsToday}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {completedToday.length} completed trips
          </div>
        </div>
      </div>

      {/* Large Live Operational Map */}
      <div
        className="card-elevation-1"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-card)',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Live Fleet Operational Tracking Map
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Live Vehicle Focus Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Track Vehicle:</span>
              <select
                value={focusedVehicleId}
                onChange={(e) => setFocusedVehicleId(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Fleet Vehicles ({vehicles.length})</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({(v.speed_kmh || 0) > 2 ? `🟢 ${Math.round(v.speed_kmh || 0)} km/h` : '🟡 Idle'})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigateSection('map')}
              style={{ fontSize: '0.8rem', padding: '5px 12px' }}
            >
              Open Full Screen Map
            </button>
          </div>
        </div>

        <div className="overview-map-container" style={{ height: '380px', width: '100%', position: 'relative' }}>
          <LeafletMap
            baseLocation={overviewBaseLocation}
            stops={overviewStops}
            fleetVehicles={vehicles}
            focusedLocation={focusedLocation}
            onSelectVehicle={(v) => setFocusedVehicleId(v.id)}
            height="100%"
            theme={theme}
            showToolbar={false}
          />
        </div>
      </div>

      {/* 2-Column Operational Deck */}
      <div className="overview-deck-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
        {/* Left Column: Active Trips & Upcoming Departures */}
        <div
          className="card-elevation-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={17} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Active Trips & Upcoming Departures
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigateSection('trips')}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              View All Trips
            </button>
          </div>

          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {trips.slice(0, 5).map((trip) => {
              const isUnassigned = !trip.driver_id || trip.status === 'PLANNED';
              const timing = calculateTripTimingSummary(trip);

              return (
                <div
                  key={trip.id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'box-shadow 0.15s ease'
                  }}
                >
                  {/* Row 1: ID, Status, Delay Badge, and Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        onClick={() => onOpenTripDetails(trip.id)}
                        style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--brand-primary)', cursor: 'pointer', letterSpacing: '-0.01em' }}
                        title="View Full Trip Manifest"
                      >
                        {trip.id}
                      </span>
                      <StatusBadge status={trip.status} />

                      {/* Real-Time Delay Status Badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: timing.delayBadge.bgColor,
                          color: timing.delayBadge.textColor,
                          border: `1px solid ${timing.delayBadge.borderColor}`
                        }}
                      >
                        {timing.delayBadge.isDelayed ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                        <span>{timing.delayBadge.label}</span>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {trip.vehicle_number && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            const v = vehicles.find(
                              (veh) => veh.vehicle_number === trip.vehicle_number || veh.id === trip.vehicle_id
                            );
                            if (v) {
                              if (onTrackVehicle) {
                                onTrackVehicle(v);
                              } else {
                                setFocusedVehicleId(v.id);
                              }
                            }
                          }}
                          style={{
                            fontSize: '0.74rem',
                            padding: '4px 8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderColor: '#10b981',
                            color: '#10b981',
                            fontWeight: 700
                          }}
                          title="Track vehicle live on telematics radar"
                        >
                          <Navigation size={11} />
                          <span>Track Live</span>
                        </button>
                      )}
                      {isUnassigned ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => onOpenAssignment(trip)}
                          style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                        >
                          Assign
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => onOpenTripDetails(trip.id)}
                          style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Driver & Vehicle & Route Corridor */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div>
                      Driver: <strong style={{ color: 'var(--text-primary)' }}>{trip.driver_name || 'Unassigned'}</strong> • Truck: <strong style={{ color: 'var(--text-primary)' }}>{trip.vehicle_number || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      <MapPin size={12} color="var(--brand-primary)" />
                      <span style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {timing.currentDestinationName}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Standardized Real-Time Departure, Delivery Time & Stops Progress */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '8px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.76rem',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                      <span>
                        Departure:{' '}
                        <strong style={{ color: 'var(--text-primary)' }}>
                          {timing.actualStart ? `Departed ${timing.actualStart}` : `Planned ${timing.plannedDeparture}`}
                        </strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Truck size={13} style={{ color: timing.delayBadge.isDelayed ? '#f59e0b' : '#10b981' }} />
                      <span>
                        Delivery:{' '}
                        <strong style={{ color: timing.delayBadge.isDelayed ? 'var(--status-delayed, #f59e0b)' : 'var(--text-primary)' }}>
                          {timing.expectedFinalDelivery}
                        </strong>
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress:</span>
                      <div style={{ flex: 1, height: '5px', backgroundColor: 'var(--border-subtle)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${timing.progressPercent}%`,
                            height: '100%',
                            backgroundColor: timing.progressPercent === 100 ? '#10b981' : 'var(--brand-primary)',
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.74rem' }}>
                        {timing.completedStopsCount}/{timing.totalStopsCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Exceptions Triage */}
        <div
          className="card-elevation-1"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={17} color="#ef4444" />
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Exceptions Requiring Attention ({openExceptions.length})
              </h3>
            </div>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigateSection('exceptions')}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Exceptions Center
            </button>
          </div>

          <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {openExceptions.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                No active operational exceptions. All routes on schedule.
              </div>
            ) : (
              openExceptions.slice(0, 4).map((exc) => (
                <div
                  key={exc.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-card)',
                    borderLeft: `4px solid ${exc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b'}`,
                    borderTop: '1px solid var(--border-subtle)',
                    borderRight: '1px solid var(--border-subtle)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                      {exc.title}
                    </div>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: exc.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
                        color: '#ffffff'
                      }}
                    >
                      {exc.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {exc.location_name || 'In Transit'} • {exc.driver_name || 'Driver'} ({exc.vehicle_number || 'Vehicle'})
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>
                      {exc.impact || 'Delay Risk'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onNavigateSection('exceptions')}
                      style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .overview-top-banner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .overview-banner-actions {
            width: 100% !important;
          }
          .overview-banner-actions button {
            flex: 1 !important;
            justify-content: center !important;
          }
          .overview-deck-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
        }
        @media (max-width: 640px) {
          .overview-title {
            font-size: 1.22rem !important;
          }
          .overview-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .overview-map-container {
            height: 290px !important;
          }
        }
      `}</style>
    </div>
  );
};
