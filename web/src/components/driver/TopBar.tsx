import React, { useState, useEffect } from 'react';
import { Search, Bell, Calendar, Sun, Moon } from 'lucide-react';
import { User } from '../../types';

interface Props {
  currentUser: User;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenNotifications?: () => void;
  onSearch?: (query: string) => void;
}

export const TopBar: React.FC<Props> = ({
  currentUser,
  theme = 'light',
  onToggleTheme,
  onOpenNotifications,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(`${dateStr} • ${timeStr}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'var(--app-surface, #FFFFFF)',
        borderBottom: '1px solid var(--app-border, #D9E1E8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        gap: '20px',
        boxSizing: 'border-box'
      }}
    >
      {/* Global Search */}
      <div
        style={{
          position: 'relative',
          maxWidth: '420px',
          width: '100%',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '14px',
            color: 'var(--text-muted, #667085)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          placeholder="Search drivers, trips, vehicles..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            height: '38px',
            backgroundColor: 'var(--app-bg, #F4F7FA)',
            border: '1px solid var(--app-border, #D9E1E8)',
            borderRadius: '9999px',
            padding: '0 16px 0 38px',
            fontSize: '0.86rem',
            color: 'var(--text-primary, #12202F)',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
        />
      </div>

      {/* Right Controls: Notification, Clock, Theme Toggle, Tagline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* HoseXperts Corporate Tagline */}
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--brand-blue, #1764A8)',
            display: 'flex',
            alignItems: 'center',
            letterSpacing: '0.01em'
          }}
          className="desktop-tagline"
        >
          Reliable Hoses. Reliable Deliveries.
        </span>

        {/* Live Date & Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text-secondary, #667085)',
            backgroundColor: 'var(--app-bg, #F4F7FA)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--app-border, #D9E1E8)'
          }}
        >
          <Calendar size={14} color="var(--brand-blue, #1764A8)" />
          <span>{currentTime || 'Mon, 15 Sep 2026 • 11:24 AM'}</span>
        </div>

        {/* Theme Toggle */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--app-bg, #F4F7FA)',
              border: '1px solid var(--app-border, #D9E1E8)',
              color: 'var(--text-secondary, #667085)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Toggle light/dark theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: 'var(--app-bg, #F4F7FA)',
            border: '1px solid var(--app-border, #D9E1E8)',
            color: 'var(--text-secondary, #667085)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Notifications"
        >
          <Bell size={16} />
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '15px',
              height: '15px',
              borderRadius: '50%',
              backgroundColor: '#D92D20',
              color: '#FFFFFF',
              fontSize: '0.62rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 4px rgba(217, 45, 32, 0.4)'
            }}
          >
            1
          </span>
        </button>
      </div>
    </header>
  );
};
