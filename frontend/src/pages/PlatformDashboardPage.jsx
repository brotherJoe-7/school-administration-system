import React, { useEffect, useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function PlatformDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/platform/dashboard')
      .then(res => {
        if (res.data.success) setData(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load platform data');
        setLoading(false);
      });
  }, []);

  if (loading) return <ProtectedLayout><div className="page-header"><h2>Loading Platform Data...</h2></div></ProtectedLayout>;

  return (
    <ProtectedLayout>
      <div className="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p>Super Admin control plane for managing SchoolSaaS tenants and global metrics.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ '--accent': 'var(--color-gold, #F59E0B)' }}>
          <div>
            <div className="stat-value">Le {data?.mrr?.toLocaleString() || '12,450,000'}</div>
            <div className="stat-label">Platform MRR</div>
            <div style={{ fontSize: '12px', color: '#10B981', marginTop: '6px' }}>+12% from last month</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent': '#3B82F6' }}>
          <div>
            <div className="stat-value">{data?.totalSchools || 0}</div>
            <div className="stat-label">Total Schools Onboarded</div>
          </div>
        </div>
        <div className="stat-card" style={{ '--accent': '#10B981' }}>
          <div>
            <div className="stat-value">{data?.totalStudents || 0}</div>
            <div className="stat-label">Total Students Managed</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Tenant Subscriptions</h3>
        <p className="text-muted" style={{ marginBottom: '20px' }}>Manage onboarded schools and their current platform status.</p>
        
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>School Name</th>
                <th>Subdomain</th>
                <th>Database</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data?.schools?.map(school => (
                <tr key={school._id}>
                  <td style={{ fontWeight: 600 }}>{school.name}</td>
                  <td>{school.subdomain}.schoolsaas.com</td>
                  <td>{school.db_name}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>Active</span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" style={{ marginRight: '8px' }}>Manage</button>
                    <button className="btn btn-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>Suspend</button>
                  </td>
                </tr>
              ))}
              {(!data?.schools || data.schools.length === 0) && (
                <tr><td colSpan="5" style={{ textAlign: 'center' }}>No tenants provisioned yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedLayout>
  );
}
