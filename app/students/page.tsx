'use client';
import { useEffect, useState } from 'react';
import type { ApiResponse, Student } from '@/types';
import { IconPlus, IconGraduationCap } from '@/components/SvgIcons';

const STATUS_BADGE: Record<Student['status'], string> = {
  Active:    'badge-green',
  Graduated: 'badge-blue',
  Withdrawn: 'badge-red',
};
const GENDER_BADGE: Record<Student['gender'], string> = {
  Male:   'badge-blue',
  Female: 'badge-purple',
  Other:  'badge-gray',
};
const CLASS_COLORS = ['#6366f1','#0891b2','#16a34a','#d97706','#dc2626','#7c3aed'];

const DEMO_STUDENTS: Student[] = [
  { id:'s1', tenantId:'t1', admissionNumber:'ADM2024000001', firstName:'Arjun',   lastName:'Patel',   dateOfBirth:'2011-05-12', gender:'Male',   classId:'class8',  className:'Class VIII',  section:'A', parentName:'Ramesh Patel',  parentPhone:'9811111001', parentEmail:'ramesh.p@gmail.com',  address:'12 MG Road, Mumbai',    status:'Active',    admissionDate:'2024-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s2', tenantId:'t1', admissionNumber:'ADM2024000002', firstName:'Ananya',  lastName:'Singh',   dateOfBirth:'2012-09-23', gender:'Female', classId:'class7',  className:'Class VII',   section:'B', parentName:'Vijay Singh',   parentPhone:'9811111002', parentEmail:'vsingh@gmail.com',    address:'45 Park St, Mumbai',    status:'Active',    admissionDate:'2024-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s3', tenantId:'t1', admissionNumber:'ADM2024000003', firstName:'Rohan',   lastName:'Mehta',   dateOfBirth:'2010-03-15', gender:'Male',   classId:'class9',  className:'Class IX',    section:'C', parentName:'Suresh Mehta',  parentPhone:'9811111003', parentEmail:'smehta@gmail.com',    address:'78 Hill View, Mumbai',  status:'Active',    admissionDate:'2023-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s4', tenantId:'t1', admissionNumber:'ADM2024000004', firstName:'Kavya',   lastName:'Reddy',   dateOfBirth:'2011-11-30', gender:'Female', classId:'class8',  className:'Class VIII',  section:'A', parentName:'Ravi Reddy',    parentPhone:'9811111004', parentEmail:'rreddy@gmail.com',    address:'23 Linking Rd, Mumbai', status:'Active',    admissionDate:'2024-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s5', tenantId:'t1', admissionNumber:'ADM2024000005', firstName:'Aditya',  lastName:'Kumar',   dateOfBirth:'2013-07-08', gender:'Male',   classId:'class6',  className:'Class VI',    section:'A', parentName:'Santosh Kumar', parentPhone:'9811111005', parentEmail:'sk@gmail.com',        address:'56 Juhu Beach, Mumbai', status:'Active',    admissionDate:'2024-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s6', tenantId:'t1', admissionNumber:'ADM2024000006', firstName:'Shreya',  lastName:'Nair',    dateOfBirth:'2010-12-01', gender:'Female', classId:'class9',  className:'Class IX',    section:'B', parentName:'Mohan Nair',    parentPhone:'9811111006', parentEmail:'mnair@gmail.com',     address:'89 Bandra, Mumbai',     status:'Active',    admissionDate:'2023-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s7', tenantId:'t1', admissionNumber:'ADM2024000007', firstName:'Vikram',  lastName:'Joshi',   dateOfBirth:'2009-04-17', gender:'Male',   classId:'class10', className:'Class X',     section:'A', parentName:'Deepak Joshi',  parentPhone:'9811111007', parentEmail:'djoshi@gmail.com',    address:'34 Andheri, Mumbai',    status:'Graduated', admissionDate:'2022-06-10', createdAt:'2024-01-01T00:00:00Z' },
  { id:'s8', tenantId:'t1', admissionNumber:'ADM2024000008', firstName:'Pooja',   lastName:'Gupta',   dateOfBirth:'2014-02-28', gender:'Female', classId:'class5',  className:'Class V',     section:'B', parentName:'Ashok Gupta',   parentPhone:'9811111008', parentEmail:'agupta@gmail.com',    address:'67 Powai, Mumbai',      status:'Active',    admissionDate:'2024-06-10', createdAt:'2024-01-01T00:00:00Z' },
];

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
  const [students,  setStudents]  = useState<Student[]>(DEMO_STUDENTS);
  const [showForm,  setShowForm]  = useState(false);
  const [filter,    setFilter]    = useState<Student['status'] | 'All'>('All');
  const [form,      setForm]      = useState({
    firstName:'', lastName:'', dateOfBirth:'', gender:'Male' as Student['gender'],
    classId:'', className:'', section:'A', parentName:'', parentPhone:'', parentEmail:'', address:'',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError,  setFormError]  = useState('');

  useEffect(() => {
    fetch('/api/students')
      .then((r) => r.json())
      .then((d: ApiResponse<Student[]>) => { if (d.success && d.data && d.data.length) setStudents(d.data); })
      .catch(() => null);
  }, []);

  async function handleAdmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      const res  = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as ApiResponse<Student>;
      if (data.success) {
        setShowForm(false);
        setForm({ firstName:'', lastName:'', dateOfBirth:'', gender:'Male', classId:'', className:'', section:'A', parentName:'', parentPhone:'', parentEmail:'', address:'' });
        const r2 = await fetch('/api/students');
        const d2 = (await r2.json()) as ApiResponse<Student[]>;
        if (d2.success && d2.data) setStudents(d2.data);
      } else {
        setFormError(data.error ?? 'Failed to admit student');
      }
    } catch {
      setFormError('Network error');
    } finally {
      setSubmitting(false);
    }
  }

  const filtered       = filter === 'All' ? students : students.filter((s) => s.status === filter);
  const activeCount    = students.filter((s) => s.status === 'Active').length;
  const graduatedCount = students.filter((s) => s.status === 'Graduated').length;
  const withdrawnCount = students.length - activeCount - graduatedCount;

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">Admission → Class Assignment → Grading → Promotion lifecycle</p>
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
          { label: 'Active',         value: activeCount,     color: '#16a34a', bg: '#dcfce7' },
          { label: 'Graduated',      value: graduatedCount,  color: '#2563eb', bg: '#dbeafe' },
          { label: 'Withdrawn',      value: withdrawnCount,  color: '#dc2626', bg: '#fee2e2' },
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

      {/* Admit Form */}
      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: '#6366f1', borderWidth: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: '32px', height: '32px', background: '#ede9fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconGraduationCap size={16} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>New Student Admission</h3>
          </div>
          {formError && <div className="alert alert-error">{formError}</div>}
          <form onSubmit={handleAdmit}>
            <div style={{ marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Personal Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              {[
                { key:'firstName',   label:'First Name',   type:'text',  ph:'e.g. Arjun'    },
                { key:'lastName',    label:'Last Name',    type:'text',  ph:'e.g. Patel'    },
                { key:'dateOfBirth', label:'Date of Birth',type:'date',  ph:''              },
              ].map(({ key, label, type, ph }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} type={type} placeholder={ph} value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required />
                </div>
              ))}
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Student['gender'] }))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="className">Class Name</label>
                <select id="className" value={form.className} onChange={(e) => setForm((f) => ({ ...f, className: e.target.value, classId: e.target.value.toLowerCase().replace(/\s/g, '') }))}>
                  {['Class V','Class VI','Class VII','Class VIII','Class IX','Class X','Class XI','Class XII'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="section">Section</label>
                <select id="section" value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}>
                  {['A','B','C','D','Science','Arts','Commerce'].map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: '10px', fontSize: '11px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Parent / Guardian
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              {[
                { key:'parentName',  label:'Parent Name',  type:'text',  ph:'e.g. Ramesh Patel'    },
                { key:'parentPhone', label:'Parent Phone',  type:'tel',   ph:'+91 98000 00000'      },
                { key:'parentEmail', label:'Parent Email',  type:'email', ph:'parent@gmail.com'     },
              ].map(({ key, label, type, ph }) => (
                <div key={key} className="form-group">
                  <label htmlFor={key}>{label}</label>
                  <input id={key} type={type} placeholder={ph} value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} required={key !== 'parentEmail'} />
                </div>
              ))}
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label htmlFor="address">Address</label>
                <input id="address" type="text" placeholder="e.g. 12 MG Road, Mumbai" value={form.address}
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
        {(['All','Active','Graduated','Withdrawn'] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 16px', borderRadius: '9999px', fontSize: '13px',
            fontWeight: filter === s ? 600 : 400, cursor: 'pointer',
            background: filter === s ? '#6366f1' : '#f1f5f9',
            color: filter === s ? '#fff' : '#64748b', border: 'none',
          }}>
            {s} ({s === 'All' ? students.length : students.filter((x) => x.status === s).length})
          </button>
        ))}
      </div>

      {/* Students Table */}
      <div className="card">
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
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{s.firstName} {s.lastName}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {new Date(s.dateOfBirth).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-gray" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{s.admissionNumber}</span></td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#6366f1' }}>{s.className}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}> – {s.section}</span>
                  </td>
                  <td><span className={`badge ${GENDER_BADGE[s.gender]}`}>{s.gender}</span></td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.parentName}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.parentPhone}</div>
                  </td>
                  <td><span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span></td>
                  <td style={{ fontSize: '13px', color: '#64748b' }}>
                    {new Date(s.admissionDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
