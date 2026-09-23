import React, { useState, useRef, useEffect } from 'react';
import { Menu, Plus, RefreshCw, Bell, AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { NavSection } from './Sidebar';

export interface AlertItem {
  id: string;
  title: string;
  subtitle?: string;
  level: 'critical' | 'warning' | 'info';
  timestamp?: string;
  linkAction?: () => void;
}

interface TopHeaderProps {
  activeSection: NavSection;
  onOpenMobileMenu: () => void;
  onNewTrip: () => void;
  lastUpdated: Date;
  onRefresh: () => void;
  refreshing?: boolean;
  alerts?: AlertItem[];
  onDismissAlert?: (id: string) => void;
  onClearAllAlerts?: () => void;
  liveRefresh?: boolean;
  onToggleLiveRefresh?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeSection,
  onOpenMobileMenu,
  onNewTrip,
  lastUpdated,
  onRefresh,
  refreshing = false,
  alerts = [],
  onDismissAlert,
  onClearAllAlerts,
  liveRefresh = true,
  onToggleLiveRefresh
}) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'overview':
        return { group: 'Operations', title: 'Operations Overview' };
      case 'schedule':
        return { group: 'Operations', title: 'Dispatch Schedule' };
      case 'dispatch':
        return { group: 'Operations', title: 'Dispatch Pipeline Board' };
      case 'map':
        return { group: 'Operations', title: 'Live Fleet Map' };
      case 'trips':
        return { group: 'Operations', title: 'Trips Management' };
      case 'vehicles':
        return { group: 'Assets', title: 'Vehicle Master' };
      case 'drivers':
        return { group: 'Personnel', title: 'Driver Master' };
      case 'destinations':
        return { group: 'Assets', title: 'Facility Directory' };
      case 'exceptions':
        return { group: 'Control', title: 'Exceptions Center' };
      case 'documents':
        return { group: 'Compliance', title: 'Documents Hub' };
      case 'reports':
        return { group: 'Analytics', title: 'Performance Analytics' };
      case 'settings':
        return { group: 'System', title: 'System Settings' };
      default:
        return { group: 'Operations', title: 'Operations Control Center' };
    }
  };

  const { group, title } = getSectionTitle();

  // Close alerts popover on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setIsAlertsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsAlertsOpen(false);
    };

    if (isAlertsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAlertsOpen]);

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-header)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="btn btn-subtle mobile-menu-btn"
          style={{ padding: '6px', display: 'none', flexShrink: 0 }}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <span className="hide-on-mobile" style={{ color: 'var(--text-muted)' }}>{group}</span>
          <span className="hide-on-mobile" style={{ color: 'var(--text-muted)' }}>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
        </div>
      </div>

      {/* Right: Alerts Notification Center, Live Sync Status & Schedule Trip Action */}
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* Alert Notifications Center Bell */}
        <div style={{ position: 'relative' }} ref={alertsRef}>
          <button
            type="button"
            onClick={() => setIsAlertsOpen((prev) => !prev)}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '6px 8px',
              position: 'relative',
              borderColor: alerts.length > 0 ? 'var(--status-delayed-border)' : 'var(--border-subtle)',
              backgroundColor: isAlertsOpen ? 'var(--bg-secondary)' : undefined
            }}
            title={alerts.length > 0 ? `${alerts.length} operational alerts require attention` : 'No active alerts'}
            aria-label="Notifications"
          >
            <Bell size={14} color={alerts.length > 0 ? 'var(--status-delayed)' : 'var(--text-secondary)'} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--status-delayed)',
                  color: '#ffffff',
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }}
              >
                {alerts.length > 9 ? '9+' : alerts.length}
              </span>
            )}
          </button>

          {/* Alert Dropdown Panel */}
          {isAlertsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '-40px',
                width: '340px',
                maxWidth: 'min(340px, calc(100vw - 24px))',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={14} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                    Operational Alerts
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: alerts.length > 0 ? 'var(--status-delayed-bg)' : 'var(--bg-surface)',
                      color: alerts.length > 0 ? 'var(--status-delayed)' : 'var(--text-muted)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    {alerts.length}
                  </span>
                </div>

                {alerts.length > 0 && onClearAllAlerts && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllAlerts();
                      setIsAlertsOpen(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    Mark All Read
                  </button>
                )}
              </div>

              {/* Alerts List */}
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={24} color="var(--status-success)" style={{ margin: '0 auto 8px auto' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      All Fleet Operations Normal
                    </div>
                    <div style={{ fontSize: '0.74rem', marginTop: '2px' }}>
                      No transit exceptions or compliance flags pending.
                    </div>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => {
                        if (alert.linkAction) {
                          alert.linkAction();
                          setIsAlertsOpen(false);
                        }
                      }}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border-subtle)',
                        cursor: alert.linkAction ? 'pointer' : 'default',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        backgroundColor:
                          alert.level === 'critical' ? 'rgba(239, 68, 68, 0.04)' : undefined
                      }}
                      className="hover:bg-subtle"
                    >
                      <div style={{ marginTop: '2px', flexShrink: 0 }}>
                        {alert.level === 'critical' ? (
                          <ShieldAlert size={15} color="var(--status-danger)" />
                        ) : alert.level === 'warning' ? (
                          <AlertTriangle size={15} color="var(--status-delayed)" />
                        ) : (
                          <Bell size={15} color="var(--accent-primary)" />
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {alert.title}
                        </div>
                        {alert.subtitle && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {alert.subtitle}
                          </div>
                        )}
                        {alert.timestamp && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {alert.timestamp}
                          </div>
                        )}
                      </div>

                      {onDismissAlert && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismissAlert(alert.id);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="Dismiss alert"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manual Refresh / Sync Button */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="btn btn-secondary btn-sm"
          style={{ padding: '5px 10px' }}
          title={`Last synchronized at ${lastUpdated.toLocaleTimeString()}`}
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span className="hide-on-mobile">Sync</span>
        </button>

          {/* Primary CTA: Schedule Trip */}
        <button
          type="button"
          onClick={onNewTrip}
          className="btn btn-primary btn-sm header-cta-btn"
          style={{ padding: '6px 12px', whiteSpace: 'nowrap' }}
          title="Create and schedule a new trip manifest"
        >
          <Plus size={14} />
          <span className="hide-on-mobile">Schedule Trip</span>
          <span className="show-on-mobile">Trip</span>
        </button>
      </div>

      <style>{`
        .show-on-mobile {
          display: none;
        }
        @media (max-width: 860px) {
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .show-on-mobile {
            display: inline !important;
          }
          .header-cta-btn {
            padding: 6px 10px !important;
          }
        }
      `}</style>
    </header>
  );
};
