import React, { useState, useMemo } from 'react';
import {
  Truck,
  Users,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  ArrowRight,
  Eye,
  UserCheck,
  RotateCcw,
  Navigation,
  Plus
} from 'lucide-react';
import { Trip, Driver, Vehicle } from '../../types';
import { StatusBadge } from '../StatusBadge';

interface DispatchBoardProps {
  trips: Trip[];
  drivers: Driver[];
  vehicles: Vehicle[];
  onOpenCreateTrip: () => void;
  onOpenTripDetails: (tripId: string) => void;
  onOpenAssignment: (trip: Trip) => void;
  onTrackOnMap?: (tripId: string) => void;
}

export const DispatchBoard: React.FC<DispatchBoardProps> = ({
  trips,
  drivers,
  vehicles,
  onOpenCreateTrip,
  onOpenTripDetails,
  onOpenAssignment,
  onTrackOnMap
}) => {
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');

  // Classify trips into the operational dispatch pipeline
  const pipeline = useMemo(() => {
    const unassigned = trips.filter((t) => t.status === 'PLANNED' || !t.driver_id);
    const assignedReady = trips.filter((t) => t.status === 'ASSIGNED' && t.driver_id);
    const onRoute = trips.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'RETURNING');
    const delivering = trips.filter((t) => t.status === 'AT_DESTINATION' || t.status === 'DELAYED');
    const completed = trips.filter((t) => t.status === 'COMPLETED');

    return {
      unassigned,
      assignedReady,
      onRoute,
      delivering,
      completed
    };
  }, [trips]);

  const stages = [
    {
      id: 'unassigned',
      title: '1. Unassigned Work',
      subtitle: 'Requires driver & vehicle allocation',
      trips: pipeline.unassigned,
      accentColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.12)',
      isCritical: pipeline.unassigned.length > 0
    },
    {
      id: 'assigned',
      title: '2. Assigned & Ready',
      subtitle: 'Awaiting departure confirmation',
      trips: pipeline.assignedReady,
      accentColor: '#1764A8',
      badgeBg: 'rgba(23, 100, 168, 0.12)',
      isCritical: false
    },
    {
      id: 'on_route',
      title: '3. Dispatched / On Route',
      subtitle: 'Active transit on highway / city',
      trips: pipeline.onRoute,
      accentColor: '#0284c7',
      badgeBg: 'rgba(2, 132, 199, 0.12)',
      isCritical: false
    },
    {
      id: 'delivering',
      title: '4. At Destination / Active',
      subtitle: 'Offloading, POD upload or delay',
      trips: pipeline.delivering,
      accentColor: '#8b5cf6',
      badgeBg: 'rgba(139, 92, 246, 0.12)',
      isCritical: pipeline.delivering.some((t) => t.status === 'DELAYED')
    },
    {
      id: 'completed',
      title: '5. Completed Today',
      subtitle: 'Base returned and verified',
      trips: pipeline.completed,
      accentColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.12)',
      isCritical: false
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Dispatch Pipeline Board
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Real-time visual lifecycle: Unassigned → Ready → Dispatched → On Route → Delivered
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenCreateTrip}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>New Dispatch Order</span>
        </button>
      </div>

      {/* Pipeline Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        {stages.map((stage) => {
          const isSelected = activeStageFilter === stage.id;
          return (
            <div
              key={stage.id}
              onClick={() => setActiveStageFilter(isSelected ? 'ALL' : stage.id)}
              className="card-elevation-1"
              style={{
                padding: '12px 16px',
                backgroundColor: isSelected ? 'rgba(23, 100, 168, 0.08)' : 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: isSelected
                  ? '2px solid var(--brand-primary)'
                  : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {stage.title.split('.')[1] || stage.title}
                </span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    backgroundColor: stage.badgeBg,
                    color: stage.accentColor
                  }}
                >
                  {stage.trips.length}
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
                {stage.trips.length} <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 500 }}>trips</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Column Operational Pipeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            activeStageFilter === 'ALL'
              ? 'repeat(auto-fit, minmax(280px, 1fr))'
              : '1fr',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {stages
          .filter((s) => activeStageFilter === 'ALL' || activeStageFilter === s.id)
          .map((stage) => (
            <div
              key={stage.id}
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '400px'
              }}
            >
              {/* Stage Header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderLeft: `4px solid ${stage.accentColor}`
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {stage.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {stage.subtitle}
                  </div>
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    backgroundColor: stage.badgeBg,
                    color: stage.accentColor
                  }}
                >
                  {stage.trips.length}
                </span>
              </div>

              {/* Cards in this stage */}
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                {stage.trips.length === 0 ? (
                  <div
                    style={{
                      padding: '30px 10px',
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.82rem'
                    }}
                  >
                    No trips currently in this stage
                  </div>
                ) : (
                  stage.trips.map((trip) => {
                    const isUnassigned = !trip.driver_id || trip.status === 'PLANNED';
                    const completedStops = trip.stops?.filter((s) => s.status === 'COMPLETED').length || 0;
                    const totalStops = trip.stops?.length || 0;

                    return (
                      <div
                        key={trip.id}
                        className="card-elevation-1"
                        style={{
                          padding: '14px',
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: 'var(--radius-md)',
                          border: isUnassigned
                            ? '1px dashed #f59e0b'
                            : '1px solid var(--border-subtle)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        {/* Top: ID & Departure Time */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span
                            onClick={() => onOpenTripDetails(trip.id)}
                            style={{
                              fontSize: '0.9rem',
                              fontWeight: 800,
                              color: 'var(--brand-primary)',
                              cursor: 'pointer'
                            }}
                          >
                            {trip.id}
                          </span>
                          <span
                            style={{
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              color: 'var(--text-secondary)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Clock size={12} />
                            {trip.planned_departure_time || '08:00'}
                          </span>
                        </div>

                        {/* Route destinations */}
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                          <MapPin size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-2px', color: 'var(--brand-primary)' }} />
                          {trip.stops && trip.stops.length > 0
                            ? trip.stops.map((s) => s.destination_name).join(' → ')
                            : trip.starting_location || 'Central Depot'}
                        </div>

                        {/* Driver & Vehicle */}
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--bg-surface)',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            Driver: <strong>{trip.driver_name || 'Unassigned'}</strong>
                          </div>
                          <div>
                            Vehicle: <strong>{trip.vehicle_number || 'None'}</strong>
                          </div>
                        </div>

                        {/* Progress or delay tag */}
                        {totalStops > 0 && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            Progress: {completedStops} / {totalStops} stops delivered
                          </div>
                        )}

                        {trip.status === 'DELAYED' && (
                          <div
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--badge-delayed-bg)',
                              color: 'var(--badge-delayed-text)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <AlertTriangle size={12} />
                            <span>Active Delay Recorded</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                            marginTop: '6px',
                            borderTop: '1px solid var(--border-subtle)',
                            paddingTop: '8px'
                          }}
                        >
                          {isUnassigned ? (
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => onOpenAssignment(trip)}
                              style={{
                                flex: 1,
                                fontSize: '0.78rem',
                                padding: '5px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <UserCheck size={13} />
                              <span>Assign</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => onOpenAssignment(trip)}
                              style={{
                                flex: 1,
                                fontSize: '0.78rem',
                                padding: '5px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              <UserCheck size={13} />
                              <span>Reassign</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => onOpenTripDetails(trip.id)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '5px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Inspect Trip"
                          >
                            <Eye size={13} />
                          </button>

                          {onTrackOnMap && (
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => onTrackOnMap(trip.id)}
                              style={{
                                fontSize: '0.78rem',
                                padding: '5px 8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Track on Live Map"
                            >
                              <Navigation size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
