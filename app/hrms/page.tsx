'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, Staff } from '@/types';
import { IconPlus, IconUsers } from '@/components/SvgIcons';

const STATUS_BADGE: Record<Staff['status'], string> = {
  Active: 'badge-green',
  'On-Leave': 'badge-yellow',
  Terminated: 'badge-red',
};

const DEPT_COLORS: Record<string, string> = {
  Mathematics: '#6366f1',
  Science: '#0891b2',
  English: '#16a34a',
  Administration: '#d97706',
  'Physical Education': '#dc2626',
};

function Avatar({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: `${color}20`, color, fontSize: '13px',
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function HrmsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', designation: '', basicSalary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = (await res.json()) as ApiResponse<Staff[]>;
      if (data.success && data.data) setStaff(data.data);
      else setError(data.error ?? 'Failed to fetch staff');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, basicSalary: Number(form.basicSalary) }),
      });
      const data = (await res.json()) as ApiResponse<Staff>;
      if (data.success) {
        setShowForm(false);
        setForm({ firstName: '', lastName: '', email: '', phone: '', department: '', designation: '', basicSalary: '' });
        await fetchStaff();
      } else {
        setFormError(data.error ?? 'Failed to add staff');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = staff.filter((s) => s.status === 'Active').length;
  const onLeaveCount = staff.filter((s) => s.status === 'On-Leave').length;
  const terminatedCount = staff.filter((s) => s.status === 'Terminated').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">HRMS – Staff Management</h1>
          <p className="page-subtitle">Manage employee profiles, leaves, and payroll data</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconPlus size={16} />
          Add Staff
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Staff', value: staff.length, color: '#6366f1', bg: '#ede9fe' },
          { label: 'Active', value: activeCount, color: '#16a34a', bg: '#dcfce7' },
          { label: 'On Leave', value: onLeaveCount, color: '#d97706', bg: '#fef9c3' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <div className="stat-icon" style={{ background: bg, color, flexShrink: 0 }}>
              <IconUsers size={20} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '24px', color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: '#6366f1', borderWidth: '2px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
            Add New Staff Member
          </h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleAddStaff}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'firstName', label: 'First Name', type: 'text' },
                { key: 'lastName', label: 'Last Name', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phone', label: 'Phone', type: 'text' },
                { key: 'department', label: 'Department', type: 'text' },
                { key: 'designation', label: 'Designation', type: 'text' },
              ].map(({ key, label, type }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <div className="form-group">
                <label htmlFor="basicSalary">Basic Salary (₹)</label>
                <input
                  id="basicSalary"
                  type="number"
                  min="1"
                  value={form.basicSalary}
                  onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Staff Member'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
            All Staff ({staff.length})
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span className="badge badge-green">Active: {activeCount}</span>
            <span className="badge badge-yellow">On-Leave: {onLeaveCount}</span>
            <span className="badge badge-red">Terminated: {terminatedCount}</span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading staff data…</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Code</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Basic Salary</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => {
                  const deptColor = DEPT_COLORS[s.department] ?? '#6366f1';
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Avatar name={`${s.firstName} ${s.lastName}`} color={deptColor} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                              {s.firstName} {s.lastName}
                            </div>
                            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-gray">{s.employeeCode}</span>
                      </td>
                      <td>
                        <span style={{ color: deptColor, fontWeight: 500, fontSize: '13px' }}>
                          {s.department}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>{s.designation}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                      </td>
                      <td style={{ fontSize: '13px', color: '#64748b' }}>
                        {new Date(s.joinDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        ₹{s.basicSalary.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
