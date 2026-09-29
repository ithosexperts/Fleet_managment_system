import React, { useState } from 'react';
import { AlertTriangle, Trash2, XCircle, X, Check, Loader2 } from 'lucide-react';
import { Trip } from '../types';

interface TripActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trips: Trip[];
  initialAction?: 'cancel' | 'delete';
  onConfirmCancel: (tripIds: string[], reason: string) => Promise<void>;
  onConfirmDelete: (tripIds: string[]) => Promise<void>;
}

export const TripActionModal: React.FC<TripActionModalProps> = ({
  isOpen,
  onClose,
  trips,
  initialAction = 'cancel',
  onConfirmCancel,
  onConfirmDelete
}) => {
  const [reason, setReason] = useState('Cancelled by dispatch manager');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionChoice, setActionChoice] = useState<'cancel' | 'delete'>(initialAction);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActionChoice(initialAction);
      setError(null);
    }
  }, [isOpen, initialAction]);

  if (!isOpen || trips.length === 0) return null;

  const isMulti = trips.length > 1;

  const handleExecute = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const tripIds = trips.map((t) => t.id);
      if (actionChoice === 'cancel') {
        await onConfirmCancel(tripIds, reason.trim() || 'Cancelled by dispatch manager');
      } else {
        await onConfirmDelete(tripIds);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          width: '94%',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-elevation-4)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: actionChoice === 'delete' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: actionChoice === 'delete' ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                color: actionChoice === 'delete' ? '#ef4444' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {actionChoice === 'delete' ? <Trash2 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isMulti
                  ? `${actionChoice === 'delete' ? 'Delete' : 'Cancel'} ${trips.length} Selected Manifests`
                  : `${actionChoice === 'delete' ? 'Delete Manifest' : 'Cancel Trip'} ${trips[0].id}`}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Select whether to mark as cancelled or permanently remove from the database
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-subtle"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: '6px', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#ef4444',
                fontSize: '0.82rem'
              }}
            >
              {error}
            </div>
          )}

          {/* Action Mode Toggle */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Action Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setActionChoice('cancel')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${actionChoice === 'cancel' ? '#f59e0b' : 'var(--border-subtle)'}`,
                  backgroundColor: actionChoice === 'cancel' ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: actionChoice === 'cancel' ? '#f59e0b' : 'var(--text-primary)' }}>
                    Cancel Trip
                  </span>
                  {actionChoice === 'cancel' && <Check size={16} color="#f59e0b" />}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Sets status to CANCELLED. Keeps history record, frees driver and vehicle.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionChoice('delete')}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${actionChoice === 'delete' ? '#ef4444' : 'var(--border-subtle)'}`,
                  backgroundColor: actionChoice === 'delete' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: actionChoice === 'delete' ? '#ef4444' : 'var(--text-primary)' }}>
                    Delete Manifest
                  </span>
                  {actionChoice === 'delete' && <Check size={16} color="#ef4444" />}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Permanently deletes manifest and stops from database. Irreversible.
                </span>
              </button>
            </div>
          </div>

          {/* Trip Summary Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem'
            }}
          >
            {isMulti ? (
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Selected Trips ({trips.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {trips.map((t) => (
                    <span
                      key={t.id}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {t.id}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Manifest ID:</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{trips[0].id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Driver & Vehicle:</span>
                  <span style={{ fontWeight: 600 }}>{trips[0].driver_name || 'Unassigned'} • {trips[0].vehicle_number || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Route:</span>
                  <span style={{ fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {trips[0].starting_location || 'Depot'} → {trips[0].current_destination || 'Deliveries'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cancellation Reason (shown if action is Cancel) */}
          {actionChoice === 'cancel' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Cancellation Reason / Dispatch Note:
              </label>
              <input
                type="text"
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Customer rescheduled, vehicle maintenance, route restructured"
                style={{ fontSize: '0.84rem' }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleExecute}
            disabled={isSubmitting}
            style={{
              padding: '8px 18px',
              fontSize: '0.84rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: actionChoice === 'delete' ? '#ef4444' : '#f59e0b',
              color: '#ffffff',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: actionChoice === 'delete' ? '0 2px 8px rgba(239, 68, 68, 0.35)' : '0 2px 8px rgba(245, 158, 11, 0.35)'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : actionChoice === 'delete' ? (
              <>
                <Trash2 size={15} />
                <span>Delete Manifest{isMulti ? 's' : ''}</span>
              </>
            ) : (
              <>
                <XCircle size={15} />
                <span>Confirm Cancellation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
