'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function forceLogout() {
      const supabase = createClient();

      // Força logout
      await supabase.auth.signOut();

      // Limpa localStorage
      localStorage.clear();

      // Redireciona para login
      setTimeout(() => {
        router.push('/login');
        router.refresh();
      }, 100);
    }

    forceLogout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Limpando sessão...</p>
      </div>
    </div>
  );
}
