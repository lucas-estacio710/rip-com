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
      },
      global: {
        headers: {
          'x-application-name': 'rip-pet-santos',
        },
      },
    }
  );

  return supabaseClient;
}
