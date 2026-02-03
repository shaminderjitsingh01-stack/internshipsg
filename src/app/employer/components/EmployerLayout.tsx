'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header, Footer } from '@/components';
import { useAuth } from '@/context/AuthContext';
import EmployerSidebar from './EmployerSidebar';
import EmployerMobileNav from './EmployerMobileNav';

interface EmployerLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function EmployerLayout({ children, title, subtitle }: EmployerLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/employer/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <Header />

      <div className="flex-1 flex pt-16">
        <EmployerSidebar />

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--foreground)]">{title}</h1>
              {subtitle && <p className="text-[var(--muted)] mt-1">{subtitle}</p>}
            </div>

            {/* Mobile Navigation */}
            <EmployerMobileNav />

            {/* Page Content */}
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
