import React, { useState } from 'react';
import { Share2, Route, FileCheck, PhoneCall, Check, MapPin, ShieldAlert } from 'lucide-react';
import { useDriverTranslation } from '../../context/DriverLanguageContext';

interface Props {
  onOpenTrip: () => void;
  onOpenPapers?: () => void;
  onOpenEmergency?: () => void;
  onOpenSupport: () => void;
  driverCoords?: { latitude: number; longitude: number };
}

export const QuickActionGrid: React.FC<Props> = ({
  onOpenTrip,
  onOpenPapers,
  onOpenEmergency,
  onOpenSupport,
  driverCoords
}) => {
  const { t } = useDriverTranslation();
  const [copied, setCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const handleShareLocation = async () => {
    if (!driverCoords) {
      setShareNotice('Current GPS location is not available yet.');
      setTimeout(() => setShareNotice(null), 3000);
      return;
    }

    const shareUrl = `https://maps.google.com/?q=${driverCoords.latitude},${driverCoords.longitude}`;
    const shareText = `Live Truck Location: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Live Truck Location',
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShareNotice('Location link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setShareNotice(null);
      }, 3000);
    } catch {
      setShareNotice(`Location: ${shareUrl}`);
      setTimeout(() => setShareNotice(null), 5000);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          padding: '0 2px'
        }}
      >
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--driver-text-secondary)'
          }}
        >
          {t.quickActions}
        </span>
        {copied && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--driver-success)',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Check size={13} /> {t.linkCopied}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px'
        }}
      >
        {/* Action 1: Live Location / Share */}
        <button
          type="button"
          className="driver-quick-action-tile"
          onClick={handleShareLocation}
          aria-label="Share live location"
        >
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
            {copied ? <Check size={19} /> : <Share2 size={19} />}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.94rem',
                fontWeight: 800,
                color: 'var(--driver-text-primary)',
                lineHeight: 1.2
              }}
            >
              {t.liveLocation}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--driver-text-secondary)',
                marginTop: '2px'
              }}
            >
              {copied ? t.linkCopied : t.shareLocation}
            </div>
          </div>
        </button>

        {/* Action 2: Trip & Stops */}
        <button
          type="button"
          className="driver-quick-action-tile"
          onClick={onOpenTrip}
          aria-label="View trip and stops"
        >
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
            <Route size={19} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.94rem',
                fontWeight: 800,
                color: 'var(--driver-text-primary)',
                lineHeight: 1.2
              }}
            >
              {t.tripStops}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--driver-text-secondary)',
                marginTop: '2px'
              }}
            >
              {t.viewTripAndStops}
            </div>
          </div>
        </button>

        {/* Action 3: Vehicle Papers & Statutory Docs */}
        <button
          type="button"
          className="driver-quick-action-tile"
          onClick={onOpenPapers || onOpenEmergency}
          aria-label="View Vehicle Papers & Compliance"
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--driver-success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FileCheck size={19} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.94rem',
                fontWeight: 800,
                color: 'var(--driver-text-primary)',
                lineHeight: 1.2
              }}
            >
              {t.vehiclePapers}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--driver-text-secondary)',
                marginTop: '2px'
              }}
            >
              RC, Fitness, PUC
            </div>
          </div>
        </button>

        {/* Action 4: Support / Call */}
        <button
          type="button"
          className="driver-quick-action-tile"
          onClick={onOpenSupport}
          aria-label="Call Dispatch Support"
        >
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
            <PhoneCall size={19} />
          </div>
          <div>
            <div
              style={{
                fontSize: '0.94rem',
                fontWeight: 800,
                color: 'var(--driver-text-primary)',
                lineHeight: 1.2
              }}
            >
              {t.callDispatch}
            </div>
            <div
              style={{
                fontSize: '0.74rem',
                color: 'var(--driver-text-secondary)',
                marginTop: '2px'
              }}
            >
              HoseXperts Control
            </div>
          </div>
        </button>
      </div>

      {shareNotice && (
        <div
          style={{
            marginTop: '10px',
            padding: '8px 12px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '10px',
            color: '#38bdf8',
            fontSize: '0.8rem',
            textAlign: 'center',
            fontWeight: 500
          }}
        >
          {shareNotice}
        </div>
      )}
    </div>
  );
};
