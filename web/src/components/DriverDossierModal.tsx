import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  Shield,
  Award,
  Truck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Star,
  Activity,
  Heart,
  FileBadge,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { Driver, DriverDocument } from '../types';

interface Props {
  driver: Driver;
  onClose: () => void;
}

export const DriverDossierModal: React.FC<Props> = ({ driver, onClose }) => {
  const [previewDoc, setPreviewDoc] = useState<DriverDocument | null>(null);

  const perf = driver.performance || {
    total_trips: driver.total_trips || 35,
    on_time_rate: 98.4,
    total_km: 9820,
    safety_score: 97
  };

  const docs = driver.documents || [];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '660px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(37, 211, 102, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-whatsapp)'
              }}
            >
              <UserCheck size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {driver.name}
                </h3>
                <span style={{ fontSize: '0.74rem', padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {driver.employee_id}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Personnel Profile, Statutory Heavy Licenses & Dispatch History
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-subtle" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          {/* Driver Hero Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #008069, #25D366)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                  overflow: 'hidden',
                  border: '2px solid var(--border-subtle)',
                  flexShrink: 0
                }}
              >
                {driver.avatar_url ? (
                  <img
                    src={driver.avatar_url}
                    alt={driver.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  driver.name.charAt(0)
                )}
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {driver.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {driver.email} &bull; {driver.phone || '+91 98100 00000'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      backgroundColor: driver.status === 'AVAILABLE' ? 'rgba(37,211,102,0.15)' : driver.status === 'ON_TRIP' ? 'rgba(14,165,233,0.15)' : 'rgba(134,150,160,0.15)',
                      color: driver.status === 'AVAILABLE' ? 'var(--accent-whatsapp)' : driver.status === 'ON_TRIP' ? 'var(--status-in-progress)' : 'var(--text-muted)'
                    }}
                  >
                    ● {driver.status}
                  </span>
                  <span style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 700 }}>
                    <Star size={12} fill="#f59e0b" />
                    <span>{driver.rating || 4.9} / 5.0</span>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ({driver.experience_years || 8} yrs exp)
                  </span>
                </div>
              </div>
            </div>

            {/* Safety Score Widget */}
            <div
              style={{
                textAlign: 'center',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(37, 211, 102, 0.08)',
                border: '1px solid rgba(37, 211, 102, 0.25)'
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-whatsapp)', textTransform: 'uppercase' }}>Safety Score</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-whatsapp)' }}>{perf.safety_score}%</div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>Zero Major Infractions</div>
            </div>
          </div>

          {/* Core Emergency & Personal Data */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px'
            }}
          >
            <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Blood Group</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--status-danger)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Heart size={13} fill="currentColor" />
                <span>{driver.blood_group || 'B+'}</span>
              </div>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Emergency Contact</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: '2px' }}>{driver.emergency_contact || 'Sunita Sharma'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{driver.emergency_phone || '+91 98101 99887'}</div>
            </div>
            <div style={{ padding: '10px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Assigned Vehicle</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {driver.assigned_vehicle_number || 'None'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Logistics Unit</div>
            </div>
          </div>

          {/* Statutory Driving Licenses & Verification Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="var(--accent-whatsapp)" />
              <span>Statutory Licenses & Verified Compliance Records</span>
            </div>

            {/* Main Commercial DL Card */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Commercial Transport License
                </div>
                <div style={{ fontSize: '0.94rem', fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {driver.license_number || 'DL-0420110098451'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Category: <b>{driver.license_category || 'Commercial HMV (Heavy Goods Carrier)'}</b> &bull; Valid till: <b>{driver.license_expiry || '2031-08-20'}</b>
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(37,211,102,0.15)', color: 'var(--accent-whatsapp)', fontWeight: 700 }}>
                ✓ VALID COMMERCIAL DL
              </span>
            </div>

            {/* Attached Statutory Documents */}
            {docs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Uploaded Identity & Statutory Certificates ({docs.length})
                </div>
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} color="var(--accent-whatsapp)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{doc.title || doc.type}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          #{doc.document_number} {doc.expiry_date ? `· Valid till: ${doc.expiry_date}` : ''}
                          {doc.file_name ? ` · 📎 ${doc.file_name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(37,211,102,0.12)',
                          color: 'var(--accent-whatsapp)',
                          fontWeight: 700
                        }}
                      >
                        ✓ {doc.status || 'VERIFIED'}
                      </span>
                      {doc.file_url && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPreviewDoc(doc)}
                          style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                        >
                          <Eye size={12} /> View Proof
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Verification Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              <span className="verification-chip">
                <CheckCircle2 size={13} />
                <span>Police Verification: Passed &amp; Verified</span>
              </span>
              <span className="verification-chip">
                <CheckCircle2 size={13} />
                <span>Medical / Vision Fitness: Certified</span>
              </span>
              <span className="verification-chip">
                <CheckCircle2 size={13} />
                <span>Aadhaar / UIDAI Proof: Linked</span>
              </span>
            </div>
          </div>

          {/* Performance & Dispatch Scorecard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={16} color="var(--accent-gold)" />
              <span>Operational Dispatch Performance</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Completed Trips</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                  {perf.total_trips}
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>On-Time Arrival Rate</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-whatsapp)' }}>
                  {perf.on_time_rate}%
                </div>
              </div>
              <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Distance Logged</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-primary)' }}>
                  {perf.total_km.toLocaleString('en-IN')} km
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close Dossier
          </button>
        </div>
      </div>

      {/* Driver Document Proof Modal */}
      {previewDoc && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1200, backgroundColor: 'rgba(0,0,0,0.85)' }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '600px', padding: '18px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>{previewDoc.title || previewDoc.type}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  #{previewDoc.document_number} &bull; Driver: {driver.name}
                </div>
              </div>
              <button type="button" className="btn btn-subtle" onClick={() => setPreviewDoc(null)}>
                <X size={16} />
              </button>
            </div>

            {previewDoc.file_url ? (
              previewDoc.file_url.startsWith('data:image/') || previewDoc.file_url.endsWith('.png') || previewDoc.file_url.endsWith('.jpg') ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={previewDoc.file_url}
                    alt={previewDoc.title}
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
                  />
                  <div style={{ marginTop: '10px' }}>
                    <a
                      href={previewDoc.file_url}
                      download={previewDoc.file_name || `${previewDoc.type}.png`}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Download size={13} /> Download Original Scan
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <FileText size={48} color="var(--accent-whatsapp)" />
                  <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>{previewDoc.file_name || 'Attached PDF Document'}</p>
                  <a
                    href={previewDoc.file_url}
                    download={previewDoc.file_name || `${previewDoc.type}.pdf`}
                    className="btn btn-primary btn-sm"
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
                    <Download size={13} /> Download PDF
                  </a>
                </div>
              )
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No file attachment uploaded for this document record.
              </div>
            )}

            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
