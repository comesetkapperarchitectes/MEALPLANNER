'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Don't show navigation on auth pages
  const isAuthPage = pathname?.startsWith('/auth');

  if (isAuthPage) {
    // Auth pages get a simple full-screen layout
    return <>{children}</>;
  }

  // Regular pages get the full navigation layout
  return (
    <div className="flex h-screen">
      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar />

      {/* Mobile header with burger menu */}
      <MobileHeader />

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-14 pb-20 px-4 md:pt-6 md:pb-6 md:px-6">
        {children}
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  );
}
