import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cache do cliente para reusar a mesma instância
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  // Reusar cliente existente para evitar criar múltiplas conexões
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        detectSessionInUrl: true,
        // Configurações de debug e resiliência
        storageKey: 'rip-pet-auth',
        flowType: 'pkce', // Mais seguro
      },
      global: {
        headers: {
          'x-application-name': 'rip-pet-santos',
        },
      },
      // Aumentar timeout para conexões lentas
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    }
  );

  // Log de debug para monitorar refresh de tokens
  if (typeof window !== 'undefined') {
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refresh bem-sucedido');
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 Usuário saiu - limpando cache');
        supabaseClient = null; // Limpar cache ao fazer logout
      }
    });
  }

  return supabaseClient;
}
