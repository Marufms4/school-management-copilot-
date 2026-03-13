'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, FeePayment } from '@/types';
import { IconDollarSign, IconPlus } from '@/components/SvgIcons';
import FeeStatusChart from '@/components/charts/FeeStatusChart';

const STATUS_BADGE: Record<FeePayment['status'], string> = {
  Pending: 'badge-red',
  Partial: 'badge-yellow',
  Paid:    'badge-green',
};
const MODE_BADGE: Record<FeePayment['paymentMode'], string> = {
  Cash:   'badge-gray',
  Online: 'badge-blue',
  Cheque: 'badge-purple',
};

const DEMO_PAYMENTS: FeePayment[] = [
  { id:'f1', tenantId:'t1', studentId:'ADM2024000001', feeCategoryId:'cat1', totalAmount:45000, paidAmount:45000, lateFee:0,    balance:0,     paymentMode:'Online', paymentDate:'2024-07-05', receiptNumber:'RCP2024000001', status:'Paid'    },
  { id:'f2', tenantId:'t1', studentId:'ADM2024000002', feeCategoryId:'cat1', totalAmount:45000, paidAmount:25000, lateFee:0,    balance:20000, paymentMode:'Cash',   paymentDate:'2024-07-10', receiptNumber:'RCP2024000002', status:'Partial' },
  { id:'f3', tenantId:'t1', studentId:'ADM2024000003', feeCategoryId:'cat2', totalAmount:12000, paidAmount:12000, lateFee:0,    balance:0,     paymentMode:'Cheque', paymentDate:'2024-07-08', receiptNumber:'RCP2024000003', status:'Paid'    },
  { id:'f4', tenantId:'t1', studentId:'ADM2024000004', feeCategoryId:'cat3', totalAmount:2500,  paidAmount:0,     lateFee:250,  balance:2750,  paymentMode:'Online', paymentDate:'',           receiptNumber:'',              status:'Pending' },
  { id:'f5', tenantId:'t1', studentId:'ADM2024000005', feeCategoryId:'cat1', totalAmount:45000, paidAmount:45000, lateFee:0,    balance:0,     paymentMode:'Online', paymentDate:'2024-07-01', receiptNumber:'RCP2024000005', status:'Paid'    },
  { id:'f6', tenantId:'t1', studentId:'ADM2024000006', feeCategoryId:'cat2', totalAmount:12000, paidAmount:6000,  lateFee:500,  balance:6500,  paymentMode:'Cash',   paymentDate:'2024-08-01', receiptNumber:'RCP2024000006', status:'Partial' },
  { id:'f7', tenantId:'t1', studentId:'ADM2024000007', feeCategoryId:'cat1', totalAmount:45000, paidAmount:45000, lateFee:0,    balance:0,     paymentMode:'Online', paymentDate:'2024-07-03', receiptNumber:'RCP2024000007', status:'Paid'    },
  { id:'f8', tenantId:'t1', studentId:'ADM2024000008', feeCategoryId:'cat3', totalAmount:2500,  paidAmount:0,     lateFee:0,    balance:2500,  paymentMode:'Online', paymentDate:'',           receiptNumber:'',              status:'Pending' },
];

