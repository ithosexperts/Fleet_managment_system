import React, { useState } from 'react';
import { Sidebar, NavSection } from './Sidebar';
import { TopHeader, AlertItem } from './TopHeader';
import { ManagerBottomNavigation } from './ManagerBottomNavigation';
import { User } from '../../types';

interface AppLayoutProps {
  currentUser: User;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchToDriver?: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onNewTrip: () => void;
  lastUpdated: Date;
  onRefresh: () => void;
  refreshing?: boolean;
  alerts?: AlertItem[];
  onDismissAlert?: (id: string) => void;
  onClearAllAlerts?: () => void;
  unassignedCount?: number;
  exceptionsCount?: number;
  liveRefresh?: boolean;
  onToggleLiveRefresh?: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onSwitchToDriver,
  activeSection,
  onSelectSection,
  onNewTrip,
  lastUpdated,
  onRefresh,
  refreshing = false,
  alerts,
  onDismissAlert,
  onClearAllAlerts,
  unassignedCount = 0,
  exceptionsCount = 0,
  liveRefresh = true,
  onToggleLiveRefresh,
  children
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Enterprise Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        currentUser={currentUser}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        onSwitchToDriver={onSwitchToDriver}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        unassignedCount={unassignedCount}
        exceptionsCount={exceptionsCount}
      />

      {/* Main Workspace Frame */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        <TopHeader
          activeSection={activeSection}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onNewTrip={onNewTrip}
          lastUpdated={lastUpdated}
          onRefresh={onRefresh}
          refreshing={refreshing}
          alerts={alerts}
          onDismissAlert={onDismissAlert}
          onClearAllAlerts={onClearAllAlerts}
          liveRefresh={liveRefresh}
          onToggleLiveRefresh={onToggleLiveRefresh}
        />

        <main
          style={{
            flex: 1,
            padding: '24px',
            maxWidth: '1520px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}
          className="app-main-content"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation for Managers */}
      <ManagerBottomNavigation
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
        unassignedCount={unassignedCount}
        exceptionsCount={exceptionsCount}
      />

      <style>{`
        @media (max-width: 860px) {
          .app-main-content {
            padding: 16px 12px calc(72px + env(safe-area-inset-bottom)) !important;
          }
        }
        @media (max-width: 480px) {
          .app-main-content {
            padding: 12px 10px calc(68px + env(safe-area-inset-bottom)) !important;
          }
        }
      `}</style>
    </div>
  );
};
