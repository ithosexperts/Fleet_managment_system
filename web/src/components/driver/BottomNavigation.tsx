import React from 'react';
import { Home, Route, MapPin, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { useDriverTranslation } from '../../context/DriverLanguageContext';

export type DriverTab = 'home' | 'trip' | 'map' | 'emergency' | 'more';

interface Props {
  activeTab: DriverTab;
  onTabChange: (tab: DriverTab) => void;
  hasActiveDelay?: boolean;
  offlineCount?: number;
}

export const BottomNavigation: React.FC<Props> = ({
  activeTab,
  onTabChange,
  hasActiveDelay,
  offlineCount = 0
}) => {
  const { t } = useDriverTranslation();

  return (
    <nav className="driver-bottom-nav" aria-label="Driver Navigation Bar">
      {/* Home Tab */}
      <button
        type="button"
        className={`driver-nav-tab ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onTabChange('home')}
        aria-label="Home Dashboard"
      >
        <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 1.9} />
        <span>{t.home}</span>
      </button>

      {/* Trip Details Tab */}
      <button
        type="button"
        className={`driver-nav-tab ${activeTab === 'trip' ? 'active' : ''}`}
        onClick={() => onTabChange('trip')}
        aria-label="Trip and Stops"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Route size={22} strokeWidth={activeTab === 'trip' ? 2.5 : 1.9} />
          {hasActiveDelay && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--driver-warning)'
              }}
            />
          )}
        </div>
        <span>{t.trip}</span>
      </button>

      {/* Navigation Map Tab */}
      <button
        type="button"
        className={`driver-nav-tab ${activeTab === 'map' ? 'active' : ''}`}
        onClick={() => onTabChange('map')}
        aria-label="Live Map Navigation"
      >
        <MapPin size={22} strokeWidth={activeTab === 'map' ? 2.5 : 1.9} />
        <span>{t.map}</span>
      </button>

      {/* More / Menu Tab */}
      <button
        type="button"
        className={`driver-nav-tab ${activeTab === 'more' ? 'active' : ''}`}
        onClick={() => onTabChange('more')}
        aria-label="More Options & Profile"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MoreHorizontal size={22} strokeWidth={activeTab === 'more' ? 2.5 : 1.9} />
          {offlineCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -3,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--driver-warning)'
              }}
            />
          )}
        </div>
        <span>{t.more}</span>
      </button>
    </nav>
  );
};
