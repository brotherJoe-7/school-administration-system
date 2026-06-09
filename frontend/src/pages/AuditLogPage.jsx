import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import toast from 'react-hot-toast';

const ActionBadge = ({ action }) => {
  const colors = {
    'LOGIN': 'success',
    'LOGOUT': 'neutral',
    'CREATE': 'success',
    'UPDATE': 'warning',
    'DELETE': 'danger',
    'APPROVE': 'success',
    'REJECT': 'danger',
    'VIEW': 'info'
  };
  return <span className={`badge badge-${colors[action] || 'neutral'}`}>{action}</span>;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [page, actionFilter, roleFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (actionFilter) params.append('action', actionFilter);
      if (roleFilter) params.append('role', roleFilter);
      
      const { data } = await API.get(`/audit?${params}`);
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout title="Audit Log" allowedRoles={['admin']}>
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p>Track all system activities and user actions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-20" style={{ padding:'16px 20px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr auto', gap:'12px', alignItems:'end' }}>
          <div className="form-group">
            <label className="form-label">Action Type</label>
            <select className="form-select" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="VIEW">View</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">User Role</label>
            <select className="form-select" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={loadAuditLogs}>Refresh</button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <p>No audit logs found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontSize:'12px', color:'var(--color-text-muted)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td style={{ fontWeight:600 }}>{log.user_name || 'System'}</td>
                    <td>
                      <span style={{ 
                        background:'var(--color-bg-hover)', 
                        color:'var(--color-text-secondary)', 
                        padding:'2px 8px', 
                        borderRadius:999, 
                        fontSize:11, 
                        fontWeight:700,
                        textTransform:'uppercase'
                      }}>
                        {log.user_role || '—'}
                      </span>
                    </td>
                    <td><ActionBadge action={log.action} /></td>
                    <td style={{ fontSize:'12px' }}>
                      {log.entity_type ? `${log.entity_type}${log.entity_id ? ` (${log.entity_id})` : ''}` : '—'}
                    </td>
                    <td style={{ fontSize:'12px', color:'var(--color-text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderTop:'1px solid var(--color-border)' }}>
            <span style={{ fontSize:'13px', color:'var(--color-text-muted)' }}>
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </span>
            <div style={{ display:'flex', gap:'8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total}>Next</button>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
