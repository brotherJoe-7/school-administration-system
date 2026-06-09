import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const map = { pending:'warning', verified:'success', rejected:'danger' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      loadPayments();
    }
  }, [user]);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/students/${user.id}/payments`);
      setPayments(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedLayout title="My Payments" allowedRoles={['student']}>
      <div className="page-header">
        <div>
          <h1>My Payments</h1>
          <p>View your tuition payment history</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : payments.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 300 }}>
          <p>No payment records found</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Amount Due</th>
                  <th>Payment Method</th>
                  <th>Reference</th>
                  <th>Semester</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontSize:'13px' }}>
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                      Le {p.amount_paid?.toLocaleString() || '0'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-danger)' }}>
                      Le {p.amount_due?.toLocaleString() || '0'}
                    </td>
                    <td>{p.payment_method || '—'}</td>
                    <td><code style={{ fontSize:'11px' }}>{p.reference || '—'}</code></td>
                    <td>{p.semester || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
