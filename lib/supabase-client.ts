import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Cache do cliente para reusar a mesma instância
let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;
let clientCreatedAt: number = 0;

// Força recriação do cliente após 50 minutos (antes do token expirar)
const MAX_CLIENT_AGE = 50 * 60 * 1000; // 50 minutos

export function createClient() {
  const now = Date.now();
  const clientAge = now - clientCreatedAt;

  // Recriar cliente se:
  // 1. Não existe ainda
  // 2. Está muito antigo (perto de expirar token)
  const shouldRecreate = !supabaseClient || clientAge > MAX_CLIENT_AGE;

  if (shouldRecreate) {
    if (supabaseClient) {
      console.log(`♻️ Recriando cliente Supabase (idade: ${Math.round(clientAge / 1000 / 60)}min)`);
      // Limpar listeners antigos
      supabaseClient = null;
    }
    clientCreatedAt = now;
  } else if (supabaseClient) {
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
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      console.log(`🔔 Auth event: ${event}`, session ? 'com sessão' : 'sem sessão');

      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refresh bem-sucedido');
        clientCreatedAt = Date.now(); // Reset timer
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 Usuário saiu - limpando cache');
        supabaseClient = null; // Limpar cache ao fazer logout
        clientCreatedAt = 0;
      } else if (event === 'USER_UPDATED') {
        console.log('🔄 Usuário atualizado');
      }

      // CRÍTICO: Se recebeu evento mas não tem sessão (exceto SIGNED_OUT)
      // significa que refresh falhou
      if (!session && event !== 'SIGNED_OUT' && event !== 'INITIAL_SESSION') {
        console.error('⚠️ Evento de auth sem sessão! Possível falha no refresh.');
        console.error(`⚠️ Isso pode causar queries travadas. Evento: ${event}`);
      }
    });

    // Listener para erros de auth
    supabaseClient.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && typeof window !== 'undefined') {
        const hadSession = localStorage.getItem('rip-pet-auth');
        if (hadSession) {
          console.warn('⚠️ Sessão perdida! Pode ter expirado.');
        }
      }
    });
  }

  return supabaseClient;
}
