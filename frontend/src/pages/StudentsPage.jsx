import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import toast from 'react-hot-toast';


const StatusBadge = ({ status }) => {
  const map = { active:'success', pending:'warning', suspended:'danger', graduated:'info' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [programsList, setProgramsList] = useState([]);

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

  return (
    <ProtectedLayout title="Students" allowedRoles={['admin','teacher']}>
      <div className="page-header">
        <div>
          <h1>Students</h1>
          <p>{total} total students in the system</p>
        </div>
        <div style={{ display:'flex', gap:'10px' }}>
          <Link to="/students/register" className="btn btn-primary">New Registration</Link>
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
              {programsList.map(p => <option key={p} value={p}>{p}</option>)}
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
                      <span style={{ background:'var(--color-info-muted)', color:'var(--color-info)', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                        {s.program || 'N/A'}
                      </span>
                    </td>
                    <td><StatusBadge status={s.status} /></td>
                    <td style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <Link to={`/reports/transcript/${s.id}`} className="btn btn-secondary btn-sm">Transcript</Link>
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
    </ProtectedLayout>
  );
}
