'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const PUBLIC_PAGES = ['/login', '/cadastro', '/test-supabase'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, perfil, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loadingTime, setLoadingTime] = useState(0);

  // Contador de tempo de loading
  useEffect(() => {
    if (!loading) {
      setLoadingTime(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Não redireciona se estiver carregando
    if (loading) return;

    // Se é uma página pública, deixa passar
    if (PUBLIC_PAGES.includes(pathname)) return;

    // Se não tem usuário e não é página pública, redireciona para login
    if (!user) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Mostra loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Verificando sessão...</p>
          {loadingTime >= 3 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Conectando ao servidor...
            </p>
          )}
          {loadingTime >= 8 && (
            <p className="text-sm text-orange-500 mt-2">
              Conexão lenta. Aguarde mais um momento...
            </p>
          )}
        </div>
      </div>
    );
  }

  // Se não está autenticado e não é página pública, não renderiza nada
  // (o useEffect acima vai redirecionar)
  if (!user && !PUBLIC_PAGES.includes(pathname)) {
    return null;
  }

  // Renderiza o conteúdo
  return <>{children}</>;
}
