import React, { useState } from 'react';
import { Clock, ShieldAlert, User, Building2, TrendingUp, Info } from 'lucide-react';

export interface DelayTrendPoint {
  label: string;
  managementMinutes: number;
  driverMinutes: number;
  managementIncidents?: number;
  driverIncidents?: number;
  topManagementReason?: string;
  topDriverReason?: string;
}

export interface DelayAttributionData {
  management: {
    total_minutes: number;
    incident_count: number;
    percentage: number;
    top_reasons?: Array<{ reason: string; total_minutes?: number; count?: number }>;
  };
  driver: {
    total_minutes: number;
    incident_count: number;
    percentage: number;
    top_reasons?: Array<{ reason: string; total_minutes?: number; count?: number }>;
  };
  trend: DelayTrendPoint[];
}

interface Props {
  data: DelayAttributionData;
  period?: 'daily' | 'weekly' | 'monthly';
  selectedDate?: string;
}

export const DelayAttributionLineChart: React.FC<Props> = ({
  data,
  period = 'daily',
  selectedDate
}) => {
  const [metricType, setMetricType] = useState<'minutes' | 'incidents'>('minutes');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const trend = data?.trend || [];
  if (!trend.length) return null;

  const isMinutes = metricType === 'minutes';

  // Extract series values based on active metric
  const mgmtValues = trend.map((p) => (isMinutes ? p.managementMinutes : p.managementIncidents || 0));
  const driverValues = trend.map((p) => (isMinutes ? p.driverMinutes : p.driverIncidents || 0));

  const allValues = [...mgmtValues, ...driverValues];
  const rawMax = Math.max(...allValues, 10);
  // Round up to nice number for grid
  const yMax = Math.ceil(rawMax / 5) * 5;

  // SVG dimensions
  const svgWidth = 780;
  const svgHeight = 280;
  const padding = { top: 35, right: 65, bottom: 45, left: 60 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  // Grid steps (4 horizontal intervals)
  const steps = 4;
  const yTicks = Array.from({ length: steps + 1 }, (_, i) => Math.round((yMax / steps) * i));

  // Compute coordinate mapping
  const getX = (index: number) => {
    if (trend.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (trend.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / yMax) * chartHeight;
  };

  // Build SVG polyline paths
  const mgmtPoints = trend.map((_, i) => `${getX(i)},${getY(mgmtValues[i])}`).join(' ');
  const driverPoints = trend.map((_, i) => `${getX(i)},${getY(driverValues[i])}`).join(' ');

  // Area paths for soft gradients
  const mgmtArea = `${getX(0)},${getY(0)} ` + mgmtPoints + ` ${getX(trend.length - 1)},${getY(0)}`;
  const driverArea = `${getX(0)},${getY(0)} ` + driverPoints + ` ${getX(trend.length - 1)},${getY(0)}`;

  const mgmtColor = '#258CFB'; // Blue (Management)
  const driverColor = '#F59E0B'; // Amber / Orange (Driver)

  const activePoint = hoveredIndex !== null ? trend[hoveredIndex] : null;

  return (
    <div
      className="card"
      style={{
        padding: '22px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      {/* Header with Title and Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(37, 140, 251, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Delay Attribution & Root Cause Analysis
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Comparative telemetry tracking: Delays caused by Management vs In-Transit Driver events
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Metric Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: 'var(--bg-secondary)',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <button
              type="button"
              onClick={() => setMetricType('minutes')}
              style={{
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: metricType === 'minutes' ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: metricType === 'minutes' ? 'var(--bg-surface)' : 'transparent',
                color: metricType === 'minutes' ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: metricType === 'minutes' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Duration (Minutes)
            </button>
            <button
              type="button"
              onClick={() => setMetricType('incidents')}
              style={{
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: metricType === 'incidents' ? 700 : 500,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: metricType === 'incidents' ? 'var(--bg-surface)' : 'transparent',
                color: metricType === 'incidents' ? 'var(--brand-primary)' : 'var(--text-muted)',
                boxShadow: metricType === 'incidents' ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Incident Frequency
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(37, 140, 251, 0.1)',
              border: '1px solid rgba(37, 140, 251, 0.25)',
              fontSize: '0.76rem',
              fontWeight: 700,
              color: 'var(--brand-primary)'
            }}
          >
            <span>{data.management.percentage}% Mgmt</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ color: 'var(--accent-gold)' }}>{data.driver.percentage}% Driver</span>
          </div>
        </div>
      </div>

      {/* Main Graphical Line Canvas */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          padding: '12px 10px 4px 10px',
          overflow: 'hidden'
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        >
          <defs>
            {/* Soft background area gradient for Management */}
            <linearGradient id="mgmtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={mgmtColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={mgmtColor} stopOpacity="0.0" />
            </linearGradient>
            {/* Soft background area gradient for Driver */}
            <linearGradient id="driverGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={driverColor} stopOpacity="0.16" />
              <stop offset="100%" stopColor={driverColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels (Left & Right) */}
          {yTicks.map((tickVal, i) => {
            const y = getY(tickVal);
            return (
              <g key={i}>
                {/* Horizontal line */}
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray={i === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                {/* Left Y Axis Label (Minutes / Count) */}
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {tickVal}{isMinutes ? 'm' : ''}
                </text>
                {/* Right Y Axis Label (Dual Axis benchmark matching Excel reference) */}
                <text
                  x={padding.left + chartWidth + 10}
                  y={y + 4}
                  textAnchor="start"
                  fontSize="10"
                  fontWeight="600"
                  fill="var(--text-muted)"
                  fontFamily="var(--font-mono)"
                >
                  {isMinutes ? `${Math.round((tickVal / 60) * 10) / 10}h` : `${Math.round((tickVal / (yMax || 1)) * 100)}%`}
                </text>
              </g>
            );
          })}

          {/* X and Y Axis main solid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartHeight}
            stroke="var(--border-medium)"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left + chartWidth}
            y1={padding.top}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="var(--border-medium)"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top + chartHeight}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight}
            stroke="var(--border-medium)"
            strokeWidth="1.5"
          />

          {/* Area Fills */}
          <polygon points={mgmtArea} fill="url(#mgmtGrad)" />
          <polygon points={driverArea} fill="url(#driverGrad)" />

          {/* Management Line (Blue) */}
          <polyline
            fill="none"
            stroke={mgmtColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={mgmtPoints}
          />

          {/* Driver Line (Amber/Orange) */}
          <polyline
            fill="none"
            stroke={driverColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={driverPoints}
          />

          {/* Vertical Hover Crosshair Line */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padding.top}
              x2={getX(hoveredIndex)}
              y2={padding.top + chartHeight}
              stroke="var(--text-primary)"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.6"
            />
          )}

          {/* Data Points (Dots on lines matching user's Excel reference) */}
          {trend.map((_, i) => {
            const x = getX(i);
            const yMgmt = getY(mgmtValues[i]);
            const yDriver = getY(driverValues[i]);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Management Point (Blue dot with white core) */}
                <circle
                  cx={x}
                  cy={yMgmt}
                  r={isHovered ? 6.5 : 4.5}
                  fill={mgmtColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ transition: 'r 0.15s ease' }}
                />
                {/* Driver Point (Amber dot with white core) */}
                <circle
                  cx={x}
                  cy={yDriver}
                  r={isHovered ? 6.5 : 4.5}
                  fill={driverColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  style={{ transition: 'r 0.15s ease' }}
                />

                {/* X Axis Label */}
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                >
                  {trend[i].label}
                </text>

                {/* Transparent Interactive Hover Column */}
                <rect
                  x={x - chartWidth / (trend.length * 2)}
                  y={padding.top}
                  width={chartWidth / trend.length}
                  height={chartHeight + padding.bottom}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              </g>
            );
          })}

          {/* Y Axis Titles */}
          <text
            x={16}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${padding.top + chartHeight / 2})`}
            fontSize="10"
            fontWeight="700"
            fill="var(--text-muted)"
            letterSpacing="0.04em"
          >
            {isMinutes ? 'DELAY MINUTES (MGMT)' : 'MGMT INCIDENTS'}
          </text>

          <text
            x={svgWidth - 14}
            y={padding.top + chartHeight / 2}
            textAnchor="middle"
            transform={`rotate(90 ${svgWidth - 14} ${padding.top + chartHeight / 2})`}
            fontSize="10"
            fontWeight="700"
            fill="var(--text-muted)"
            letterSpacing="0.04em"
          >
            {isMinutes ? 'HOURS / ATTRIBUTION' : 'RELATIVE PERCENTAGE'}
          </text>
        </svg>

        {/* Hovered Floating Glassmorphic Tooltip Card */}
        {activePoint && hoveredIndex !== null && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '24px',
              backgroundColor: 'var(--bg-primary)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '240px',
              pointerEvents: 'none',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activePoint.label}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Total: <b>{activePoint.managementMinutes + activePoint.driverMinutes}m</b>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.74rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: mgmtColor, fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: mgmtColor }} />
                  Management:
                </span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {isMinutes ? `${activePoint.managementMinutes} min` : `${activePoint.managementIncidents || 0} incidents`}
                </span>
              </div>
              {activePoint.topManagementReason && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '14px' }}>
                  Cause: {activePoint.topManagementReason}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: driverColor, fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: driverColor }} />
                  Driver & Transit:
                </span>
                <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {isMinutes ? `${activePoint.driverMinutes} min` : `${activePoint.driverIncidents || 0} incidents`}
                </span>
              </div>
              {activePoint.topDriverReason && (
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '14px' }}>
                  Cause: {activePoint.topDriverReason}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend Below Chart (Matching user's Excel reference) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
          padding: '8px 12px',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '16px',
              height: '8px',
              backgroundColor: mgmtColor,
              borderRadius: '2px',
              display: 'inline-block'
            }}
          />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Management Caused Delays (Warehouse, Dock Waiting, Gate Pass, Paperwork)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '16px',
              height: '8px',
              backgroundColor: driverColor,
              borderRadius: '2px',
              display: 'inline-block'
            }}
          />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Driver Caused Delays (Traffic Congestion, Rest Stoppages, Route Deviation)
          </span>
        </div>
      </div>

      {/* Two Comparative KPI Cards: Management vs Driver Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
        {/* Management Card */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            borderLeft: `4px solid ${mgmtColor}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} color={mgmtColor} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Management & Depot Delays
              </span>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: mgmtColor,
                backgroundColor: 'rgba(37, 140, 251, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {data.management.percentage}% of total delay
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {data.management.total_minutes} min
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              ({data.management.incident_count} recorded bottlenecks)
            </span>
          </div>

          {data.management.top_reasons && data.management.top_reasons.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Primary Operational Bottlenecks:
              </span>
              {data.management.top_reasons.slice(0, 2).map((r, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>• {r.reason}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.total_minutes || 15}m</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Driver Card */}
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            borderLeft: `4px solid ${driverColor}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} color={driverColor} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Driver & Roadway Delays
              </span>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: driverColor,
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              {data.driver.percentage}% of total delay
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {data.driver.total_minutes} min
            </span>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              ({data.driver.incident_count} transit events)
            </span>
          </div>

          {data.driver.top_reasons && data.driver.top_reasons.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Primary Transit Bottlenecks:
              </span>
              {data.driver.top_reasons.slice(0, 2).map((r, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>• {r.reason}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.total_minutes || 12}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
