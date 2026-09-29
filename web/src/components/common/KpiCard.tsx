import React from 'react';

interface KpiCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
  loading?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'default',
  onClick,
  loading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          borderColor: 'var(--status-success-border)',
          accentColor: 'var(--status-success)'
        };
      case 'warning':
        return {
          borderColor: 'var(--status-delayed-border)',
          accentColor: 'var(--status-delayed)'
        };
      case 'danger':
        return {
          borderColor: 'var(--status-danger-border)',
          accentColor: 'var(--status-danger)'
        };
      case 'info':
        return {
          borderColor: 'var(--status-in-progress-border)',
          accentColor: 'var(--status-in-progress)'
        };
      default:
        return {
          borderColor: 'var(--border-subtle)',
          accentColor: 'var(--text-primary)'
        };
    }
  };

  const vStyles = getVariantStyles();

  if (loading) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ height: '14px', width: '50%' }} />
        <div className="skeleton" style={{ height: '28px', width: '35%' }} />
        <div className="skeleton" style={{ height: '12px', width: '65%' }} />
      </div>
    );
  }

  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        borderLeft: variant !== 'default' ? `3px solid ${vStyles.accentColor}` : '1px solid var(--border-subtle)',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 18px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: '0.74rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}
        >
          {label}
        </span>
        {icon && <span style={{ color: vStyles.accentColor, opacity: 0.85 }}>{icon}</span>}
      </div>

      <div
        style={{
          fontSize: '1.9rem',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: variant !== 'default' ? vStyles.accentColor : 'var(--text-primary)',
          marginTop: '6px',
          letterSpacing: '-0.02em',
          lineHeight: 1.1
        }}
      >
        {value}
      </div>

      {subValue && (
        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {subValue}
        </div>
      )}
    </div>
  );
};
