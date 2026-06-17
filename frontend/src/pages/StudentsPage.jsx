import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { getAbbr, programLabel } from '../utils/programs';


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

  useEffect(() => {
    API.get('/classes/programs')
      .then(res => setProgramsList(res.data.data || []))
      .catch(() => setProgramsList(['BIT','BBIT','BSEM','BICT','DAT','BSc CS','BBA MIS','Diploma ICT','HND Computing']));
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
          <div className="form-group">
            <label className="form-label">Program</label>
            <select className="form-select" value={program} onChange={e => { setProgram(e.target.value); setPage(1); }}>
              <option value="">All Programs</option>
              {programsList.map(p => <option key={p} value={p}>{programLabel(p)}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
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
                      <div style={{ display:'flex', gap:'6px' }}>
                        <Link to={`/reports/transcript/${s.id}`} className="btn btn-secondary btn-sm">Transcript</Link>
                        {user?.role === 'admin' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => openPayments(s)}>Payments</button>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleSuspend(s.id, s.status)}>
                              {s.status === 'suspended' ? 'Activate' : 'Suspend'}
                            </button>
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(s.id)}>
                              Delete
                            </button>
                          </>
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
    </ProtectedLayout>
  );
}
