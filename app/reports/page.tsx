'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, DashboardStats, Payroll } from '@/types';
import RevenueChart from '@/components/charts/RevenueChart';
import FeeStatusChart from '@/components/charts/FeeStatusChart';
import PayrollBarChart from '@/components/charts/PayrollBarChart';

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

export default function ReportsPage() {
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard').then(r => r.json()),
      fetch('/api/payroll').then(r => r.json()),
    ]).then(([d, p]: [ApiResponse<DashboardStats>, ApiResponse<Payroll[]>]) => {
      if (d.success && d.data) setStats(d.data);
      if (p.success && p.data) setPayroll(p.data);
    }).catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  // Payroll chart data
  const payrollChartData = payroll.slice(0, 8).map(p => ({
    name:        p.staffId.slice(0, 6),
    basicSalary: p.basicSalary,
    grossSalary: p.grossSalary,
    netSalary:   p.netSalary,
  }));

  const reportCards = [
    { title: 'Total Revenue (YTD)',  value: formatCurrency((stats?.monthlyRevenue ?? 0) * 8), color: '#16a34a', bg: '#dcfce7' },
    { title: 'Total Expense (YTD)',  value: formatCurrency((stats?.monthlyExpense ?? 0) * 8), color: '#dc2626', bg: '#fee2e2' },
    { title: 'Pending Collections', value: formatCurrency(stats?.pendingFees ?? 0),           color: '#d97706', bg: '#fef9c3' },
    { title: 'Net Surplus (YTD)',    value: formatCurrency(((stats?.monthlyRevenue ?? 0) - (stats?.monthlyExpense ?? 0)) * 8), color: '#6366f1', bg: '#ede9fe' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 16px' }} />
          <p>Loading reports…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Financial, payroll and fee collection insights</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select style={{ width: 'auto', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
            <option>Academic Year 2024-25</option>
            <option>Academic Year 2023-24</option>
          </select>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        {reportCards.map(card => (
          <div key={card.title} className="stat-card">
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: card.bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', marginBottom: '4px',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={card.color} strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Revenue vs Expense Trend</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Monthly overview · Academic Year 2024-25</p>
          </div>
          <span className="badge badge-blue">12 Months</span>
        </div>
        {stats?.revenueData ? (
          <RevenueChart data={stats.revenueData} height={300} />
        ) : (
          <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            Connect to database to view trend data
          </div>
        )}
      </div>

      {/* Two-column charts */}
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* Fee Status Donut */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Fee Collection Status</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Distribution by payment status</p>
          </div>
          <FeeStatusChart paid={12} partial={5} pending={8} />
        </div>

        {/* Payroll Bar Chart */}
        <div className="card">
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Payroll Summary</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Gross vs Net salary comparison</p>
          </div>
          <PayrollBarChart data={payrollChartData.length ? payrollChartData : [
            { name: 'EMP001', basicSalary: 55000, grossSalary: 85250, netSalary: 78634 },
            { name: 'EMP002', basicSalary: 48000, grossSalary: 74400, netSalary: 61984 },
            { name: 'EMP003', basicSalary: 62000, grossSalary: 96100, netSalary: 88672 },
            { name: 'EMP004', basicSalary: 40000, grossSalary: 62000, netSalary: 57200 },
          ]} height={220} />
        </div>
      </div>

      {/* Report Downloads */}
      <div className="card">
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
          Available Reports
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {[
            { title: 'Fee Collection Report',  desc: 'Monthly fee collection summary',    color: '#6366f1', bg: '#ede9fe' },
            { title: 'Payroll Summary',         desc: 'Staff salary and deductions',       color: '#0891b2', bg: '#e0f2fe' },
            { title: 'Student Attendance',      desc: 'Class-wise attendance report',      color: '#16a34a', bg: '#dcfce7' },
            { title: 'Academic Performance',    desc: 'Class results and grade analysis',  color: '#d97706', bg: '#fef9c3' },
            { title: 'Staff Leave Report',      desc: 'Leave requests and approvals',      color: '#7c3aed', bg: '#ede9fe' },
            { title: 'Financial Statement',     desc: 'Income and expense statement',      color: '#dc2626', bg: '#fee2e2' },
          ].map(r => (
            <div key={r.title} style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '14px', border: '1px solid #e2e8f0', borderRadius: '10px',
              background: '#fafafa', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = r.color}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '8px', background: r.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{r.title}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{r.desc}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
