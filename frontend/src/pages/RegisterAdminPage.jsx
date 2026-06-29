import React, { useState, useEffect } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function RegisterAdminPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    school_name: '',
  });
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  useEffect(() => {
    // Load existing admins
    API.get('/superadmin/admins')
      .then(r => setAdmins(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingAdmins(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/superadmin/admins', form);
      toast.success(`Admin account created for ${form.full_name}. Password: ${form.password}`);
      setForm({ full_name: '', email: '', password: '', school_name: '' });
      // Refresh list
      const r = await API.get('/superadmin/admins');
      setAdmins(r.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      await API.put(`/superadmin/admins/${id}`, { status: newStatus });
      toast.success(`Admin ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      const r = await API.get('/superadmin/admins');
      setAdmins(r.data.data || []);
    } catch {
      toast.error('Failed to update admin status');
    }
  };

  return (
    <ProtectedLayout title="Register Admin" allowedRoles={['superadmin']}>
      <div className="page-header">
        <div>
          <h1>Register School Admin</h1>
          <p>Create administrator accounts for onboarded schools</p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="card mb-20" style={{ borderLeft: '4px solid var(--color-gold)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>New Admin Account</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                required
                placeholder="e.g. John Kamara"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                required
                placeholder="admin@school.edu.sl"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Password</label>
              <input
                className="form-input"
                required
                placeholder="Set a secure password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">School Name (optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Rising Academy"
                value={form.school_name}
                onChange={e => setForm(f => ({ ...f, school_name: e.target.value }))}
              />
            </div>
          </div>
          <div style={{ background: 'var(--color-gold-muted)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', color: 'var(--color-gold)', marginBottom: '16px' }}>
            ⚠️ Share the email and initial password securely with the admin. Advise them to change their password on first login.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </div>

      {/* Admins Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Existing School Admins</h3>
        </div>
        <div className="table-wrapper">
          {loadingAdmins ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>School</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><p>No admin accounts found</p></div></td></tr>
                ) : admins.map(a => (
                  <tr key={a.id || a._id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{a.school_name || '—'}</td>
                    <td>
                      <span className={`badge badge-${a.status === 'active' ? 'success' : 'danger'}`}>{a.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSuspend(a.id || a._id, a.status)}
                      >
                        {a.status === 'inactive' ? 'Activate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
