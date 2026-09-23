import React from 'react';
import { Navigation, ExternalLink, MapPin } from 'lucide-react';
import { TripStop } from '../../types';

interface Props {
  nextStop?: TripStop;
  distanceKm: number | null;
  etaMinutes: number | null;
  areaCode?: string;
  onSelectStop?: (stop: TripStop) => void;
}

export const FloatingNavigationCard: React.FC<Props> = ({
  nextStop,
  distanceKm,
  etaMinutes,
  areaCode,
  onSelectStop
}) => {
  if (!nextStop) {
    return (
      <div className="driver-floating-top">
        <div style={{ textAlign: 'center', fontSize: '0.86rem', color: 'var(--driver-text-secondary)', fontWeight: 600 }}>
          No upcoming delivery stops. Route completed.
        </div>
      </div>
    );
  }

  const googleMapsUrl =
    nextStop.latitude && nextStop.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${nextStop.latitude},${nextStop.longitude}`
      : null;

  return (
    <>
      {/* Top Floating Card: Next Stop Overview */}
      <div
        className="driver-floating-top"
        onClick={() => onSelectStop && onSelectStop(nextStop)}
        style={{ cursor: onSelectStop ? 'pointer' : 'default' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}
        >
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--driver-primary)'
            }}
          >
            NEXT STOP
          </span>

          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              backgroundColor: 'var(--driver-primary-light)',
              color: 'var(--driver-primary)',
              border: '1px solid var(--driver-primary-border)',
              padding: '2px 8px',
              borderRadius: '9999px'
            }}
          >
            [ ON ROUTE ]
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--driver-text-primary)',
              margin: 0,
              lineHeight: 1.25
            }}
          >
            {nextStop.destination_name}
          </h2>
          {areaCode && (
            <span
              style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--driver-primary)',
                backgroundColor: 'var(--driver-bg)',
                padding: '1px 5px',
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
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.78rem',
            color: 'var(--driver-text-secondary)',
            marginTop: '4px'
          }}
        >
          <span>{distanceKm !== null ? `${distanceKm} km` : 'Calculating distance'}</span>
          <span>•</span>
          <span>{etaMinutes !== null ? `~${etaMinutes} mins` : 'Calculating ETA'}</span>
        </div>
      </div>

      {/* Bottom Floating Card: ETA summary and direct Google Maps CTA */}
      <div className="driver-floating-bottom">
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--driver-text-primary)', lineHeight: 1.1 }}>
            {etaMinutes !== null ? `${etaMinutes} mins` : '-- mins'}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--driver-text-secondary)', marginTop: '2px' }}>
            {distanceKm !== null ? `${distanceKm} km away` : 'Live route'}
          </div>
        </div>

        {googleMapsUrl ? (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="driver-btn-primary"
            style={{
              width: 'auto',
              minWidth: '170px',
              minHeight: '46px',
              padding: '0 20px',
              fontSize: '0.94rem',
              textDecoration: 'none'
            }}
          >
            <Navigation size={18} />
            <span>Open in Maps</span>
            <ExternalLink size={13} style={{ opacity: 0.8 }} />
          </a>
        ) : (
          <button
            type="button"
            className="driver-btn-primary"
            disabled
            style={{ width: 'auto', minWidth: '170px', minHeight: '46px', padding: '0 20px', fontSize: '0.94rem' }}
          >
            <MapPin size={18} />
            <span>No GPS Fix</span>
          </button>
        )}
      </div>
    </>
  );
};
