import React from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  lastUpdated?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  title,
  subtitle,
  lastUpdated,
  onRefresh,
  refreshing = false,
  actions
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '16px'
      }}
    >
      <div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.45rem', letterSpacing: '-0.02em', fontWeight: 700 }}>
            {title}
          </h1>

          {lastUpdated && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--status-success)',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite ease-in-out'
                }}
              />
              Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        {subtitle && (
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {onRefresh && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh telematics data"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        )}

        {actions}
      </div>
    </div>
  );
};
