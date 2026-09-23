import React from 'react';
import { CheckCircle2, AlertTriangle, WifiOff, ChevronRight } from 'lucide-react';
import { Delay } from '../../types';

interface Props {
  activeDelay?: Delay | null;
  onViewDelay?: () => void;
  isOnline?: boolean;
  offlineCount?: number;
  onSyncNow?: () => void;
}

export const StatusBanner: React.FC<Props> = ({
  activeDelay,
  onViewDelay,
  isOnline = true,
  offlineCount = 0,
  onSyncNow
}) => {
  // Offline State Banner (compact & non-blocking)
  if (!isOnline || offlineCount > 0) {
    return (
      <div
        style={{
          backgroundColor: 'var(--driver-warning-bg)',
          border: '1px solid var(--driver-warning-border)',
          borderRadius: '14px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(247, 144, 9, 0.2)',
              color: 'var(--driver-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <WifiOff size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.86rem',
                fontWeight: 700,
                color: 'var(--driver-text-primary)'
              }}
            >
              Offline Mode Active
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--driver-text-secondary)',
                marginTop: '1px'
              }}
            >
              {offlineCount > 0
                ? `${offlineCount} event${offlineCount > 1 ? 's' : ''} queued locally`
                : 'Last synced recently. Changes saved locally.'}
            </div>
          </div>
        </div>

        {offlineCount > 0 && onSyncNow && (
          <button
            type="button"
            className="driver-btn-secondary"
            onClick={onSyncNow}
            style={{
              minHeight: '34px',
              padding: '0 12px',
              fontSize: '0.78rem',
              borderColor: 'var(--driver-warning-border)',
              color: 'var(--driver-warning)'
            }}
          >
            Sync Now
          </button>
        )}
      </div>
    );
  }

  // Delay Alert Banner
  if (activeDelay) {
    return (
      <div
        style={{
          backgroundColor: 'var(--driver-warning-bg)',
          border: '1px solid var(--driver-warning-border)',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: 'var(--driver-shadow-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(247, 144, 9, 0.2)',
              color: 'var(--driver-warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '2px'
            }}
          >
            <AlertTriangle size={18} />
          </div>

          <div>
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 800,
                color: 'var(--driver-text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{activeDelay.reason || 'Transit Delay'}</span>
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                color: 'var(--driver-text-secondary)',
                marginTop: '2px',
                maxWidth: '240px'
              }}
            >
              {activeDelay.description || 'Delhi commercial freight corridor'}
            </div>
          </div>
        </div>

        {onViewDelay && (
          <button
            type="button"
            onClick={onViewDelay}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--driver-warning)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              flexShrink: 0,
              padding: '6px 4px'
            }}
          >
            <span>Resolve</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    );
  }

  // Normal Status (Everything on track)
  return (
    <div
      style={{
        backgroundColor: 'var(--driver-card-bg)',
        border: '1px solid var(--driver-card-border)',
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--driver-shadow-card)'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: 'var(--driver-success-bg)',
          color: 'var(--driver-success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <CheckCircle2 size={19} />
      </div>

      <div>
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 800,
            color: 'var(--driver-text-primary)'
          }}
        >
          Everything is on track
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--driver-text-secondary)',
            marginTop: '1px'
          }}
        >
          Keep going, drive safe.
        </div>
      </div>
    </div>
  );
};
