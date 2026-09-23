import React from 'react';

interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = '18px',
  width = '100%',
  borderRadius = 'var(--radius-sm)',
  style
}) => {
  return (
    <div
      className="skeleton"
      style={{
        height,
        width,
        borderRadius,
        ...style
      }}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 6
}) => {
  return (
    <div className="enterprise-table-container" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height="20px" width={`${100 / columns}%`} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} height="32px" width={`${100 / columns}%`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
