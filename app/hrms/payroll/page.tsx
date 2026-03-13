'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, Payroll } from '@/types';
import { IconDollarSign } from '@/components/SvgIcons';
import PayrollBarChart from '@/components/charts/PayrollBarChart';

const STATUS_BADGE: Record<Payroll['status'], string> = {
  Draft:     'badge-gray',
  Processed: 'badge-blue',
  Paid:      'badge-green',
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEMO_PAYROLLS: Payroll[] = [
  { id:'p1', tenantId:'t1', staffId:'EMP20240001', month:3, year:2025, basicSalary:55000, hra:22000, da:8250, pf:6600, lopDays:0, lopAmount:0, grossSalary:85250, netSalary:78650, status:'Paid' },
  { id:'p2', tenantId:'t1', staffId:'EMP20240002', month:3, year:2025, basicSalary:48000, hra:19200, da:7200, pf:5760, lopDays:9, lopAmount:16615, grossSalary:74400, netSalary:52025, status:'Paid' },
  { id:'p3', tenantId:'t1', staffId:'EMP20240003', month:3, year:2025, basicSalary:62000, hra:24800, da:9300, pf:7440, lopDays:0, lopAmount:0,    grossSalary:96100, netSalary:88660, status:'Paid' },
  { id:'p4', tenantId:'t1', staffId:'EMP20240004', month:3, year:2025, basicSalary:40000, hra:16000, da:6000, pf:4800, lopDays:0, lopAmount:0,    grossSalary:62000, netSalary:57200, status:'Processed' },
  { id:'p5', tenantId:'t1', staffId:'EMP20240005', month:3, year:2025, basicSalary:38000, hra:15200, da:5700, pf:4560, lopDays:0, lopAmount:0,    grossSalary:58900, netSalary:54340, status:'Processed' },
  { id:'p6', tenantId:'t1', staffId:'EMP20240001', month:2, year:2025, basicSalary:55000, hra:22000, da:8250, pf:6600, lopDays:0, lopAmount:0,    grossSalary:85250, netSalary:78650, status:'Paid' },
  { id:'p7', tenantId:'t1', staffId:'EMP20240003', month:2, year:2025, basicSalary:62000, hra:24800, da:9300, pf:7440, lopDays:0, lopAmount:0,    grossSalary:96100, netSalary:88660, status:'Paid' },
];

export default function PayrollPage() {
  const [payrolls,  setPayrolls]  = useState<Payroll[]>(DEMO_PAYROLLS);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState({ staffId: '1', month: 3, year: 2025, lopDays: 0 });
  const [submitting,setSubmitting]= useState(false);
  const [formMsg,   setFormMsg]   = useState('');

  useEffect(() => {
    fetch('/api/payroll')
      .then((r) => r.json())
      .then((d: ApiResponse<Payroll[]>) => { if (d.success && d.data && d.data.length) setPayrolls(d.data); })
      .catch(() => null);
  }, []);

  async function handleProcessPayroll(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg('');
    try {
      const res  = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as ApiResponse<Payroll>;
      if (data.success) {
        setFormMsg('✓ Payroll processed successfully!');
        setShowForm(false);
        const r2 = await fetch('/api/payroll');
        const d2 = (await r2.json()) as ApiResponse<Payroll[]>;
        if (d2.success && d2.data) setPayrolls(d2.data);
      } else {
        setFormMsg(data.error ?? 'Failed to process payroll');
      }
    } catch {
      setFormMsg('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const totalNet   = payrolls.reduce((a, p) => a + p.netSalary,   0);
  const totalGross = payrolls.reduce((a, p) => a + p.grossSalary,  0);
  const paidCount  = payrolls.filter((p) => p.status === 'Paid').length;

  // Chart data – one entry per unique staffId in the list
  const chartMap = new Map<string, { basicSalary: number; grossSalary: number; netSalary: number }>();
  for (const p of payrolls) {
    if (!chartMap.has(p.staffId)) {
      chartMap.set(p.staffId, { basicSalary: p.basicSalary, grossSalary: p.grossSalary, netSalary: p.netSalary });
    }
  }
  const chartData = Array.from(chartMap.entries()).map(([name, v]) => ({ name, ...v }));

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Monthly salary processing with Basic, HRA, DA, PF components</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconDollarSign size={16} />
          Process Payroll
        </button>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        {[
          { label: 'Payroll Records', value: payrolls.length.toString(),        color: '#6366f1', bg: '#ede9fe' },
          { label: 'Total Gross',     value: `₹${totalGross.toLocaleString()}`, color: '#0891b2', bg: '#dbeafe' },
          { label: 'Total Net Paid',  value: `₹${totalNet.toLocaleString()}`,   color: '#16a34a', bg: '#dcfce7' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <div className="stat-icon" style={{ background: bg, color, flexShrink: 0 }}>
              <IconDollarSign size={20} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '24px', color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Payroll chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Salary Breakdown</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Gross vs Net salary per employee</p>
          </div>
          <span className="badge badge-green">{paidCount} Paid</span>
        </div>
        <PayrollBarChart data={chartData} height={230} />
      </div>

      {/* Process Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: '#6366f1', borderWidth: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconDollarSign size={16} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Process Payroll</h3>
          </div>
          {formMsg && (
            <div className={`alert ${formMsg.startsWith('✓') ? 'alert-success' : 'alert-error'}`}>
              {formMsg}
            </div>
          )}
          {/* Salary formula info */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', marginBottom: '20px', fontSize: '12px' }}>
            {[
              { label:'HRA',  desc:'40% of Basic',          color:'#6366f1' },
              { label:'DA',   desc:'15% of Basic',          color:'#0891b2' },
              { label:'PF',   desc:'12% of Basic (–)',       color:'#dc2626' },
              { label:'LOP',  desc:'Basic/26 × LOP days (–)',color:'#d97706' },
            ].map(({ label, desc, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
                <strong style={{ color }}>{label}</strong>
                <span style={{ color: '#94a3b8' }}>{desc}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleProcessPayroll}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label htmlFor="staffId">Staff Member</label>
                <select id="staffId" value={form.staffId} onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}>
                  <option value="1">EMP001 – John Smith</option>
                  <option value="2">EMP002 – Sarah Johnson</option>
                  <option value="3">EMP003 – Priya Sharma</option>
                  <option value="4">EMP004 – Rahul Verma</option>
                  <option value="5">EMP005 – Anita Desai</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="month">Month</label>
                <select id="month" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="year">Year</label>
                <input id="year" type="number" min="2020" max="2030" value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label htmlFor="lopDays">LOP Days (0 = auto)</label>
                <input id="lopDays" type="number" min="0" max="31" value={form.lopDays}
                  onChange={(e) => setForm((f) => ({ ...f, lopDays: Number(e.target.value) }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Processing…' : 'Calculate & Generate Payslip'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Payroll Table */}
      <div className="card">
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Payroll Records</h2>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Staff ID</th>
                <th>Period</th>
                <th>Basic</th>
                <th>HRA</th>
                <th>DA</th>
                <th>PF (–)</th>
                <th>LOP (–)</th>
                <th>Gross</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p.id}>
                  <td><span className="badge badge-purple" style={{ fontFamily: 'monospace' }}>{p.staffId}</span></td>
                  <td style={{ fontSize: '13px', fontWeight: 500 }}>{MONTHS[p.month - 1]} {p.year}</td>
                  <td>₹{p.basicSalary.toLocaleString()}</td>
                  <td style={{ color: '#6366f1' }}>₹{p.hra.toLocaleString()}</td>
                  <td style={{ color: '#0891b2' }}>₹{p.da.toLocaleString()}</td>
                  <td style={{ color: '#dc2626' }}>₹{p.pf.toLocaleString()}</td>
                  <td style={{ color: '#d97706' }}>
                    {p.lopDays > 0 ? <>₹{p.lopAmount.toLocaleString()} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({p.lopDays}d)</span></> : '—'}
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{p.grossSalary.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#16a34a', fontSize: '15px' }}>₹{p.netSalary.toLocaleString()}</td>
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
