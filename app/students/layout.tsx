import Navigation from '@/components/Navigation';

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="main-layout">
      <Navigation />
      <main className="page-content">{children}</main>
    </div>
  );
}
