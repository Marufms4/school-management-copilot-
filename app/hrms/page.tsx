'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, Staff } from '@/types';
import { IconPlus, IconUsers } from '@/components/SvgIcons';

const STATUS_BADGE: Record<Staff['status'], string> = {
  Active:     'badge-green',
  'On-Leave': 'badge-yellow',
  Terminated: 'badge-red',
};

const DEPT_COLORS: Record<string, string> = {
  Mathematics:        '#6366f1',
  Science:            '#0891b2',
  English:            '#16a34a',
  Administration:     '#d97706',
  'Physical Education': '#dc2626',
  Commerce:           '#7c3aed',
  History:            '#ea580c',
};

const DEMO_STAFF: Staff[] = [
  { id:'1', tenantId:'t1', employeeCode:'EMP20240001', firstName:'John',     lastName:'Smith',   email:'john.smith@democschool.edu',  phone:'9800000001', department:'Mathematics',        designation:'Senior Teacher',     status:'Active',     joinDate:'2022-06-01', basicSalary:55000 },
  { id:'2', tenantId:'t1', employeeCode:'EMP20240002', firstName:'Sarah',    lastName:'Johnson', email:'sarah.j@democschool.edu',     phone:'9800000002', department:'Science',            designation:'Lab Instructor',     status:'On-Leave',   joinDate:'2021-08-15', basicSalary:48000 },
  { id:'3', tenantId:'t1', employeeCode:'EMP20240003', firstName:'Priya',    lastName:'Sharma',  email:'priya.s@democschool.edu',     phone:'9800000003', department:'English',            designation:'Head of Department', status:'Active',     joinDate:'2020-04-01', basicSalary:62000 },
  { id:'4', tenantId:'t1', employeeCode:'EMP20240004', firstName:'Rahul',    lastName:'Verma',   email:'rahul.v@democschool.edu',     phone:'9800000004', department:'Administration',     designation:'Admin Officer',      status:'Active',     joinDate:'2023-01-10', basicSalary:40000 },
  { id:'5', tenantId:'t1', employeeCode:'EMP20240005', firstName:'Anita',    lastName:'Desai',   email:'anita.d@democschool.edu',     phone:'9800000005', department:'Physical Education', designation:'Sports Coach',       status:'Active',     joinDate:'2022-09-01', basicSalary:38000 },
  { id:'6', tenantId:'t1', employeeCode:'EMP20240006', firstName:'Mohammed', lastName:'Khan',    email:'mk@democschool.edu',          phone:'9800000006', department:'Mathematics',        designation:'Teacher',            status:'Active',     joinDate:'2023-07-01', basicSalary:45000 },
  { id:'7', tenantId:'t1', employeeCode:'EMP20240007', firstName:'Sunita',   lastName:'Patil',   email:'sunita.p@democschool.edu',    phone:'9800000007', department:'Science',            designation:'Teacher',            status:'Terminated', joinDate:'2019-06-01', basicSalary:42000 },
];

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
  const [staff,    setStaff]    = useState<Staff[]>(DEMO_STAFF);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', designation: '', basicSalary: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');

  useEffect(() => {
    fetch('/api/staff')
      .then((r) => r.json())
      .then((d: ApiResponse<Staff[]>) => { if (d.success && d.data && d.data.length) setStaff(d.data); })
      .catch(() => null);
  }, []);

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res  = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, basicSalary: Number(form.basicSalary) }),
      });
      const data = (await res.json()) as ApiResponse<Staff>;
      if (data.success) {
        setShowForm(false);
        setForm({ firstName:'', lastName:'', email:'', phone:'', department:'', designation:'', basicSalary:'' });
        // refresh
        const r2 = await fetch('/api/staff');
        const d2 = (await r2.json()) as ApiResponse<Staff[]>;
        if (d2.success && d2.data) setStaff(d2.data);
      } else {
        setFormError(data.error ?? 'Failed to add staff');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount     = staff.filter((s) => s.status === 'Active').length;
  const onLeaveCount    = staff.filter((s) => s.status === 'On-Leave').length;
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

      {/* Summary */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Staff', value: staff.length,     color: '#6366f1', bg: '#ede9fe' },
          { label: 'Active',      value: activeCount,      color: '#16a34a', bg: '#dcfce7' },
          { label: 'On Leave',    value: onLeaveCount,     color: '#d97706', bg: '#fef9c3' },
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUsers size={16} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Add New Staff Member</h3>
          </div>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleAddStaff}>
            <div style={{ marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Personal Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'firstName',   label: 'First Name',  type: 'text',  ph: 'e.g. John'         },
                { key: 'lastName',    label: 'Last Name',   type: 'text',  ph: 'e.g. Smith'        },
                { key: 'email',       label: 'Email',       type: 'email', ph: 'john@school.edu'   },
                { key: 'phone',       label: 'Phone',       type: 'text',  ph: '+91 98000 00000'   },
                { key: 'department',  label: 'Department',  type: 'text',  ph: 'e.g. Mathematics'  },
                { key: 'designation', label: 'Designation', type: 'text',  ph: 'e.g. Senior Teacher'},
              ].map(({ key, label, type, ph }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key} type={type} placeholder={ph}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required
                  />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Salary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div className="form-group">
                <label htmlFor="basicSalary">Basic Salary (₹ / month)</label>
                <input
                  id="basicSalary" type="number" min="1" placeholder="e.g. 50000"
                  value={form.basicSalary}
                  onChange={(e) => setForm((f) => ({ ...f, basicSalary: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ color: '#94a3b8' }}>HRA (auto)</label>
                <input disabled placeholder="40% of Basic" style={{ background: '#f8fafc', color: '#94a3b8' }} />
              </div>
              <div className="form-group">
                <label style={{ color: '#94a3b8' }}>PF Deduction (auto)</label>
                <input disabled placeholder="12% of Basic" style={{ background: '#f8fafc', color: '#94a3b8' }} />
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
                    <td><span className="badge badge-gray" style={{ fontFamily: 'monospace' }}>{s.employeeCode}</span></td>
                    <td><span style={{ color: deptColor, fontWeight: 500, fontSize: '13px' }}>{s.department}</span></td>
                    <td style={{ fontSize: '13px' }}>{s.designation}</td>
                    <td><span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span></td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(s.joinDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>₹{s.basicSalary.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
