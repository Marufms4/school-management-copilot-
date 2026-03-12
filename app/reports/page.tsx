import { IconBarChart } from '@/components/SvgIcons';

export default function ReportsPage() {
  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Generate and download financial, attendance, and academic reports</p>
        </div>
      </div>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 24px', gap: '16px' }}>
        <div style={{ background: '#ede9fe', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
          <IconBarChart size={36} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Reports Coming Soon</h2>
        <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '400px' }}>
          Comprehensive reporting including revenue analysis, attendance tracking, fee collection summaries,
          and academic performance metrics will be available here.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Fee Collection Report', 'Payroll Summary', 'Attendance Report', 'Academic Performance'].map((r) => (
            <span key={r} className="badge badge-purple" style={{ padding: '6px 14px' }}>{r}</span>
          ))}
        </div>
      </div>
    </>
  );
}
