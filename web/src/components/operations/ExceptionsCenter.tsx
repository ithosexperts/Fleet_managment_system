import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  Users,
  Truck,
  CheckCircle2,
  Filter,
  ShieldAlert,
  ChevronRight,
  Eye,
  Check,
  Phone,
  RotateCcw,
  Info,
  X
} from 'lucide-react';
import { OperationalException } from '../../types';
import { PageHeader } from '../common/PageHeader';

interface ExceptionsCenterProps {
  exceptions: OperationalException[];
  onAcknowledge: (id: string, notes?: string) => Promise<void>;
  onViewTrip: (tripId: string) => void;
  onRefresh: () => void;
  lastUpdated?: Date;
  refreshing?: boolean;
}

export const ExceptionsCenter: React.FC<ExceptionsCenterProps> = ({
  exceptions,
  onAcknowledge,
  onViewTrip,
  onRefresh,
  lastUpdated,
  refreshing = false
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('OPEN');
  const [selectedExceptionForModal, setSelectedExceptionForModal] = useState<OperationalException | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filtered exceptions
  const filteredExceptions = exceptions.filter((exc) => {
    if (severityFilter !== 'ALL' && exc.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OPEN' && (exc.resolution_status === 'ACKNOWLEDGED' || exc.is_acknowledged === 1)) {
        return false;
      }
      if (statusFilter === 'ACKNOWLEDGED' && exc.resolution_status !== 'ACKNOWLEDGED' && exc.is_acknowledged !== 1) {
        return false;
      }
    }
    return true;
  });

  // Severity counts
  const criticalCount = exceptions.filter((e) => e.severity === 'CRITICAL' && !e.is_acknowledged).length;
  const highCount = exceptions.filter((e) => e.severity === 'HIGH' && !e.is_acknowledged).length;
  const mediumCount = exceptions.filter((e) => e.severity === 'MEDIUM' && !e.is_acknowledged).length;
  const lowCount = exceptions.filter((e) => e.severity === 'LOW' && !e.is_acknowledged).length;

  const handleOpenAcknowledge = (exc: OperationalException) => {
    setSelectedExceptionForModal(exc);
    setResolutionNotes(exc.resolution_notes || '');
  };

  const handleConfirmAcknowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExceptionForModal) return;
    setSubmitting(true);
    try {
      await onAcknowledge(selectedExceptionForModal.id, resolutionNotes);
      setSelectedExceptionForModal(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge exception');
    } finally {
      setSubmitting(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: '#ef4444',
          text: '#ffffff',
          label: 'CRITICAL'
        };
      case 'HIGH':
        return {
          bg: 'var(--badge-delayed-bg)',
          text: 'var(--badge-delayed-text)',
          label: 'HIGH'
        };
      case 'MEDIUM':
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          text: '#d97706',
          label: 'MEDIUM'
        };
      default:
        return {
          bg: 'rgba(100, 116, 139, 0.15)',
          text: '#64748b',
          label: 'LOW'
        };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Enterprise Unified Header with Real-Time Pulse */}
      <PageHeader
        breadcrumbs={[{ label: 'Control' }, { label: 'Exceptions Center' }]}
        title="Operational Exceptions & Alert Triage"
        subtitle="Real-time incident response: Delays, GPS losses, geofence breaches, and compliance risks"
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {/* Severity Metric Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          onClick={() => setSeverityFilter(severityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
          className="card-elevation-1"
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: severityFilter === 'CRITICAL' ? '2px solid #ef4444' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444' }}>CRITICAL ALERTS</span>
            <ShieldAlert size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {criticalCount}
          </div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'HIGH' ? 'ALL' : 'HIGH')}
          className="card-elevation-1"
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: severityFilter === 'HIGH' ? '2px solid #f97316' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f97316' }}>HIGH SEVERITY</span>
            <AlertTriangle size={18} color="#f97316" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {highCount}
          </div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
          className="card-elevation-1"
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: severityFilter === 'MEDIUM' ? '2px solid #f59e0b' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b' }}>MEDIUM RISKS</span>
            <Info size={18} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {mediumCount}
          </div>
        </div>

        <div
          onClick={() => setSeverityFilter(severityFilter === 'LOW' ? 'ALL' : 'LOW')}
          className="card-elevation-1"
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: severityFilter === 'LOW' ? '2px solid #64748b' : '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)' }}>LOW / ADVISORY</span>
            <CheckCircle2 size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {lowCount}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="card-elevation-1"
        style={{
          padding: '10px 16px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setStatusFilter('OPEN')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: statusFilter === 'OPEN' ? 'var(--brand-primary)' : 'transparent',
              color: statusFilter === 'OPEN' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Open Exceptions
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACKNOWLEDGED')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: statusFilter === 'ACKNOWLEDGED' ? 'var(--brand-primary)' : 'transparent',
              color: statusFilter === 'ACKNOWLEDGED' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            Acknowledged & Resolved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: statusFilter === 'ALL' ? 'var(--brand-primary)' : 'transparent',
              color: statusFilter === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            All Alerts
          </button>
        </div>

        {severityFilter !== 'ALL' && (
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setSeverityFilter('ALL')}
            style={{ fontSize: '0.8rem', padding: '4px 10px' }}
          >
            Clear Severity ({severityFilter})
          </button>
        )}
      </div>

      {/* Structured Exceptions List */}
      {filteredExceptions.length === 0 ? (
        <div
          style={{
            padding: '50px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <CheckCircle2 size={42} color="var(--brand-primary)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            No Exceptions Found in Current Filter
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            All operational routes, drivers, and telematics are operating within normal parameters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredExceptions.map((exc) => {
            const badge = getSeverityBadge(exc.severity);
            const isResolved = exc.is_acknowledged === 1 || exc.resolution_status === 'ACKNOWLEDGED';

            return (
              <div
                key={exc.id}
                className="card-elevation-1"
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: isResolved ? '1px solid var(--border-subtle)' : `1px solid ${badge.bg}`,
                  borderLeft: `5px solid ${badge.bg}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                {/* Header: WHAT + Severity */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          backgroundColor: badge.bg,
                          color: badge.text
                        }}
                      >
                        {badge.label}
                      </span>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {exc.title}
                      </h3>
                      {isResolved && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--badge-completed-bg)',
                            color: 'var(--badge-completed-text)'
                          }}
                        >
                          ✓ Acknowledged
                        </span>
                      )}
                    </div>
                    {exc.description && (
                      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
                        {exc.description}
                      </p>
                    )}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                    {new Date(exc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Structured Metadata: WHERE, WHEN, WHO, IMPACT */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>
                      WHERE (LOCATION)
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {exc.location_name || 'In Transit'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>
                      WHO (DRIVER & FLEET UNIT)
                    </span>
                    <strong style={{ color: 'var(--text-primary)' }}>
                      {exc.driver_name || 'Driver'} • {exc.vehicle_number || 'N/A'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>
                      TRIP REFERENCE
                    </span>
                    <strong style={{ color: 'var(--brand-primary)' }}>
                      {exc.trip_ref || exc.trip_id || 'Fleet Level'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', fontWeight: 700, display: 'block' }}>
                      IMPACT
                    </span>
                    <strong style={{ color: '#ef4444' }}>
                      {exc.impact || 'Service Level At Risk'}
                    </strong>
                  </div>
                </div>

                {/* Resolution Notes if acknowledged */}
                {exc.resolution_notes && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(23, 100, 168, 0.08)',
                      borderLeft: '3px solid var(--brand-primary)',
                      fontSize: '0.8rem',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <strong>Manager Resolution Notes:</strong> {exc.resolution_notes}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                  {exc.trip_id && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onViewTrip(exc.trip_id!)}
                      style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={14} />
                      <span>Inspect Trip</span>
                    </button>
                  )}

                  {!isResolved ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleOpenAcknowledge(exc)}
                      style={{ fontSize: '0.8rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Check size={14} />
                      <span>Acknowledge & Resolve</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleOpenAcknowledge(exc)}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      <span>Update Notes</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Acknowledge / Resolution Modal */}
      {selectedExceptionForModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedExceptionForModal(null)}
        >
          <div
            className="card-elevation-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '520px',
              padding: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Acknowledge Operational Exception
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExceptionForModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Document corrective action taken for: <strong>{selectedExceptionForModal.title}</strong>
            </p>

            <form onSubmit={handleConfirmAcknowledge}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Resolution / Dispatch Action Taken
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Spoke with driver; traffic detour cleared via secondary bypass. Customer notified of +15m adjusted ETA."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', resize: 'vertical', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedExceptionForModal(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !resolutionNotes.trim()}
                >
                  {submitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
