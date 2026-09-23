import React from 'react';
import {
  Truck,
  MapPin,
  Users,
  FileText,
  Database,
  Smartphone,
  LogOut,
  Map as MapIcon,
  Activity,
  Layers,
  ChevronRight,
  Shield,
  LayoutDashboard,
  Calendar,
  ClipboardList,
  ShieldAlert,
  FileCheck,
  Settings
} from 'lucide-react';
import { User } from '../../types';
import { ThemeToggle } from '../ThemeToggle';
import { HoseXpertsLogo } from '../common/HoseXpertsLogo';

export type NavSection =
  | 'overview'
  | 'schedule'
  | 'dispatch'
  | 'map'
  | 'trips'
  | 'drivers'
  | 'vehicles'
  | 'destinations'
  | 'exceptions'
  | 'documents'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  currentUser: User;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchToDriver?: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unassignedCount?: number;
  exceptionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onSwitchToDriver,
  isOpenMobile,
  onCloseMobile,
  unassignedCount = 0,
  exceptionsCount = 0
}) => {
  const navGroups = [
    {
      label: 'Operations & Dispatch',
      items: [
        { id: 'overview' as NavSection, label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { id: 'schedule' as NavSection, label: 'Schedule', icon: <Calendar size={16} /> },
        {
          id: 'dispatch' as NavSection,
          label: 'Dispatch Board',
          icon: <ClipboardList size={16} />,
          badge: unassignedCount,
          badgeColor: '#f59e0b'
        },
        { id: 'map' as NavSection, label: 'Live Fleet', icon: <MapIcon size={16} /> },
        { id: 'trips' as NavSection, label: 'Trips', icon: <Activity size={16} /> }
      ]
    },
    {
      label: 'Fleet & Resources',
      items: [
        { id: 'drivers' as NavSection, label: 'Drivers Master', icon: <Users size={16} /> },
        { id: 'vehicles' as NavSection, label: 'Vehicles Master', icon: <Truck size={16} /> },
        { id: 'destinations' as NavSection, label: 'Locations Master', icon: <MapPin size={16} /> },
        { id: 'documents' as NavSection, label: 'Documents', icon: <FileCheck size={16} /> }
      ]
    },
    {
      label: 'Control & Governance',
      items: [
        {
          id: 'exceptions' as NavSection,
          label: 'Exceptions Center',
          icon: <ShieldAlert size={16} />,
          badge: exceptionsCount,
          badgeColor: '#ef4444'
        },
        { id: 'reports' as NavSection, label: 'Reports', icon: <FileText size={16} /> },
        { id: 'settings' as NavSection, label: 'Settings', icon: <Settings size={16} /> }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 998
          }}
          className="mobile-sidebar-backdrop"
        />
      )}

      <aside
        style={{
          width: '256px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          flexShrink: 0,
          transition: 'transform 0.2s ease'
        }}
        className={`app-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <HoseXpertsLogo variant={theme === 'dark' ? 'white' : 'blue'} height={32} showTagline={true} />
        </div>

        {/* Nav Groups */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {navGroups.map((group) => (
            <div key={group.label}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                  padding: '0 8px',
                  marginBottom: '6px'
                }}
              >
                {group.label}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.id);
                        onCloseMobile();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isActive ? 'var(--accent-primary-subtle)' : 'transparent',
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        fontWeight: isActive ? 600 : 500,
                        fontSize: '0.86rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.12s ease',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {item.icon}
                      </span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {(item as any).badge && (item as any).badge > 0 ? (
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '10px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            backgroundColor: (item as any).badgeColor || 'var(--brand-primary)',
                            color: '#ffffff',
                            marginRight: '4px'
                          }}
                        >
                          {(item as any).badge}
                        </span>
                      ) : null}
                      {isActive && (
                        <div
                          style={{
                            width: '4px',
                            height: '14px',
                            borderRadius: '2px',
                            backgroundColor: 'var(--accent-primary)'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Operator Footer */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            backgroundColor: 'var(--bg-secondary)'
          }}
        >
          {/* Driver Mobile Switcher Button */}
          {onSwitchToDriver && (
            <button
              onClick={() => {
                onSwitchToDriver();
                onCloseMobile();
              }}
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
            >
              <Smartphone size={13} />
              <span>Driver Mobile View</span>
            </button>
          )}

          {/* User Profile Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 0'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.74rem',
                flexShrink: 0
              }}
              title={currentUser.name}
            >
              {(currentUser.name || 'User')
                .split(' ')
                .map((n: string) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={currentUser.name}
              >
                {currentUser.name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {currentUser.role === 'MANAGER' ? 'Operations Manager' : 'Field Driver'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
              <ThemeToggle theme={theme} onToggle={onToggleTheme} size={13} />
              <button
                onClick={onLogout}
                className="btn btn-subtle"
                style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
                title="Sign out of operations"
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 860px) {
          .app-sidebar {
            position: fixed !important;
            top: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            box-shadow: var(--shadow-lg);
          }
          .app-sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};


