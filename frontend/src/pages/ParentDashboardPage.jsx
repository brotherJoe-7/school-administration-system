import React, { useState, useEffect } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data } = await API.get('/parents/dashboard');
      if (data.success) {
        setChildrenData(data.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatLeones = (v) => `Le ${(v / 1000000).toFixed(1)}M`;

  return (
    <ProtectedLayout>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Parent Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Welcome back, {user?.name?.split(' ')[0]}. Here is the latest update on your children.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : childrenData.length === 0 ? (
        <div className="empty-state">
          <h3>No students linked</h3>
          <p>Please contact the school administration to link your children to this account.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {childrenData.map((child) => (
            <div key={child.id} className="card" style={{ borderLeft: '4px solid var(--color-gold)' }}>
              <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{child.name}</h2>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>Student ID: {child.student_number}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Attendance Rate</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: child.attendanceRate > 85 ? '#10B981' : '#EF4444' }}>
                    {child.attendanceRate}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Academic Profile */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Current Enrollments</h3>
                  {child.registrations.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No active enrollments</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {child.registrations.map(reg => (
                        <div key={reg._id} style={{ background: 'var(--color-bg-primary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{reg.program}</div>
                          <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Academic Year: {reg.academic_year}</span>
                            <span style={{ color: reg.status === 'approved' ? '#10B981' : '#F59E0B' }}>{reg.status.toUpperCase()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Financial Ledger */}
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Recent Payments</h3>
                  {child.payments.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No payment history</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {child.payments.slice(0, 3).map(pay => (
                        <div key={pay._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-primary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{pay.payment_type.replace('_', ' ').toUpperCase()}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{new Date(pay.payment_date).toLocaleDateString()}</div>
                          </div>
                          <div style={{ fontWeight: 700, color: '#10B981', fontSize: '14px' }}>
                            {formatLeones(pay.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ProtectedLayout>
  );
}
