import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getAbbr, programLabel, getProgramDuration } from '../utils/programs';


const StatusBadge = ({ status }) => {
  const map = { active:'success', pending:'warning', suspended:'danger', graduated:'info' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [programsList, setProgramsList] = useState([]);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPayments, setStudentPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({ amount_paid:'', amount_due:'', payment_date:'', payment_method:'', reference:'', semester:'' });
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Parent linking and viewing
  const [parentStudent, setParentStudent] = useState(null);
  const [parentForm, setParentForm] = useState({ first_name:'', last_name:'', email:'', phone:'' });
  const [parentLoading, setParentLoading] = useState(false);
  const [parentCreated, setParentCreated] = useState(null);

  const [viewParents, setViewParents] = useState(null); // holds { student, parents: [] }
  const [loadingViewParents, setLoadingViewParents] = useState(false);

  // Transfer Student
  const [transferStudent, setTransferStudent] = useState(null);
  const [transferForm, setTransferForm] = useState({ destination: '' });
  const [transferLoading, setTransferLoading] = useState(false);

  const [idCardStudent, setIdCardStudent] = useState(null);
  const [schoolColor, setSchoolColor] = useState('#4f46e5');
  const [openMenuId, setOpenMenuId] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleWindowClick = () => setOpenMenuId(null);
    if (openMenuId) window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [openMenuId]);

  useEffect(() => {
    API.get('/classes/programs')
      .then(res => setProgramsList(res.data.data || []))
      .catch(() => setProgramsList(['BIT','BBIT','BSEM','BICT','DAT','BSc CS','BBA MIS','Diploma ICT','HND Computing']));
  }, []);

  useEffect(() => {
    API.get('/settings/tenant')
      .then(res => {
        const color = res.data?.data?.custom_theme?.primary_color;
        if (color && color !== '#000000') setSchoolColor(color);
      })
      .catch(() => {});
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, search, program, status });
      const { data } = await API.get(`/students?${params}`);
      setStudents(data.data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, [page, search, program, status]);

  const handleSuspend = async (id, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await API.put(`/students/${id}`, { status: newStatus });
      toast.success(`Student ${newStatus === 'active' ? 'activated' : 'suspended'}`);
      fetchStudents();
    } catch {
      toast.error('Failed to update student status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this student and all their records?')) return;
    try {
      await API.delete(`/students/${id}`);
      toast.success('Student deleted');
      fetchStudents();
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      await API.put(`/students/${transferStudent.id}`, { 
        status: 'transferred', 
        transfer_destination: transferForm.destination 
      });
      toast.success('Student marked as transferred');
      setTransferStudent(null);
      setTransferForm({ destination: '' });
      fetchStudents();
    } catch {
      toast.error('Failed to transfer student');
    } finally {
      setTransferLoading(false);
    }
  };

  const openPayments = async (student) => {
    setSelectedStudent(student);
    setLoadingPayments(true);
    try {
      const { data } = await API.get(`/students/${student.id}/payments`);
      setStudentPayments(data.data || []);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/students/${selectedStudent.id}/payments`, paymentForm);
      toast.success('Payment recorded successfully');
      setPaymentForm({ amount_paid:'', amount_due:'', payment_date:'', payment_method:'', reference:'', semester:'' });
      openPayments(selectedStudent); // Refresh payments
    } catch (err) {
      toast.error('Failed to record payment');
    }
  };

  const handleLinkParent = async (e) => {
    e.preventDefault();
    setParentLoading(true);
    try {
      const { data } = await API.post('/parents', { ...parentForm, student_id: parentStudent.id });
      setParentCreated({ email: parentForm.email, password: data.data?.default_password_hint || parentStudent.student_number });
      setParentForm({ first_name:'', last_name:'', email:'', phone:'' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create parent');
    } finally {
      setParentLoading(false);
    }
  };

  const closeParentModal = () => { setParentStudent(null); setParentCreated(null); };

  const handleViewParent = async (student) => {
    setLoadingViewParents(true);
    setViewParents({ student, parents: [] });
    try {
      const { data } = await API.get(`/parents/student/${student.id}`);
      setViewParents({ student, parents: data.data || [] });
    } catch (err) {
      toast.error('Failed to load parent information');
      setViewParents(null);
    } finally {
      setLoadingViewParents(false);
    }
  };

  return (
    <ProtectedLayout title="Students" allowedRoles={['admin','teacher']}>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>{total} total students in the system</p>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          {user?.role === 'admin' && (
            <>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/setup');
                  toast.success('Setup Link copied! Share this link on WhatsApp.');
                }}
              >
                Copy Setup Link
              </button>
              <Link to="/students/register" className="btn btn-primary">
                + Register New Student
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-20" style={{ padding:'16px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:'12px', alignItems:'end' }}>
          <div className="form-group">
            <label className="form-label">Search</label>
            <input className="form-input" placeholder="Name, student number, or email..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          {user?.role === 'admin' && (
            <div className="form-group">
              <label className="form-label">Program</label>
              <select className="form-select" value={program} onChange={e => { setProgram(e.target.value); setPage(1); }}>
                <option value="">All Programs</option>
                {programsList.map(p => <option key={p} value={p}>{programLabel(p)}</option>)}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <p>No students found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Student Number</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Program</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--color-bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)' }}>
                        {s.profile_picture ? (
                          <img src={s.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>N/A</span>
                        )}
                      </div>
                    </td>
                    <td><code style={{ color:'var(--color-gold)', fontSize:'12px' }}>{s.student_number}</code></td>
                    <td style={{ color:'#fff', fontWeight:600 }}>{s.first_name} {s.last_name}</td>
                    <td>{s.email}</td>
                    <td>
                      <span className="badge badge-info" title={s.program || ''}>
                        {getAbbr(s.program)}
                      </span>
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      {/* Desktop View: Horizontal Buttons */}
                      <div className="desktop-only" style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                        <Link to={`/reports/transcript/${s.id}`} className="btn btn-secondary btn-sm">Transcript</Link>
                        <button className="btn btn-secondary btn-sm" onClick={() => setIdCardStudent(s)}>ID Card</button>
                        {user?.role === 'admin' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => openPayments(s)}>Payments</button>
                            <button className="btn btn-secondary btn-sm" style={{ color:'#7C3AED' }} onClick={() => setParentStudent(s)}>Link Parent</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleViewParent(s)}>View Parent</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleSuspend(s.id, s.status)}>
                              {s.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-info)' }} onClick={() => setTransferStudent(s)}>
                              Transfer
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s.id)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>

                      {/* Mobile View: Dropdown Menu */}
                      <div className="mobile-only" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}
                          style={{ padding: '6px 12px', minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                        >
                          Actions
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                        
                        {openMenuId === s.id && (
                              <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: '4px',
                            background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)',
                            borderRadius: '8px', padding: '6px', minWidth: '160px', zIndex: 50,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '2px'
                          }}>
                            <Link to={`/reports/transcript/${s.id}`} style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--color-text-primary)', textDecoration: 'none', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => setOpenMenuId(null)}>Transcript</Link>
                            <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); setIdCardStudent(s); }}>ID Card</button>
                            {user?.role === 'admin' && (
                              <>
                                <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); openPayments(s); }}>Payments</button>
                                <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); setParentStudent(s); }}>Link Parent</button>
                                <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-text-primary)', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); handleViewParent(s); }}>View Parent</button>
                                <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />
                                <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-warning)', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); handleSuspend(s.id, s.status); }}>{s.status === 'suspended' ? 'Activate' : 'Suspend'}</button>
                                <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-info)', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); setTransferStudent(s); }}>Transfer</button>
                                <button style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', borderRadius: '4px' }} className="hover-bg-secondary" onClick={() => { setOpenMenuId(null); handleDelete(s.id); }}>Delete</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 15 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderTop:'1px solid var(--color-border)' }}>
            <span style={{ fontSize:'13px', color:'var(--color-text-muted)' }}>
              Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
            </span>
            <div style={{ display:'flex', gap:'8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Payments Modal */}
      {selectedStudent && (
        <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
          <div className="modal-box" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payments for {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.student_number})</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card" style={{ padding: '16px', background: 'var(--color-bg-primary)' }}>
                <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Add New Payment</h4>
                <form onSubmit={handleAddPayment} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Amount Paid (Le)</label>
                    <input className="form-input" type="number" required value={paymentForm.amount_paid} onChange={e => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount Due (Le)</label>
                    <input className="form-input" type="number" required value={paymentForm.amount_due} onChange={e => setPaymentForm({ ...paymentForm, amount_due: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input className="form-input" type="date" required value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <input className="form-input" required placeholder="e.g. Year 1 Sem 1" value={paymentForm.semester} onChange={e => setPaymentForm({ ...paymentForm, semester: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Method</label>
                    <select className="form-select" required value={paymentForm.payment_method} onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}>
                      <option value="">Select</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Mobile Money">Mobile Money</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference</label>
                    <input className="form-input" placeholder="Receipt/Txn Number" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary">Save Payment</button>
                  </div>
                </form>
              </div>

              <div>
                <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Payment History</h4>
                {loadingPayments ? <div className="loading-center"><div className="spinner" /></div> : (
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Amount Paid</th><th>Due</th><th>Semester</th><th>Method</th><th>Ref</th></tr></thead>
                    <tbody>
                      {studentPayments.length === 0 ? <tr><td colSpan={6}>No payments found.</td></tr> : 
                        studentPayments.map(p => (
                          <tr key={p.id}>
                            <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                            <td style={{ color: 'var(--color-success)', fontWeight: 600 }}>Le {p.amount_paid}</td>
                            <td style={{ color: 'var(--color-danger)' }}>Le {p.amount_due}</td>
                            <td>{p.semester}</td>
                            <td>{p.payment_method}</td>
                            <td style={{ fontSize: '11px' }}>{p.reference}</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link Parent Modal */}
      {parentStudent && (
        <div className="modal-overlay" onClick={closeParentModal}>
          <div className="modal-box" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link Parent to {parentStudent.first_name} {parentStudent.last_name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={closeParentModal}>x</button>
            </div>
            <div className="modal-body">
              {parentCreated ? (
                /* ── Success State ── */
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px', padding:'16px' }}>
                    <p style={{ fontWeight:700, color:'#10B981', marginBottom:'8px', fontSize:'14px' }}>Parent account created successfully</p>
                    <p style={{ fontSize:'13px', color:'var(--color-text-secondary)', marginBottom:'4px' }}>Share these login credentials with the parent:</p>
                    <p style={{ fontSize:'13px', margin:'8px 0 4px' }}>Email: <strong style={{ color:'var(--color-gold)' }}>{parentCreated.email}</strong></p>
                    <p style={{ fontSize:'13px', margin:0 }}>Default Password: <strong style={{ color:'var(--color-gold)' }}>{parentCreated.password}</strong></p>
                    <p style={{ fontSize:'11px', color:'var(--color-text-muted)', marginTop:'10px' }}>The parent will be prompted to change this password on first login.</p>
                  </div>
                  <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => { navigator.clipboard.writeText(`Email: ${parentCreated.email}\nPassword: ${parentCreated.password}`); toast.success('Credentials copied to clipboard'); }}
                    >
                      Copy Credentials
                    </button>
                    <button className="btn btn-primary" onClick={closeParentModal}>Done</button>
                  </div>
                </div>
              ) : (
                /* ── Form State ── */
                <>
                  <div style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.3)', borderRadius:'8px', padding:'12px 14px', marginBottom:'16px' }}>
                    <p style={{ fontSize:'13px', color:'#a78bfa', margin:0 }}>
                      The parent's default login password will be automatically set to the student's ID number (<strong>{parentStudent.student_number}</strong>). No manual password creation needed.
                    </p>
                  </div>
                  <form onSubmit={handleLinkParent} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">First Name</label>
                        <input className="form-input" required value={parentForm.first_name} onChange={e => setParentForm({...parentForm, first_name: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ marginBottom:0 }}>
                        <label className="form-label">Last Name</label>
                        <input className="form-input" required value={parentForm.last_name} onChange={e => setParentForm({...parentForm, last_name: e.target.value})} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Email Address</label>
                      <input className="form-input" type="email" required value={parentForm.email} onChange={e => setParentForm({...parentForm, email: e.target.value})} />
                    </div>
                    <div className="form-group" style={{ marginBottom:0 }}>
                      <label className="form-label">Phone (optional)</label>
                      <input className="form-input" value={parentForm.phone} onChange={e => setParentForm({...parentForm, phone: e.target.value})} />
                    </div>
                    <div style={{ display:'flex', gap:'10px', justifyContent:'flex-end', marginTop:'4px' }}>
                      <button type="button" className="btn btn-secondary" onClick={closeParentModal}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={parentLoading}>
                        {parentLoading ? 'Creating...' : 'Create and Link'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Parent Modal */}
      {viewParents && (
        <div className="modal-overlay" onClick={() => setViewParents(null)}>
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Parents for {viewParents.student.first_name} {viewParents.student.last_name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setViewParents(null)}>x</button>
            </div>
            <div className="modal-body">
              {loadingViewParents ? (
                <div className="loading-center"><div className="spinner" /></div>
              ) : viewParents.parents.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <p>No parent linked to this student yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {viewParents.parents.map(parent => (
                    <div key={parent._id} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', background: 'var(--color-bg-primary)' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{parent.first_name} {parent.last_name}</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--color-text-muted)' }}>Status: {parent.status}</p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px', fontSize: '13px' }}>
                        <div style={{ color: 'var(--color-text-muted)' }}>Email:</div>
                        <div style={{ fontWeight: 500 }}>{parent.email}</div>
                        
                        <div style={{ color: 'var(--color-text-muted)' }}>Phone:</div>
                        <div style={{ fontWeight: 500 }}>{parent.phone || '—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Student Modal */}
      {transferStudent && (
        <div className="modal-overlay" onClick={() => setTransferStudent(null)}>
          <div className="modal-box" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Transfer {transferStudent.first_name} {transferStudent.last_name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setTransferStudent(null)}>x</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#3b82f6', margin: 0 }}>
                  Transferring this student will change their status to "Transferred". Their records will be preserved. Use National ID (if available) or Student Number as the transfer identifier: <strong>{transferStudent.national_id || transferStudent.student_number}</strong>.
                </p>
              </div>
              <form onSubmit={handleTransfer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Transfer Destination (School Name or Program)</label>
                  <input className="form-input" required value={transferForm.destination} onChange={e => setTransferForm({ destination: e.target.value })} placeholder="e.g. Rising Academy New Campus" />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setTransferStudent(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={transferLoading}>
                    {transferLoading ? 'Transferring...' : 'Transfer Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ID Card Modal */}
      {idCardStudent && (
        <div className="modal-overlay" onClick={() => setIdCardStudent(null)}>
          <div className="modal-box" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Student ID Card</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIdCardStudent(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

              {/* ── Landscape ID Card ── */}
              <div id="id-card-content" style={{
                width: '500px', height: '300px',
                background: '#fff', color: '#000',
                borderRadius: '14px',
                display: 'flex', flexDirection: 'row',
                boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>

                {/* LEFT PANEL */}
                <div style={{
                  width: '170px', flexShrink: 0,
                  background: `linear-gradient(160deg, ${schoolColor}dd 0%, ${schoolColor} 60%, ${schoolColor}bb 100%)`,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '20px 14px', gap: '12px', position: 'relative'
                }}>
                  {/* Decorative circles */}
                  <div style={{ position: 'absolute', top: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ position: 'absolute', bottom: '-30px', right: '-30px', width: '110px', height: '110px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

                  {/* Photo */}
                  <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    background: '#ddd6fe', border: '3px solid rgba(255,255,255,0.8)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)', flexShrink: 0
                  }}>
                    {idCardStudent.profile_picture ? (
                      <img src={idCardStudent.profile_picture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '32px' }}>👤</span>
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ textAlign: 'center', zIndex: 1 }}>
                    <div style={{ color: '#fff', fontSize: '13px', fontWeight: 700, lineHeight: 1.2 }}>
                      {idCardStudent.first_name}<br />{idCardStudent.last_name}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '10px', marginTop: '4px', fontWeight: 500 }}>
                      {getAbbr(idCardStudent.program) || 'STUDENT'}
                    </div>
                  </div>
                </div>

                {/* RIGHT PANEL */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 18px' }}>

                  {/* Header */}
                  <div style={{ borderBottom: '2px solid #4f46e5', paddingBottom: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', letterSpacing: '2px', textTransform: 'uppercase' }}>Student Identity Card</div>
                    <div style={{ fontSize: '9px', color: '#9ca3af', letterSpacing: '0.5px' }}>School Administration System</div>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 14px', flex: 1 }}>
                    <div>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Student ID</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{idCardStudent.student_number}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Year of Study</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>Year {idCardStudent.year_of_study || 1}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Date of Birth</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{idCardStudent.date_of_birth ? new Date(idCardStudent.date_of_birth).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Enrolled</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{new Date(idCardStudent.created_at || Date.now()).getFullYear()}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Nationality</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{idCardStudent.nationality || 'N/A'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '1px' }}>Valid Until</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                        {(() => {
                          const enrollYear = new Date(idCardStudent.created_at || Date.now()).getFullYear();
                          const duration = getProgramDuration(idCardStudent.program);
                          const yearsRemaining = Math.max(0, idCardStudent.year_of_study ? (duration - (idCardStudent.year_of_study - 1)) : duration);
                          return `31 Jul ${enrollYear + yearsRemaining}`;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ width: '100%', height: '24px', background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px, #000 4px, #000 5px, #fff 5px, #fff 8px, #000 8px, #000 12px, #fff 12px, #fff 14px)', borderRadius: '2px', opacity: 0.85 }} />
                    <div style={{ fontSize: '7px', color: '#9ca3af', letterSpacing: '2px', textAlign: 'center' }}>{idCardStudent.student_number}</div>
                  </div>
                </div>
              </div>

              {/* Print Button */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px', width: '100%' }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                  const printContent = document.getElementById('id-card-content');
                  const windowPrint = window.open('', '', 'left=0,top=0,width=900,height=700,toolbar=0,scrollbars=0,status=0');
                  windowPrint.document.write('<html><head><title>Student ID Card</title>');
                  windowPrint.document.write('<style>');
                  windowPrint.document.write('@page { size: landscape; margin: 0.5cm; }');
                  windowPrint.document.write('@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }');
                  windowPrint.document.write('body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f3f4f6; }');
                  windowPrint.document.write('</style>');
                  windowPrint.document.write('</head><body>');
                  windowPrint.document.write(printContent.outerHTML);
                  windowPrint.document.write('</body></html>');
                  windowPrint.document.close();
                  windowPrint.focus();
                  setTimeout(() => {
                    windowPrint.print();
                    windowPrint.close();
                  }, 250);
                }}>
                  🖨️ Print ID Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}

