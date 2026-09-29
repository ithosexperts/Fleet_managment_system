import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Truck,
  MapPin,
  Users,
  Car,
  FileText,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Wifi,
  WifiOff
} from 'lucide-react';
import { DriverTab } from './BottomNavigation';
import { User, Trip } from '../../types';
import { HoseXpertsLogo } from '../common/HoseXpertsLogo';

interface Props {
  activeTab: DriverTab;
  onTabChange: (tab: DriverTab) => void;
  currentUser: User;
  activeTrip: Trip | null;
  theme: 'dark' | 'light';
  onToggleTheme?: () => void;
  onLogout: () => void;
  isOnline: boolean;
  offlineCount: number;
  onOpenDocuments?: () => void;
  onOpenAlerts?: () => void;
  onOpenVehicles?: () => void;
  onOpenDrivers?: () => void;
  onOpenReports?: () => void;
  onOpenSettings?: () => void;
}

export const DesktopSidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  currentUser,
  activeTrip,
  theme,
  onToggleTheme,
  onLogout,
  isOnline,
  offlineCount,
  onOpenDocuments,
  onOpenAlerts,
  onOpenVehicles,
  onOpenDrivers,
  onOpenReports,
  onOpenSettings
}) => {
  const initials = currentUser.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'RS';

  // 10 Desktop Navigation items aligned with HoseXperts Enterprise Operations UI
  const navItems = [
    { id: 'home', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'map', label: 'Live Map', icon: <Compass size={18} /> },
    { id: 'trip', label: 'Trips', icon: <Truck size={18} /> },
    { id: 'stops', label: 'Stops', icon: <MapPin size={18} /> },
    { id: 'drivers', label: 'Drivers', icon: <Users size={18} /> },
    { id: 'vehicles', label: 'Vehicles', icon: <Car size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={18} />, badge: '3', badgeColor: '#D92D20' },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];

  const handleItemClick = (id: string) => {
    if (id === 'documents') {
      if (onOpenDocuments) onOpenDocuments();
      else onTabChange('more');
    } else if (id === 'alerts') {
      if (onOpenAlerts) onOpenAlerts();
      else onTabChange('home');
    } else if (id === 'vehicles') {
      if (onOpenVehicles) onOpenVehicles();
      else onTabChange('more');
    } else if (id === 'drivers') {
      if (onOpenDrivers) onOpenDrivers();
      else onTabChange('more');
    } else if (id === 'reports') {
      if (onOpenReports) onOpenReports();
      else onTabChange('trip');
    } else if (id === 'settings') {
      if (onOpenSettings) onOpenSettings();
      else onTabChange('more');
    } else if (id === 'stops') {
      onTabChange('trip');
    } else if (id === 'home' || id === 'trip' || id === 'map' || id === 'emergency' || id === 'more') {
      onTabChange(id as DriverTab);
    } else {
      onTabChange('home');
    }
  };

  return (
    <aside
      style={{
        width: '250px',
        backgroundColor: '#1764A8',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px 20px',
        boxSizing: 'border-box',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        boxShadow: '2px 0 12px rgba(23, 100, 168, 0.15)',
        zIndex: 100
      }}
    >
      <div>
        {/* Top HoseXperts Corporate Logo */}
        <div style={{ padding: '4px 8px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
          <HoseXpertsLogo variant="white" height={36} showTagline={true} />
        </div>

        {/* 10 Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
          {navItems.map((item) => {
            const isActive =
              (item.id === 'home' && activeTab === 'home') ||
              (item.id === 'trip' && activeTab === 'trip') ||
              (item.id === 'map' && activeTab === 'map');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#0E477A' : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.82)',
                  border: 'none',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.82)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ opacity: isActive ? 1 : 0.9 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      backgroundColor: item.badgeColor || '#D92D20',
                      color: '#FFFFFF',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      lineHeight: 1
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile and Logout Section */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* User Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.12)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                color: '#1764A8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.88rem',
                flexShrink: 0
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {currentUser.name}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {currentUser.role === 'DRIVER'
                  ? (activeTrip?.vehicle_number ? `Driver • ${activeTrip.vehicle_number}` : 'Driver on Duty')
                  : 'Operations Manager'}
              </div>
            </div>
          </div>

          <ChevronRight size={16} color="rgba(255, 255, 255, 0.7)" />
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: '0.84rem',
            fontWeight: 600,
            padding: '6px 8px',
            borderRadius: '8px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.85)';
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
