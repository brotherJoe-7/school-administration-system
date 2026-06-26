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
  const [showModal, setShowModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'Orange Money', reference: '' });
  const [processing, setProcessing] = useState(false);

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

  const handlePayment = (e) => {
    e.preventDefault();
    setProcessing(true);
    // Simulate API call to payment gateway
    setTimeout(() => {
      setProcessing(false);
      setShowModal(false);
      toast.success(`Payment of Le ${parseInt(paymentForm.amount).toLocaleString()} initiated via ${paymentForm.method}!`);
      // Update local state to reflect pending payment
      setPayments(prev => [{
        payment_date: new Date().toISOString(),
        amount_paid: parseInt(paymentForm.amount),
        amount_due: 0,
        payment_method: paymentForm.method,
        reference: paymentForm.reference || `REF-${Math.floor(Math.random() * 100000)}`,
        semester: 'Current',
        status: 'pending'
      }, ...prev]);
      setPaymentForm({ amount: '', method: 'Orange Money', reference: '' });
    }, 2000);
  };

  return (
    <ProtectedLayout title="My Payments" allowedRoles={['student']}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Payments</h1>
          <p>View your tuition payment history</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Make a Payment
        </button>
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

      {/* Payment Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: 400, background: '#111' }}>
            <h2 style={{ marginBottom: 20 }}>Initiate Payment</h2>
            <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Amount (Le)</label>
                <input type="number" required className="form-input" placeholder="e.g. 500000" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Gateway</label>
                <select className="form-select" value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                  <option value="Orange Money">Orange Money (Mobile)</option>
                  <option value="Afrimoney">Afrimoney (Mobile)</option>
                  <option value="Bank Transfer">Direct Bank Transfer</option>
                </select>
              </div>
              {paymentForm.method !== 'Bank Transfer' && (
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input type="tel" required className="form-input" placeholder="e.g. 076 123 456" />
                </div>
              )}
              {paymentForm.method === 'Bank Transfer' && (
                <div className="form-group">
                  <label className="form-label">Transaction Reference</label>
                  <input type="text" required className="form-input" placeholder="Bank receipt or teller number" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={processing}>
                  {processing ? 'Processing...' : 'Pay Now'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={processing}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
