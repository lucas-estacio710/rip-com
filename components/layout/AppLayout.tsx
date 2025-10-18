'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navigation from './Navigation';
import Header from './Header';
import ProtectedRoute from '../auth/ProtectedRoute';

// Páginas que não precisam de layout (login, etc.)
const PUBLIC_PAGES = ['/login', '/cadastro', '/test-supabase'];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PAGES.includes(pathname);

  // Páginas públicas não usam o layout padrão nem proteção
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Páginas autenticadas usam o layout completo com proteção
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar - Desktop only */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />

          {/* Page content with padding for mobile navigation */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="container mx-auto px-4 py-6 max-w-7xl">{children}</div>
          </main>
        </div>

        {/* Bottom Navigation - Mobile only */}
        <Navigation />
      </div>
    </ProtectedRoute>
  );
}
