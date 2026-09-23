import React from 'react';

interface SlaGaugeProps {
  percentage?: number;
  value?: number;
  label?: string;
  sublabel?: string;
  size?: number;
}

export const SlaGauge: React.FC<SlaGaugeProps> = ({
  percentage,
  value,
  label = 'On-Time SLA Rate',
  sublabel = 'Geofence-verified stops',
  size = 130
}) => {
  const metric = percentage !== undefined ? percentage : (value ?? 0);
  const clamped = Math.max(0, Math.min(100, Math.round(metric)));
  const strokeWidth = 9;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // 270 degree arc
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (clamped / 100) * arcLength;

  const getStatusColor = (val: number) => {
    if (val >= 90) return 'var(--status-success)';
    if (val >= 75) return 'var(--accent-gold)';
    return 'var(--status-delayed)';
  };

  const statusColor = getStatusColor(clamped);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 14px'
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(135 ${size / 2} ${size / 2})`}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(135 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>

        {/* Center metric */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              color: 'var(--text-primary)',
              lineHeight: 1
            }}
          >
            {clamped}%
          </span>
          <span
            style={{
              fontSize: '0.66rem',
              fontWeight: 600,
              color: statusColor,
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            {clamped >= 90 ? 'Optimal' : clamped >= 75 ? 'Acceptable' : 'Attention'}
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sublabel}</div>
      </div>
    </div>
  );
};

export interface TrendBarDataPoint {
  label: string;
  value: number;
  onTimeRate?: number;
  benchmark?: number;
  highlight?: boolean;
}

export interface TrendBarChartProps {
  data: TrendBarDataPoint[];
  height?: number;
  title?: string;
  subtitle?: string;
  metricUnit?: string;
  unit?: string;
}

export const TrendBarChart: React.FC<TrendBarChartProps> = ({
  data,
  height = 120,
  title = 'Dispatch Activity Trend',
  subtitle,
  metricUnit = 'trips',
  unit
}) => {
  const displayUnit = unit || metricUnit;
  const maxValue = Math.max(...data.map((d) => d.value), 4);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{title}</span>
          {subtitle && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
              {subtitle}
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max: {maxValue} {displayUnit}</span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          height: `${height}px`,
          padding: '12px 8px 0 8px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)'
        }}
      >
        {data.map((item, idx) => {
          const heightPercent = Math.max(8, Math.round((item.value / maxValue) * 100));
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end'
              }}
              title={`${item.label}: ${item.value} ${displayUnit}${item.onTimeRate !== undefined ? ` (${item.onTimeRate}% on-time)` : ''}`}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: item.value > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                  marginBottom: '4px'
                }}
              >
                {item.value}
              </span>

              <div
                style={{
                  width: '100%',
                  maxWidth: '32px',
                  height: `${heightPercent}%`,
                  backgroundColor: item.highlight
                    ? 'var(--accent-gold)'
                    : item.value > 0
                    ? 'var(--accent-primary)'
                    : 'var(--border-subtle)',
                  borderRadius: '3px 3px 0 0',
                  transition: 'height 0.3s ease'
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
        {data.map((item, idx) => (
          <span
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.68rem',
              color: item.highlight ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontWeight: item.highlight ? 700 : 500
            }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export interface FleetStatusBarProps {
  completed: number;
  inTransit: number;
  delayed: number;
  scheduled: number;
  total?: number;
}

export const FleetStatusBar: React.FC<FleetStatusBarProps> = ({
  completed,
  inTransit,
  delayed,
  scheduled,
  total
}) => {
  const calculatedTotal = total !== undefined ? total : (completed + inTransit + delayed + scheduled);
  if (calculatedTotal === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fleet Dispatch Breakdown</span>
          <span style={{ color: 'var(--text-muted)' }}>0 total manifests</span>
        </div>
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '8px',
            borderRadius: '4px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)'
          }}
        />
      </div>
    );
  }

  const pctCompleted = (completed / calculatedTotal) * 100;
  const pctInTransit = (inTransit / calculatedTotal) * 100;
  const pctDelayed = (delayed / calculatedTotal) * 100;
  const pctScheduled = (scheduled / calculatedTotal) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem' }}>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Fleet Dispatch Breakdown</span>
        <span style={{ color: 'var(--text-muted)' }}>{calculatedTotal} total manifests</span>
      </div>

      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '8px',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        {pctCompleted > 0 && (
          <div
            style={{ width: `${pctCompleted}%`, backgroundColor: 'var(--status-success)' }}
            title={`Completed: ${completed} (${Math.round(pctCompleted)}%)`}
          />
        )}
        {pctInTransit > 0 && (
          <div
            style={{ width: `${pctInTransit}%`, backgroundColor: 'var(--accent-primary)' }}
            title={`In Transit: ${inTransit} (${Math.round(pctInTransit)}%)`}
          />
        )}
        {pctDelayed > 0 && (
          <div
            style={{ width: `${pctDelayed}%`, backgroundColor: 'var(--status-delayed)' }}
            title={`Delayed: ${delayed} (${Math.round(pctDelayed)}%)`}
          />
        )}
        {pctScheduled > 0 && (
          <div
            style={{ width: `${pctScheduled}%`, backgroundColor: 'var(--text-muted)', opacity: 0.5 }}
            title={`Scheduled: ${scheduled} (${Math.round(pctScheduled)}%)`}
          />
        )}
      </div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--status-success)' }} />
          <span>Delivered ({completed})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--accent-primary)' }} />
          <span>In Transit ({inTransit})</span>
        </div>
        {delayed > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--status-delayed)' }} />
            <span>Delayed ({delayed})</span>
          </div>
        )}
        {scheduled > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--text-muted)', opacity: 0.6 }} />
            <span>Scheduled ({scheduled})</span>
          </div>
        )}
      </div>
    </div>
  );
};
