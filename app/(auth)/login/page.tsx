'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ApiResponse, User } from '@/types';
import { IconSchool } from '@/components/SvgIcons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@school.com');
  const [password, setPassword] = useState('demo123');
  const [tenantId, setTenantId] = useState('school1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, tenantId }),
      });
      const data = (await res.json()) as ApiResponse<User>;
      if (data.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error ?? 'Login failed');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #6366f1 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '18px',
            marginBottom: '16px',
            backdropFilter: 'blur(10px)',
          }}>
            <IconSchool size={32} />
          </div>
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>
            EduCore SaaS
          </h1>
          <p style={{ color: '#a5b4fc', fontSize: '14px' }}>
            School Management Platform
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a', marginBottom: '6px' }}>
            Welcome back
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            Sign in to your school account
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label htmlFor="tenantId">School ID</label>
              <input
                id="tenantId"
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="e.g. school1"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@school.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px', marginTop: '4px' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{
            marginTop: '24px',
            padding: '14px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>
              Demo credentials
            </p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Email: admin@school.com</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Password: demo123</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>School ID: school1</p>
          </div>
        </div>
      </div>
    </div>
  );
}
