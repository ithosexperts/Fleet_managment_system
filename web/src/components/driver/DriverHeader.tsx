import React from 'react';
import { MapPin, Bell, Sun, Moon, RefreshCw, Globe } from 'lucide-react';
import { User } from '../../types';
import { HoseXpertsLogo } from '../common/HoseXpertsLogo';
import { useDriverTranslation, DriverLanguage } from '../../context/DriverLanguageContext';

interface Props {
  currentUser: User;
  vehicleNumber?: string;
  gpsAccuracy?: number | null;
  isRealGps?: boolean;
  isRefreshingGps?: boolean;
  onRefreshGps?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenNotifications?: () => void;
  isDesktop?: boolean;
}

export const DriverHeader: React.FC<Props> = ({
  currentUser,
  vehicleNumber = '',
  gpsAccuracy,
  isRealGps,
  isRefreshingGps,
  onRefreshGps,
  theme,
  onToggleTheme,
  onOpenNotifications,
  isDesktop = false
}) => {
  const { language, setLanguage, t } = useDriverTranslation();

  // Time-aware greeting using localized dictionary
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 17) return t.goodAfternoon;
    return t.goodEvening;
  };

  // Get driver initials
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'RS';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px', boxSizing: 'border-box' }}>
      {/* Top Brand & Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isDesktop ? 'flex-end' : 'space-between',
          padding: isDesktop ? '0 2px' : '4px 2px 0'
        }}
      >
        {!isDesktop && <HoseXpertsLogo variant="compact" height={28} />}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Desktop view displays Language + GPS in single line */}
          {isDesktop && (
            <>
              {/* Language Switcher Pill Button Group */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '9999px',
                  padding: '2px',
                  gap: '2px'
                }}
                title={t.languageSelect}
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  style={{
                    background: language === 'en' ? 'var(--driver-primary)' : 'transparent',
                    color: language === 'en' ? '#ffffff' : 'var(--driver-text-secondary)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: language === 'en' ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  style={{
                    background: language === 'hi' ? 'var(--driver-primary)' : 'transparent',
                    color: language === 'hi' ? '#ffffff' : 'var(--driver-text-secondary)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: language === 'hi' ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  हिन्दी
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hinglish')}
                  style={{
                    background: language === 'hinglish' ? 'var(--driver-primary)' : 'transparent',
                    color: language === 'hinglish' ? '#ffffff' : 'var(--driver-text-secondary)',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: language === 'hinglish' ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Hinglish
                </button>
              </div>

              {/* GPS indicator with interactive refresh */}
              <div
                onClick={onRefreshGps}
                title={onRefreshGps ? 'Click to refresh GPS fix' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: gpsAccuracy !== null ? 'var(--driver-success)' : 'var(--driver-warning)',
                  backgroundColor: gpsAccuracy !== null ? 'var(--driver-success-bg)' : 'var(--driver-warning-bg)',
                  border: `1px solid ${gpsAccuracy !== null ? 'var(--driver-success-border)' : 'var(--driver-warning-border)'}`,
                  padding: '3px 9px',
                  borderRadius: '9999px',
                  cursor: onRefreshGps ? 'pointer' : 'default'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: gpsAccuracy !== null ? 'var(--driver-success)' : 'var(--driver-warning)'
                  }}
                />
                <span>{isRefreshingGps ? t.refreshingGps : gpsAccuracy !== null ? t.gpsConnected : t.acquiringGps}</span>
                {onRefreshGps && (
                  <RefreshCw size={11} className={isRefreshingGps ? 'spin' : ''} style={{ opacity: 0.75 }} />
                )}
              </div>
            </>
          )}

          {/* Theme Toggle */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle dark/light mode"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '50%',
                cursor: 'pointer',
                color: 'var(--driver-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px'
              }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}

          {/* Notification Bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            style={{
              position: 'relative',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'var(--driver-text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px'
            }}
          >
            <Bell size={15} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#D92D20'
              }}
            />
          </button>
        </div>
      </div>

      {/* Row 2 (Mobile only): Language Switcher Pill & GPS Telematics Status */}
      {!isDesktop && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            padding: '0 2px'
          }}
        >
          {/* Language Switcher Pill Button Group */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
              padding: '2px',
              gap: '2px'
            }}
            title={t.languageSelect}
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              style={{
                background: language === 'en' ? 'var(--driver-primary)' : 'transparent',
                color: language === 'en' ? '#ffffff' : 'var(--driver-text-secondary)',
                border: 'none',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '0.70rem',
                fontWeight: language === 'en' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              style={{
                background: language === 'hi' ? 'var(--driver-primary)' : 'transparent',
                color: language === 'hi' ? '#ffffff' : 'var(--driver-text-secondary)',
                border: 'none',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '0.70rem',
                fontWeight: language === 'hi' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              हिन्दी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hinglish')}
              style={{
                background: language === 'hinglish' ? 'var(--driver-primary)' : 'transparent',
                color: language === 'hinglish' ? '#ffffff' : 'var(--driver-text-secondary)',
                border: 'none',
                borderRadius: '9999px',
                padding: '3px 8px',
                fontSize: '0.70rem',
                fontWeight: language === 'hinglish' ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Hinglish
            </button>
          </div>

          {/* GPS indicator with interactive refresh */}
          <div
            onClick={onRefreshGps}
            title={onRefreshGps ? 'Click to refresh GPS fix' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: gpsAccuracy !== null ? 'var(--driver-success)' : 'var(--driver-warning)',
              backgroundColor: gpsAccuracy !== null ? 'var(--driver-success-bg)' : 'var(--driver-warning-bg)',
              border: `1px solid ${gpsAccuracy !== null ? 'var(--driver-success-border)' : 'var(--driver-warning-border)'}`,
              padding: '3px 10px',
              borderRadius: '9999px',
              cursor: onRefreshGps ? 'pointer' : 'default'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: gpsAccuracy !== null ? 'var(--driver-success)' : 'var(--driver-warning)'
              }}
            />
            <span>{isRefreshingGps ? t.refreshingGps : gpsAccuracy !== null ? t.gpsConnected : t.acquiringGps}</span>
            {onRefreshGps && (
              <RefreshCw size={11} className={isRefreshingGps ? 'spin' : ''} style={{ opacity: 0.75 }} />
            )}
          </div>
        </div>
      )}

      {/* Driver Profile Greeting Banner */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '0 2px'
        }}
      >
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'var(--driver-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.05rem',
            letterSpacing: '0.5px',
            boxShadow: '0 2px 8px rgba(23, 100, 168, 0.25)',
            flexShrink: 0
          }}
        >
          {initials}
        </div>

        <div>
          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--driver-text-secondary)',
              fontWeight: 500,
              lineHeight: 1.2
            }}
          >
            {getGreeting()}
          </div>
          <h1
            style={{
              fontSize: '1.18rem',
              fontWeight: 800,
              color: 'var(--driver-text-primary)',
              margin: '2px 0 0',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}
          >
            {currentUser.name}
          </h1>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--driver-text-muted)',
              fontWeight: 500,
              marginTop: '1px'
            }}
          >
            {vehicleNumber ? `${t.driverOnDuty} • ${vehicleNumber}` : t.driverOnDuty}
          </div>
        </div>
      </header>
    </div>
  );
};
