import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgot-password', { email, role });
      setSubmitted(true);
      toast.success('If the email exists, a reset link will be sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center', margin: '40px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>✉️</div>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px' }}>
            We've sent a password reset link to <strong>{email}</strong>.
            Please check your inbox (and spam folder) to reset your password.
          </p>
          <Link to="/login" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Return to Login
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
            <h1>Forgot Password</h1>
            <p>Request a secure reset link</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">I am a...</label>
          <select 
            className="form-select" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
            required
          >
            <option value="">Select Role</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="Enter your registered email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '10px' }} 
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login" style={{ color: 'var(--color-gold)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            Back to Login
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}
