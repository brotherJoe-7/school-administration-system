import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ROLES = [
  { key: 'admin', label: 'Admin', icon: '' },
  { key: 'teacher', label: 'Teacher', icon: '' },
  { key: 'student', label: 'Student', icon: '' },
];

const DEMO_CREDENTIALS = {
  admin:   { email: 'admin@schooladmin.edu',     password: 'Admin@123' },
  teacher: { email: 'i.koroma@schooladmin.edu',  password: 'Teacher@123' },
  student: { email: 'a.sesay@student.schooladmin.edu', password: 'Student@123' },
};

export default function LoginPage() {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const fillDemo = () => {
    const creds = DEMO_CREDENTIALS[role];
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password, role);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div>
            <h1>School Administration System</h1>
            <p>Institutional Portal</p>
          </div>
        </div>

        <div className="role-tabs">
          {ROLES.map((r) => (
            <button
              key={r.key}
              className={`role-tab ${role === r.key ? 'active' : ''}`}
              onClick={() => { setRole(r.key); setEmail(''); setPassword(''); }}
              type="button"
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                  fontSize: '18px',
                  padding: '0'
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button className="btn btn-primary btn-lg w-full" type="submit" disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</>
            ) : (
              `Sign In as ${ROLES.find(r => r.key === role)?.label}`
            )}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '16px', background: 'var(--color-bg-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Demo Credentials
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--color-gold)' }}>Current role: {role}</strong><br/>
            Email: <code style={{ color: 'var(--color-text-primary)' }}>{DEMO_CREDENTIALS[role].email}</code><br/>
            Password: <code style={{ color: 'var(--color-text-primary)' }}>{DEMO_CREDENTIALS[role].password}</code>
          </p>
          <button className="btn btn-secondary btn-sm w-full" type="button" onClick={fillDemo}>
            Fill Demo Credentials
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '20px' }}>
          Protected by JWT authentication · GDPR compliant
        </p>
      </div>
    </div>
  );
}
