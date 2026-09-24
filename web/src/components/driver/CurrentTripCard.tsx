import React from 'react';
import { Truck, ArrowRight, Clock, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { Trip } from '../../types';
import { useDriverTranslation } from '../../context/DriverLanguageContext';

interface Props {
  trip: Trip | null;
  onViewTripDetails: () => void;
  onStartTrip?: () => void;
  onCompleteTrip?: () => void;
  actionLoading?: boolean;
}

export const CurrentTripCard: React.FC<Props> = ({
  trip,
  onViewTripDetails,
  onStartTrip,
  onCompleteTrip,
  actionLoading = false
}) => {
  const { t } = useDriverTranslation();
  if (!trip) {
    return (
      <div
        className="driver-card"
        style={{
          textAlign: 'center',
          padding: '36px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--driver-primary-light)',
            color: 'var(--driver-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Truck size={28} />
        </div>
        <div>
          <h3
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--driver-text-primary)',
              margin: '0 0 6px'
            }}
          >
            {t.noActiveTrip}
          </h3>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--driver-text-secondary)',
              margin: 0,
              maxWidth: '280px'
            }}
          >
            {t.noActiveTripSubtitle}
          </p>
        </div>
      </div>
    );
  }

  const completedStops = trip.stops?.filter((s) => s.status === 'COMPLETED').length || 0;
  const totalStops = trip.stops?.length || 0;
  const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

  // Origin -> Destination summary
  const origin = trip.starting_location || 'Origin';
  const lastStop = trip.stops && trip.stops.length > 0 ? trip.stops[trip.stops.length - 1].destination_name : 'Destination';
  const vehicleModel = trip.vehicle_model || 'Fleet Vehicle';

  // Status
  const isPlanned = trip.status === 'PLANNED' || trip.status === 'ASSIGNED';
  const isEnRoute = trip.status === 'IN_PROGRESS' || trip.status === 'AT_DESTINATION';
  const isReturning = trip.status === 'RETURNING';
  const isCompleted = trip.status === 'COMPLETED';

  const statusLabel = isPlanned
    ? t.readyToStart
    : isReturning
    ? t.returning
    : isCompleted
    ? t.completed
    : t.onRoute;

  return (
    <div className="driver-hero-trip">
      {/* Top Header Label & Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Truck size={16} color="#FFFFFF" />
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'rgba(255, 255, 255, 0.9)'
              }}
            >
              {t.activeTrip}
            </span>
          </div>
          {trip.id && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                fontFamily: 'monospace'
              }}
            >
              {trip.id}
            </span>
          )}
        </div>

        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            padding: '3px 10px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            color: '#FFFFFF',
            backdropFilter: 'blur(4px)'
          }}
        >
          [ {statusLabel} ]
        </span>
      </div>

      {/* Main Route Title & Vehicle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '14px' }}>
        <div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              margin: '0 0 4px',
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap'
            }}
          >
            <span>{origin}</span>
            <ArrowRight size={16} style={{ opacity: 0.85 }} />
            <span>{lastStop}</span>
          </h2>

          <div
            style={{
              fontSize: '0.82rem',
              color: 'rgba(255, 255, 255, 0.85)',
              fontWeight: 500
            }}
          >
            {vehicleModel}
          </div>
        </div>

        {/* Small Truck Illustration graphic */}
        <div
          style={{
            width: '56px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg width="40" height="26" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="28" height="20" rx="2" fill="#FFFFFF" opacity="0.9" />
            <path d="M30 10H38L44 16V24H30V10Z" fill="#FFFFFF" opacity="0.95" />
            <rect x="33" y="12" width="6" height="5" rx="1" fill="#1764A8" />
            <circle cx="10" cy="24" r="4" fill="#0E477A" />
            <circle cx="10" cy="24" r="2" fill="#FFFFFF" />
            <circle cx="36" cy="24" r="4" fill="#0E477A" />
            <circle cx="36" cy="24" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Planned Departure & Stops count info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          backgroundColor: 'rgba(0, 0, 0, 0.14)',
          borderRadius: '12px',
          marginBottom: '14px',
          fontSize: '0.82rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={14} style={{ opacity: 0.85 }} />
          <span>Planned Departure: <strong style={{ color: '#FFFFFF' }}>{trip.planned_departure_time || '06:00'}</strong></span>
        </div>
        <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
          {trip.vehicle_number}
        </div>
      </div>

      {/* Stops Progress Bar */}
      <div style={{ marginBottom: '14px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            marginBottom: '6px',
            color: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <span>{completedStops} of {totalStops} Stops Completed</span>
          <strong>{progressPercent}%</strong>
        </div>
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            borderRadius: '9999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#FFFFFF',
              borderRadius: '9999px',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Action CTA Button: Start Trip, Complete Trip, or View Trip Details */}
      {isPlanned && onStartTrip ? (
        <button
          type="button"
          onClick={onStartTrip}
          disabled={actionLoading}
          style={{
            width: '100%',
            minHeight: '48px',
            backgroundColor: '#FFFFFF',
            color: '#1764A8',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.96rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Play size={18} fill="currentColor" />
          <span>{actionLoading ? t.startingTrip : t.startTrip}</span>
        </button>
      ) : completedStops === totalStops && totalStops > 0 && onCompleteTrip ? (
        <button
          type="button"
          onClick={onCompleteTrip}
          disabled={actionLoading}
          style={{
            width: '100%',
            minHeight: '48px',
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.96rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionLoading ? 'Completing Trip...' : 'Complete Trip & Finish Duty'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onViewTripDetails}
          style={{
            width: '100%',
            minHeight: '48px',
            backgroundColor: '#FFFFFF',
            color: '#1764A8',
            border: 'none',
            borderRadius: '12px',
            fontSize: '0.94rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <span>{t.viewTripAndStops}</span>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};
