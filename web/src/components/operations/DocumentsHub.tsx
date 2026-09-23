import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck,
  Truck,
  X,
  Edit3,
  Plus
} from 'lucide-react';
import { Vehicle, VehicleDocument } from '../../types';
import { SearchableDropdown } from '../common/SearchableDropdown';
import { PageHeader } from '../common/PageHeader';

interface DocumentsHubProps {
  vehicles: Vehicle[];
  onOpenVehiclePapers: (vehicle: Vehicle, docType?: string, isEdit?: boolean) => void;
  lastUpdated?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
}

interface FlattenedDoc {
  doc: VehicleDocument;
  vehicle: Vehicle;
}

export const normalizeDocTypeKey = (typeStr?: string): string => {
  if (!typeStr) return 'OTHER';
  const upper = String(typeStr).toUpperCase();
  if (upper.includes('REGISTRATION') || upper === 'RC') return 'RC';
  if (upper.includes('INSURANCE')) return 'INSURANCE';
  if (upper.includes('FITNESS')) return 'FITNESS';
  if (upper.includes('POLLUTION') || upper === 'PUC') return 'PUC';
  if (upper.includes('PERMIT')) return 'PERMIT';
  return upper;
};

export const getDocTypeDisplay = (doc: { type?: string; document_type?: string; title?: string }) => {
  const raw = doc.document_type || doc.type || '';
  const key = normalizeDocTypeKey(raw || doc.title);
  switch (key) {
    case 'RC':
      return { key: 'RC', label: 'RC (Registration)', badgeColor: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.12)' };
    case 'INSURANCE':
      return { key: 'INSURANCE', label: 'Insurance', badgeColor: '#059669', bgColor: 'rgba(5, 150, 105, 0.12)' };
    case 'FITNESS':
      return { key: 'FITNESS', label: 'Fitness', badgeColor: '#7c3aed', bgColor: 'rgba(124, 58, 237, 0.12)' };
    case 'PUC':
      return { key: 'PUC', label: 'PUC (Pollution)', badgeColor: '#d97706', bgColor: 'rgba(217, 119, 6, 0.12)' };
    case 'PERMIT':
      return { key: 'PERMIT', label: 'National Permit', badgeColor: '#0891b2', bgColor: 'rgba(8, 145, 178, 0.12)' };
    default:
      return { key: 'OTHER', label: raw || 'Document', badgeColor: '#64748b', bgColor: 'rgba(100, 116, 139, 0.12)' };
  }
};

