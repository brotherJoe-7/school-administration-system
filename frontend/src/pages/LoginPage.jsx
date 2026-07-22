import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'superadmin') {
        navigate('/platform');
      } else if (user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, authLoading, navigate]);

  const [forgotMode, setForgotMode] = useState(false);
  const [role, setRole] = useState('student');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (forgotMode) {
      try {
        const { data } = await API.post('/auth/forgot-password', { email, role });
        toast.success(data.message || 'If the email exists, a reset link will be sent.');
        setForgotMode(false);
      } catch (err) {
        toast.error('Failed to send reset link.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      if (user.role === 'superadmin') {
        navigate('/platform');
      } else if (user.role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Left Column: System Information */}
      <div className="login-left" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '24px', textAlign: 'left', maxWidth: '400px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
            <span style={{ fontSize: '36px', fontWeight: '800', color: 'var(--color-bg-primary)' }}>SA</span>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-0.5px', color: 'var(--color-text-primary)' }}>School SaaS</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '18px', lineHeight: '1.6' }}>
            Empowering education through a secure, seamless, and integrated platform.
          </p>
          <ul style={{ color: 'var(--color-text-secondary)', fontSize: '16px', lineHeight: '1.8', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            <li><strong>Student Management:</strong> Track enrollment, attendance, and performance seamlessly.</li>
            <li><strong>Financial Tracking:</strong> Automate fee collection and generate instant financial reports.</li>
            <li><strong>Grading System:</strong> Simplify assessments and report card generation.</li>
            <li><strong>Real-time Analytics:</strong> Make data-driven decisions with dynamic dashboards.</li>
          </ul>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="login-right" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div className="login-card" style={{ width: '100%', maxWidth: '440px', padding: '40px', background: 'var(--color-bg-card)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--color-border)' }}>
          <div className="login-logo" style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', color: 'var(--color-text-primary)' }}>Sign in</h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '8px' }}>Use your portal account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-group">
              <input
                className="form-input"
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ background: 'var(--color-bg-primary)' }}
              />
            </div>

            {!forgotMode && (
              <div className="form-group">
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!forgotMode}
                    style={{ paddingRight: '40px', background: 'var(--color-bg-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {forgotMode && (
              <div className="form-group">
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)} style={{ background: 'var(--color-bg-primary)' }}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: 'var(--color-bg-primary)', borderTopColor: 'var(--color-text-primary)' }} />
                ) : (
                  forgotMode ? 'Send Reset Link' : 'Next'
                )}
              </button>
              
              {!forgotMode && (
                <button type="button" onClick={() => setForgotMode(true)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '14px', cursor: 'pointer', padding: 0, textAlign: 'center', marginTop: '4px' }}>
                  Forgot password?
                </button>
              )}
              {forgotMode && (
                <button type="button" onClick={() => setForgotMode(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '14px', cursor: 'pointer', padding: 0, textAlign: 'center', marginTop: '4px' }}>
                  Back to Login
                </button>
              )}

              {!forgotMode && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '16px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>or continue with</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  </div>
                  
                  <button type="button" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Login with Google
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.15 0c-1.35 0-2.84.62-3.83 1.63-.8.8-1.34 1.94-1.34 3.05 1.48.06 2.92-.61 3.86-1.57.81-.82 1.34-1.93 1.31-3.11zM11.97 4.98c-2.43 0-4.32 1.55-5.32 1.55-1.02 0-2.61-1.41-4.47-1.41-2.4 0-4.63 1.41-5.88 3.59-2.52 4.41-.65 10.96 1.83 14.52 1.2 1.74 2.61 3.73 4.54 3.73 1.86 0 2.53-1.14 4.82-1.14 2.27 0 2.87 1.14 4.8 1.14 2.02 0 3.26-1.87 4.41-3.55 1.34-1.95 1.89-3.84 1.92-3.93-.04-.02-3.69-1.42-3.69-5.69 0-3.57 2.92-5.28 3.05-5.36-1.68-2.46-4.28-2.79-5.21-2.84-2.22-.22-4.46 1.39-5.8 1.39z"/>
                    </svg>
                    Login with Apple
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
