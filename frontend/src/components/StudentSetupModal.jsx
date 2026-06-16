import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function StudentSetupModal() {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', confirm_password: '', consent_gdpr: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (!form.consent_gdpr) {
      toast.error('You must provide GDPR consent to proceed.');
      return;
    }

    setLoading(true);
    try {
      await API.put('/students/complete-setup', form);
      toast.success('Profile setup complete! Please log in with your new credentials.');
      logout();
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, background: 'rgba(0,0,0,0.85)' }}>
      <div className="modal-box" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Complete Your Profile</h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Welcome! Please set up your personal information and password to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" placeholder="Your personal email address" required value={form.email} onChange={e => set('email', e.target.value)} />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>This will be your username for login.</small>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" required value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Confirm Password *</label>
            <input className="form-input" type="password" required value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} />
          </div>

          <div style={{ background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" required checked={form.consent_gdpr} onChange={e => set('consent_gdpr', e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: '#000' }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>I consent to Data Processing (GDPR) *</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5, display: 'block' }}>
                  I agree to the secure collection of my educational data for administrative purposes in compliance with data protection laws.
                </span>
              </div>
            </label>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Saving Profile...' : 'Save Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