export const DocumentsHub: React.FC<DocumentsHubProps> = ({
  vehicles,
  onOpenVehiclePapers,
  lastUpdated,
  onRefresh,
  refreshing = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // Flatten all documents across all vehicles
  const allDocs = useMemo(() => {
    const list: FlattenedDoc[] = [];
    vehicles.forEach((v) => {
      if (v.documents && v.documents.length > 0) {
        v.documents.forEach((d) => {
          const typeKey = normalizeDocTypeKey(d.document_type || d.type || d.title);
          list.push({
            doc: {
              ...d,
              type: typeKey as any,
              document_type: d.document_type || d.type || typeKey
            },
            vehicle: v
          });
        });
      }
    });
    return list;
  }, [vehicles]);

  // Statistics
  const stats = useMemo(() => {
    let valid = 0;
    let expiringSoon = 0;
    let expired = 0;
    allDocs.forEach(({ doc }) => {
      if (doc.status === 'EXPIRED') expired++;
      else if (doc.status === 'EXPIRING_SOON') expiringSoon++;
      else valid++;
    });
    return { total: allDocs.length, valid, expiringSoon, expired };
  }, [allDocs]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return allDocs.filter(({ doc, vehicle }) => {
      const typeKey = normalizeDocTypeKey(doc.document_type || doc.type || doc.title);
      if (statusFilter.length > 0 && !statusFilter.includes(doc.status)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(typeKey)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPlate = vehicle.vehicle_number.toLowerCase().includes(q);
        const matchesTitle = (doc.title || '').toLowerCase().includes(q);
        const matchesNumber = (doc.document_number || '').toLowerCase().includes(q);
        const matchesType = typeKey.toLowerCase().includes(q);
        if (!matchesPlate && !matchesTitle && !matchesNumber && !matchesType) return false;
      }

      return true;
    });
  }, [allDocs, statusFilter, typeFilter, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Enhanced Page Header with Direct Document Registration & Update Action */}
      <PageHeader
        breadcrumbs={[{ label: 'Compliance' }, { label: 'Documents Hub' }]}
        title="Fleet Compliance & Document Registry"
        subtitle="Statutory compliance audit: Registration Certificates (RC), Fitness, Insurance, PUC & Permits"
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        refreshing={refreshing}
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              if (vehicles.length > 0) {
                onOpenVehiclePapers(vehicles[0], undefined, true);
              }
            }}
            style={{
              backgroundColor: '#1764A8',
              borderColor: '#1764A8',
              color: '#ffffff',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Register or update official vehicle compliance papers"
          >
            <Plus size={14} />
            <span>Register & Update Document</span>
          </button>
        }
      />

      {/* KPI Stat Cards */}
      <div
        className="documents-kpi-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          className="card-elevation-1"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Total Registered Documents
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {stats.total}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => prev.includes('VALID') ? prev.filter((s) => s !== 'VALID') : [...prev, 'VALID'])}
          className="card-elevation-1"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: statusFilter.includes('VALID') ? '2px solid #10b981' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
            Valid & In Compliance
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {stats.valid}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => prev.includes('EXPIRING_SOON') ? prev.filter((s) => s !== 'EXPIRING_SOON') : [...prev, 'EXPIRING_SOON'])}
          className="card-elevation-1"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: statusFilter.includes('EXPIRING_SOON') ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
            Expiring Within 30 Days
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            {stats.expiringSoon}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => prev.includes('EXPIRED') ? prev.filter((s) => s !== 'EXPIRED') : [...prev, 'EXPIRED'])}
          className="card-elevation-1"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: statusFilter.includes('EXPIRED') ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
            Expired Documents (Action Req.)
          </span>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {stats.expired}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="card-elevation-1"
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        {/* Search */}
        <div className="searchbar-enhanced" style={{ minWidth: '240px', flex: '1 1 240px', position: 'relative' }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search vehicle plate or document number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Doc Type Filter */}
        <SearchableDropdown
          multiple
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as string[])}
          placeholder="All Doc Types"
          minWidth="160px"
          options={[
            { value: 'RC', label: 'RC (Registration)' },
            { value: 'INSURANCE', label: 'Insurance' },
            { value: 'FITNESS', label: 'Fitness (Form 38)' },
            { value: 'PUC', label: 'PUC (Pollution)' },
            { value: 'PERMIT', label: 'Permit' }
          ]}
        />

        {/* Status Filter */}
        <SearchableDropdown
          multiple
          value={statusFilter}
          onChange={(val) => setStatusFilter(val as string[])}
          placeholder="All Statuses"
          minWidth="150px"
          options={[
            { value: 'VALID', label: 'Valid' },
            { value: 'EXPIRING_SOON', label: 'Expiring Soon' },
            { value: 'EXPIRED', label: 'Expired' }
          ]}
        />

        {(statusFilter.length > 0 || typeFilter.length > 0 || searchQuery) && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              setStatusFilter([]);
              setTypeFilter([]);
              setSearchQuery('');
            }}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Documents Table */}
      <div
        className="card-elevation-1"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-card)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Vehicle Plate
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Document Type
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Title & Certificate Number
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Expiry Date
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Compliance Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No vehicle compliance documents found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(({ doc, vehicle }) => {
                  const isExpired = doc.status === 'EXPIRED';
                  const isExpiringSoon = doc.status === 'EXPIRING_SOON';

                  return (
                    <tr
                      key={`${vehicle.id}-${doc.id}`}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {vehicle.vehicle_number}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                          {vehicle.model}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {(() => {
                          const display = getDocTypeDisplay(doc);
                          return (
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                backgroundColor: display.bgColor,
                                color: display.badgeColor,
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                letterSpacing: '0.2px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <FileCheck size={13} />
                              {display.label}
                            </span>
                          );
                        })()}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {doc.document_number}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: isExpired ? '#ef4444' : isExpiringSoon ? '#f59e0b' : 'var(--text-primary)'
                          }}
                        >
                          {doc.expiry_date}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          Issued: {doc.issue_date || 'N/A'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            backgroundColor: isExpired
                              ? '#fef2f2'
                              : isExpiringSoon
                              ? '#fffbeb'
                              : 'var(--badge-completed-bg)',
                            color: isExpired
                              ? '#ef4444'
                              : isExpiringSoon
                              ? '#d97706'
                              : 'var(--badge-completed-text)',
                            border: `1px solid ${
                              isExpired
                                ? '#fecaca'
                                : isExpiringSoon
                                ? '#fde68a'
                                : 'var(--badge-completed-border)'
                            }`
                          }}
                        >
                          {isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : 'VALID'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => onOpenVehiclePapers(vehicle, doc.type || doc.document_type || doc.title, true)}
                            style={{
                              fontSize: '0.78rem',
                              padding: '5px 10px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              borderColor: 'var(--brand-primary)',
                              color: 'var(--brand-primary)',
                              fontWeight: 600
                            }}
                            title="Edit details, dates, or update certificate"
                          >
                            <Edit3 size={13} />
                            <span>Update & Edit</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onOpenVehiclePapers(vehicle)}
                            style={{ fontSize: '0.78rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="View all compliance documents for this vehicle"
                          >
                            <Eye size={13} />
                            <span>View Papers</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
