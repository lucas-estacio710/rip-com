# 🚀 Guia de Migração: @supabase/auth-helpers-nextjs → @supabase/ssr

## ⚠️ POR QUE MIGRAR?

O pacote `@supabase/auth-helpers-nextjs` está **DEPRECADO** e não é compatível com Next.js 15.

**Problemas atuais:**
- ❌ Timeouts de 10 segundos
- ❌ Erros com `cookies()` assíncrono
- ❌ Sessions inválidas
- ❌ RLS não funcionando corretamente

## 📦 PASSO 1: Instalar Novos Pacotes

```bash
# Desinstalar pacotes antigos
npm uninstall @supabase/auth-helpers-nextjs

# Instalar novos pacotes
npm install @supabase/ssr@latest @supabase/supabase-js@latest
```

## 🔄 PASSO 2: Mapeamento de Funções

| Antigo (auth-helpers-nextjs) | Novo (@supabase/ssr) |
|------------------------------|----------------------|
| `createClientComponentClient` | `createBrowserClient` |
| `createServerComponentClient` | `createServerClient` |
| `createMiddlewareClient` | `createServerClient` (com middleware) |
| `createRouteHandlerClient` | `createServerClient` |

## 📝 PASSO 3: Criar Novos Utilitários

### 3.1 Cliente do Navegador (components/providers)

**Arquivo:** `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 3.2 Cliente do Servidor (Server Components)

**Arquivo:** `lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies() // ⚠️ ASYNC no Next.js 15!

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // O método `setAll` foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver middleware refreshando
            // as sessões do usuário.
          }
        },
      },
    }
  )
}
```

### 3.3 Cliente para Route Handlers (API Routes)

**Arquivo:** `lib/supabase/route-handler.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

export async function createClient(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  return { supabase, supabaseResponse }
}
```

## 🔧 PASSO 4: Atualizar Middleware

**Arquivo:** `middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Atualizar sessão - sem isso, o usuário é deslogado aleatoriamente
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Proteger rotas
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## 🔄 PASSO 5: Atualizar AuthContext

**CRÍTICO:** Use `getUser()` ao invés de `getSession()`

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // ✅ CORRETO: Usar getUser() ao invés de getSession()
    // getUser() revalida o token SEMPRE
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Error loading user:', error);
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## 🛠️ PASSO 6: Atualizar API Routes

**Antes:**
```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createRouteHandlerClient({ cookies });
```

**Depois:**
```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = await cookies(); // ASYNC!

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Seu código aqui
}
```

## ✅ PASSO 7: Checklist de Migração

- [ ] Desinstalar `@supabase/auth-helpers-nextjs`
- [ ] Instalar `@supabase/ssr`
- [ ] Criar `lib/supabase/client.ts` (browser)
- [ ] Criar `lib/supabase/server.ts` (server)
- [ ] Atualizar `middleware.ts`
- [ ] Atualizar `AuthContext.tsx` (usar `getUser()`)
- [ ] Atualizar todas as API routes
- [ ] Atualizar Server Components
- [ ] Testar login/logout
- [ ] Testar proteção de rotas
- [ ] Verificar cookies no DevTools

## 🎯 PASSO 8: Executar SQL no Supabase

Execute o arquivo `URGENT_fix_timeout_and_rls.sql` no SQL Editor do Supabase para:
- ✅ Aumentar timeouts (3s → 30s)
- ✅ Adicionar índices
- ✅ Verificar políticas RLS

## 🔍 PASSO 9: Verificação

### Teste 1: Login
```bash
# Deve funcionar sem timeout
```

### Teste 2: Verificar Cookies
Abra DevTools → Application → Cookies
- Deve ter: `sb-<project>-auth-token`
- Formato: JSON válido (não base64)

### Teste 3: Console
Não deve ter erros sobre:
- ❌ cookies() should be awaited
- ❌ Failed to parse cookie string

## 📚 Referências

- [Migração Oficial](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [Next.js 15 + Supabase](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

## ⚠️ IMPORTANTE

**NÃO use ambos os pacotes ao mesmo tempo!** Isso causa conflitos de autenticação.

Após a migração, o timeout de 10s deve desaparecer completamente.
