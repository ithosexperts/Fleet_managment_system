import React from 'react';

interface Props {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  badgeColor?: string;
  badgeBg?: string;
  isAlert?: boolean;
}

export const KpiCard: React.FC<Props> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  iconColor,
  isAlert = false
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--app-surface, #FFFFFF)',
        border: `1px solid ${isAlert ? 'var(--warning-border, #FCD34D)' : 'var(--app-border, #D9E1E8)'}`,
        borderRadius: '14px',
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
        minWidth: '200px',
        flex: 1
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary, #667085)',
            marginBottom: '4px'
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: 'var(--text-primary, #12202F)',
            fontFamily: 'Inter, monospace',
            lineHeight: 1.15
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: '0.76rem',
            fontWeight: 600,
            color: isAlert ? '#D97706' : 'var(--operational-green, #12A66A)',
            marginTop: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '10px',
          backgroundColor: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {icon}
      </div>
    </div>
  );
};
