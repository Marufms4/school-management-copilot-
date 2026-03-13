import Navigation from '@/components/Navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EduCore – Dashboard',
  description: 'EduCore School Management System',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-layout">
      <Navigation />
      <main className="page-content">
        {children}
      </main>
    </div>
  );
}
