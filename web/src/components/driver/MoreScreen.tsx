import React from 'react';
import {
  User as UserIcon,
  Truck,
  FileText,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Smartphone,
  Route,
  CheckCircle2,
  Globe
} from 'lucide-react';
import { User, Trip } from '../../types';
import { useDriverTranslation } from '../../context/DriverLanguageContext';

interface Props {
  currentUser: User;
  activeTrip: Trip | null;
  trips: Trip[];
  onSelectTrip: (tripId: string) => void;
  onOpenDocuments: () => void;
  onOpenVehicleInfo: () => void;
  onOpenHelp: () => void;
  theme: 'dark' | 'light';
  onToggleTheme?: () => void;
  offlineCount: number;
  onSyncOffline: () => void;
  onSwitchRole?: (role: 'DRIVER' | 'MANAGER') => void;
  onLogout: () => void;
}

export const MoreScreen: React.FC<Props> = ({
  currentUser,
  activeTrip,
  trips,
  onSelectTrip,
  onOpenDocuments,
  onOpenVehicleInfo,
  onOpenHelp,
  theme,
  onToggleTheme,
  offlineCount,
  onSyncOffline,
  onSwitchRole,
  onLogout
}) => {
  const { language, setLanguage, t } = useDriverTranslation();
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'DR';

  const vehicleNumber = activeTrip?.vehicle_number || '';
  const otherTrips = trips.filter((t) => t.id !== activeTrip?.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Header */}
      <div style={{ padding: '2px 0' }}>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 800,
            color: 'var(--driver-text-primary)',
            margin: 0
          }}
        >
          {t.more}
        </h1>
      </div>

      {/* Driver Profile Card */}
      <div
        className="driver-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '18px'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'var(--driver-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            boxShadow: '0 4px 12px rgba(0, 143, 114, 0.25)',
            flexShrink: 0
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--driver-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {currentUser.name}
          </div>
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--driver-text-secondary)',
              marginTop: '1px'
            }}
          >
            Commercial Driver • {vehicleNumber}
          </div>
          <div
            style={{
              fontSize: '0.74rem',
              color: 'var(--driver-success)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px'
            }}
          >
            <ShieldCheck size={14} />
            <span>Verified Driver & Safety Active</span>
          </div>
        </div>
      </div>

      {/* Other Assigned Trips Section (if any exist) */}
      {otherTrips.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--driver-text-secondary)',
              marginBottom: '8px',
              padding: '0 2px'
            }}
          >
            Other Assigned Shipments ({otherTrips.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {otherTrips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)}
                className="driver-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Route size={18} color="var(--driver-primary)" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--driver-text-primary)' }}>
                      {trip.sap_shipment_num || trip.id}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                      {trip.vehicle_number} • Dep: {trip.planned_departure_time || '08:00'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', color: 'var(--driver-primary)', fontWeight: 700 }}>
                  <span>Switch</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primary Menu Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Documents & Vehicle Papers */}
        <button
          type="button"
          onClick={onOpenDocuments}
          className="driver-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '14px 16px',
            border: '1px solid var(--driver-card-border)',
            cursor: 'pointer',
            textAlign: 'left'
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
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                Vehicle Papers & Documents
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                RC, Insurance, Fitness, Pollution, Challans
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--driver-text-muted)" />
        </button>

        {/* Vehicle Info */}
        <button
          type="button"
          onClick={onOpenVehicleInfo}
          className="driver-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '14px 16px',
            border: '1px solid var(--driver-card-border)',
            cursor: 'pointer',
            textAlign: 'left'
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
              <Truck size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                Vehicle Information
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                {activeTrip?.vehicle_number
                  ? `${activeTrip.vehicle_number}${activeTrip?.vehicle_model ? ` • ${activeTrip.vehicle_model}` : ''}`
                  : 'No Vehicle Assigned'}
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--driver-text-muted)" />
        </button>

        {/* Help & Support */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="driver-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '14px 16px',
            border: '1px solid var(--driver-card-border)',
            cursor: 'pointer',
            textAlign: 'left'
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
              <HelpCircle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                Help & Support
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                Dispatch contact, standard guidelines & FAQ
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--driver-text-muted)" />
        </button>
      </div>

      {/* Settings & System Utilities */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--driver-text-secondary)',
            marginBottom: '4px',
            padding: '0 2px'
          }}
        >
          {t.languageSelect} & Preferences
        </div>

        {/* Language Selection Card */}
        <div
          className="driver-card"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Globe size={18} color="var(--driver-primary)" />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--driver-text-primary)' }}>
                {t.languageSelect}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                {t.languageSelectSub}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px'
            }}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: language === 'en' ? '2px solid var(--driver-primary)' : '1px solid var(--driver-card-border)',
                backgroundColor: language === 'en' ? 'var(--driver-primary-light)' : 'var(--bg-card)',
                color: language === 'en' ? 'var(--driver-primary)' : 'var(--driver-text-primary)',
                fontWeight: language === 'en' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: language === 'hi' ? '2px solid var(--driver-primary)' : '1px solid var(--driver-card-border)',
                backgroundColor: language === 'hi' ? 'var(--driver-primary-light)' : 'var(--bg-card)',
                color: language === 'hi' ? 'var(--driver-primary)' : 'var(--driver-text-primary)',
                fontWeight: language === 'hi' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              हिन्दी (Hindi)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hinglish')}
              style={{
                padding: '10px 6px',
                borderRadius: '10px',
                border: language === 'hinglish' ? '2px solid var(--driver-primary)' : '1px solid var(--driver-card-border)',
                backgroundColor: language === 'hinglish' ? 'var(--driver-primary-light)' : 'var(--bg-card)',
                color: language === 'hinglish' ? 'var(--driver-primary)' : 'var(--driver-text-primary)',
                fontWeight: language === 'hinglish' ? 800 : 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              Hinglish
            </button>
          </div>
        </div>

        {/* Dark/Light Theme Toggle */}
        {onToggleTheme && (
          <div
            className="driver-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {theme === 'dark' ? <Sun size={18} color="var(--driver-warning)" /> : <Moon size={18} color="var(--driver-primary)" />}
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--driver-text-primary)' }}>
                  App Theme
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                  Currently in {theme === 'dark' ? 'Dark' : 'Light'} mode
                </div>
              </div>
            </div>

            <button
              type="button"
              className="driver-btn-secondary"
              onClick={onToggleTheme}
              style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.78rem' }}
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        )}

        {/* Offline Sync Status */}
        <div
          className="driver-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={18} color="var(--driver-primary)" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--driver-text-primary)' }}>
                Offline Storage Sync
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                {offlineCount > 0
                  ? `${offlineCount} action${offlineCount > 1 ? 's' : ''} queued locally`
                  : 'All operational data in sync'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="driver-btn-secondary"
            onClick={onSyncOffline}
            style={{ minHeight: '34px', padding: '0 12px', fontSize: '0.78rem' }}
          >
            Sync Now
          </button>
        </div>

        {/* Manager Simulation Return (if applicable) */}
        {onSwitchRole && currentUser.role === 'MANAGER' && (
          <div
            className="driver-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: 'var(--driver-primary-light)',
              borderColor: 'var(--driver-primary-border)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={18} color="var(--driver-primary)" />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--driver-primary)' }}>
                  Manager Role Simulator
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--driver-text-secondary)' }}>
                  Viewing mobile driver terminal
                </div>
              </div>
            </div>

            <button
              type="button"
              className="driver-btn-primary"
              onClick={() => onSwitchRole('MANAGER')}
              style={{
                width: 'auto',
                minHeight: '34px',
                padding: '0 12px',
                fontSize: '0.78rem'
              }}
            >
              Back to Manager
            </button>
          </div>
        )}
      </div>

      {/* Logout Action */}
      <button
        type="button"
        onClick={onLogout}
        className="driver-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          width: '100%',
          padding: '14px',
          color: 'var(--driver-danger)',
          borderColor: 'var(--driver-danger-border)',
          backgroundColor: 'var(--driver-danger-bg)',
          fontWeight: 800,
          fontSize: '0.94rem',
          cursor: 'pointer',
          marginTop: '6px'
        }}
      >
        <LogOut size={18} />
        <span>{t.logout}</span>
      </button>

      {/* Drive Safe Footer Badge */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px 0 10px',
          fontSize: '0.76rem',
          color: 'var(--driver-text-muted)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--driver-primary)' }}>
          <CheckCircle2 size={14} />
          <span>Drive Safe • TruckTracker Fleet v1.2</span>
        </div>
        <div>Commercial Logistics Telematics & Dispatch System</div>
      </div>
    </div>
  );
};
