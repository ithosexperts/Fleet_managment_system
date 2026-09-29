import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Map as MapIcon,
  FileCheck,
  Menu,
  AlertTriangle
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface ManagerBottomNavigationProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenMobileMenu: () => void;
  unassignedCount?: number;
  exceptionsCount?: number;
}

export const ManagerBottomNavigation: React.FC<ManagerBottomNavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenMobileMenu,
  unassignedCount = 0,
  exceptionsCount = 0
}) => {
  const tabs = [
    {
      id: 'overview' as NavSection,
      label: 'Overview',
      icon: <LayoutDashboard size={18} />
    },
    {
      id: 'schedule' as NavSection,
      label: 'Schedule',
      icon: <Calendar size={18} />,
      badge: unassignedCount > 0 ? unassignedCount : undefined
    },
    {
      id: 'map' as NavSection,
      label: 'Live Map',
      icon: <MapIcon size={18} />
    },
    {
      id: 'documents' as NavSection,
      label: 'Docs',
      icon: <FileCheck size={18} />
    }
  ];

  return (
    <nav
      className="manager-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '6px 8px calc(6px + env(safe-area-inset-bottom))',
        zIndex: 900,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.35)'
      }}
      aria-label="Mobile Navigation"
    >
      {tabs.map((tab) => {
        const isActive = activeSection === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectSection(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 4px',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--brand-primary, #1764A8)' : 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              position: 'relative',
              minHeight: '46px',
              borderRadius: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tab.icon}
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                  }}
                >
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em'
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '24px',
                  height: '2.5px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--brand-primary, #1764A8)'
                }}
              />
            )}
          </button>
        );
      })}

      {/* Menu / Drawer Toggle */}
      <button
        type="button"
        onClick={onOpenMobileMenu}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '6px 4px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-muted, #94a3b8)',
          cursor: 'pointer',
          position: 'relative',
          minHeight: '46px',
          borderRadius: '8px',
          transition: 'all 0.15s ease'
        }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Menu size={18} />
          {exceptionsCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-8px',
                backgroundColor: 'var(--status-delayed, #ef4444)',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 800,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              !
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 500,
            letterSpacing: '0.01em'
          }}
        >
          Menu
        </span>
      </button>

      <style>{`
        @media (max-width: 860px) {
          .manager-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
};
