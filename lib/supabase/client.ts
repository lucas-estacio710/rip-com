import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
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
  )
}
