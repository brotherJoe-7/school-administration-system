import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function TeachersPage() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ first_name:'', last_name:'', email:'', phone:'', department:'', specialization:'' });

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/teachers?search=${search}&limit=20`);
      setTeachers(data.data || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/teachers', form);
      toast.success('Teacher created. Default password: Teacher@123');
      setShowModal(false);
      setForm({ first_name:'', last_name:'', email:'', phone:'', department:'', specialization:'' });
      fetchTeachers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSuspend = async (id, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await API.put(`/teachers/${id}`, { status: newStatus });
      toast.success(`Teacher ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchTeachers();
    } catch {
      toast.error('Failed to update teacher status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this teacher?')) return;
    try {
      await API.delete(`/teachers/${id}`);
      toast.success('Teacher deleted');
      fetchTeachers();
    } catch {
      toast.error('Failed to delete teacher');
    }
  };

  return (
    <ProtectedLayout title="Teachers" allowedRoles={['admin']}>
      <div className="page-header">
        <div><h1>Teachers</h1><p>{total} staff members</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Teacher</button>
      </div>

      <div className="card mb-20" style={{padding:'14px 20px'}}>
        <div className="form-group">
          <label className="form-label">Search</label>
          <input className="form-input" placeholder="Name or email..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="data-table">
              <thead><tr><th>Teacher Number</th><th>Name</th><th>Email</th><th>Department</th><th>Specialization</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {teachers.length === 0 ? (
                  <tr><td colSpan={6}><div className="empty-state"><p>No teachers found</p></div></td></tr>
                ) : teachers.map(t => (
                  <tr key={t.id}>
                    <td><code style={{color:'var(--color-gold)',fontSize:'12px'}}>{t.teacher_number}</code></td>
                    <td style={{color:'#fff',fontWeight:600}}>{t.first_name} {t.last_name}</td>
                    <td>{t.email}</td>
                    <td>{t.department}</td>
                    <td style={{fontSize:'13px',color:'var(--color-text-muted)'}}>{t.specialization}</td>
                    <td><span className={`badge badge-${t.status==='active'?'success':(t.status==='suspended'?'danger':'warning')}`}>{t.status}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleSuspend(t.id, t.status)}>
                          {t.status === 'suspended' ? 'Activate' : 'Suspend'}
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(t.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={()=>setShowModal(false)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Teacher</h3>
              <button className="btn btn-secondary btn-sm" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" required value={form.first_name}
                      onChange={e=>setForm(f=>({...f,first_name:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" required value={form.last_name}
                      onChange={e=>setForm(f=>({...f,last_name:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" required value={form.email}
                      onChange={e=>setForm(f=>({...f,email:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone}
                      onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department}
                      onChange={e=>setForm(f=>({...f,department:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <input className="form-input" value={form.specialization}
                      onChange={e=>setForm(f=>({...f,specialization:e.target.value}))} />
                  </div>
                </div>
                <div style={{background:'var(--color-gold-muted)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'var(--radius-md)',padding:'12px',fontSize:'13px',color:'var(--color-gold)'}}>
                  Default password will be <strong>Teacher@123</strong>. The teacher should change it on first login.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Teacher</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