export default function FeesPage() {
  const [payments,  setPayments]  = useState<FeePayment[]>(DEMO_PAYMENTS);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({
    studentId:'1', feeCategoryId:'cat1', paidAmount:'', paymentMode:'Online' as FeePayment['paymentMode'], paymentDate:'',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formMsg,    setFormMsg]    = useState('');

  useEffect(() => {
    fetch('/api/fees')
      .then((r) => r.json())
      .then((d: ApiResponse<FeePayment[]>) => { if (d.success && d.data && d.data.length) setPayments(d.data); })
      .catch(() => null);
  }, []);

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg('');
    try {
      const res  = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, paidAmount: Number(form.paidAmount) }),
      });
      const data = (await res.json()) as ApiResponse<FeePayment>;
      if (data.success) {
        setFormMsg('✓ Payment recorded!');
        setShowForm(false);
        const r2 = await fetch('/api/fees');
        const d2 = (await r2.json()) as ApiResponse<FeePayment[]>;
        if (d2.success && d2.data) setPayments(d2.data);
      } else {
        setFormMsg(data.error ?? 'Failed to record payment');
      }
    } catch {
      setFormMsg('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const totalCollected = payments.reduce((a, p) => a + p.paidAmount,  0);
  const totalPending   = payments.reduce((a, p) => a + p.balance,     0);
  const paidCount      = payments.filter((p) => p.status === 'Paid').length;
  const partialCount   = payments.filter((p) => p.status === 'Partial').length;
  const pendingCount   = payments.filter((p) => p.status === 'Pending').length;
  const chartData      = [
    { name: 'Paid',    value: paidCount,    fill: '#16a34a' },
    { name: 'Partial', value: partialCount, fill: '#d97706' },
    { name: 'Pending', value: pendingCount, fill: '#dc2626' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p className="page-subtitle">Tuition, Transport, Exam fees · Late-fee calculation · Receipt generation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconPlus size={16} />
          Record Payment
        </button>
      </div>

      {/* Stats + Chart row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', marginBottom: '24px', alignItems: 'stretch' }}>
        {[
          { label: 'Total Records',  value: payments.length.toString(),           color: '#6366f1', bg: '#ede9fe' },
          { label: 'Collected',      value: `₹${totalCollected.toLocaleString()}`,color: '#16a34a', bg: '#dcfce7' },
          { label: 'Outstanding',    value: `₹${totalPending.toLocaleString()}`,  color: '#dc2626', bg: '#fee2e2' },
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
        <div className="card" style={{ margin: 0, padding: '16px', minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>Collection Status</div>
          <FeeStatusChart data={chartData} height={130} />
        </div>
      </div>

      {/* Record Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: '#16a34a', borderWidth: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: '#dcfce7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconDollarSign size={16} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Record Fee Payment</h3>
          </div>
          {formMsg && (
            <div className={`alert ${formMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>{formMsg}</div>
          )}
          <form onSubmit={handleRecord}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="studentId">Student</label>
                <select id="studentId" value={form.studentId} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}>
                  <option value="1">Arjun Patel – ADM2024000001</option>
                  <option value="2">Ananya Singh – ADM2024000002</option>
                  <option value="3">Rohan Mehta – ADM2024000003</option>
                  <option value="4">Kavya Reddy – ADM2024000004</option>
                  <option value="5">Aditya Kumar – ADM2024000005</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="feeCategoryId">Fee Category</label>
                <select id="feeCategoryId" value={form.feeCategoryId} onChange={(e) => setForm((f) => ({ ...f, feeCategoryId: e.target.value }))}>
                  <option value="cat1">Annual Tuition Fee – ₹45,000</option>
                  <option value="cat2">Transport Fee – ₹12,000</option>
                  <option value="cat3">Exam Fee – ₹2,500</option>
                  <option value="cat4">Library Fee – ₹1,500</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paidAmount">Amount Paid (₹)</label>
                <input id="paidAmount" type="number" min="1" placeholder="e.g. 45000"
                  value={form.paidAmount} onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label htmlFor="paymentMode">Payment Mode</label>
                <select id="paymentMode" value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as FeePayment['paymentMode'] }))}>
                  <option>Online</option><option>Cash</option><option>Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="paymentDate">Payment Date</label>
                <input id="paymentDate" type="date" value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))} />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', fontSize: '12px', color: '#16a34a', fontWeight: 500, width: '100%' }}>
                  ✓ Auto-calculates late fee &amp; generates receipt number
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}>
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
                  <td><span className="badge badge-purple" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{p.studentId}</span></td>
                  <td style={{ fontWeight: 500 }}>₹{p.totalAmount.toLocaleString()}</td>
                  <td style={{ fontWeight: 600, color: '#16a34a' }}>₹{p.paidAmount.toLocaleString()}</td>
                  <td style={{ color: p.lateFee > 0 ? '#dc2626' : '#94a3b8' }}>
                    {p.lateFee > 0 ? `₹${p.lateFee.toLocaleString()}` : '—'}
                  </td>
                  <td style={{ fontWeight: 600, color: p.balance > 0 ? '#dc2626' : '#16a34a' }}>
                    {p.balance > 0 ? `₹${p.balance.toLocaleString()}` : '✓ Cleared'}
                  </td>
                  <td><span className={`badge ${MODE_BADGE[p.paymentMode]}`}>{p.paymentMode}</span></td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
