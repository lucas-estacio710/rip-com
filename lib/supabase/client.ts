import { createBrowserClient } from '@supabase/ssr'

// Cache do cliente para evitar múltiplas instâncias
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Se já existe um cliente, reutiliza
  if (supabaseClient) {
    console.log('🔄 Reutilizando cliente Supabase existente');
    return supabaseClient;
  }

  console.log('🆕 Criando NOVO cliente Supabase');
  console.log('📍 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Key presente:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Configurações para evitar logout automático
        persistSession: true, // Persiste sessão no localStorage
        autoRefreshToken: true, // Renova token automaticamente
        detectSessionInUrl: true, // Detecta sessão em callbacks
        flowType: 'pkce', // Usa PKCE flow para maior segurança
      },
      // Configurações globais
      global: {
        headers: {
          'x-application-name': 'rip-pet-crm',
        },
      },
    }
  );

  console.log('✅ Cliente Supabase criado com sucesso');

  return supabaseClient;
}
