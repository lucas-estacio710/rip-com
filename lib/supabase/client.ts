// Cliente Supabase simplificado usando fetch direto
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Armazenar sessão
let currentSession: any = null;

// Carregar sessão do localStorage
function loadSession() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('supabase_session');
    if (stored) {
      currentSession = JSON.parse(stored);
      return currentSession;
    }
  } catch (e) {
    console.error('Erro ao carregar sessão:', e);
  }
  return null;
}

// Salvar sessão no localStorage
function saveSession(session: any) {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem('supabase_session', JSON.stringify(session));
      currentSession = session;
    } else {
      localStorage.removeItem('supabase_session');
      currentSession = null;
    }
  } catch (e) {
    console.error('Erro ao salvar sessão:', e);
  }
}

// Headers para requisições
function getHeaders(accessToken?: string) {
  const token = accessToken || currentSession?.access_token || SUPABASE_ANON_KEY;
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

// Cliente simplificado
export function createClient() {
  // Carregar sessão ao criar cliente
  loadSession();

  return {
    auth: {
      getSession: async () => {
        const session = loadSession();
        return { data: { session }, error: null };
      },

      getUser: async () => {
        const session = loadSession();
        return { data: { user: session?.user || null }, error: null };
      },

      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try {
          const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            return { data: { user: null, session: null }, error: data };
          }

          const session = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            user: data.user,
          };

          saveSession(session);
          return { data: { user: data.user, session }, error: null };
        } catch (error) {
          return { data: { user: null, session: null }, error };
        }
      },

      signOut: async () => {
        saveSession(null);
        return { error: null };
      },

      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // Chamar callback com sessão atual
        const session = loadSession();
        if (session) {
          setTimeout(() => callback('SIGNED_IN', session), 0);
        }

        return {
          data: {
            subscription: {
              unsubscribe: () => {},
            },
          },
        };
      },
    },

    from: (table: string) => ({
      select: (columns = '*') => {
        let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(columns)}`;
        let filters: string[] = [];
        let limitVal: number | null = null;
        let singleRow = false;

        const builder = {
          eq: (column: string, value: any) => {
            filters.push(`${column}=eq.${value}`);
            return builder;
          },
          gte: (column: string, value: any) => {
            filters.push(`${column}=gte.${encodeURIComponent(value)}`);
            return builder;
          },
          limit: (count: number) => {
            limitVal = count;
            return builder;
          },
          single: () => {
            singleRow = true;
            limitVal = 1;
            return builder;
          },
          maybeSingle: () => {
            singleRow = true;
            limitVal = 1;
            return builder;
          },
          then: async (resolve: any) => {
            let finalUrl = url;
            if (filters.length > 0) {
              finalUrl += '&' + filters.join('&');
            }
            if (limitVal) {
              finalUrl += `&limit=${limitVal}`;
            }

            try {
              const response = await fetch(finalUrl, {
                headers: getHeaders(),
              });

              const data = await response.json();

              if (!response.ok) {
                resolve({ data: null, error: data });
                return;
              }

              if (singleRow) {
                resolve({ data: data[0] || null, error: null });
              } else {
                resolve({ data, error: null, count: data.length });
              }
            } catch (error) {
              resolve({ data: null, error });
            }
          },
        };

        return builder;
      },

      insert: (values: any) => ({
        select: () => ({
          single: async () => {
            try {
              const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(values),
              });

              const data = await response.json();

              if (!response.ok) {
                return { data: null, error: data };
              }

              return { data: Array.isArray(data) ? data[0] : data, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
        }),
      }),

      update: (values: any) => {
        let filters: string[] = [];

        const builder = {
          eq: (column: string, value: any) => {
            filters.push(`${column}=eq.${value}`);
            return builder;
          },
          then: async (resolve: any) => {
            const url = `${SUPABASE_URL}/rest/v1/${table}?${filters.join('&')}`;

            try {
              const response = await fetch(url, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(values),
              });

              if (!response.ok) {
                const error = await response.json();
                resolve({ data: null, error });
                return;
              }

              const data = await response.json();
              resolve({ data, error: null });
            } catch (error) {
              resolve({ data: null, error });
            }
          },
        };

        return builder;
      },

      delete: () => {
        let filters: string[] = [];

        const builder = {
          eq: (column: string, value: any) => {
            filters.push(`${column}=eq.${value}`);
            return builder;
          },
          then: async (resolve: any) => {
            const url = `${SUPABASE_URL}/rest/v1/${table}?${filters.join('&')}`;

            try {
              const response = await fetch(url, {
                method: 'DELETE',
                headers: getHeaders(),
              });

              if (!response.ok) {
                const error = await response.json();
                resolve({ data: null, error });
                return;
              }

              resolve({ data: null, error: null });
            } catch (error) {
              resolve({ data: null, error });
            }
          },
        };

        return builder;
      },
    }),

    rpc: (functionName: string, params?: any) => ({
      maybeSingle: async () => {
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(params || {}),
          });

          const data = await response.json();

          if (!response.ok) {
            return { data: null, error: data };
          }

          return { data: Array.isArray(data) ? data[0] : data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
    }),
  };
}
