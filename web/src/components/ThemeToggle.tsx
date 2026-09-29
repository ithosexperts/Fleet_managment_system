import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface Props {
  theme: 'dark' | 'light';
  onToggle: () => void;
  showLabel?: boolean;
  className?: string;
  size?: number;
}

export const ThemeToggle: React.FC<Props> = ({
  theme,
  onToggle,
  showLabel = false,
  className = '',
  size = 18
}) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: showLabel ? '8px' : '0px',
        padding: showLabel ? '8px 14px' : undefined,
        width: showLabel ? 'auto' : undefined
      }}
    >
      {isDark ? (
        <Sun size={size} color="var(--accent-gold)" />
      ) : (
        <Moon size={size} color="var(--accent-gold)" />
      )}
      {showLabel && (
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};
