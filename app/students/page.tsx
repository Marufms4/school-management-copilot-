'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, Student } from '@/types';
import { IconPlus, IconGraduationCap } from '@/components/SvgIcons';

const STATUS_BADGE: Record<Student['status'], string> = {
  Active: 'badge-green',
  Graduated: 'badge-blue',
  Withdrawn: 'badge-red',
};

const GENDER_BADGE: Record<Student['gender'], string> = {
  Male: 'badge-blue',
  Female: 'badge-purple',
  Other: 'badge-gray',
};

const CLASS_COLORS = ['#6366f1', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];

function ClassAvatar({ className, section }: { className: string; section: string }) {
  const idx = parseInt(className.replace(/\D/g, '')) % CLASS_COLORS.length;
  const color = CLASS_COLORS[idx] ?? '#6366f1';
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px',
      background: `${color}20`, color, fontSize: '11px',
      fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, textAlign: 'center', lineHeight: 1.2,
    }}>
      {className.replace('Class ', 'C')}{section}
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<Student['status'] | 'All'>('All');
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'Male' as Student['gender'],
    classId: '', className: '', section: 'A', parentName: '', parentPhone: '', parentEmail: '', address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { fetchStudents(); }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = (await res.json()) as ApiResponse<Student[]>;
      if (data.success && data.data) setStudents(data.data);
      else setError(data.error ?? 'Failed to fetch students');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as ApiResponse<Student>;
      if (data.success) {
        setShowForm(false);
        setForm({
          firstName: '', lastName: '', dateOfBirth: '', gender: 'Male',
          classId: '', className: '', section: 'A', parentName: '', parentPhone: '', parentEmail: '', address: '',
        });
        await fetchStudents();
      } else {
        setFormError(data.error ?? 'Failed to admit student');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filter === 'All' ? students : students.filter((s) => s.status === filter);
  const activeCount = students.filter((s) => s.status === 'Active').length;
  const graduatedCount = students.filter((s) => s.status === 'Graduated').length;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">Student lifecycle: Admission → Class Assignment → Grading → Promotion</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <IconPlus size={16} />
          Admit Student
        </button>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '24px' }}>
        {[
          { label: 'Total Students', value: students.length, color: '#6366f1', bg: '#ede9fe' },
          { label: 'Active', value: activeCount, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Graduated', value: graduatedCount, color: '#2563eb', bg: '#dbeafe' },
          { label: 'Withdrawn', value: students.length - activeCount - graduatedCount, color: '#dc2626', bg: '#fee2e2' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="stat-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <div className="stat-icon" style={{ background: bg, color, flexShrink: 0 }}>
              <IconGraduationCap size={20} />
            </div>
            <div>
              <div className="stat-value" style={{ fontSize: '22px', color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Student Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: '#6366f1', borderWidth: '2px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '20px' }}>
            New Student Admission
          </h3>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleAdmit}>
            <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Personal Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'firstName', label: 'First Name', type: 'text' },
                { key: 'lastName', label: 'Last Name', type: 'text' },
                { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
              ].map(({ key, label, type }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} type={type} value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required />
                </div>
              ))}
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Student['gender'] }))}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="classId">Class ID</label>
                <input id="classId" type="text" placeholder="e.g. class8a" value={form.classId}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label htmlFor="className">Class Name</label>
                <input id="className" type="text" placeholder="e.g. Class 8" value={form.className}
                  onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))} />
              </div>
              <div className="form-group">
                <label htmlFor="section">Section</label>
                <select id="section" value={form.section}
                  onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}>
                  {['A', 'B', 'C', 'D', 'Science', 'Arts', 'Commerce'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Parent/Guardian Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { key: 'parentName', label: 'Parent Name', type: 'text' },
                { key: 'parentPhone', label: 'Parent Phone', type: 'tel' },
                { key: 'parentEmail', label: 'Parent Email', type: 'email' },
              ].map(({ key, label, type }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} type={type} value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    required={key !== 'parentEmail'} />
                </div>
              ))}
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label htmlFor="address">Address</label>
                <input id="address" type="text" value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Admitting…' : 'Complete Admission'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {(['All', 'Active', 'Graduated', 'Withdrawn'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 16px', borderRadius: '9999px', fontSize: '13px',
              fontWeight: filter === s ? 600 : 400, cursor: 'pointer',
              background: filter === s ? '#6366f1' : '#f1f5f9',
              color: filter === s ? '#fff' : '#64748b',
              border: 'none',
            }}
          >
            {s} {s === 'All' ? `(${students.length})` : `(${students.filter((x) => x.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Students Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading student data…</div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Admission No.</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent</th>
                  <th>Status</th>
                  <th>Admission Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ClassAvatar className={s.className} section={s.section} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                            {s.firstName} {s.lastName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            {new Date(s.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {s.admissionNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#6366f1' }}>{s.className}</span>
                      <span style={{ color: '#94a3b8', fontSize: '12px' }}> – {s.section}</span>
                    </td>
                    <td>
                      <span className={`badge ${GENDER_BADGE[s.gender]}`}>{s.gender}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.parentName}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.parentPhone}</div>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {new Date(s.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
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
