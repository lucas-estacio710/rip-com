# Plano de Refatoração - Sistema de Autenticação

> Pesquisa realizada em 07/01/2026 baseada nas melhores práticas do Supabase

## Problema Atual

1. **Query de perfil travando** - RLS na tabela `perfis` causa timeout
2. **Estado de "limbo"** - Sessão existe mas perfil não carrega
3. **Cache manual desnecessário** - `@supabase/ssr` já gerencia internamente

## Descobertas da Pesquisa

### 1. Singleton já é nativo
O `createBrowserClient` do `@supabase/ssr` **já implementa singleton internamente**. Não precisamos de cache manual.

> "Behind the scenes, createBrowserClient reuses the same client instance if called multiple times"
> — [Supabase Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)

### 2. RLS Performance - O Problema Real
A policy atual:
```sql
USING (auth.uid() = id)
```

**Problema**: Chamar `auth.uid()` diretamente em cada row é lento.

**Solução**: Envolver em SELECT para ativar cache do query planner:
```sql
USING ((select auth.uid()) = id)
```

> "This triggers query optimization caching via initPlan, dramatically reducing function invocations"
> — [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

### 3. Latência do `getUser()` vs `getSession()`
- `getUser()` faz validação no servidor (mais seguro, mais lento ~500ms)
- `getSession()` usa cache local (mais rápido, menos seguro)

**Solução recomendada**: Usar `getSession()` para UI + validar no servidor quando necessário

> — [GitHub Discussion #33434](https://github.com/orgs/supabase/discussions/33434)

### 4. Adicionar filtros explícitos
Não confiar apenas no RLS. Adicionar `.eq('id', userId)` nas queries para otimização.

---

## Plano de Ação

### Fase 1: Corrigir RLS no Supabase (SQL Editor)

```sql
-- 1. Dropar policies antigas
DROP POLICY IF EXISTS "Usuários veem seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON perfis;

-- 2. Recriar com otimização (select wrapper)
CREATE POLICY "perfis_select_own"
ON perfis FOR SELECT
TO authenticated
USING ((select auth.uid()) = id);

CREATE POLICY "perfis_update_own"
ON perfis FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id);

-- 3. Garantir índice no id (já é PK, mas confirmar)
-- O id já é PRIMARY KEY, então já tem índice

-- 4. Criar função RPC como fallback (opcional mas recomendado)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS SETOF perfis
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM perfis WHERE id = auth.uid();
$$;
```

### Fase 2: Refatorar AuthContext

```typescript
// contexts/AuthContext.tsx - Versão simplificada

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { Perfil, Unidade } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  unidade: Unidade | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carregar perfil usando RPC (mais confiável que select direto)
  const loadProfile = async (userId: string) => {
    const supabase = createClient();

    try {
      // Opção 1: Usar RPC function (recomendado)
      const { data, error } = await supabase.rpc('get_my_profile').single();

      // Opção 2: Select direto com filtro explícito (fallback)
      // const { data, error } = await supabase
      //   .from('perfis')
      //   .select('*')
      //   .eq('id', userId)
      //   .single();

      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exceção ao carregar perfil:', err);
      return null;
    }
  };

  useEffect(() => {
    const supabase = createClient();

    // Inicializar - usar getSession() para rapidez
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setSession(session);
          setUser(session.user);

          // Carregar perfil em paralelo
          const profileData = await loadProfile(session.user.id);
          if (profileData) {
            setPerfil(profileData);

            // Carregar unidade se existir
            if (profileData.unidade_id) {
              const { data: unidadeData } = await supabase
                .from('unidades')
                .select('*')
                .eq('id', profileData.unidade_id)
                .single();

              if (unidadeData) setUnidade(unidadeData);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);

        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setPerfil(null);
          setUnidade(null);
          router.push('/login');
        }

        if (event === 'SIGNED_IN' && session?.user) {
          const profileData = await loadProfile(session.user.id);
          if (profileData) {
            setPerfil(profileData);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, perfil, unidade, loading, signIn, signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

### Fase 3: Simplificar cliente Supabase

```typescript
// lib/supabase/client.ts - Já está correto!
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Fase 4: Atualizar ProtectedRoute

```typescript
// components/auth/ProtectedRoute.tsx - Simplificado

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
    if (!loading && !user && !PUBLIC_PAGES.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user && !PUBLIC_PAGES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
```

---

## Checklist de Implementação

- [ ] **SQL no Supabase**: Rodar script da Fase 1
- [ ] **Testar RPC**: Verificar se `get_my_profile()` funciona
- [ ] **Refatorar AuthContext**: Aplicar código da Fase 2
- [ ] **Testar fluxo completo**: Login → Dashboard → Refresh → Logout
- [ ] **Remover logs de debug**: Limpar console.logs excessivos
- [ ] **Atualizar versão**: Bump para v1.2.0 (minor - refatoração)

---

## Referências

- [Supabase Auth with Next.js App Router](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Latency with getUser() Discussion](https://github.com/orgs/supabase/discussions/33434)
- [Setting up Server-Side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Build User Management App Tutorial](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

**Estimativa**: A principal mudança é no SQL (RLS policy). O código TypeScript é mais uma simplificação/cleanup.
