import React, { useState, useRef } from 'react';
import { X, UserCheck, Check, AlertCircle, Phone, Mail, BadgeCheck, Camera, Upload, FileText, Trash2, ShieldCheck, Eye, EyeOff, Lock, Key } from 'lucide-react';
import { api } from '../services/api';
import { SearchableDropdown } from './common/SearchableDropdown';
import { processAndCompressFile } from '../utils/imageCompressor';
import { Driver, Vehicle, DriverDocument } from '../types';

interface Props {
  vehicles: Vehicle[];
  initialDriver?: Driver | null;
  onSuccess: (driver: Driver) => void;
  onClose: () => void;
}

export const DriverModal: React.FC<Props> = ({ vehicles, initialDriver, onSuccess, onClose }) => {
  const isEdit = Boolean(initialDriver);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialDriver?.name || '');
  const [employeeId, setEmployeeId] = useState(initialDriver?.employee_id || '');
  const [phone, setPhone] = useState(initialDriver?.phone || '+91 ');
  const [email, setEmail] = useState(initialDriver?.email || '');
  const [password, setPassword] = useState(isEdit ? '' : 'driver123');
  const [showPassword, setShowPassword] = useState(false);
  const [assignedVehicleId, setAssignedVehicleId] = useState(initialDriver?.assigned_vehicle_id || '');
  const [status, setStatus] = useState<any>(initialDriver?.status || 'AVAILABLE');
  const [licenseNumber, setLicenseNumber] = useState(initialDriver?.license_number || '');
  const [licenseCategory, setLicenseCategory] = useState(initialDriver?.license_category || 'Commercial HMV');
  const [emergencyPhone, setEmergencyPhone] = useState(initialDriver?.emergency_phone || '');
  const [avatarUrl, setAvatarUrl] = useState(initialDriver?.avatar_url || '');

  // Attached compliance documents
  const [documents, setDocuments] = useState<DriverDocument[]>(initialDriver?.documents || []);
  const [newDocType, setNewDocType] = useState<DriverDocument['type']>('DRIVING_LICENSE');
  const [newDocTitle, setNewDocTitle] = useState('Commercial Heavy Driver License');
  const [newDocNumber, setNewDocNumber] = useState('');
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [newDocFile, setNewDocFile] = useState<{ url: string; name: string; size: number } | null>(null);
  const [showAddDoc, setShowAddDoc] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar file upload handler with auto client-side compression
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const processed = await processAndCompressFile(file, { maxWidth: 800, maxHeight: 800, quality: 0.82 });
        setAvatarUrl(processed.dataUrl);
      } catch (err: any) {
        setError(err.message || 'Failed to process driver photo.');
      }
    }
  };

  // Document file upload handler with safe client-side compression
  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const processed = await processAndCompressFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.82 });
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
      setError('Please provide document number before adding.');
      return;
    }

    const newDoc: DriverDocument = {
      id: `dd-${Date.now()}`,
      type: newDocType,
      title: newDocTitle || `${newDocType.replace(/_/g, ' ')}`,
      document_number: newDocNumber.trim().toUpperCase(),
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: newDocExpiry || undefined,
      status: 'VERIFIED',
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
    if (!name.trim()) {
      setError('Please provide driver full name.');
      return;
    }

    if (!isEdit && !password.trim()) {
      setError('Please provide a login password for the driver.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const selectedVehicle = vehicles.find((v) => v.id === assignedVehicleId);

    const payload: any = {
      name: name.trim(),
      employee_id: (employeeId.trim() || `EMP-DRV-${Math.floor(100 + Math.random() * 900)}`).toUpperCase(),
      phone: phone.trim() || '+91 98100 00000',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
      password: password.trim() || undefined,
      assigned_vehicle_id: assignedVehicleId || null,
      assigned_vehicle_number: selectedVehicle?.vehicle_number || undefined,
      status: status,
      avatar_url: avatarUrl || undefined,
      license_number: licenseNumber.trim() || undefined,
      license_category: licenseCategory || undefined,
      emergency_phone: emergencyPhone.trim() || undefined,
      documents: documents
    };

    try {
      if (isEdit && initialDriver) {
        const res = await api.fleet.updateDriver(initialDriver.id, payload);
        onSuccess(res.driver || { ...initialDriver, ...payload });
      } else {
        const res = await api.fleet.createDriver(payload);
        onSuccess(res.driver || { ...payload, id: `drv-${Date.now()}` });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || (isEdit ? 'Failed to update driver' : 'Failed to register driver'));
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
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-whatsapp)'
              }}
            >
              <UserCheck size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 600, margin: 0 }}>
                {isEdit ? 'Edit Driver / Captain Details' : 'Register Fleet Driver / Captain'}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                {isEdit ? 'Update commercial driving license and contact roster' : 'Enlist a verified commercial driver to the operations roster'}
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

            {/* Driver Photo / Avatar Upload Section */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(37, 211, 102, 0.1)',
                  border: '2px solid var(--accent-whatsapp)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
                title="Click to change driver photo"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Driver Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-whatsapp)' }}>
                    {name ? name.charAt(0).toUpperCase() : <Camera size={22} />}
                  </span>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    left: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px',
                    color: '#fff'
                  }}
                >
                  <Camera size={11} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Driver Profile Avatar / Photo
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Upload clear portrait picture for telematics ID and dossier
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '3px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Upload size={11} />
                    <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      className="btn btn-subtle btn-sm"
                      onClick={() => setAvatarUrl('')}
                      style={{ padding: '3px 6px', fontSize: '0.72rem', color: 'var(--status-danger)' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Full Driver Name <span style={{ color: 'var(--status-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vikram Rathore"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Employee ID
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="EMP-DRV-104"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  />
                  <BadgeCheck size={13} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Duty Status
                </label>
                <SearchableDropdown
                  value={status}
                  onChange={(value) => setStatus(value as any)}
                  options={[
                    { value: 'AVAILABLE', label: 'Available on Duty' },
                    { value: 'INACTIVE', label: 'Inactive / Leave' },
                    { value: 'OFF_DUTY', label: 'Off Duty / Rest Period' }
                  ]}
                />
              </div>
            </div>

            <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Phone Line <span style={{ color: 'var(--status-danger)' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98104 55667"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <Phone size={13} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Emergency Contact Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98101 99887"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                  />
                  <Phone size={13} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            {/* Dedicated Driver Login & App Credentials */}
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={15} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Driver Login & App Access Credentials
                </span>
              </div>

              <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Login Email <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. driver@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required={!isEdit}
                    />
                    <Mail size={13} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    {isEdit ? 'Reset Password' : <>Login Password <span style={{ color: 'var(--status-danger)' }}>*</span></>}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder={isEdit ? 'Leave blank to retain current' : 'e.g. driver123'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!isEdit}
                      style={{ paddingRight: '32px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex'
                      }}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', margin: 0 }}>
                {isEdit
                  ? 'Enter a new password if you want to reset this driver’s login credentials.'
                  : 'The driver will use this Email and Password to log in on the Android mobile app or Driver web portal.'}
              </span>
            </div>

            <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  Commercial Driver License (DL) #
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. DL-0420110098451"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                  License Category
                </label>
                <SearchableDropdown
                  value={licenseCategory}
                  onChange={(value) => setLicenseCategory(value as string)}
                  options={[
                    { value: 'Commercial HMV', label: 'Commercial HMV (Heavy)' },
                    { value: 'Commercial LMV', label: 'Commercial LMV (Light)' },
                    { value: 'Commercial MGV', label: 'Commercial MGV (Medium)' }
                  ]}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                Assign Primary Vehicle (Truck)
              </label>
              <SearchableDropdown
                value={assignedVehicleId}
                onChange={(value) => setAssignedVehicleId(value as string)}
                placeholder="Unassigned (Floating Driver)"
                options={[
                  { value: '', label: 'Unassigned (Floating Driver)' },
                  ...vehicles.map((v) => ({ value: v.id, label: `${v.vehicle_number} — ${v.model} (${v.status})` }))
                ]}
              />
            </div>

            {/* Statutory Driver Documents Upload Section */}
            <div
              style={{
                marginTop: '4px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--accent-whatsapp)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Compliance & Statutory Documents ({documents.length})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowAddDoc(!showAddDoc)}
                  style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                >
                  {showAddDoc ? 'Cancel' : '+ Attach Document'}
                </button>
              </div>

              {/* List of Attached Documents */}
              {documents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.76rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <FileText size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontWeight: 600 }}>{doc.title}</span>
                          <span style={{ color: 'var(--text-muted)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                            #{doc.document_number}
                          </span>
                          {doc.file_name && (
                            <span style={{ color: 'var(--accent-whatsapp)', marginLeft: '6px', fontSize: '0.7rem' }}>
                              📎 {doc.file_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '2px' }}
                        title="Remove document attachment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  No statutory documents attached yet. Attach Driving License, Aadhaar, or Medical fitness certificates.
                </div>
              )}

              {/* Add Document Inline Form */}
              {showAddDoc && (
                <div
                  style={{
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px dashed var(--accent-whatsapp)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Document Type</label>
                      <SearchableDropdown
                        value={newDocType}
                        onChange={(val) => {
                          const strVal = (Array.isArray(val) ? val[0] : val) as string;
                          setNewDocType(strVal as any);
                          const titles: Record<string, string> = {
                            DRIVING_LICENSE: 'Commercial Heavy Driver License',
                            AADHAR_CARD: 'UIDAI Government Identity Card',
                            POLICE_VERIFICATION: 'Police Background Clearance',
                            MEDICAL_FITNESS: 'Annual Vision & Medical Fitness'
                          };
                          setNewDocTitle(titles[strVal] || strVal);
                        }}
                        options={[
                          { value: 'DRIVING_LICENSE', label: 'Commercial Driving License' },
                          { value: 'AADHAR_CARD', label: 'Aadhaar / National ID' },
                          { value: 'POLICE_VERIFICATION', label: 'Police Verification Record' },
                          { value: 'MEDICAL_FITNESS', label: 'Medical Fitness Certificate' }
                        ]}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Document / Certificate #</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. DL-042011"
                        value={newDocNumber}
                        onChange={(e) => setNewDocNumber(e.target.value)}
                        style={{ height: '34px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                  </div>

                  <div className="responsive-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Expiry Date (Optional)</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newDocExpiry}
                        onChange={(e) => setNewDocExpiry(e.target.value)}
                        style={{ height: '34px', fontSize: '0.78rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Attach Scan / PDF</label>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => docFileInputRef.current?.click()}
                        style={{ width: '100%', height: '34px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Upload size={12} />
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '120px' }}>
                          {newDocFile ? newDocFile.name : 'Choose File (PDF/Img)'}
                        </span>
                      </button>
                      <input
                        ref={docFileInputRef}
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleDocFileChange}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setShowAddDoc(false)}
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleAddDocument}
                      style={{ padding: '3px 10px', fontSize: '0.72rem', backgroundColor: 'var(--accent-whatsapp)', color: '#0b141a', fontWeight: 700 }}
                    >
                      Add Document
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
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
                  <Check size={16} /> {isEdit ? 'Update Driver' : 'Register Driver'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
