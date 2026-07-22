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

    <div className="login-page">
      <div className="login-left">
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="4" x2="20" y2="20"></line>
          <line x1="4" y1="20" x2="20" y2="4"></line>
        </svg>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-logo">
            <h1>Sign in</h1>
            <p>Use your portal account</p>
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
                    style={{ paddingRight: '40px' }}
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
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <button className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderColor: '#000', borderTopColor: '#fff' }} />
                ) : (
                  forgotMode ? 'Send Reset Link' : 'Next'
                )}
              </button>
              
              {!forgotMode && (
                <button type="button" onClick={() => setForgotMode(true)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', padding: 0, textAlign: 'center', marginTop: '10px' }}>
                  Forgot password?
                </button>
              )}
              {forgotMode && (
                <button type="button" onClick={() => setForgotMode(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '14px', cursor: 'pointer', padding: 0, textAlign: 'center', marginTop: '10px' }}>
                  Back to Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
