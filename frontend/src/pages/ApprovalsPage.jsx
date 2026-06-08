import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import toast from 'react-hot-toast';

export default function ApprovalsPage() {
  const [data, setData] = useState({ registrations:[], payroll:[], transcripts:[] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('registrations');
  const [auditLog, setAuditLog] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: d } = await API.get('/approvals?type=all&status=pending');
      setData(d.data || {});
    } catch { toast.error('Failed to load approval queue'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const approveReg = async (id) => {
    try { await API.post(`/approvals/registration/${id}/approve`); toast.success('Registration approved'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const rejectReg = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    try { await API.post(`/approvals/registration/${id}/reject`, {reason}); toast.success('Registration rejected'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const approveTranscript = async (id) => {
    try { await API.post(`/approvals/transcript/${id}/approve`); toast.success('Transcript approved'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const rejectTranscript = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    try { await API.post(`/approvals/transcript/${id}/reject`, {reason}); toast.success('Transcript rejected'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const loadAudit = async () => {
    try { const { data } = await API.get('/approvals/audit-log'); setAuditLog(data.data || []); }
    catch { toast.error('Failed to load audit log'); }
  };

  useEffect(() => { if (tab === 'audit' || tab === 'attendance') loadAudit(); }, [tab]);

  const pendingCount = (data.registrations?.length||0) + (data.transcripts?.length||0) + (data.payroll?.length||0);

  return (
    <ProtectedLayout title="Approval Queue" allowedRoles={['admin']}>
      <div className="page-header">
        <div>
          <h1>Approval Queue</h1>
          <p>{pendingCount} item{pendingCount!==1?'s':''} awaiting review</p>
        </div>
        {pendingCount > 0 && (
          <div style={{background:'var(--color-danger-muted)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:'var(--radius-md)',padding:'8px 16px',display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'13px',fontWeight:700,color:'var(--color-danger)'}}>{pendingCount} pending</span>
          </div>
        )}
      </div>

      <div className="tab-bar">
        {[
          {key:'registrations', label:`Registrations (${data.registrations?.length||0})`},
          {key:'payroll', label:`Payroll (${data.payroll?.length||0})`},
          {key:'transcripts', label:`Transcripts (${data.transcripts?.length||0})`},
          {key:'attendance', label:'Attendance Review'},
          {key:'audit', label:'Audit Log'},
        ].map(t => (
          <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {loading && tab !== 'audit' && tab !== 'attendance' ? (
        <div className="loading-center"><div className="spinner"/></div>
      ) : (
        <>
          {/* Registrations Tab */}
          {tab==='registrations' && (
            <div className="card" style={{padding:0}}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Student Number</th><th>Name</th><th>Email</th><th>Program</th><th>Year</th><th>Payment</th><th>Submitted</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(data.registrations||[]).length===0 ? (
                      <tr><td colSpan={8}><div className="empty-state"><p>No pending registrations</p></div></td></tr>
                    ) : (data.registrations||[]).map(r => (
                      <tr key={r.id}>
                        <td><code style={{color:'var(--color-gold)',fontSize:'12px'}}>{r.student_number}</code></td>
                        <td style={{color:'#fff',fontWeight:600}}>{r.first_name} {r.last_name}</td>
                        <td style={{fontSize:'13px'}}>{r.email}</td>
                        <td><span className="badge badge-info">{r.program}</span></td>
                        <td>Year {r.year_of_study}</td>
                        <td>
                          {r.payment_status==='verified'
                            ? <span className="badge badge-success">Paid</span>
                            : <span className="badge badge-warning">{r.payment_status||'Unpaid'}</span>}
                        </td>
                        <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{new Date(r.submitted_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className="btn btn-success btn-sm" onClick={()=>approveReg(r.id)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>rejectReg(r.id)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payroll Tab */}
          {tab==='payroll' && (
            <div className="card" style={{padding:0}}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Teacher</th><th>Department</th><th>Pay Period</th><th>Net Pay</th><th>Created</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(data.payroll||[]).length===0 ? (
                      <tr><td colSpan={6}><div className="empty-state"><p>No pending payroll</p></div></td></tr>
                    ) : (data.payroll||[]).map(p => (
                      <tr key={p.id}>
                        <td style={{color:'#fff',fontWeight:600}}>{p.first_name} {p.last_name}<br/><code style={{fontSize:11,color:'var(--color-text-muted)'}}>{p.teacher_number}</code></td>
                        <td>{p.department}</td>
                        <td>{new Date(p.pay_period).toLocaleDateString('en-SL',{year:'numeric',month:'long'})}</td>
                        <td style={{color:'var(--color-gold)',fontWeight:700}}>Le {parseFloat(p.net_pay).toLocaleString()}</td>
                        <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className="btn btn-success btn-sm" onClick={async()=>{
                              try{await API.put(`/payroll/${p.id}/approve`);toast.success('Approved');fetchAll();}catch{toast.error('Failed');}
                            }}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={async()=>{
                              const r=window.prompt('Reason:');if(!r)return;
                              try{await API.put(`/payroll/${p.id}/reject`,{reason:r});toast.success('Rejected');fetchAll();}catch{toast.error('Failed');}
                            }}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Transcripts Tab */}
          {tab==='transcripts' && (
            <div className="card" style={{padding:0}}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Student Number</th><th>Name</th><th>Program</th><th>Requested</th><th>Actions</th></tr></thead>
                  <tbody>
                    {(data.transcripts||[]).length===0 ? (
                      <tr><td colSpan={5}><div className="empty-state"><p>No pending transcript requests</p></div></td></tr>
                    ) : (data.transcripts||[]).map(t => (
                      <tr key={t.id}>
                        <td><code style={{color:'var(--color-gold)',fontSize:'12px'}}>{t.student_number}</code></td>
                        <td style={{color:'#fff',fontWeight:600}}>{t.first_name} {t.last_name}</td>
                        <td><span className="badge badge-info">{t.program||'N/A'}</span></td>
                        <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{new Date(t.requested_at).toLocaleDateString()}</td>
                        <td>
                          <div style={{display:'flex',gap:'6px'}}>
                            <button className="btn btn-success btn-sm" onClick={()=>approveTranscript(t.id)}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={()=>rejectTranscript(t.id)}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Attendance Review Tab */}
          {tab==='attendance' && (
            <div className="card" style={{padding:0}}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Timestamp</th><th>Recorded By (User ID)</th><th>Role</th><th>Class Reference</th><th>Submission Details</th></tr></thead>
                  <tbody>
                    {auditLog.filter(a => a.action === 'SUBMIT_ATTENDANCE').length === 0 ? (
                      <tr><td colSpan={5}><div className="empty-state"><p>No attendance changes or submissions found for review</p></div></td></tr>
                    ) : auditLog.filter(a => a.action === 'SUBMIT_ATTENDANCE').map(a => (
                      <tr key={a.id}>
                        <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{new Date(a.timestamp).toLocaleString()}</td>
                        <td><code style={{color:'var(--color-gold)'}}>{a.user_id}</code></td>
                        <td><span className="badge badge-neutral">{a.user_role}</span></td>
                        <td>Class ID: #{a.entity_id}</td>
                        <td style={{color:'#fff', fontSize: '13px'}}>{a.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Audit Log Tab */}
          {tab==='audit' && (
            <div className="card" style={{padding:0}}>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead><tr><th>Timestamp</th><th>User ID</th><th>Role</th><th>Action</th><th>Entity</th><th>Notes</th></tr></thead>
                  <tbody>
                    {auditLog.length===0 ? (
                      <tr><td colSpan={6}><div className="empty-state"><p>No audit records</p></div></td></tr>
                    ) : auditLog.map(a => (
                      <tr key={a.id}>
                        <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{new Date(a.timestamp).toLocaleString()}</td>
                        <td>{a.user_id}</td>
                        <td><span className="badge badge-neutral">{a.user_role}</span></td>
                        <td style={{color:'var(--color-gold)',fontWeight:600,fontSize:'12px'}}>{a.action}</td>
                        <td style={{fontSize:'12px'}}>{a.entity_type} #{a.entity_id}</td>
                        <td style={{fontSize:'12px',color:'var(--color-text-muted)'}}>{a.notes||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </ProtectedLayout>
  );
}
