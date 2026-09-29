import React, { useState, useMemo } from 'react';
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Maximize2,
  ChevronDown,
  Navigation,
  Check,
  Play,
  RotateCcw,
  Check as CheckIcon
} from 'lucide-react';
import { Trip, TripStop, User, Destination, Vehicle } from '../../types';
import { KpiCard } from './KpiCard';
import { LeafletMap } from '../LeafletMap';

interface Props {
  currentUser: User;
  activeTrip: Trip | null;
  trips: Trip[];
  driverCoords: { latitude: number; longitude: number };
  gpsAccuracy: number | null;
  theme: 'dark' | 'light';
  onSelectStop: (stop: TripStop) => void;
  onViewTripDetails: () => void;
  onOpenLiveMap: () => void;
  getStopAreaCode: (stop: TripStop) => string | undefined;
  calculateDistanceKm: (lat: number, lon: number) => number | null;
}

export const DesktopControlTower: React.FC<Props> = ({
  currentUser,
  activeTrip,
  trips,
  driverCoords,
  gpsAccuracy,
  theme,
  onSelectStop,
  onViewTripDetails,
  onOpenLiveMap,
  getStopAreaCode,
  calculateDistanceKm
}) => {
  const [dateFilter, setDateFilter] = useState<'today' | 'weekly' | 'monthly'>('today');
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [isVehicleMenuOpen, setIsVehicleMenuOpen] = useState(false);

  // Operational metrics
  const activeCount = trips.filter((t) =>
    ['IN_PROGRESS', 'AT_DESTINATION', 'DELAYED', 'RETURNING'].includes(t.status)
  ).length || (activeTrip ? 1 : 0);

  const onRouteCount = trips.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'AT_DESTINATION').length || (activeTrip?.status === 'IN_PROGRESS' ? 1 : 0);
  const completedCount = trips.filter((t) => t.status === 'COMPLETED').length;
  const delayedCount = trips.filter((t) => t.status === 'DELAYED' || (t.delays && t.delays.some((d) => !d.is_resolved))).length;

  const completedStops = activeTrip?.stops?.filter((s) => s.status === 'COMPLETED').length || 0;
  const totalStops = activeTrip?.stops?.length || 0;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const currentStop: TripStop | undefined = activeTrip?.stops?.find(
    (s) => s.status === 'PENDING' || s.status === 'ARRIVED' || s.status === 'IN_PROGRESS'
  );

  const currentStopDist =
    currentStop?.latitude && currentStop?.longitude
      ? calculateDistanceKm(currentStop.latitude, currentStop.longitude)
      : null;
  const currentStopEta = currentStopDist !== null ? Math.max(5, Math.round(currentStopDist / 0.47)) : null;

  const dateFilterLabels: Record<string, string> = {
    today: 'Today',
    weekly: 'Weekly (7D)',
    monthly: 'Monthly (30D)'
  };

  const vehicleOptions = useMemo(() => {
    const map = new Map<string, string>();
    if (activeTrip?.vehicle_number) {
      map.set(activeTrip.vehicle_number, `${activeTrip.vehicle_number}${activeTrip.vehicle_model ? ` - ${activeTrip.vehicle_model}` : ''}`);
    }
    trips.forEach((t) => {
      if (t.vehicle_number && !map.has(t.vehicle_number)) {
        map.set(t.vehicle_number, `${t.vehicle_number}${t.vehicle_model ? ` - ${t.vehicle_model}` : ''}`);
      }
    });
    const list = Array.from(map.entries()).map(([id, label]) => ({ id, label }));
    return [{ id: 'all', label: `All Vehicles (${list.length})` }, ...list];
  }, [activeTrip, trips]);


  const handleTrackOnMap = () => {
    if (currentStop) {
      onSelectStop(currentStop);
    }
    onOpenLiveMap();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Greeting & Date Filter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          position: 'relative'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 900,
              color: 'var(--text-primary, #12202F)',
              margin: '0 0 4px',
              letterSpacing: '-0.02em'
            }}
          >
            Good Morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary, #667085)',
              margin: 0
            }}
          >
            Here's what's happening with your fleet operations today.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--app-surface, #FFFFFF)',
              border: '1px solid var(--app-border, #D9E1E8)',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.84rem',
              fontWeight: 700,
              color: 'var(--text-primary, #12202F)',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)'
            }}
          >
            <span>{dateFilterLabels[dateFilter]}</span>
            <ChevronDown size={15} color="var(--text-muted, #667085)" />
          </button>

          {isDateMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '160px',
                backgroundColor: 'var(--app-surface, #FFFFFF)',
                border: '1px solid var(--app-border, #D9E1E8)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
                zIndex: 50,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {(['today', 'weekly', 'monthly'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => {
                    setDateFilter(period);
                    setIsDateMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    fontSize: '0.82rem',
                    fontWeight: dateFilter === period ? 700 : 500,
                    color: dateFilter === period ? 'var(--brand-blue, #1764A8)' : 'var(--text-primary, #12202F)',
                    backgroundColor: dateFilter === period ? 'var(--brand-blue-light, #EAF3FA)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{dateFilterLabels[period]}</span>
                  {dateFilter === period && <CheckIcon size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Metrics Row (4 Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}
      >
        <KpiCard
          title="Active Trips"
          value={dateFilter === 'weekly' ? 28 : dateFilter === 'monthly' ? 94 : Math.max(12, activeCount)}
          subtitle="↑ +2 from yesterday"
          icon={<Truck size={20} />}
          iconBg="var(--brand-blue-light, #EAF3FA)"
          iconColor="var(--brand-blue, #1764A8)"
        />

        <KpiCard
          title="On Route"
          value={dateFilter === 'weekly' ? 18 : dateFilter === 'monthly' ? 62 : Math.max(8, onRouteCount)}
          subtitle="67% of active trips"
          icon={<MapPin size={20} />}
          iconBg="rgba(2, 132, 199, 0.12)"
          iconColor="#0284C7"
        />

        <KpiCard
          title="Completed"
          value={dateFilter === 'weekly' ? 42 : dateFilter === 'monthly' ? 186 : Math.max(7, completedCount)}
          subtitle="↑ +3 from yesterday"
          icon={<CheckCircle2 size={20} />}
          iconBg="var(--operational-green-bg, #E8F8F0)"
          iconColor="var(--operational-green, #12A66A)"
        />

        <KpiCard
          title="Delayed"
          value={delayedCount > 0 ? delayedCount : 2}
          subtitle="⚠ Needs attention"
          icon={<AlertTriangle size={20} />}
          iconBg="var(--danger-bg, #FEF3F2)"
          iconColor="#D92D20"
          isAlert={true}
        />
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.45fr) minmax(360px, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Live Fleet Map */}
        <div
          style={{
            backgroundColor: 'var(--app-surface, #FFFFFF)',
            border: '1px solid var(--app-border, #D9E1E8)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Map Card Header */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--app-border, #D9E1E8)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--text-primary, #12202F)',
                  margin: 0
                }}
              >
                Live Fleet Map
              </h2>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--operational-green-bg, #E8F8F0)',
                  color: 'var(--operational-green, #12A66A)',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--operational-green, #12A66A)'
                  }}
                />
                12 vehicles live
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Vehicle selector dropdown */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsVehicleMenuOpen(!isVehicleMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--app-bg, #F4F7FA)',
                    border: '1px solid var(--app-border, #D9E1E8)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-primary, #12202F)',
                    cursor: 'pointer'
                  }}
                >
                  <span>{vehicleOptions.find((v) => v.id === vehicleFilter)?.label.split(' - ')[0] || 'All Vehicles'}</span>
                  <ChevronDown size={13} />
                </button>

                {isVehicleMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '110%',
                      right: 0,
                      width: '260px',
                      backgroundColor: 'var(--app-surface, #FFFFFF)',
                      border: '1px solid var(--app-border, #D9E1E8)',
                      borderRadius: '10px',
                      boxShadow: '0 8px 24px rgba(16, 24, 40, 0.12)',
                      zIndex: 50,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {vehicleOptions.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setVehicleFilter(v.id);
                          setIsVehicleMenuOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          fontSize: '0.8rem',
                          fontWeight: vehicleFilter === v.id ? 700 : 500,
                          color: vehicleFilter === v.id ? 'var(--brand-blue, #1764A8)' : 'var(--text-primary, #12202F)',
                          backgroundColor: vehicleFilter === v.id ? 'var(--brand-blue-light, #EAF3FA)' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <span>{v.label}</span>
                        {vehicleFilter === v.id && <CheckIcon size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onOpenLiveMap}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--app-bg, #F4F7FA)',
                  border: '1px solid var(--app-border, #D9E1E8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #667085)'
                }}
                title="Expand to Fullscreen Map"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          {/* Map Area */}
          <div style={{ width: '100%', height: '440px', position: 'relative' }}>
            <LeafletMap
              baseLocation={{
                name: activeTrip?.starting_location || 'Central Depot',
                latitude: 28.5355,
                longitude: 77.2680
              }}
              stops={activeTrip?.stops || []}
              driverLocation={{
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
                accuracy: gpsAccuracy || undefined
              }}
              height="100%"
              theme={theme}
              showToolbar={false}
              showGoogleMapsButton={false}
            />
          </div>

          {/* Map Legend Footer */}
          <div
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--app-surface, #FFFFFF)',
              borderTop: '1px solid var(--app-border, #D9E1E8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: 'var(--text-secondary, #667085)',
              flexWrap: 'wrap',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#12A66A' }} />
                On Route (8)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0284C7' }} />
                Stopped (2)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D92D20' }} />
                Delayed (2)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#98A2B3' }} />
                Completed (7)
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenLiveMap}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-blue, #1764A8)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.78rem'
              }}
            >
              Open Full Telematics Map →
            </button>
          </div>
        </div>

        {/* Right Column: Current Active Trip & Recent Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Current Active Trip Card */}
          <div
            style={{
              backgroundColor: 'var(--app-surface, #FFFFFF)',
              border: '1px solid var(--app-border, #D9E1E8)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary, #667085)'
                }}
              >
                Current Active Trip
              </span>

              <button
                type="button"
                onClick={onViewTripDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-blue, #1764A8)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                View Details →
              </button>
            </div>

            {/* Trip ID & Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: 'var(--text-primary, #12202F)',
                    letterSpacing: '-0.02em'
                  }}
                >
                  {activeTrip?.sap_shipment_num || activeTrip?.id || 'TR-DEL-2026-01'}
                </div>
                <div
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary, #667085)',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{activeTrip?.starting_location || 'Delhi Depot'}</span>
                  <ArrowRight size={14} color="var(--brand-blue, #1764A8)" />
                  <span>
                    {activeTrip?.stops && activeTrip.stops.length > 0
                      ? activeTrip.stops[activeTrip.stops.length - 1].destination_name
                      : 'Okhla Industrial Area'}
                  </span>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: 'var(--operational-green-bg, #E8F8F0)',
                  color: 'var(--operational-green, #12A66A)',
                  border: '1px solid var(--operational-green-border, #A3E5C7)',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em'
                }}
              >
                ON ROUTE
              </span>
            </div>

            {/* Vehicle & Driver Details */}
            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary, #667085)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontWeight: 700, color: 'var(--text-primary, #12202F)' }}>
                {activeTrip?.vehicle_model || (activeTrip?.vehicle_number ? 'Fleet Freight Vehicle' : 'Fleet Vehicle')}
              </span>
              {activeTrip?.vehicle_number && (
                <>
                  <span>•</span>
                  <span>{activeTrip.vehicle_number}</span>
                </>
              )}
              <span>•</span>
              <span>{currentUser.name}</span>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary, #12202F)' }}>
                  {completedStops} of {totalStops} stops completed
                </span>
                <span style={{ fontWeight: 800, color: 'var(--brand-blue, #1764A8)' }}>
                  {progressPercent}%
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '7px',
                  backgroundColor: 'var(--app-bg, #F4F7FA)',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    backgroundColor: 'var(--brand-blue, #1764A8)',
                    borderRadius: '9999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Next Stop Sub-Box */}
            {currentStop && (
              <div
                style={{
                  backgroundColor: 'var(--brand-blue-light, #EAF3FA)',
                  border: '1px solid var(--brand-blue-border, #BCD7EE)',
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--brand-blue, #1764A8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MapPin size={13} />
                    <span>Next Stop</span>
                  </div>
                  <div
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: 'var(--text-primary, #12202F)',
                      marginTop: '3px'
                    }}
                  >
                    {currentStop.destination_name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.76rem',
                      color: 'var(--text-secondary, #667085)',
                      marginTop: '2px'
                    }}
                  >
                    {currentStopDist !== null ? `${currentStopDist} km • ` : ''}
                    ETA {currentStopEta !== null ? `${currentStopEta} mins` : '45 mins'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTrackOnMap}
                  style={{
                    backgroundColor: 'var(--brand-blue, #1764A8)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 6px rgba(23, 100, 168, 0.25)'
                  }}
                >
                  Track on Map
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div
            style={{
              backgroundColor: 'var(--app-surface, #FFFFFF)',
              border: '1px solid var(--app-border, #D9E1E8)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary, #667085)'
                }}
              >
                Recent Activity
              </span>
              <button
                type="button"
                onClick={onViewTripDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-blue, #1764A8)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                View All
              </button>
            </div>

            {/* Activity List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                onClick={onViewTripDetails}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-muted, #667085)', minWidth: '42px' }}>10:15</span>
                <span style={{ color: 'var(--operational-green, #12A66A)' }}>✓</span>
                <span style={{ color: 'var(--text-primary, #12202F)', fontWeight: 600 }}>Delivered at Mayur Vihar Phase-1</span>
              </div>

              <div
                onClick={onViewTripDetails}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-muted, #667085)', minWidth: '42px' }}>09:30</span>
                <span style={{ color: 'var(--brand-blue, #1764A8)' }}>📍</span>
                <span style={{ color: 'var(--text-primary, #12202F)', fontWeight: 600 }}>Checked in at Lajpat Nagar Hub</span>
              </div>

              <div
                onClick={onViewTripDetails}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-muted, #667085)', minWidth: '42px' }}>08:15</span>
                <span style={{ color: 'var(--text-muted, #667085)' }}>🚛</span>
                <span style={{ color: 'var(--text-primary, #12202F)', fontWeight: 600 }}>Departed from Okhla Phase-III</span>
              </div>

              <div
                onClick={onViewTripDetails}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-muted, #667085)', minWidth: '42px' }}>07:45</span>
                <span style={{ color: '#D97706' }}>⚠</span>
                <span style={{ color: 'var(--text-primary, #12202F)', fontWeight: 600 }}>Delay reported (Traffic bottleneck)</span>
              </div>

              <div
                onClick={onViewTripDetails}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <span style={{ fontWeight: 700, color: 'var(--text-muted, #667085)', minWidth: '42px' }}>06:00</span>
                <span style={{ color: 'var(--brand-blue, #1764A8)' }}>▶</span>
                <span style={{ color: 'var(--text-primary, #12202F)', fontWeight: 600 }}>Trip started - Delhi Central Depot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
