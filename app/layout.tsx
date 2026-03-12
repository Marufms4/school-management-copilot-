import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EduCore SaaS – School Management',
  description: 'Comprehensive school management platform with HRMS, Student ERP, and Finance.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
