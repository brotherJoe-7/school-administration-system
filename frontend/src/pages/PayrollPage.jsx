import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const map = { approved:'success', pending:'warning', rejected:'danger', disbursed:'info' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

const fmt = (v) => `Le ${parseFloat(v || 0).toLocaleString()}`;

export default function PayrollPage() {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ teacher_id:'', salary_amount:'', allowances:'', deductions:'', pay_period:'' });

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'teacher' ? '/payroll/my-payslips' : '/payroll';
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterMonth) params.append('month', filterMonth);

      const { data } = await API.get(`${endpoint}?${params}`);
      setPayroll(data.data || []);
    } catch { 
      toast.error('Failed to load payroll records'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchPayroll();
    if (user?.role === 'admin') {
      API.get('/teachers').then(r => setTeachers(r.data.data || [])).catch(() => {});
    }
  }, [filterStatus, filterMonth, user]);

  const handleApprove = async (id) => {
    try {
      await API.put(`/payroll/${id}/approve`);
      toast.success('Payroll approved');
      fetchPayroll();
    } catch { toast.error('Approval failed'); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    try {
      await API.put(`/payroll/${id}/reject`, { reason });
      toast.success('Payroll rejected');
      fetchPayroll();
    } catch { toast.error('Rejection failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/payroll', form);
      toast.success('Payroll entry created');
      setShowModal(false);
      fetchPayroll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const netPay = (parseFloat(form.salary_amount||0)+parseFloat(form.allowances||0)-parseFloat(form.deductions||0)).toLocaleString();

  return (
    <ProtectedLayout title="Payroll">
      <div className="page-header">
        <div>
          <h1>{user?.role==='teacher' ? 'My Payslips' : 'Payroll Management'}</h1>
          <p>Teacher salary breakdown and approval workflow</p>
        </div>
        {user?.role==='admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Payroll</button>
        )}
      </div>

      {user?.role==='admin' && (
        <div className="card mb-20" style={{padding:'16px 20px'}}>
          <div style={{display:'flex', gap:'16px', alignItems:'end', flexWrap:'wrap'}}>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Status Filter</label>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="form-group" style={{marginBottom:0}}>
              <label className="form-label">Month Filter</label>
              <input type="month" className="form-input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => { setFilterStatus(''); setFilterMonth(''); }}>
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{padding:0}}>
        <div className="table-wrapper">
          {loading ? <div className="loading-center"><div className="spinner"/></div> : (
            <table className="data-table">
              <thead>
                <tr>
                  {user?.role==='admin' && <th>Teacher</th>}
                  <th>Pay Period</th>
                  <th>Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  {user?.role==='admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {payroll.length===0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><p>No payroll records found</p></div></td></tr>
                ) : payroll.map(p => (
                  <tr key={p.id}>
                    {user?.role==='admin' && (
                      <td style={{color:'#fff',fontWeight:600}}>
                        {p.first_name} {p.last_name}
                        <br/><code style={{fontSize:11,color:'var(--color-text-muted)'}}>{p.teacher_number}</code>
                      </td>
                    )}
                    <td>{new Date(p.pay_period).toLocaleDateString('en-SL',{year:'numeric',month:'long'})}</td>
                    <td>{fmt(p.salary_amount)}</td>
                    <td style={{color:'var(--color-success)'}}>+{fmt(p.allowances)}</td>
                    <td style={{color:'var(--color-danger)'}}>-{fmt(p.deductions)}</td>
                    <td style={{color:'var(--color-gold)',fontWeight:700,fontSize:'15px'}}>{fmt(p.net_pay)}</td>
                    <td><StatusBadge status={p.status}/></td>
                    {user?.role==='admin' && (
                      <td>
                        {p.status==='pending' && (
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className="btn btn-success btn-sm" onClick={()=>handleApprove(p.id)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>handleReject(p.id)}>Reject</button>
                          </div>
                        )}
                      </td>
                    )}
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
              <h3>Create Payroll Entry</h3>
              <button className="btn btn-secondary btn-sm" onClick={()=>setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                <div className="form-group">
                  <label className="form-label">Teacher</label>
                  <select className="form-select" required value={form.teacher_id}
                    onChange={e=>setForm(f=>({...f,teacher_id:e.target.value}))}>
                    <option value="">Select teacher</option>
                    {teachers.map(t=><option key={t.id} value={t.id}>{t.teacher_number} — {t.first_name} {t.last_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Pay Period</label>
                  <select className="form-select" required value={form.pay_period}
                    onChange={e=>setForm(f=>({...f,pay_period:e.target.value}))}>
                    <option value="">Select a Month...</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                      const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Salary (Le)</label>
                    <input className="form-input" type="number" required min="0" placeholder="5000000" value={form.salary_amount}
                      onChange={e=>setForm(f=>({...f,salary_amount:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Allowances (Le)</label>
                    <input className="form-input" type="number" min="0" placeholder="500000" value={form.allowances}
                      onChange={e=>setForm(f=>({...f,allowances:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deductions (Le)</label>
                    <input className="form-input" type="number" min="0" placeholder="350000" value={form.deductions}
                      onChange={e=>setForm(f=>({...f,deductions:e.target.value}))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Net Pay (calculated)</label>
                    <div style={{padding:'10px 14px',background:'var(--color-bg-primary)',borderRadius:'var(--radius-md)',border:'1px solid var(--color-border)',fontSize:'15px',fontWeight:700,color:'var(--color-gold)'}}>
                      Le {netPay}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
