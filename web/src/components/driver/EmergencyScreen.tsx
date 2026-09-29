import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  PhoneCall,
  AlertOctagon,
  FileWarning,
  CheckCircle2,
  Phone
} from 'lucide-react';

interface Props {
  onBack?: () => void;
  onReportIncident?: () => void;
  controlRoomPhone?: string;
  fleetManagerPhone?: string;
  roadsidePhone?: string;
  emergencyServicesPhone?: string;
}

export const EmergencyScreen: React.FC<Props> = ({
  onBack,
  onReportIncident,
  controlRoomPhone = '+911145678900',
  fleetManagerPhone = '+919811223344',
  roadsidePhone = '+9118001021234',
  emergencyServicesPhone = '112'
}) => {
  // Hold-for-2-seconds state logic
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [sosActivated, setSosActivated] = useState<boolean>(false);
  const holdIntervalRef = useRef<number | null>(null);

  const startHold = () => {
    if (sosActivated) return;
    setIsHolding(true);
    const startTime = Date.now();
    const duration = 2000; // 2 seconds

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        setIsHolding(false);
        setSosActivated(true);
        // Automatically dial emergency services or control room
        window.location.href = `tel:${emergencyServicesPhone}`;
      }
    }, 40);
  };

  const endHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setIsHolding(false);
    if (!sosActivated) {
      setHoldProgress(0);
    }
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
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
            aria-label="Back"
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
          Emergency Help
        </h1>
      </div>

      {/* Hero SOS Hold Button Section */}
      <div
        className="driver-card"
        style={{
          textAlign: 'center',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--driver-card-bg)',
          border: '1px solid var(--driver-danger-border)',
          boxShadow: '0 4px 20px rgba(217, 45, 32, 0.12)'
        }}
      >
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--driver-danger)',
            marginBottom: '4px'
          }}
        >
          SOS EMERGENCY BEACON
        </div>
        <h2
          style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--driver-text-primary)',
            margin: '0 0 6px'
          }}
        >
          Need Immediate Help?
        </h2>
        <p
          style={{
            fontSize: '0.86rem',
            color: 'var(--driver-text-secondary)',
            margin: '0 0 20px',
            maxWidth: '280px'
          }}
        >
          Dispatch Control Room and Emergency Responders are available 24/7.
        </p>

        {/* 2-Second Hold Button */}
        <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 16px' }}>
          {/* Circular Progress Ring */}
          <svg
            width="130"
            height="130"
            viewBox="0 0 130 130"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'rotate(-90deg)',
              pointerEvents: 'none'
            }}
          >
            <circle
              cx="65"
              cy="65"
              r="58"
              fill="none"
              stroke="var(--driver-danger-bg)"
              strokeWidth="6"
            />
            <circle
              cx="65"
              cy="65"
              r="58"
              fill="none"
              stroke="var(--driver-danger)"
              strokeWidth="6"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * holdProgress) / 100}
              strokeLinecap="round"
              style={{ transition: isHolding ? 'stroke-dashoffset 0.04s linear' : 'stroke-dashoffset 0.2s ease' }}
            />
          </svg>

          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={endHold}
            onMouseLeave={endHold}
            onTouchStart={startHold}
            onTouchEnd={endHold}
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              backgroundColor: sosActivated ? 'var(--driver-success)' : 'var(--driver-danger)',
              color: '#FFFFFF',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(217, 45, 32, 0.35)',
              cursor: 'pointer',
              userSelect: 'none',
              touchAction: 'none'
            }}
            aria-label="Hold for 2 seconds to activate SOS"
          >
            {sosActivated ? (
              <>
                <CheckCircle2 size={32} />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, marginTop: '4px' }}>CALLED</span>
              </>
            ) : (
              <>
                <AlertOctagon size={32} />
                <span style={{ fontSize: '0.86rem', fontWeight: 800, marginTop: '2px', letterSpacing: '0.5px' }}>
                  SOS
                </span>
              </>
            )}
          </button>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--driver-text-muted)', fontWeight: 600 }}>
          {sosActivated
            ? 'Emergency response alert dispatched.'
            : isHolding
            ? `Holding... ${Math.round(holdProgress)}%`
            : 'Hold for 2 seconds to activate SOS'}
        </div>
      </div>

      {/* Emergency Contacts Directory */}
      <div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--driver-text-secondary)',
            marginBottom: '10px',
            padding: '0 2px'
          }}
        >
          Direct Hotlines
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Contact 1: Control Room */}
          <a
            href={`tel:${controlRoomPhone}`}
            className="driver-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              padding: '14px 16px',
              color: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--driver-primary-light)',
                  color: 'var(--driver-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PhoneCall size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                  Call Control Room
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                  Central Dispatch Command • 24/7
                </div>
              </div>
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--driver-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Phone size={16} />
            </div>
          </a>

          {/* Contact 2: Fleet Manager */}
          <a
            href={`tel:${fleetManagerPhone}`}
            className="driver-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              padding: '14px 16px',
              color: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(14, 165, 233, 0.12)',
                  color: '#0284C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PhoneCall size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                  Call Fleet Manager
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                  Assigned Route Supervisor
                </div>
              </div>
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--driver-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Phone size={16} />
            </div>
          </a>

          {/* Contact 3: Roadside Assistance */}
          <a
            href={`tel:${roadsidePhone}`}
            className="driver-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              padding: '14px 16px',
              color: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--driver-warning-bg)',
                  color: 'var(--driver-warning)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PhoneCall size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                  Roadside Assistance
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                  Mechanical breakdown, towing, flat tires
                </div>
              </div>
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--driver-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Phone size={16} />
            </div>
          </a>

          {/* Contact 4: Police & Medical 112 */}
          <a
            href={`tel:${emergencyServicesPhone}`}
            className="driver-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textDecoration: 'none',
              padding: '14px 16px',
              color: 'inherit'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--driver-danger-bg)',
                  color: 'var(--driver-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldAlert size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                  Police / Emergency Services
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--driver-danger)', fontWeight: 600 }}>
                  Dial 112 (National Emergency Helpline)
                </div>
              </div>
            </div>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--driver-danger)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Phone size={16} />
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
