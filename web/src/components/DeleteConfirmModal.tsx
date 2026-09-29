import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemName: string;
  itemType: 'vehicle' | 'driver' | 'destination' | 'record';
  hasAssociatedTrips?: boolean;
  associatedTripCount?: number;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  itemName,
  itemType,
  hasAssociatedTrips = false,
  associatedTripCount = 0,
  onConfirm
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm();
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setError(err.message || `Failed to delete ${itemType}`);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1300,
        backgroundColor: 'rgba(11, 16, 27, 0.72)',
        backdropFilter: 'blur(5px)'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          width: '92%',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.28)',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: '1px solid var(--border-subtle, #f1f5f9)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Trash2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #0f172a)' }}>
                {title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', margin: '2px 0 0' }}>
                Confirm permanent removal from enterprise fleet records
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#ef4444'
              }}
            >
              {error}
            </div>
          )}

          <p style={{ fontSize: '0.88rem', color: 'var(--text-primary, #1e293b)', lineHeight: '1.5', margin: 0 }}>
            Are you sure you want to permanently delete <strong>{itemName}</strong>?
          </p>

          {hasAssociatedTrips && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '10px',
                display: 'flex',
                gap: '10px',
                fontSize: '0.8rem',
                color: '#b45309'
              }}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Warning:</strong> This {itemType} has {associatedTripCount || 'active'} recorded delivery trip(s). Proceeding will permanently decommission the {itemType}, disconnect its compliance records, and purge associated trip manifests from the operational roster.
              </div>
            </div>
          )}

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-secondary, #f8fafc)',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-secondary, #64748b)'
            }}
          >
            • This action is permanent and cannot be undone.<br />
            • Driver credentials and active assignments will be released.
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--border-subtle, #f1f5f9)'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 700,
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
            }}
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span>{isDeleting ? 'Deleting...' : `Delete ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
