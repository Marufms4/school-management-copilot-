'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, FeePayment } from '@/types';
import { IconDollarSign, IconPlus } from '@/components/SvgIcons';

const STATUS_BADGE: Record<FeePayment['status'], string> = {
  Pending: 'badge-red',
  Partial: 'badge-yellow',
  Paid: 'badge-green',
};

const MODE_BADGE: Record<FeePayment['paymentMode'], string> = {
  Cash: 'badge-gray',
  Online: 'badge-blue',
  Cheque: 'badge-purple',
};

export default function FeesPage() {
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: '1', feeCategoryId: 'cat1', paidAmount: '', paymentMode: 'Online' as FeePayment['paymentMode'], paymentDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState('');

  useEffect(() => { fetchPayments(); }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch('/api/fees');
      const data = (await res.json()) as ApiResponse<FeePayment[]>;
      if (data.success && data.data) setPayments(data.data);
      else setError(data.error ?? 'Failed to fetch payments');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg('');
    try {
      const res = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paidAmount: Number(form.paidAmount) }),
      });
      const data = (await res.json()) as ApiResponse<FeePayment>;
      if (data.success) {
        setFormMsg('Payment recorded!');
        setShowForm(false);
        await fetchPayments();
      } else {
        setFormMsg(data.error ?? 'Failed to record payment');
      }
    } catch {
      setFormMsg('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const totalCollected = payments.reduce((a, p) => a + p.paidAmount, 0);
  const totalPending = payments.reduce((a, p) => a + p.balance, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">Tuition, Transport, Exam fees with late-fee calculation and receipt generation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconPlus size={16} />
          Record Payment
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        {[
          { label: 'Total Records', value: payments.length.toString(), color: '#6366f1', bg: '#ede9fe' },
          { label: 'Collected', value: `₹${totalCollected.toLocaleString()}`, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Outstanding', value: `₹${totalPending.toLocaleString()}`, color: '#dc2626', bg: '#fee2e2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <div className="stat-icon" style={{ background: bg, color, flexShrink: 0 }}>
              <IconDollarSign size={20} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '22px', color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Record Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: '#6366f1', borderWidth: '2px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>Record Fee Payment</h3>
          {formMsg && <div className={`alert ${formMsg.includes('recorded') ? 'alert-success' : 'alert-error'}`}>{formMsg}</div>}
          <form onSubmit={handleRecord}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="studentId">Student</label>
                <select id="studentId" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}>
                  <option value="1">Arjun Patel (ADM2024001)</option>
                  <option value="2">Ananya Singh (ADM2024002)</option>
                  <option value="3">Rohan Mehta (ADM2024003)</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="feeCategoryId">Fee Category</label>
                <select id="feeCategoryId" value={form.feeCategoryId} onChange={(e) => setForm((f) => ({ ...f, feeCategoryId: e.target.value }))}>
                  <option value="cat1">Annual Tuition Fee – ₹45,000</option>
                  <option value="cat2">Transport Fee – ₹12,000</option>
                  <option value="cat3">Exam Fee – ₹2,500</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paidAmount">Amount Paid (₹)</label>
                <input id="paidAmount" type="number" min="1" value={form.paidAmount}
                  onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label htmlFor="paymentMode">Payment Mode</label>
                <select id="paymentMode" value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as FeePayment['paymentMode'] }))}>
                  <option>Online</option>
                  <option>Cash</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paymentDate">Payment Date</label>
                <input id="paymentDate" type="date" value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Recording…' : 'Record & Generate Receipt'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Payments Table */}
      <div className="card">
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Payment Records</h2>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading fee records…</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Receipt No.</th>
                  <th>Student ID</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Late Fee</th>
                  <th>Balance</th>
                  <th>Mode</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>
                        {p.receiptNumber || '—'}
                      </span>
                    </td>
                    <td><span className="badge badge-purple">{p.studentId}</span></td>
                    <td style={{ fontWeight: 500 }}>₹{p.totalAmount.toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>₹{p.paidAmount.toLocaleString()}</td>
                    <td style={{ color: p.lateFee > 0 ? '#dc2626' : '#94a3b8' }}>
                      {p.lateFee > 0 ? `₹${p.lateFee.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ fontWeight: 600, color: p.balance > 0 ? '#dc2626' : '#16a34a' }}>
                      ₹{p.balance.toLocaleString()}
                    </td>
                    <td><span className={`badge ${MODE_BADGE[p.paymentMode]}`}>{p.paymentMode}</span></td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
