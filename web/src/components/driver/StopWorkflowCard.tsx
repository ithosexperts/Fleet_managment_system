import React, { useState } from 'react';
import {
  MapPin,
  CheckCircle2,
  Camera,
  Navigation,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Plus,
  ArrowLeft,
  FileCheck,
  Building2,
  FileText
} from 'lucide-react';
import { TripStop } from '../../types';

interface Props {
  stop: TripStop;
  isCurrentStop: boolean;
  totalStops: number;
  distanceKm: number | null;
  etaMinutes: number | null;
  areaCode?: string;
  actionLoading: boolean;
  onArrive: () => Promise<void>;
  onCheckIn?: () => Promise<void>;
  onOpenUploadPOD: () => void;
  onMarkDelivered: () => Promise<void>;
  onReportDelay: () => void;
  onAddCustomStop: () => void;
  onOpenDocuments?: () => void;
  onBack?: () => void;
  hasPodUploaded?: boolean;
}

export const StopWorkflowCard: React.FC<Props> = ({
  stop,
  isCurrentStop,
  totalStops,
  distanceKm,
  etaMinutes,
  areaCode,
  actionLoading,
  onArrive,
  onCheckIn,
  onOpenUploadPOD,
  onMarkDelivered,
  onReportDelay,
  onAddCustomStop,
  onOpenDocuments,
  onBack,
  hasPodUploaded = false
}) => {
  // Local state for step when arrived
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const isCompleted = stop.status === 'COMPLETED';
  const isArrived = stop.status === 'ARRIVED' || isCompleted;

  // Progressive state determination
  let currentState: 1 | 2 | 3 | 4 | 5 = 1;
  if (isCompleted) {
    currentState = 5;
  } else if (hasPodUploaded) {
    currentState = 4;
  } else if (hasCheckedIn) {
    currentState = 3;
  } else if (isArrived) {
    currentState = 2;
  } else {
    currentState = 1;
  }

  const handleCheckInClick = async () => {
    if (onCheckIn) {
      await onCheckIn();
    }
    setHasCheckedIn(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '2px 0'
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
              aria-label="Back to Stops"
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
            Stop Details
          </h1>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: 'var(--driver-text-secondary)',
            backgroundColor: 'var(--driver-card-bg)',
            border: '1px solid var(--driver-card-border)',
            padding: '4px 10px',
            borderRadius: '9999px'
          }}
        >
          {stop.stop_number} of {totalStops}
        </span>
      </div>

      {/* Main Stop Card with Warehouse Graphic */}
      <div className="driver-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'var(--driver-primary-light, #EAF3FA)',
              color: 'var(--driver-primary, #1764A8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--driver-primary-border, #BCD7EE)'
            }}
          >
            <Building2 size={24} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--driver-text-primary)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25
                }}
              >
                {stop.destination_name}
              </h2>
              {areaCode && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    backgroundColor: 'var(--driver-primary-light)',
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

            {/* Distance & ETA pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                fontSize: '0.78rem',
                color: 'var(--driver-text-secondary)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <MapPin size={13} color="var(--driver-primary)" />
                <span>{distanceKm !== null ? `${distanceKm} km away` : '18 km away'}</span>
              </span>
              <span>•</span>
              <span style={{ fontWeight: 600 }}>
                ETA {etaMinutes !== null ? `${etaMinutes} mins` : '45 mins'}
              </span>
            </div>
          </div>
        </div>

        {/* Turn-by-Turn Google Navigation Button */}
        {stop.latitude && stop.longitude && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${stop.latitude},${stop.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="driver-btn-secondary"
            style={{
              textDecoration: 'none',
              marginBottom: '18px',
              fontSize: '0.86rem',
              color: 'var(--driver-primary)',
              borderColor: 'var(--driver-primary-border)'
            }}
          >
            <Navigation size={16} />
            <span>Open Google Maps Turn-by-Turn</span>
            <ExternalLink size={13} style={{ opacity: 0.7 }} />
          </a>
        )}

        {/* Progressive 4-Step Checklist ("What to do at this stop?") */}
        <div
          style={{
            backgroundColor: 'var(--driver-bg)',
            border: '1px solid var(--driver-card-border)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: 800,
              color: 'var(--driver-text-primary)',
              marginBottom: '12px'
            }}
          >
            What to do at this stop?
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Step 1: Reach Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentState >= 2 ? 'var(--driver-success)' : 'transparent',
                  border: `2px solid ${currentState >= 2 ? 'var(--driver-success)' : 'var(--driver-card-border)'}`,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {currentState >= 2 && <CheckCircle2 size={16} />}
              </div>
              <span
                style={{
                  fontWeight: currentState === 1 ? 700 : 500,
                  color: currentState >= 2 ? 'var(--driver-text-primary)' : currentState === 1 ? 'var(--driver-primary)' : 'var(--driver-text-muted)',
                  textDecoration: currentState >= 2 ? 'line-through' : 'none'
                }}
              >
                Reach location
              </span>
            </div>

            {/* Step 2: Check in at gate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentState >= 3 ? 'var(--driver-success)' : 'transparent',
                  border: `2px solid ${currentState >= 3 ? 'var(--driver-success)' : 'var(--driver-card-border)'}`,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {currentState >= 3 && <CheckCircle2 size={16} />}
              </div>
              <span
                style={{
                  fontWeight: currentState === 2 ? 700 : 500,
                  color: currentState >= 3 ? 'var(--driver-text-primary)' : currentState === 2 ? 'var(--driver-primary)' : 'var(--driver-text-muted)',
                  textDecoration: currentState >= 3 ? 'line-through' : 'none'
                }}
              >
                Check-in at gate
              </span>
            </div>

            {/* Step 3: Upload documents / photos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentState >= 4 ? 'var(--driver-success)' : 'transparent',
                  border: `2px solid ${currentState >= 4 ? 'var(--driver-success)' : 'var(--driver-card-border)'}`,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {currentState >= 4 && <CheckCircle2 size={16} />}
              </div>
              <span
                style={{
                  fontWeight: currentState === 3 ? 700 : 500,
                  color: currentState >= 4 ? 'var(--driver-text-primary)' : currentState === 3 ? 'var(--driver-primary)' : 'var(--driver-text-muted)',
                  textDecoration: currentState >= 4 ? 'line-through' : 'none'
                }}
              >
                Upload documents / photos
              </span>
            </div>

            {/* Step 4: Mark as delivered */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: currentState === 5 ? 'var(--driver-success)' : 'transparent',
                  border: `2px solid ${currentState === 5 ? 'var(--driver-success)' : 'var(--driver-card-border)'}`,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {currentState === 5 && <CheckCircle2 size={16} />}
              </div>
              <span
                style={{
                  fontWeight: currentState === 4 ? 700 : 500,
                  color: currentState === 5 ? 'var(--driver-success)' : currentState === 4 ? 'var(--driver-primary)' : 'var(--driver-text-muted)',
                  textDecoration: currentState === 5 ? 'line-through' : 'none'
                }}
              >
                Mark as delivered
              </span>
            </div>
          </div>
        </div>

        {/* ONE OBVIOUS PRIMARY ACTION CTA (Progressive State Machine) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentState === 1 && (
            <button
              type="button"
              className="driver-btn-primary"
              onClick={onArrive}
              disabled={actionLoading}
            >
              <MapPin size={20} />
              <span>I'm at the Location →</span>
            </button>
          )}

          {currentState === 2 && (
            <button
              type="button"
              className="driver-btn-primary"
              onClick={handleCheckInClick}
              disabled={actionLoading}
            >
              <CheckCircle2 size={20} />
              <span>Check In at Dock</span>
            </button>
          )}

          {currentState === 3 && (
            <button
              type="button"
              className="driver-btn-primary"
              onClick={onOpenUploadPOD}
              disabled={actionLoading}
            >
              <Camera size={20} />
              <span>Upload Proof of Delivery (POD)</span>
            </button>
          )}

          {currentState === 4 && (
            <button
              type="button"
              className="driver-btn-primary"
              onClick={onMarkDelivered}
              disabled={actionLoading}
              style={{
                backgroundColor: 'var(--driver-success)'
              }}
            >
              <CheckCircle2 size={20} />
              <span>Mark as Delivered</span>
            </button>
          )}

          {currentState === 5 && (
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--driver-success-bg)',
                border: '1px solid var(--driver-success-border)',
                textAlign: 'center',
                color: 'var(--driver-success)',
                fontWeight: 800,
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={20} />
              <span>Delivery Completed!</span>
            </div>
          )}

          {/* Secondary Actions Row: Upload Photo + View Docs */}
          {!isCompleted && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className="driver-btn-secondary"
                onClick={onOpenUploadPOD}
              >
                <Camera size={16} />
                <span>Upload Photo</span>
              </button>

              <button
                type="button"
                className="driver-btn-secondary"
                onClick={onOpenDocuments || onReportDelay}
              >
                {onOpenDocuments ? <FileText size={16} /> : <AlertTriangle size={16} />}
                <span>{onOpenDocuments ? 'View Docs' : 'Report Delay'}</span>
              </button>
            </div>
          )}

          {/* Add Custom Stop auxiliary button */}
          <button
            type="button"
            className="driver-btn-secondary"
            onClick={onAddCustomStop}
            style={{
              borderStyle: 'dashed',
              fontSize: '0.82rem',
              color: 'var(--driver-text-secondary)',
              marginTop: '4px'
            }}
          >
            <Plus size={15} color="var(--driver-primary)" />
            <span>Add Ad-hoc Stop (Emergency / Unplanned)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
