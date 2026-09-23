import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Shield,
  Plus,
  CreditCard,
  Download,
  Eye,
  Clock,
  MapPin,
  Check,
  Upload,
  Paperclip
} from 'lucide-react';
import { Vehicle, VehicleDocument, VehicleChallan } from '../types';
import { api } from '../services/api';
import { SearchableDropdown } from './common/SearchableDropdown';
import { normalizeDocTypeKey } from './operations/DocumentsHub';
import { processAndCompressFile } from '../utils/imageCompressor';

interface Props {
  vehicle: Vehicle;
  onClose: () => void;
  onUpdate: (updatedVehicle: Vehicle) => void;
  initialDocType?: string;
  initialAddDoc?: boolean;
}

export const VehiclePapersModal: React.FC<Props> = ({
  vehicle,
  onClose,
  onUpdate,
  initialDocType,
  initialAddDoc
}) => {
  const [activeTab, setActiveTab] = useState<'papers' | 'challans'>('papers');
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle>(vehicle);
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [isAddingChallan, setIsAddingChallan] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);
  const [previewChallan, setPreviewChallan] = useState<VehicleChallan | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const challanFileInputRef = useRef<HTMLInputElement>(null);

  // New Doc Form
  const [docType, setDocType] = useState<VehicleDocument['type']>('RC');
  const [docTitle, setDocTitle] = useState('Registration Certificate (RC)');
  const [docNumber, setDocNumber] = useState('');
  const [docIssue, setDocIssue] = useState('');
  const [docExpiry, setDocExpiry] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docFile, setDocFile] = useState<{ url: string; name: string; size: number } | null>(null);

  // Auto-open and pre-populate edit document form
  useEffect(() => {
    if (initialDocType) {
      const existing = (currentVehicle.documents || []).find(
        (d) => normalizeDocTypeKey(d.type || d.document_type || d.title) === normalizeDocTypeKey(initialDocType)
      );
      if (existing) {
        setDocType(existing.type);
        setDocTitle(existing.title || `${existing.type} Certificate`);
        setDocNumber(existing.document_number || '');
        setDocIssue(existing.issue_date || '');
        setDocExpiry(existing.expiry_date || '');
        setDocNotes(existing.notes || '');
        if (existing.file_url) {
          setDocFile({ url: existing.file_url, name: existing.file_name || 'Document File', size: existing.file_size || 0 });
        }
        setIsAddingDoc(true);
      } else if (initialAddDoc) {
        setIsAddingDoc(true);
      }
    } else if (initialAddDoc) {
      setIsAddingDoc(true);
    }
  }, [initialDocType, initialAddDoc]);

  // New Challan Form
  const [challanNumber, setChallanNumber] = useState('');
  const [challanReason, setChallanReason] = useState('');
  const [challanAmount, setChallanAmount] = useState<number>(500);
  const [challanLocation, setChallanLocation] = useState('Delhi Commercial Freight Corridor');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanProofFile, setChallanProofFile] = useState<{ url: string; name: string; size: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const docs = currentVehicle.documents || [];
  const challans = currentVehicle.challans || [];
  const pendingChallans = challans.filter((c) => c.status === 'PENDING');
  const totalPendingFine = pendingChallans.reduce((sum, c) => sum + (c.amount || 0), 0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processed = await processAndCompressFile(file);
        setDocFile({
          url: processed.dataUrl,
          name: processed.name,
          size: processed.size
        });
      } catch (err: any) {
        alert(err.message || 'Error processing document file.');
      }
    }
  };

  const handleChallanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const processed = await processAndCompressFile(file);
        setChallanProofFile({
          url: processed.dataUrl,
          name: processed.name,
          size: processed.size
        });
      } catch (err: any) {
        alert(err.message || 'Error processing challan proof file.');
      }
    }
  };

  const handleAttachProofToExisting = async (challanId: string, file: File) => {
    try {
      const processed = await processAndCompressFile(file);
      const proofPayload = {
        proof_url: processed.dataUrl,
        proof_name: processed.name,
        proof_size: processed.size
      };
      await api.fleet.attachChallanProof(currentVehicle.id, challanId, proofPayload);
      const updatedChallans = challans.map((c) =>
        c.id === challanId ? { ...c, ...proofPayload } : c
      );
      const updatedVehicle: Vehicle = { ...currentVehicle, challans: updatedChallans };
      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
      setMessage(`✓ Proof document attached to Challan.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error attaching proof.');
    }
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber.trim()) return;

    setSaving(true);
    const newDoc: VehicleDocument = {
      id: `doc-${Date.now()}`,
      type: docType,
      title: docTitle.trim() || `${docType} Certificate`,
      document_number: docNumber.trim().toUpperCase(),
      issue_date: docIssue || new Date().toISOString().split('T')[0],
      expiry_date: docExpiry || '2030-01-01',
      status: 'VALID',
      notes: docNotes.trim() || undefined,
      file_url: docFile?.url,
      file_name: docFile?.name,
      file_size: docFile?.size
    };

    try {
      await api.fleet.updateDocument(currentVehicle.id, newDoc);
      const updatedDocs = [...docs.filter((d) => d.type !== docType), newDoc];
      const updatedVehicle: Vehicle = { ...currentVehicle, documents: updatedDocs };
      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
      setIsAddingDoc(false);
      setDocFile(null);
      setMessage(`✓ ${newDoc.title} updated successfully.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challanNumber.trim() || !challanReason.trim()) return;

    setSaving(true);
    const newChallanData = {
      challan_number: challanNumber.trim().toUpperCase(),
      date: challanDate,
      violation_reason: challanReason.trim(),
      amount: Number(challanAmount),
      location: challanLocation.trim(),
      status: 'PENDING' as const,
      proof_url: challanProofFile?.url,
      proof_name: challanProofFile?.name,
      proof_size: challanProofFile?.size
    };

    try {
      const res = await api.fleet.addChallan(currentVehicle.id, newChallanData);
      const updatedChallans = [res.challan, ...challans];
      const updatedVehicle: Vehicle = { ...currentVehicle, challans: updatedChallans };
      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
      setIsAddingChallan(false);
      setChallanProofFile(null);
      setChallanNumber('');
      setChallanReason('');
      setChallanAmount(500);
      setMessage(`✓ Traffic Challan ${newChallanData.challan_number} logged.`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSettleChallan = async (challanId: string) => {
    try {
      await api.fleet.settleChallan(currentVehicle.id, challanId);
      const updatedChallans = challans.map((c) =>
        c.id === challanId
          ? {
              ...c,
              status: 'PAID' as const,
              payment_date: new Date().toISOString().split('T')[0],
              receipt_number: `PAY-REC-${Date.now().toString().slice(-6)}`
            }
          : c
      );
      const updatedVehicle: Vehicle = { ...currentVehicle, challans: updatedChallans };
      setCurrentVehicle(updatedVehicle);
      onUpdate(updatedVehicle);
      setMessage('✓ Challan penalty marked as settled and cleared.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        @media (max-width: 640px) {
          .papers-modal-grid-2,
          .papers-modal-grid-3 {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
      <div className="modal-content" style={{ maxWidth: '680px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-mono)' }}>
                  {currentVehicle.vehicle_number}
                </h3>
                <span style={{ fontSize: '0.74rem', padding: '1px 8px', borderRadius: 'var(--radius-full)', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  {currentVehicle.model}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Vehicle Compliance, Official RC/PUC Papers & Traffic Challans
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-subtle" onClick={onClose} style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            padding: '0 16px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('papers');
              setIsAddingDoc(false);
            }}
            style={{
              padding: '10px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'papers' ? '2px solid var(--accent-whatsapp)' : '2px solid transparent',
              color: activeTab === 'papers' ? 'var(--accent-whatsapp)' : 'var(--text-muted)'
            }}
          >
            📋 Official Vehicle Papers ({docs.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('challans');
              setIsAddingChallan(false);
            }}
            style={{
              padding: '10px 16px',
              fontSize: '0.84rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'challans' ? '2px solid var(--status-delayed)' : '2px solid transparent',
              color: activeTab === 'challans' ? 'var(--status-delayed)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚠️ Traffic Challans ({challans.length})</span>
            {pendingChallans.length > 0 && (
              <span style={{ fontSize: '0.66rem', padding: '1px 6px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--status-danger)', color: '#ffffff', fontWeight: 800 }}>
                {pendingChallans.length} DUE
              </span>
            )}
          </button>
        </div>

        {/* Status Toast */}
        {message && (
          <div style={{ margin: '12px 16px 0', padding: '8px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(37, 211, 102, 0.12)', border: '1px solid rgba(37, 211, 102, 0.3)', color: 'var(--accent-whatsapp)', fontSize: '0.8rem', fontWeight: 600 }}>
            {message}
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
          {/* =========================================================
              TAB 1: OFFICIAL VEHICLE PAPERS
              ========================================================= */}
          {activeTab === 'papers' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Registered transport certificates and statutory fitness records.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddingDoc(!isAddingDoc)}
                  style={{ gap: '4px', fontSize: '0.76rem' }}
                >
                  <Plus size={13} />
                  <span>{isAddingDoc ? 'Cancel' : 'Add / Renew Paper'}</span>
                </button>
              </div>

              {/* Add / Renew Form */}
              {isAddingDoc && (
                <form
                  onSubmit={handleSaveDoc}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--accent-whatsapp)' }}>
                    Add or Renew Official Vehicle Certificate
                  </div>
                  <div className="papers-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Certificate Category</label>
                      <SearchableDropdown
                        value={docType}
                        onChange={(value) => {
                          const nextType = value as VehicleDocument['type'];
                          setDocType(nextType);
                          setDocTitle(nextType === 'RC' ? 'Registration Certificate' : nextType === 'INSURANCE' ? 'Motor Insurance Policy' : nextType === 'FITNESS' ? 'Fitness Certificate' : nextType === 'PUC' ? 'Pollution Under Control Certificate' : nextType === 'PERMIT' ? 'National / State Permit' : 'Other Compliance Document');
                        }}
                        options={[
                          { value: 'FITNESS', label: 'Fitness Certificate' },
                          { value: 'INSURANCE', label: 'Insurance Policy' },
                          { value: 'OTHER', label: 'Other Compliance Paper' },
                          { value: 'PERMIT', label: 'National/State Permit' },
                          { value: 'PUC', label: 'Pollution (PUC)' },
                          { value: 'RC', label: 'Registration Certificate (RC)' }
                        ]}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Certificate Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g. ICICI Commercial Insurance"
                      />
                    </div>
                  </div>

                  <div className="papers-modal-grid-3" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Certificate / Policy #</label>
                      <input
                        type="text"
                        className="form-input"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        placeholder="e.g. POL-994821"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Issue Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={docIssue}
                        onChange={(e) => setDocIssue(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Expiry Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={docExpiry}
                        onChange={(e) => setDocExpiry(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem' }}>Authority / Policy Notes</label>
                    <input
                      type="text"
                      className="form-input"
                      value={docNotes}
                      onChange={(e) => setDocNotes(e.target.value)}
                      placeholder="e.g. Burari RTO inspected, BS-VI diesel compliant"
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem' }}>Attach Scanned Document / Certificate (PDF / Image)</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px dashed var(--border-default)',
                          backgroundColor: 'var(--bg-primary)',
                          fontSize: '0.76rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          color: docFile ? 'var(--accent-whatsapp)' : 'var(--text-muted)'
                        }}
                      >
                        <Upload size={14} />
                        <span>{docFile ? docFile.name : 'Upload PDF / Scan file (Max 10MB)'}</span>
                      </button>
                      {docFile && (
                        <button
                          type="button"
                          onClick={() => setDocFile(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--status-danger)',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingDoc(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Paper Record'}
                    </button>
                  </div>
                </form>
              )}

              {/* Papers List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {docs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No vehicle documents registered yet. Click "Add / Renew Paper" to record RC, Insurance, or PUC.
                  </div>
                ) : (
                  docs.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Shield size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                              {d.title}
                            </span>
                            <span
                              className={`paper-status-badge ${
                                d.status === 'VALID' ? 'valid' : d.status === 'EXPIRING_SOON' ? 'warning' : 'expired'
                              }`}
                            >
                              {d.status === 'VALID' ? '✓ VALID' : d.status === 'EXPIRING_SOON' ? '⚠️ RENEW SOON' : 'EXPIRED'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span>No: <b style={{ fontFamily: 'var(--font-mono)' }}>{d.document_number}</b></span>
                            <span>Expires: <b>{d.expiry_date}</b></span>
                            {d.notes && <span>• {d.notes}</span>}
                            {d.file_name && <span>• 📎 {d.file_name}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreviewDoc(d)}
                        style={{ padding: '4px 10px', fontSize: '0.74rem', gap: '4px' }}
                      >
                        <Eye size={12} />
                        <span>View Proof</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* =========================================================
              TAB 2: TRAFFIC CHALLANS & PENALTIES
              ========================================================= */}
          {activeTab === 'challans' && (
            <>
              {/* Challan Metrics Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px'
                }}
              >
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Challans</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '2px' }}>{challans.length} Recorded</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: pendingChallans.length > 0 ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-secondary)', border: pendingChallans.length > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: pendingChallans.length > 0 ? 'var(--status-danger)' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Pending Fine Amount
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: pendingChallans.length > 0 ? 'var(--status-danger)' : 'var(--text-primary)', marginTop: '2px' }}>
                    ₹{totalPendingFine.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Official transport police traffic challans and municipal infractions.
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsAddingChallan(!isAddingChallan)}
                  style={{ gap: '4px', fontSize: '0.76rem' }}
                >
                  <Plus size={13} />
                  <span>{isAddingChallan ? 'Cancel' : 'Log New Challan'}</span>
                </button>
              </div>

              {/* Add Challan Form */}
              {isAddingChallan && (
                <form
                  onSubmit={handleSaveChallan}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--status-delayed)' }}>
                    Log Commercial Traffic Challan
                  </div>
                  <div className="papers-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Challan / Notice #</label>
                      <input
                        type="text"
                        className="form-input"
                        value={challanNumber}
                        onChange={(e) => setChallanNumber(e.target.value)}
                        placeholder="e.g. CH-DL-2026-0042"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Fine Amount (₹)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={challanAmount}
                        onChange={(e) => setChallanAmount(Number(e.target.value))}
                        min="100"
                        step="100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem' }}>Violation Reason / Offense</label>
                    <input
                      type="text"
                      className="form-input"
                      value={challanReason}
                      onChange={(e) => setChallanReason(e.target.value)}
                      placeholder="e.g. Over-speeding > 60 km/h on NH-24"
                      required
                    />
                  </div>

                  <div className="papers-modal-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Violation Location</label>
                      <input
                        type="text"
                        className="form-input"
                        value={challanLocation}
                        onChange={(e) => setChallanLocation(e.target.value)}
                        placeholder="e.g. Ring Road Lajpat Nagar Overpass"
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.74rem' }}>Date Issued</label>
                      <input
                        type="date"
                        className="form-input"
                        value={challanDate}
                        onChange={(e) => setChallanDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Upload Challan Proof Document / Scan */}
                  <div>
                    <label className="form-label" style={{ fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Attach Challan Notice Slip / Penalty Receipt Proof (Image or PDF)</span>
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Optional • Max 10MB</span>
                    </label>
                    <input
                      ref={challanFileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleChallanFileChange}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => challanFileInputRef.current?.click()}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: challanProofFile ? '1px solid var(--accent-whatsapp)' : '1px dashed var(--border-default)',
                          backgroundColor: challanProofFile ? 'rgba(37, 211, 102, 0.08)' : 'var(--bg-primary)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          color: challanProofFile ? 'var(--accent-whatsapp)' : 'var(--text-primary)',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <Upload size={14} />
                        <span>{challanProofFile ? challanProofFile.name : 'Upload Notice / Slip File (JPG, PNG, PDF)'}</span>
                      </button>

                      {challanProofFile && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            ({(challanProofFile.size / 1024).toFixed(0)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() => setChallanProofFile(null)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--status-danger)',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              padding: '2px 6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <X size={12} /> Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {challanProofFile && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {challanProofFile.url.startsWith('data:image/') ? (
                          <img
                            src={challanProofFile.url}
                            alt="Challan Proof Preview"
                            style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
                          />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                            <FileText size={22} />
                          </div>
                        )}
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                          ✓ Notice document scan attached. Will be archived on vehicle compliance record.
                        </span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingChallan(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                      {saving ? 'Logging...' : 'Record Challan'}
                    </button>
                  </div>
                </form>
              )}

              {/* Challans List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {challans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ✨ Clean Compliance Record: 0 traffic challans reported for this vehicle.
                  </div>
                ) : (
                  challans.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: c.status === 'PENDING' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.86rem' }}>
                            {c.challan_number}
                          </span>
                          <span className={`challan-pill ${c.status === 'PENDING' ? 'pending' : 'paid'}`}>
                            {c.status === 'PENDING' ? '● PENDING PAYMENT' : '✓ SETTLED / PAID'}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: c.status === 'PENDING' ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                            ₹{c.amount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)', margin: '3px 0' }}>
                          {c.violation_reason}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <span>📍 {c.location || 'Delhi-NCR'}</span>
                          <span>📅 {c.date}</span>
                          {c.receipt_number && <span>• Receipt: <b>{c.receipt_number}</b></span>}
                          {c.proof_name && <span>• 📎 <b>{c.proof_name}</b></span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {c.proof_url ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setPreviewChallan(c)}
                            style={{ padding: '5px 10px', fontSize: '0.74rem', gap: '4px' }}
                          >
                            <Eye size={12} />
                            <span>View Proof</span>
                          </button>
                        ) : (
                          <label style={{ margin: 0, cursor: 'pointer' }}>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAttachProofToExisting(c.id, f);
                              }}
                            />
                            <span
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '5px 10px', fontSize: '0.74rem', gap: '4px', borderStyle: 'dashed' }}
                              title="Attach scanned notice slip or receipt photo"
                            >
                              <Upload size={12} />
                              <span>Upload Proof</span>
                            </span>
                          </label>
                        )}

                        {c.status === 'PENDING' && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSettleChallan(c.id)}
                            style={{
                              backgroundColor: 'var(--accent-whatsapp)',
                              borderColor: 'var(--accent-whatsapp)',
                              color: '#0b141a',
                              fontWeight: 700,
                              padding: '5px 12px',
                              fontSize: '0.76rem',
                              gap: '4px'
                            }}
                          >
                            <CreditCard size={13} />
                            <span>Settle & Pay Fine</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* Proof Preview Sub-Modal */}
      {previewDoc && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.8)' }}
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '520px', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{previewDoc.title}</div>
              <button type="button" className="btn btn-subtle" onClick={() => setPreviewDoc(null)}>
                <X size={16} />
              </button>
            </div>
            {/* SVG Certificate Card */}
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                border: '2px solid var(--accent-whatsapp)',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>GOVERNMENT OF NCT OF DELHI</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>TRANSPORT DEPARTMENT (COMMERCIAL WING)</div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>✓ VERIFIED DIGITAL RECORD</div>
              </div>
              <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div>VEHICLE REGISTRATION: <b style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{currentVehicle.vehicle_number}</b></div>
                <div>DOCUMENT TYPE: <b>{previewDoc.title}</b></div>
                <div>DOCUMENT NUMBER: <b style={{ fontFamily: 'monospace' }}>{previewDoc.document_number}</b></div>
                <div>VALIDITY PERIOD: <b>{previewDoc.issue_date} &rarr; {previewDoc.expiry_date}</b></div>
                <div>FLEET ASSET: <b>{currentVehicle.model}</b></div>
                {previewDoc.notes && <div style={{ color: '#94a3b8' }}>REMARKS: {previewDoc.notes}</div>}
              </div>
              <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>FleetTracker Fleet Compliance Vault</span>
                <span>Audit Ref: #{previewDoc.id}</span>
              </div>
            </div>

            {previewDoc.file_url && (
              <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Uploaded Proof Document {previewDoc.file_name ? `(${previewDoc.file_name})` : ''}</span>
                  <a
                    href={previewDoc.file_url}
                    download={previewDoc.file_name || 'vehicle-document'}
                    style={{ color: 'var(--accent-whatsapp)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
                {previewDoc.file_url.startsWith('data:image/') ? (
                  <img
                    src={previewDoc.file_url}
                    alt="Document Proof"
                    style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                    <FileText size={24} color="var(--accent-whatsapp)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{previewDoc.file_name || 'Scanned Document (PDF)'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click download to view original file</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewDoc(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challan Notice / Proof Preview Sub-Modal */}
      {previewChallan && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100, backgroundColor: 'rgba(0,0,0,0.82)' }}
          onClick={() => setPreviewChallan(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '560px', padding: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Traffic Challan Record</div>
                <span className={`challan-pill ${previewChallan.status === 'PENDING' ? 'pending' : 'paid'}`}>
                  {previewChallan.status === 'PENDING' ? '● PENDING PAYMENT' : '✓ SETTLED'}
                </span>
              </div>
              <button type="button" className="btn btn-subtle" onClick={() => setPreviewChallan(null)}>
                <X size={16} />
              </button>
            </div>

            {/* Verification Card */}
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                border: previewChallan.status === 'PENDING' ? '2px solid rgba(239, 68, 68, 0.7)' : '2px solid var(--accent-whatsapp)',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                    OFFICIAL TRANSPORT POLICE / E-CHALLAN PORTAL
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800 }}>COMMERCIAL PENALTY AUDIT RECORD</div>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: previewChallan.status === 'PENDING' ? '#ef4444' : '#10b981' }}>
                  ₹{previewChallan.amount.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ margin: '14px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div>CHALLAN / NOTICE #: <b style={{ color: '#f59e0b', fontFamily: 'monospace' }}>{previewChallan.challan_number}</b></div>
                <div>VEHICLE REGISTRATION: <b style={{ fontFamily: 'monospace' }}>{currentVehicle.vehicle_number}</b> ({currentVehicle.model})</div>
                <div>OFFENSE / VIOLATION: <b>{previewChallan.violation_reason}</b></div>
                <div>LOCATION RECORDED: <b>{previewChallan.location || 'Delhi Commercial Freight Corridor'}</b></div>
                <div>DATE OF NOTICE: <b>{previewChallan.date}</b></div>
                {previewChallan.receipt_number && (
                  <div style={{ color: '#10b981' }}>
                    SETTLEMENT RECEIPT: <b>{previewChallan.receipt_number}</b> (Paid: {previewChallan.payment_date || 'Yes'})
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #334155', paddingTop: '10px', fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>TruckTracker Compliance Vault</span>
                <span>Challan ID: #{previewChallan.id}</span>
              </div>
            </div>

            {/* Uploaded Notice Slip / Proof Section */}
            {previewChallan.proof_url ? (
              <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={14} color="var(--accent-whatsapp)" />
                    <span>Uploaded Proof Document {previewChallan.proof_name ? `(${previewChallan.proof_name})` : ''}</span>
                  </span>
                  <a
                    href={previewChallan.proof_url}
                    download={previewChallan.proof_name || `challan-${previewChallan.challan_number}.png`}
                    style={{ color: 'var(--accent-whatsapp)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                  >
                    <Download size={13} /> Download Proof
                  </a>
                </div>

                {previewChallan.proof_url.startsWith('data:image/') ? (
                  <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', backgroundColor: '#090d16' }}>
                    <img
                      src={previewChallan.proof_url}
                      alt="Challan Proof Document"
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)' }}>
                    <FileText size={28} color="var(--accent-whatsapp)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{previewChallan.proof_name || 'Official Challan Slip (PDF)'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click download to view original PDF scan</div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '14px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-default)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  No physical scan or receipt photo attached to this challan yet.
                </div>
                <label style={{ cursor: 'pointer', margin: 0 }}>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f && previewChallan) {
                        handleAttachProofToExisting(previewChallan.id, f);
                        setPreviewChallan(null);
                      }
                    }}
                  />
                  <span className="btn btn-secondary btn-sm" style={{ gap: '6px', fontSize: '0.76rem', display: 'inline-flex' }}>
                    <Upload size={13} />
                    <span>Upload Proof Now</span>
                  </span>
                </label>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {previewChallan.status === 'PENDING' && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      handleSettleChallan(previewChallan.id);
                      setPreviewChallan(null);
                    }}
                    style={{
                      backgroundColor: 'var(--accent-whatsapp)',
                      borderColor: 'var(--accent-whatsapp)',
                      color: '#0b141a',
                      fontWeight: 700,
                      gap: '6px'
                    }}
                  >
                    <CreditCard size={13} />
                    <span>Settle & Pay Fine (₹{previewChallan.amount.toLocaleString('en-IN')})</span>
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreviewChallan(null)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
