import React, { useState, useRef } from 'react';
import { AlertTriangle, X, Send, Camera, Upload, Trash2, CheckCircle2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { api, getCurrentGpsPosition } from '../services/api';
import { SearchableDropdown } from './common/SearchableDropdown';
import { processAndCompressFile } from '../utils/imageCompressor';

interface Props {
  tripId: string;
  stopId?: string;
  onSuccess: () => void;
  onClose: () => void;
}

const PREDEFINED_REASONS = [
  'Accident / Incident', 'Customer / Site Unavailable', 'Documentation Issue',
  'Fuel Issue', 'Loading Delay', 'Other', 'Road Block', 'Traffic',
  'Tyre / Puncture', 'Unloading Delay', 'Vehicle Problem', 'Weather'
];

export const DelayModal: React.FC<Props> = ({ tripId, stopId, onSuccess, onClose }) => {
  const [reason, setReason] = useState('Traffic');
  const [description, setDescription] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        setStatusText('Compressing image for upload...');
        const processed = await processAndCompressFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
        setProofFile(processed.file);
        setProofPreview(processed.dataUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to process selected photo.');
      } finally {
        setStatusText(null);
      }
    }
  };

  const handleRemovePhoto = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      setStatusText('Acquiring location telemetry...');
      const coords = await getCurrentGpsPosition().catch(() => ({
        latitude: undefined,
        longitude: undefined,
        gps_accuracy: undefined
      }));

      let photoId: string | undefined = undefined;

      if (proofFile) {
        setStatusText('Uploading delay proof photo...');
        const formData = new FormData();
        formData.append('photo', proofFile, proofFile.name || `delay_proof_${Date.now()}.jpg`);
        formData.append('trip_id', tripId);
        if (stopId) formData.append('stop_id', stopId);
        formData.append('photo_type', 'Delay Proof');
        if (coords.latitude) formData.append('latitude', coords.latitude.toString());
        if (coords.longitude) formData.append('longitude', coords.longitude.toString());
        if (coords.gps_accuracy) formData.append('gps_accuracy', coords.gps_accuracy.toString());

        try {
          const uploadRes = await api.photos.upload(formData);
          photoId = uploadRes?.photo?.id || uploadRes?.id;
        } catch (uploadErr: any) {
          console.warn('Photo upload warning:', uploadErr);
          // If offline/mock mode, we can still proceed with fallback
        }
      }

      setStatusText('Filing delay report...');
      await api.driver.reportDelay(tripId, {
        reason,
        description,
        stopId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        gps_accuracy: coords.gps_accuracy,
        photoId
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit delay report');
    } finally {
      setSubmitting(false);
      setStatusText(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="var(--status-delayed)" />
            <h3 style={{ fontSize: '1.1rem' }}>Report Operational Delay</h3>
          </div>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '6px' }} disabled={submitting}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Delay Cause</label>
              <SearchableDropdown
                value={reason}
                onChange={(value) => setReason(value as string)}
                required
                placeholder="Select delay cause"
                options={PREDEFINED_REASONS.map((r) => ({ value: r, label: r }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Operational Details (Optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="E.g., Highway bridge bypass congested, waiting for police clearance..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Proof of Delay / Photo Attachment */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Proof / Attachment (Optional)</span>
                {proofFile && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Ready
                  </span>
                )}
              </label>

              {/* Hidden File and Camera inputs */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {!proofFile ? (
                <div
                  style={{
                    border: '1px dashed rgba(245, 158, 11, 0.4)',
                    backgroundColor: 'rgba(245, 158, 11, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Attach visual evidence of roadblock, tyre breakdown, receipt, or traffic
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        padding: '7px 14px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderColor: 'rgba(245, 158, 11, 0.4)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <Camera size={15} color="var(--accent-gold)" /> Take Photo
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '7px 14px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Upload size={15} /> Upload File
                    </button>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    JPG, PNG, WebP up to 10MB
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    {proofPreview ? (
                      <img
                        src={proofPreview}
                        alt="Proof preview"
                        style={{
                          width: '46px',
                          height: '46px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          flexShrink: 0
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <ImageIcon size={20} color="var(--accent-gold)" />
                      </div>
                    )}

                    <div style={{ minWidth: 0, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden'
                        }}
                      >
                        {proofFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatFileSize(proofFile.size)} • Evidence Attached
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="btn btn-secondary"
                    title="Remove attachment"
                    style={{
                      padding: '6px',
                      color: 'var(--status-danger)',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      flexShrink: 0
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              📍 System will automatically timestamp this event and attach current GPS coordinates.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="spin" /> {statusText || 'Submitting...'}
                </>
              ) : (
                <>
                  <Send size={16} /> Submit Delay Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

