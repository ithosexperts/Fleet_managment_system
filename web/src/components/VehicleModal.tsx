import React, { useState, useRef } from 'react';
import { X, Truck, Check, AlertCircle, Camera, Upload, FileText, Trash2, ShieldCheck, Eye } from 'lucide-react';
import { api } from '../services/api';
import { Vehicle, Driver, VehicleDocument } from '../types';
import { SearchableDropdown } from './common/SearchableDropdown';
import { processAndCompressFile } from '../utils/imageCompressor';

interface Props {
  drivers: Driver[];
  initialVehicle?: Vehicle | null;
  onSuccess: (vehicle: Vehicle) => void;
  onClose: () => void;
}

export const VehicleModal: React.FC<Props> = ({ drivers, initialVehicle, onSuccess, onClose }) => {
  const isEdit = Boolean(initialVehicle);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [vehicleNumber, setVehicleNumber] = useState(initialVehicle?.vehicle_number || '');
  const [model, setModel] = useState(initialVehicle?.model || '');
  const [vehicleType, setVehicleType] = useState(initialVehicle?.vehicle_type || 'Medium Freight');
  const [assignedDriverId, setAssignedDriverId] = useState(initialVehicle?.assigned_driver_id || '');
  const [status, setStatus] = useState<any>(initialVehicle?.status || 'AVAILABLE');
  const [notes, setNotes] = useState(initialVehicle?.notes || '');
  const [photoUrl, setPhotoUrl] = useState(initialVehicle?.photo_url || '');

  // Compliance documents
  const [documents, setDocuments] = useState<VehicleDocument[]>(initialVehicle?.documents || []);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocType, setNewDocType] = useState<VehicleDocument['type']>('RC');
  const [newDocTitle, setNewDocTitle] = useState('Registration Certificate (RC Book)');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocFile, setNewDocFile] = useState<{ url: string; name: string; size: number } | null>(null);

  const [previewFile, setPreviewFile] = useState<{ url: string; name?: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const processed = await processAndCompressFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.8 });
        setPhotoUrl(processed.dataUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to process truck photo.');
      }
    }
  };

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const processed = await processAndCompressFile(file);
        setNewDocFile({
          url: processed.dataUrl,
          name: processed.name,
          size: processed.size
        });
      } catch (err: any) {
        setError(err.message || 'Failed to process document file.');
      }
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocNumber.trim()) {
      setError('Please provide document/certificate number.');
      return;
    }

    const newDoc: VehicleDocument = {
      id: `vd-${Date.now()}`,
      type: newDocType,
      title: newDocTitle || `${newDocType.replace(/_/g, ' ')}`,
      document_number: newDocNumber.trim().toUpperCase(),
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: newDocExpiry || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      status: 'VALID',
      file_url: newDocFile?.url,
      file_name: newDocFile?.name,
      file_size: newDocFile?.size
    };

    setDocuments((prev) => [...prev.filter((d) => d.type !== newDocType), newDoc]);
    setNewDocNumber('');
    setNewDocExpiry('');
    setNewDocFile(null);
    setShowAddDoc(false);
    setError(null);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim() || !model.trim()) {
      setError('Please provide both vehicle registration number and model.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const selectedDriver = drivers.find((d) => d.id === assignedDriverId || d.user_id === assignedDriverId);

    const payload = {
      vehicle_number: vehicleNumber.trim().toUpperCase(),
      model: model.trim(),
      vehicle_type: vehicleType,
      assigned_driver_id: assignedDriverId || null,
      assigned_driver_name: selectedDriver?.name || undefined,
      status: status,
      notes: notes.trim() || undefined,
      photo_url: photoUrl || undefined,
      documents: documents.length > 0 ? documents : undefined
    };

    try {
      if (isEdit && initialVehicle) {
        const res = await api.fleet.updateVehicle(initialVehicle.id, payload);
        onSuccess(res.vehicle || { ...initialVehicle, ...payload });
      } else {
        const res = await api.fleet.createVehicle(payload);
        onSuccess(res.vehicle || { ...payload, id: `v-${Date.now()}` });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update vehicle' : 'Failed to add vehicle'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        @media (max-width: 640px) {
          .responsive-modal-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
      <div className="modal-content" style={{ maxWidth: '580px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-whatsapp)'
              }}
            >
              <Truck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 600, margin: 0 }}>
                {isEdit ? 'Edit Fleet Vehicle' : 'Register Fleet Vehicle'}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                {isEdit ? 'Update commercial truck specs, photos and compliance papers' : 'Add commercial truck or cargo hauler with documents'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', padding: '16px 20px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--status-danger-bg)',
                  border: '1px solid var(--status-danger-border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--status-danger)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Vehicle Truck Photo Upload */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '74px',
                    height: '56px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-tertiary)',
                    border: '1.5px dashed var(--border-default)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Truck Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Truck size={28} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  style={{
                    position: 'absolute',
                    bottom: '-6px',
                    right: '-6px',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-whatsapp)',
                    color: '#0b141a',
                    border: '2px solid var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                  title="Upload Vehicle Photo"
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Commercial Vehicle Photo</span>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--status-danger)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        padding: '2px 4px'
                      }}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Upload high-res truck photo (JPG/PNG, up to 5MB) for visual fleet identification.
                </p>
              </div>
            </div>

            <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Registration Number (Plate) <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DL 01 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase', fontWeight: 600 }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Operational Status
                </label>
                <SearchableDropdown
                  value={status}
                  onChange={(value) => setStatus(value as any)}
                  options={[
                    { value: 'AVAILABLE', label: 'Available for Dispatch' },
                    { value: 'INACTIVE', label: 'Inactive / Reserve' },
                    { value: 'MAINTENANCE', label: 'In Maintenance / Workshop' }
                  ]}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Vehicle Make & Model <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Tata 407 / Eicher Pro 2049"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
              />
            </div>

            <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Vehicle Class / Type
                </label>
                <SearchableDropdown
                  value={vehicleType}
                  onChange={(value) => setVehicleType(value as string)}
                  options={[
                    { value: 'City Box Hauler', label: 'City Box Hauler' },
                    { value: 'Heavy Freight', label: 'Heavy Freight (24ft Container)' },
                    { value: 'Light Commercial', label: 'Light Commercial Vehicle' },
                    { value: 'Medium Freight', label: 'Medium Freight (14ft Deck)' },
                    { value: 'Refrigerated Express', label: 'Refrigerated Express (Thermal)' }
                  ]}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Assigned Driver / Captain
                </label>
                <SearchableDropdown
                  value={assignedDriverId}
                  onChange={(value) => setAssignedDriverId(value as string)}
                  placeholder="Unassigned (Floating Fleet)"
                  options={[
                    { value: '', label: 'Unassigned (Floating Fleet)' },
                    ...drivers.map((d) => ({ value: d.id, label: `${d.name} (${d.employee_id})` }))
                  ]}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Telematics & Equipment Notes
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="e.g. GPS hardware sensor #TEL-4920, Fastag active, Intercity permit valid"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Compliance Papers & Statutory Documents Upload */}
            <div
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--accent-whatsapp)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Vehicle Papers & Certificates ({documents.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDoc(!showAddDoc)}
                  style={{
                    backgroundColor: 'rgba(37, 211, 102, 0.12)',
                    color: 'var(--accent-whatsapp)',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  {showAddDoc ? 'Cancel' : '+ Attach Paper / Doc'}
                </button>
              </div>

              {/* Add Document Sub-form */}
              {showAddDoc && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                        Paper Type
                      </label>
                      <SearchableDropdown
                        value={newDocType}
                        onChange={(val) => {
                          const strVal = (Array.isArray(val) ? val[0] : val) as VehicleDocument['type'];
                          setNewDocType(strVal);
                          const titles: Record<string, string> = {
                            RC: 'Registration Certificate (RC Book)',
                            INSURANCE: 'Comprehensive Commercial Insurance',
                            PUC: 'Pollution Under Control Certificate (PUCC)',
                            FITNESS: 'Fitness Inspection Certificate',
                            PERMIT: 'All India Motor Vehicle Permit',
                            OTHER: 'State Road Tax Receipt / Other'
                          };
                          setNewDocTitle(titles[strVal] || strVal);
                        }}
                        options={[
                          { value: 'RC', label: 'RC - Registration Certificate' },
                          { value: 'INSURANCE', label: 'Insurance Policy' },
                          { value: 'PUC', label: 'PUC Certificate' },
                          { value: 'FITNESS', label: 'Fitness Certificate' },
                          { value: 'PERMIT', label: 'National Permit' },
                          { value: 'OTHER', label: 'Road Tax / Other Statutory Receipt' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                        Document / Policy Number *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. RC-2024-XXXXX"
                        value={newDocNumber}
                        onChange={(e) => setNewDocNumber(e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        className="form-input"
                        value={newDocExpiry}
                        onChange={(e) => setNewDocExpiry(e.target.value)}
                        style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
                        Attach Scan / PDF
                      </label>
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleDocFileChange}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => docFileInputRef.current?.click()}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px dashed var(--border-default)',
                          backgroundColor: 'var(--bg-secondary)',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          color: newDocFile ? 'var(--accent-whatsapp)' : 'var(--text-muted)'
                        }}
                      >
                        <Upload size={13} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {newDocFile ? newDocFile.name : 'Upload PDF/Scan (Max 10MB)'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddDoc(false);
                        setNewDocFile(null);
                      }}
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddDocument}
                      className="btn btn-primary"
                      style={{
                        padding: '4px 12px',
                        fontSize: '0.74rem',
                        backgroundColor: 'var(--accent-whatsapp)',
                        color: '#0b141a',
                        fontWeight: 600
                      }}
                    >
                      Save Document
                    </button>
                  </div>
                </div>
              )}

              {/* Documents List */}
              {documents.length === 0 ? (
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                  No vehicle documents attached yet. Click "+ Attach Paper / Doc" to upload RC, Insurance, PUC, or Fitness proof.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FileText size={15} color="var(--accent-whatsapp)" />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.title || doc.type}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            #{doc.document_number} {doc.expiry_date ? `· Expires: ${doc.expiry_date}` : ''}
                            {doc.file_name ? ` · 📎 ${doc.file_name}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {doc.file_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewFile({ url: doc.file_url!, name: doc.file_name || doc.title })}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-whatsapp)',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Preview Attachment"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--status-danger)',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          title="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', padding: '12px 20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
              style={{
                backgroundColor: 'var(--accent-whatsapp)',
                borderColor: 'var(--accent-whatsapp)',
                color: '#0b141a',
                fontWeight: 600
              }}
            >
              {submitting ? (
                'Saving...'
              ) : (
                <>
                  <Check size={16} /> {isEdit ? 'Update Vehicle' : 'Register Vehicle'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Attachment preview popup */}
        {previewFile && (
          <div
            className="modal-overlay"
            style={{ zIndex: 10000, backgroundColor: 'rgba(0,0,0,0.85)' }}
            onClick={() => setPreviewFile(null)}
          >
            <div
              className="modal-content"
              style={{ maxWidth: '640px', padding: '16px', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{previewFile.name || 'Document Proof'}</span>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
              {previewFile.url.startsWith('data:image/') || previewFile.url.endsWith('.png') || previewFile.url.endsWith('.jpg') ? (
                <img
                  src={previewFile.url}
                  alt="Attachment Preview"
                  style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <FileText size={48} color="var(--accent-whatsapp)" />
                  <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>{previewFile.name || 'PDF Document'}</p>
                  <a
                    href={previewFile.url}
                    download={previewFile.name || 'document.pdf'}
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: 'var(--accent-whatsapp)',
                      color: '#0b141a',
                      fontWeight: 600,
                      marginTop: '12px'
                    }}
                  >
                    Download / Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
