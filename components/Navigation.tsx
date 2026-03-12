'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  { href: '/dashboard',      label: 'Dashboard',  icon: IconDashboard,       group: 'main' },
  { href: '/hrms',           label: 'Staff (HRMS)', icon: IconUsers,          group: 'main' },
  { href: '/hrms/payroll',   label: 'Payroll',    icon: IconDollarSign,       group: 'main' },
  { href: '/students',       label: 'Students',   icon: IconGraduationCap,   group: 'academic' },
  { href: '/fees',           label: 'Fee Management', icon: IconBriefcase,   group: 'academic' },
  { href: '/reports',        label: 'Reports',    icon: IconBarChart,         group: 'academic' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6"  x2="21" y2="6"  />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '10px',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
        }}>
          <IconSchool size={22} />
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '16px', lineHeight: 1.2 }}>
            EduCore
          </div>
          <div style={{ color: '#a5b4fc', fontSize: '11px', letterSpacing: '0.05em' }}>
            School Management
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '6px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em',
                      textTransform: 'uppercase', padding: '4px 14px 8px', opacity: 0.7 }}>
            MAIN
          </p>
          {navItems.filter(n => n.group === 'main').map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: active ? '#fff' : '#a5b4fc',
                  background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: '13.5px',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                  borderLeft: active ? '3px solid #818cf8' : '3px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1', letterSpacing: '0.1em',
                      textTransform: 'uppercase', padding: '4px 14px 8px', opacity: 0.7 }}>
            ACADEMICS
          </p>
          {navItems.filter(n => n.group === 'academic').map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 14px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: active ? '#fff' : '#a5b4fc',
                  background: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                  fontWeight: active ? 600 : 400,
                  fontSize: '13.5px',
                  transition: 'all 0.15s ease',
                  marginBottom: '2px',
                  borderLeft: active ? '3px solid #818cf8' : '3px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <a
          href="/logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 14px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#fca5a5',
            fontSize: '13.5px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.12)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          <IconLogOut size={17} />
          Sign Out
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #2d2a6e 60%, #312e81 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          boxShadow: '4px 0 16px rgba(0,0,0,0.15)',
        }}
        className="hidden-mobile"
      >
        {sidebarContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '14px',
          left: '14px',
          zIndex: 200,
          background: '#1e1b4b',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '8px',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="mobile-menu-btn"
        aria-label="Open menu"
      >
        <MenuIcon open={false} />
      </button>

      {/* Mobile overlay */}
      <div
        onClick={() => setMobileOpen(false)}
        style={{
          display: mobileOpen ? 'block' : 'none',
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 150,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Mobile drawer */}
      <aside
        style={{
          width: '260px',
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #1e1b4b 0%, #2d2a6e 60%, #312e81 100%)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 160,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: mobileOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
        }}
        className="mobile-sidebar"
      >
        <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MenuIcon open={true} />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-sidebar { display: none !important; }
        }
      `}</style>
    </>
  );
}

