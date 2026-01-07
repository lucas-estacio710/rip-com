'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_PAGES = ['/login', '/cadastro', '/test-supabase'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Não redireciona se estiver carregando ou for página pública
    if (loading || PUBLIC_PAGES.includes(pathname)) return;

    // Se não tem usuário, redireciona para login
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  // Não autenticado em página protegida - não renderiza (vai redirecionar)
  if (!user && !PUBLIC_PAGES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
