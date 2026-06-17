import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function StudentSetupPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState('');

  if (authLoading) return <div className="loading-center"><div className="spinner" /></div>;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^90500\d{3,5}$/.test(studentId)) {
      toast.error('Invalid Student ID. Must start with 90500.');
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await API.post('/auth/student-setup', { student_number: studentId });
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initiate setup');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: '#000000', border: '2px solid var(--color-border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: '20px', fontWeight: 900, color: '#fff',
          fontFamily: 'Outfit, sans-serif',
        }}>SAS</div>
        
        <h1 style={{ fontFamily: 'Outfit', fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>Student Setup</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', margin: '0 0 30px 0', lineHeight: 1.5 }}>
          Enter your 9-digit Campus ID to claim your account.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
            <label className="form-label">Student ID</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. 905000001"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              maxLength={9}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
            style={{ width: '100%' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Continue to Dashboard'}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Already set up? <a href="/login" style={{ color: 'var(--color-gold)' }}>Sign in here</a>
        </p>
      </div>
    </div>
  );
}
