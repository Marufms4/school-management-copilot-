'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, DashboardStats, School } from '@/types';
import RevenueChart from '@/components/charts/RevenueChart';
import {
  IconUsers,
  IconGraduationCap,
  IconDollarSign,
  IconAlertCircle,
  IconSchool,
} from '@/components/SvgIcons';

const DEMO_SCHOOLS: School[] = [
  {
    id: 'school1',
    name: 'Sunrise International School',
    address: 'Mumbai, Maharashtra',
    phone: '022-12345678',
    email: 'info@sunrise.edu',
    principalName: 'Dr. Priya Sharma',
    totalStudents: 842,
    totalStaff: 64,
    monthlyRevenue: 1250000,
    monthlyExpense: 890000,
  },
  {
    id: 'school2',
    name: 'Greenfield Academy',
    address: 'Pune, Maharashtra',
    phone: '020-87654321',
    email: 'info@greenfield.edu',
    principalName: 'Mr. Arun Verma',
    totalStudents: 654,
    totalStaff: 48,
    monthlyRevenue: 980000,
    monthlyExpense: 720000,
  },
  {
    id: 'school3',
    name: 'Horizon Public School',
    address: 'Nashik, Maharashtra',
    phone: '0253-1234567',
    email: 'info@horizon.edu',
    principalName: 'Ms. Sunita Patil',
    totalStudents: 512,
    totalStaff: 38,
    monthlyRevenue: 750000,
    monthlyExpense: 560000,
  },
];

function formatCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  trend,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  trend?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && (
        <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px', fontWeight: 500 }}>
          {trend}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((d: ApiResponse<DashboardStats>) => {
        if (d.success && d.data) setStats(d.data);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const totalNetwork = DEMO_SCHOOLS.reduce((a, s) => a + s.totalStudents, 0);
  const totalRevNetwork = DEMO_SCHOOLS.reduce((a, s) => a + s.monthlyRevenue, 0);

  return (
    <>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Management Dashboard</h1>
          <p className="page-subtitle">EduCore SaaS – Real-time school network overview</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{
            padding: '6px 14px',
            background: '#dcfce7',
            color: '#16a34a',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} />
            Live Data
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ color: '#64748b', padding: '40px 0', textAlign: 'center' }}>Loading dashboard…</div>
      ) : (
        <div className="grid-4">
          <StatCard
            label="Total Students"
            value={stats?.totalStudents.toLocaleString() ?? '—'}
            icon={<IconGraduationCap size={22} />}
            iconBg="#ede9fe"
            trend="↑ 4.2% this month"
          />
          <StatCard
            label="Total Staff"
            value={stats?.totalStaff.toLocaleString() ?? '—'}
            icon={<IconUsers size={22} />}
            iconBg="#dbeafe"
            trend="2 new this month"
          />
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(stats?.monthlyRevenue ?? 0)}
            icon={<IconDollarSign size={22} />}
            iconBg="#dcfce7"
            trend="↑ 6.1% vs last month"
          />
          <StatCard
            label="Pending Fees"
            value={formatCurrency(stats?.pendingFees ?? 0)}
            icon={<IconAlertCircle size={22} />}
            iconBg="#fee2e2"
          />
        </div>
      )}

      {/* Revenue Chart */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>Revenue vs Expense</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>Academic year Jul 2024 – Jun 2025</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#6366f1', fontWeight: 600 }}>
              Net: {formatCurrency((stats?.monthlyRevenue ?? 0) - (stats?.monthlyExpense ?? 0))}
            </span>
          </div>
        </div>
        {stats?.revenueData && (
          <RevenueChart data={stats.revenueData} height={280} />
        )}
      </div>

      {/* Multi-school Table */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>School Network</h2>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              {DEMO_SCHOOLS.length} schools · {totalNetwork.toLocaleString()} students · {formatCurrency(totalRevNetwork)} combined revenue
            </p>
          </div>
          <div className="badge badge-blue">{DEMO_SCHOOLS.length} Active</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>School</th>
                <th>Principal</th>
                <th>Students</th>
                <th>Staff</th>
                <th>Monthly Revenue</th>
                <th>Monthly Expense</th>
                <th>Net Surplus</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_SCHOOLS.map((school) => (
                <tr key={school.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: '14px', fontWeight: 700,
                      }}>
                        <IconSchool size={18} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{school.name}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{school.address}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '13px' }}>{school.principalName}</td>
                  <td>
                    <span className="badge badge-purple">{school.totalStudents.toLocaleString()}</span>
                  </td>
                  <td style={{ fontSize: '13px', color: '#374151' }}>{school.totalStaff}</td>
                  <td style={{ fontWeight: 600, color: '#16a34a' }}>{formatCurrency(school.monthlyRevenue)}</td>
                  <td style={{ fontWeight: 500, color: '#dc2626' }}>{formatCurrency(school.monthlyExpense)}</td>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>
                    {formatCurrency(school.monthlyRevenue - school.monthlyExpense)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {[
          { href: '/hrms', label: 'Manage Staff', color: '#6366f1' },
          { href: '/hrms/payroll', label: 'Process Payroll', color: '#0891b2' },
          { href: '/students', label: 'Student Records', color: '#16a34a' },
          { href: '/fees', label: 'Fee Collection', color: '#d97706' },
        ].map(({ href, label, color }) => (
          <a
            key={href}
            href={href}
            style={{
              padding: '12px 20px',
              background: '#fff',
              border: `2px solid ${color}20`,
              borderRadius: '12px',
              color: color,
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {label} →
          </a>
        ))}
      </div>
    </>
  );
}
