import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableSkeleton } from './SkeletonLoader';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (item: T) => string | number | null | undefined;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface EnterpriseTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  className?: string;
  style?: React.CSSProperties;
  selectable?: boolean;
  selectedKeys?: (string | number)[];
  onToggleSelect?: (key: string | number) => void;
  onToggleSelectAll?: () => void;
  batchBar?: React.ReactNode;
}

export function EnterpriseTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your current filter criteria.',
  emptyActionLabel,
  onEmptyAction,
  className = '',
  style,
  selectable = false,
  selectedKeys = [],
  onToggleSelect,
  onToggleSelectAll,
  batchBar
}: EnterpriseTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;

    if (sortKey === col.key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(col.key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const column = columns.find((c) => c.key === sortKey);
    if (!column) return data;

    const sortFn = column.sortValue || ((item: any) => item[sortKey]);

    return [...data].sort((a, b) => {
      const valA = sortFn(a);
      const valB = sortFn(b);

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [data, sortKey, sortDirection, columns]);

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length} />;
  }

    const isAllSelected =
      sortedData.length > 0 &&
      sortedData.every((item, i) => selectedKeys.includes(keyExtractor(item, i)));

    return (
      <div className={`enterprise-table-container ${className}`} style={style}>
        {batchBar && <div style={{ marginBottom: '10px' }}>{batchBar}</div>}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="enterprise-table">
            <thead>
              <tr>
                {selectable && (
                  <th style={{ width: '44px', textAlign: 'center', padding: '0 10px' }}>
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={isAllSelected}
                      onChange={() => onToggleSelectAll && onToggleSelectAll()}
                      aria-label="Select all rows"
                      style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col)}
                      className={col.sortable ? 'sortable' : ''}
                      style={{
                        width: col.width,
                        textAlign: col.align || 'left',
                        cursor: col.sortable ? 'pointer' : 'default'
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                          width: '100%'
                        }}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span style={{ color: isSorted ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                            {isSorted ? (
                              sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                            ) : (
                              <ArrowUpDown size={11} style={{ opacity: 0.6 }} />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: 0 }}>
                    <EmptyState
                      title={emptyTitle}
                      description={emptyDescription}
                      actionLabel={emptyActionLabel}
                      onAction={onEmptyAction}
                    />
                  </td>
                </tr>
              ) : (
                sortedData.map((item, rowIdx) => {
                  const rowKey = keyExtractor(item, rowIdx);
                  const isRowSelected = selectedKeys.includes(rowKey);
                  return (
                    <tr
                      key={rowKey}
                      onClick={() => onRowClick && onRowClick(item)}
                      style={{
                        cursor: onRowClick ? 'pointer' : 'default',
                        backgroundColor: isRowSelected ? 'rgba(59, 130, 246, 0.06)' : undefined
                      }}
                    >
                      {selectable && (
                        <td
                          style={{ width: '44px', textAlign: 'center', padding: '0 10px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={isRowSelected}
                            onChange={() => onToggleSelect && onToggleSelect(rowKey)}
                            aria-label={`Select item ${rowKey}`}
                            style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          style={{
                            textAlign: col.align || 'left'
                          }}
                          className={col.className}
                        >
                          {col.render ? col.render(item, rowIdx) : (item as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
}
