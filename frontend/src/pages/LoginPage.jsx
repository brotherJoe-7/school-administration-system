import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const FEATURES = [
  { icon: '🎓', title: 'Student Management', desc: 'Track enrollment, attendance & performance across classes.' },
  { icon: '💰', title: 'Financial Tracking', desc: 'Automate fee collection and generate instant financial reports.' },
  { icon: '📊', title: 'Real-time Analytics', desc: 'Data-driven dashboards for smarter institutional decisions.' },
  { icon: '🤖', title: 'AI-Powered Insights', desc: 'Gemini AI summarizes your school data automatically.' },
];

const STATS = [
  { value: '2,400+', label: 'Students Tracked' },
  { value: '98%', label: 'Uptime SLA' },
  { value: '40+', label: 'Schools' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [role, setRole] = useState('student');
  const [focusedField, setFocusedField] = useState(null);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'superadmin') navigate('/platform');
      else if (user.role === 'parent') navigate('/parent-dashboard');
      else navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (forgotMode) {
      try {
        const { data } = await API.post('/auth/forgot-password', { email, role });
        toast.success(data.message || 'If the email exists, a reset link will be sent.');
        setForgotMode(false);
      } catch {
        toast.error('Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const loggedInUser = await login(email, password);
      toast.success(`Welcome back, ${loggedInUser.name.split(' ')[0]}!`);
      if (loggedInUser.role === 'superadmin') navigate('/platform');
      else if (loggedInUser.role === 'parent') navigate('/parent-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 16px',
    background: focusedField === field
      ? 'var(--color-bg-primary)'
      : 'var(--color-bg-hover)',
    border: `1.5px solid ${focusedField === field ? 'var(--color-gold)' : 'var(--color-border)'}`,
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: focusedField === field ? '0 0 0 3px var(--color-gold-muted)' : 'none',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>

      {/* ── LEFT PANEL ─────────────────────────────────── */}
      <div style={{
        flex: '0 0 48%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative accent ring */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: '320px', height: '320px',
          borderRadius: '50%',
          border: '1px solid var(--color-gold-muted)',
          opacity: 0.4,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-120px', left: '-60px',
          width: '400px', height: '400px',
          borderRadius: '50%',
          border: '1px solid var(--color-gold-muted)',
          opacity: 0.25,
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'var(--color-gold)',
            borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: '20px', color: 'var(--color-bg-primary)' }}>SA</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '16px', color: 'var(--color-text-primary)' }}>School SaaS</div>
            <div style={{ fontSize: '11px', color: 'var(--color-gold)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Administration Platform</div>
          </div>
        </div>

        {/* Main Hero Copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '28px', paddingTop: '32px', paddingBottom: '32px' }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: 'var(--color-gold-muted)',
              border: '1px solid rgba(245,158,11,0.3)',
              color: 'var(--color-gold)',
              fontSize: '11px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '999px',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              marginBottom: '16px',
            }}>
              Trusted by schools across Sierra Leone
            </div>
            <h1 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 900,
              color: 'var(--color-text-primary)',
              lineHeight: 1.15,
              letterSpacing: '-0.5px',
              margin: 0,
            }}>
              Manage your school<br />
              <span style={{ color: 'var(--color-gold)' }}>smarter, not harder.</span>
            </h1>
            <p style={{
              marginTop: '16px',
              color: 'var(--color-text-muted)',
              fontSize: '16px',
              lineHeight: 1.7,
              maxWidth: '380px',
            }}>
              One unified platform for student records, finances, grading, attendance, and AI-powered analytics.
            </p>
          </div>

          {/* Feature List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{
                  width: '38px', height: '38px', flexShrink: 0,
                  background: 'var(--color-bg-hover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px',
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text-primary)' }}>{f.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'flex', gap: '0',
          borderTop: '1px solid var(--color-border)',
          paddingTop: '24px',
        }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              paddingRight: i < STATS.length - 1 ? '20px' : 0,
              borderRight: i < STATS.length - 1 ? '1px solid var(--color-border)' : 'none',
              marginRight: i < STATS.length - 1 ? '20px' : 0,
            }}>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: '22px', color: 'var(--color-gold)' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL: LOGIN FORM ─────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--color-bg-primary)',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Header */}
          <div style={{ marginBottom: '36px' }}>
            {forgotMode ? (
              <>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Reset password</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px' }}>
                  Enter your email and we'll send you a reset link.
                </p>
              </>
            ) : (
              <>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Sign in</h2>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '15px' }}>
                  Welcome back. Enter your portal credentials.
                </p>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@school.edu.sl"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
                autoComplete="email"
                style={inputStyle('email')}
              />
            </div>

            {/* Password */}
            {!forgotMode && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    autoComplete="current-password"
                    style={{ ...inputStyle('password'), paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)', padding: 0,
                      display: 'flex', alignItems: 'center',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Role selector (forgot password only) */}
            {forgotMode && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                  Your Role
                </label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  onFocus={() => setFocusedField('role')}
                  onBlur={() => setFocusedField(null)}
                  style={{ ...inputStyle('role'), appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            {/* Forgot password link */}
            {!forgotMode && (
              <div style={{ textAlign: 'right', marginTop: '-6px' }}>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-gold)', fontSize: '13px', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? 'var(--color-gold-dark)' : 'var(--color-gold)',
                color: 'var(--color-bg-primary)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 16px var(--color-gold-muted)',
                marginTop: '8px',
              }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderColor: 'rgba(0,0,0,0.2)', borderTopColor: 'var(--color-bg-primary)' }} />
                  {forgotMode ? 'Sending...' : 'Signing in...'}
                </>
              ) : (
                forgotMode ? 'Send Reset Link' : 'Sign In →'
              )}
            </button>

            {/* Back to login */}
            {forgotMode && (
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '14px', cursor: 'pointer', padding: 0, textAlign: 'center', marginTop: '4px' }}
              >
                ← Back to login
              </button>
            )}

            {/* Divider + Social */}
            {!forgotMode && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 4px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
                    or sign in with
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px', fontWeight: 600 }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '14px', fontWeight: 600 }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11"/>
                    </svg>
                    Apple
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Footer Trust Badge */}
          <div style={{
            marginTop: '32px',
            padding: '14px 16px',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{ color: 'var(--color-success)', fontSize: '18px', flexShrink: 0 }}>🔒</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)' }}>Secured by JWT + bcrypt</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Your credentials are encrypted end-to-end. We never store plain-text passwords.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: hide left panel */}
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
