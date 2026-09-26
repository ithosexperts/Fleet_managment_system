import React, { Suspense, lazy, useState, useEffect } from 'react';
import { api } from './services/api';
import { User } from './types';
import { LoginView } from './views/LoginView';

const DriverView = lazy(() => import('./views/DriverView').then((module) => ({ default: module.DriverView })));
const ManagerView = lazy(() => import('./views/ManagerView').then((module) => ({ default: module.ManagerView })));

import { HoseXpertsLogo } from './components/common/HoseXpertsLogo';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulatedRole, setSimulatedRole] = useState<'DRIVER' | 'MANAGER' | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    // Only restore dark theme if user explicitly clicked the theme toggle
    const explicitUserSet = localStorage.getItem('truck_tracker_user_set_theme');
    const stored = localStorage.getItem('truck_tracker_theme');
    if (explicitUserSet === 'true' && (stored === 'dark' || stored === 'light')) {
      return stored;
    }
    // By default, light theme should always be open
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('truck_tracker_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('truck_tracker_user_set_theme', 'true');
      return next;
    });
  };

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    const token = localStorage.getItem('truck_tracker_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      setCurrentUser(data.user);
    } catch {
      localStorage.removeItem('truck_tracker_token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setSimulatedRole(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('truck_tracker_token');
    setCurrentUser(null);
    setSimulatedRole(null);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary, #F8FAFC)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '22px',
          padding: '24px'
        }}
      >
        <div
          style={{
            padding: '14px 26px',
            background: 'var(--card-bg, rgba(255, 255, 255, 0.04))',
            border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.1))',
            borderRadius: '16px',
            boxShadow: '0 15px 35px -10px rgba(0,0,0,0.6), 0 0 24px rgba(23,100,168,0.2)',
            animation: 'pulse 2.2s infinite ease-in-out'
          }}
        >
          <HoseXpertsLogo
            variant={theme === 'dark' ? 'white' : 'blue'}
            height={54}
            showTagline={true}
          />
        </div>
        <div
          style={{
            width: '170px',
            height: '4px',
            backgroundColor: 'var(--border-subtle, rgba(255,255,255,0.1))',
            borderRadius: '9999px',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '55px',
              height: '100%',
              backgroundColor: '#1764A8',
              borderRadius: '9999px',
              animation: 'indeterminate 1.4s infinite ease-in-out'
            }}
          />
        </div>
        <div style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.84rem', fontWeight: 600, letterSpacing: '0.04em' }}>
          Initializing HoseXperts Telematics...
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.025); opacity: 1; }
          }
          @keyframes indeterminate {
            0% { transform: translateX(-55px); }
            100% { transform: translateX(170px); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Active view: either real user role or simulated view for convenient QA testing
  const activeRole = simulatedRole || currentUser.role;

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary, #F8FAFC)' }} />}>
      <div>
        {activeRole === 'DRIVER' ? (
          <DriverView
            currentUser={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSwitchRole={(role) => setSimulatedRole(role)}
          />
        ) : (
          <ManagerView
            currentUser={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSwitchRole={(role) => setSimulatedRole(role)}
          />
        )}
      </div>
    </Suspense>
  );
};

export default App;
