'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconDashboard,
  IconUsers,
  IconGraduationCap,
  IconDollarSign,
  IconBriefcase,
  IconBarChart,
  IconLogOut,
  IconSchool,
} from '@/components/SvgIcons';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { href: '/hrms', label: 'HRMS', icon: IconUsers },
  { href: '/hrms/payroll', label: 'Payroll', icon: IconDollarSign },
  { href: '/students', label: 'Students', icon: IconGraduationCap },
  { href: '/fees', label: 'Fees', icon: IconBriefcase },
  { href: '/reports', label: 'Reports', icon: IconBarChart },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          background: '#6366f1',
          borderRadius: '10px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <IconSchool size={22} />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', lineHeight: 1.2 }}>
            EduCore
          </div>
          <div style={{ color: '#a5b4fc', fontSize: '11px' }}>SaaS Platform</div>
        </div>
      </div>

      {/* Nav Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                color: active ? '#fff' : '#a5b4fc',
                background: active ? 'rgba(99,102,241,0.4)' : 'transparent',
                fontWeight: active ? 600 : 400,
                fontSize: '14px',
                transition: 'all 0.15s ease',
                borderLeft: active ? '3px solid #818cf8' : '3px solid transparent',
              }}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <a
          href="/logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            textDecoration: 'none',
            color: '#fca5a5',
            fontSize: '14px',
          }}
        >
          <IconLogOut size={18} />
          Sign Out
        </a>
      </div>
    </aside>
  );
}
