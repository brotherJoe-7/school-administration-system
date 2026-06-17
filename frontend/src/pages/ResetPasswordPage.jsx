import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const token = query.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      await API.post('/auth/reset-password', { token, newPassword: password });
      toast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center', margin: '40px 0' }}>
          <p style={{ color: 'var(--color-danger)', marginBottom: '30px' }}>
            Missing reset token. Please request a new password reset link.
          </p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div>
            <h1>Reset Password</h1>
            <p>Enter your new secure password</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="At least 8 characters" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input 
            type="password" 
            className="form-input" 
            placeholder="Re-enter new password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }} 
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      </div>
    </div>
  );
}
