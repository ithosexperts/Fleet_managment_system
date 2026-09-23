import React from 'react';
import {
  ArrowLeft,
  HelpCircle,
  Check,
  MapPin,
  Navigation,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Trip, TripStop } from '../../types';

interface Props {
  trip: Trip;
  currentStop?: TripStop;
  driverCoords?: { latitude: number; longitude: number };
  onBack?: () => void;
  onOpenHelp?: () => void;
  onSelectStop: (stop: TripStop) => void;
  getStopAreaCode: (stop: TripStop) => string | undefined;
  calculateDistanceKm: (lat: number, lon: number) => number | null;
}

export const TripTimeline: React.FC<Props> = ({
  trip,
  currentStop,
  driverCoords,
  onBack,
  onOpenHelp,
  onSelectStop,
  getStopAreaCode,
  calculateDistanceKm
}) => {
  const stops = trip.stops || [];
  const completedStops = stops.filter((s) => s.status === 'COMPLETED').length;
  const totalStops = stops.length;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  const origin = trip.starting_location || 'Central Depot';
  const destination = stops.length > 0 ? stops[stops.length - 1].destination_name : 'Final Delivery Hub';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 2px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="driver-tap-target"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--driver-card-bg)',
                border: '1px solid var(--driver-card-border)',
                color: 'var(--driver-text-primary)',
                padding: 0
              }}
              aria-label="Go Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--driver-text-primary)',
              margin: 0
            }}
          >
            Trip Details
          </h1>
        </div>

        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: 'var(--driver-card-bg)',
              border: '1px solid var(--driver-card-border)',
              borderRadius: '9999px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--driver-text-secondary)',
              cursor: 'pointer'
            }}
          >
            <HelpCircle size={15} />
            <span>Help</span>
          </button>
        )}
      </div>

      {/* Trip Summary Card */}
      <div className="driver-card" style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div
              style={{
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--driver-text-muted)',
                letterSpacing: '0.04em'
              }}
            >
              {trip.sap_shipment_num || trip.id}
            </div>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                color: 'var(--driver-text-primary)',
                marginTop: '2px'
              }}
            >
              {trip.vehicle_number} • {trip.vehicle_model || 'Heavy Truck'}
            </div>
          </div>

          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: '9999px',
              backgroundColor:
                trip.status === 'IN_PROGRESS' || trip.status === 'AT_DESTINATION'
                  ? 'var(--driver-primary-light)'
                  : 'var(--driver-bg)',
              color:
                trip.status === 'IN_PROGRESS' || trip.status === 'AT_DESTINATION'
                  ? 'var(--driver-primary)'
                  : 'var(--driver-text-secondary)',
              border: `1px solid ${
                trip.status === 'IN_PROGRESS' || trip.status === 'AT_DESTINATION'
                  ? 'var(--driver-primary-border)'
                  : 'var(--driver-card-border)'
              }`
            }}
          >
            {trip.status === 'IN_PROGRESS'
              ? 'IN PROGRESS'
              : trip.status === 'AT_DESTINATION'
              ? 'AT DOCK'
              : trip.status}
          </span>
        </div>

        {/* Origin -> Destination */}
        <div
          style={{
            fontSize: '0.88rem',
            color: 'var(--driver-text-secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}
        >
          <span>{origin}</span>
          <ArrowRight size={15} style={{ color: 'var(--driver-primary)' }} />
          <span>{destination}</span>
        </div>

        {/* Progress bar and count */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.82rem',
              marginBottom: '6px'
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--driver-text-primary)' }}>
              {completedStops} of {totalStops} Stops Completed
            </span>
            <span style={{ fontWeight: 800, color: 'var(--driver-primary)' }}>
              {progressPercent}%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--driver-bg)',
              borderRadius: '9999px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progressPercent}%`,
                backgroundColor: 'var(--driver-primary)',
                borderRadius: '9999px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Stop Timeline Header */}
      <div
        style={{
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--driver-text-secondary)',
          padding: '0 2px'
        }}
      >
        Stop Timeline
      </div>

      {/* Vertical Timeline Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {stops.map((stop, index) => {
          const isDone = stop.status === 'COMPLETED';
          const isCurrent = currentStop?.id === stop.id;
          const isPending = !isDone && !isCurrent;
          const areaCode = getStopAreaCode(stop);

          const distanceKm =
            stop.latitude && stop.longitude && driverCoords
              ? calculateDistanceKm(stop.latitude, stop.longitude)
              : null;

          return (
            <div
              key={stop.id}
              className={`driver-timeline-node ${isDone ? 'completed' : ''}`}
            >
              {/* Left Timeline Icon */}
              <div
                className={`driver-timeline-icon ${
                  isDone ? 'completed' : isCurrent ? 'current' : 'pending'
                }`}
              >
                {isDone ? (
                  <Check size={16} strokeWidth={3} />
                ) : isCurrent ? (
                  <MapPin size={16} />
                ) : (
                  <span>{stop.stop_number}</span>
                )}
              </div>

              {/* Right Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isCurrent ? (
                  /* Current Stop Highlighted Dominant Card */
                  <div
                    onClick={() => onSelectStop(stop)}
                    style={{
                      backgroundColor: 'var(--driver-primary-light)',
                      border: '2px solid var(--driver-primary)',
                      borderRadius: '16px',
                      padding: '16px',
                      boxShadow: '0 4px 14px rgba(0, 143, 114, 0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        marginBottom: '6px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          color: 'var(--driver-primary)',
                          textTransform: 'uppercase'
                        }}
                      >
                        NEXT STOP
                      </span>

                      {distanceKm !== null && (
                        <span
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            backgroundColor: 'var(--driver-primary)',
                            color: '#FFFFFF',
                            padding: '3px 9px',
                            borderRadius: '9999px'
                          }}
                        >
                          {distanceKm} km away
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--driver-text-primary)',
                          margin: 0
                        }}
                      >
                        {stop.destination_name}
                      </h3>
                      {areaCode && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            backgroundColor: 'var(--driver-card-bg)',
                            color: 'var(--driver-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--driver-primary-border)'
                          }}
                        >
                          {areaCode}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--driver-text-secondary)',
                        marginTop: '4px',
                        lineHeight: 1.3
                      }}
                    >
                      {stop.address}
                    </div>

                    {/* Action Button inside current stop */}
                    <div
                      style={{
                        marginTop: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          color: 'var(--driver-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>Open Stop Workflow</span>
                        <ChevronRight size={14} />
                      </div>

                      {stop.latitude && stop.longitude && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: 'var(--driver-primary)',
                            backgroundColor: '#FFFFFF',
                            border: '1px solid var(--driver-primary-border)',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            textDecoration: 'none'
                          }}
                        >
                          <Navigation size={12} />
                          <span>Google Maps</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ) : isDone ? (
                  /* Completed Stop Node */
                  <div
                    onClick={() => onSelectStop(stop)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--driver-card-bg)',
                      border: '1px solid var(--driver-card-border)',
                      cursor: 'pointer',
                      opacity: 0.9
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--driver-text-primary)' }}>
                          {stop.destination_name}
                        </span>
                        {areaCode && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--driver-text-muted)'
                            }}
                          >
                            {areaCode}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: 'var(--driver-success)'
                        }}
                      >
                        ✓ Delivered
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)', marginTop: '2px' }}>
                      {stop.actual_arrival_time
                        ? `Delivered at ${new Date(stop.actual_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Completed'}
                    </div>
                  </div>
                ) : (
                  /* Pending Stop Node */
                  <div
                    onClick={() => onSelectStop(stop)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--driver-card-bg)',
                      border: '1px solid var(--driver-card-border)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--driver-text-primary)' }}>
                          {stop.destination_name}
                        </span>
                        {areaCode && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-mono)',
                              color: 'var(--driver-text-muted)'
                            }}
                          >
                            {areaCode}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--driver-text-muted)' }}>
                        Stop {stop.stop_number}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-muted)', marginTop: '2px' }}>
                      {stop.address}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
