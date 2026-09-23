import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cloud,
  RefreshCw,
  CheckCircle2,
  Users,
  Shield,
  Smartphone,
  Server,
  Database,
  Info,
  UserPlus,
  Trash2,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  X
} from 'lucide-react';
import { api, API_BASE } from '../../services/api';
import { User } from '../../types';
import { PageHeader } from '../common/PageHeader';

interface SettingsViewProps {
  currentUser: User;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSwitchRole?: (role: 'DRIVER' | 'MANAGER') => void;
  lastUpdated?: Date;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  theme,
  onToggleTheme,
  onSwitchRole,
  lastUpdated,
  onRefresh,
  refreshing = false
}) => {
  // Team & Manager Management
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPassword, setManagerPassword] = useState('');
  const [managerPhone, setManagerPhone] = useState('+91 ');
  const [showManagerPassword, setShowManagerPassword] = useState(false);
  const [creatingManager, setCreatingManager] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamSuccess, setTeamSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const res = await api.auth.getUsers();
      if (res && res.users) {
        setTeamMembers(res.users);
      }
    } catch (e) {
      console.warn('Failed to load team members:', e);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerName.trim() || !managerEmail.trim() || !managerPassword.trim()) {
      setTeamError('Name, email, and password are required');
      return;
    }
    setCreatingManager(true);
    setTeamError(null);
    try {
      await api.auth.createUser({
        name: managerName.trim(),
        email: managerEmail.trim().toLowerCase(),
        password: managerPassword.trim(),
        phone: managerPhone.trim() || undefined,
        role: 'MANAGER'
      });
      setTeamSuccess(`Operations Manager "${managerName}" successfully provisioned.`);
      setShowAddManagerModal(false);
      setManagerName('');
      setManagerEmail('');
      setManagerPassword('manager123');
      setManagerPhone('+91 ');
      await loadTeamMembers();
    } catch (err: any) {
      setTeamError(err.message || 'Failed to create manager account');
    } finally {
      setCreatingManager(false);
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (user.id === currentUser.id) {
      alert('You cannot delete your own active session account.');
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to remove account for ${user.name} (${user.email})? They will no longer be able to log in.`);
    if (!confirmDelete) return;

    try {
      await api.auth.deleteUser(user.id);
      setTeamSuccess(`Account for ${user.name} has been removed.`);
      await loadTeamMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '900px' }}>
      {/* Enterprise Unified Header */}
      <PageHeader
        breadcrumbs={[{ label: 'System' }, { label: 'System Settings' }]}
        title="Operations & System Settings"
        subtitle="Manage team accounts, system diagnostics, and ERP configuration"
        lastUpdated={lastUpdated}
        onRefresh={onRefresh || loadTeamMembers}
        refreshing={refreshing}
      />

      {/* 1. SAP ONE Portal ERP Reference */}
      <div
        className="card-elevation-1"
        style={{
          padding: '20px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Cloud size={20} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            SAP ONE Portal ERP Integration
          </h3>
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
          TruckTracker stores SAP Business One ERP reference fields on trips and vehicles.
          Managers enter SAP shipment numbers, delivery document numbers, and cost centers when creating trips.
          These are stored alongside operational data in the fleet database.
        </p>
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.82rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}
        >
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>SAP Field: </span>
            <strong>sap_shipment_num</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(Shipment Order)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>SAP Field: </span>
            <strong>erp_delivery_doc</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(Delivery ODLN)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>SAP Field: </span>
            <strong>cost_center</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(CO Cost Center)</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>SAP Field: </span>
            <strong>fleet_unit_id</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(PM Equipment No.)</span>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          Configure <code>SAP_PORTAL_URL</code> and <code>SAP_SERVICE_LAYER_TOKEN</code> in Render environment variables to enable live bi-directional sync.
        </p>
      </div>

      {/* 2. Operations Team & Manager Access Control */}
      <div
        className="card-elevation-1"
        style={{
          padding: '20px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} color="var(--brand-primary)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Operations Team & Manager Access Control
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Provision and manage dispatch managers, supervisors, and administrative login credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setTeamError(null);
              setShowAddManagerModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
          >
            <UserPlus size={15} />
            <span>Add Operations Manager</span>
          </button>
        </div>

        {teamSuccess && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#10b981',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} />
              <span>{teamSuccess}</span>
            </div>
            <button
              type="button"
              onClick={() => setTeamSuccess(null)}
              style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loadingTeam ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              Loading operational staff roster...
            </div>
          ) : teamMembers.filter((m) => m.role === 'MANAGER').length === 0 ? (
            <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              No manager accounts found.
            </div>
          ) : (
            teamMembers
              .filter((m) => m.role === 'MANAGER')
              .map((member) => {
                const isSelf = member.id === currentUser.id;
                return (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(59, 130, 246, 0.15)',
                          color: 'var(--brand-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {member.name}
                          </span>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                fontWeight: 700
                              }}
                            >
                              YOU
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '1px 6px',
                              borderRadius: '10px',
                              backgroundColor: 'rgba(59, 130, 246, 0.15)',
                              color: 'var(--brand-primary)',
                              fontWeight: 700
                            }}
                          >
                            OPERATIONS MANAGER
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Mail size={12} />
                            {member.email}
                          </span>
                          {member.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} />
                              {member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {!isSelf && (
                        <button
                          type="button"
                          className="btn btn-subtle btn-sm"
                          onClick={() => handleDeleteUser(member)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--status-danger)',
                            padding: '4px 8px',
                            fontSize: '0.74rem'
                          }}
                          title="Remove manager account"
                        >
                          <Trash2 size={13} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Add Operations Manager Modal */}
      {showAddManagerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-primary)'
                  }}
                >
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Add Operations Manager</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                    Create login credentials for a new dispatch or operations manager
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddManagerModal(false)}
                style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateManager}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {teamError && (
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
                    <span>{teamError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Full Name <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ananya Sen"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Login Email Address <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. ananya@company.com"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      required
                    />
                    <Mail size={13} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Login Password <span style={{ color: 'var(--status-danger)' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showManagerPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="e.g. manager123"
                      value={managerPassword}
                      onChange={(e) => setManagerPassword(e.target.value)}
                      required
                      style={{ paddingRight: '32px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowManagerPassword(!showManagerPassword)}
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
                      {showManagerPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    This password will be used by the manager to log into the Operations Center.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                    Phone Number (optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98100 12345"
                      value={managerPhone}
                      onChange={(e) => setManagerPhone(e.target.value)}
                    />
                    <Phone size={13} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '12px 16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddManagerModal(false)}
                  disabled={creatingManager}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creatingManager}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {creatingManager ? <RefreshCw size={14} className="spin" /> : <UserPlus size={14} />}
                  <span>{creatingManager ? 'Creating...' : 'Create Manager Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. System Environment Diagnostics */}
      <div
        className="card-elevation-1"
        style={{
          padding: '20px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Server size={20} color="var(--brand-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            API & Telemetry Environment
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>API Endpoint Base:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', wordBreak: 'break-all' }}>{API_BASE}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Application Mode:</span>
            <span style={{ fontWeight: 700, color: '#10b981' }}>Role-Enforced Enterprise Platform</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Current Authenticated User:</span>
            <span style={{ fontWeight: 700, wordBreak: 'break-all' }}>{currentUser.name} ({currentUser.email})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Backend Enforced Role:</span>
            <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{currentUser.role}</span>
          </div>
        </div>
      </div>

      {/* 3. Testing & QA Persona Simulator */}
      {onSwitchRole && (
        <div
          className="card-elevation-1"
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Smartphone size={20} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              QA Role & View Simulator
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Switch between the pure Driver Terminal experience and the Operations Control Center to audit role isolation.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onSwitchRole('DRIVER')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
            >
              <Smartphone size={15} />
              <span>Preview Driver Terminal View</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onSwitchRole('MANAGER')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}
            >
              <Shield size={15} />
              <span>Operations Control Center View</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
