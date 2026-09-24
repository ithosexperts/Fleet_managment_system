import React, { useState } from 'react';
import { ArrowRight, Lock, Mail, Smartphone, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';
import { ThemeToggle } from '../components/ThemeToggle';
import { HoseXpertsLogo } from '../components/common/HoseXpertsLogo';

interface Props {
  onLoginSuccess: (user: User, token: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, theme = 'dark', onToggleTheme }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail: string, loginPass: string) => {
    if (!loginEmail.trim() || !loginPass) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.auth.login({ email: loginEmail.trim(), password: loginPass });
      localStorage.setItem('truck_tracker_token', data.token);
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(email, password);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative'
      }}
      className="login-container-responsive"
    >
      {onToggleTheme && (
        <div className="login-theme-toggle" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} showLabel />
        </div>
      )}

      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px' }}>
          <HoseXpertsLogo variant={theme === 'dark' ? 'white' : 'blue'} height={46} showTagline={true} />
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Enterprise Fleet Dispatch & Logistics Terminal
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--status-danger-bg)',
              border: '1px solid var(--status-danger-border)',
              color: 'var(--status-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              <Mail size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Corporate Email or Phone
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. driver@hosexperts.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              style={{ fontSize: '0.92rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
              <Lock size={12} style={{ display: 'inline', marginRight: '6px' }} />
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ fontSize: '0.92rem', paddingRight: '40px', width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            style={{ width: '100%', marginTop: '6px', fontSize: '0.94rem', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Terminal'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Security & Direct APK Link */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={14} color="var(--accent-primary)" />
            <span>Encrypted HoseXperts Logistics Authentication</span>
          </div>

          {/* Android Mobile App Direct APK Link */}
          <div style={{ textAlign: 'center' }}>
            <a
              href="https://github.com/ithosexperts/Fleet_managment_system/releases/download/v1.1.0/TruckTracker-Driver-v1.1.0-debug.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-subtle"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.76rem',
                color: 'var(--text-secondary)',
                width: '100%',
                justifyContent: 'center',
                padding: '6px'
              }}
            >
              <Smartphone size={13} />
              <span>Download Native Android Driver App (APK v1.1.0)</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 480px) {
          .login-container-responsive {
            padding: calc(46px + env(safe-area-inset-top, 12px)) 14px calc(24px + env(safe-area-inset-bottom, 12px)) !important;
            align-items: flex-start !important;
          }
          .login-theme-toggle {
            top: max(12px, env(safe-area-inset-top, 12px)) !important;
            right: 14px !important;
          }
          .card {
            padding: 22px 18px !important;
            border-radius: var(--radius-lg) !important;
          }
        }
      `}</style>
    </div>
  );
};
