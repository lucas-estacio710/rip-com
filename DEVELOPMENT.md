# 🔧 Guia de Desenvolvimento - RIP.PET CRM

> **IMPORTANTE PARA CLAUDE CODE**: Leia este arquivo no início de cada nova sessão!

## 📋 Regras Críticas

### 1. **SEMPRE atualizar versão antes de push**

**OBRIGATÓRIO**: Antes de fazer `git push`, SEMPRE incrementar a versão em `lib/version.ts`

```typescript
// lib/version.ts
export const APP_VERSION = '1.0.1'; // ← Mudar aqui
export const APP_BUILD_DATE = '2025-10-28'; // ← Atualizar data
```

**Regras de versionamento (Semantic Versioning):**
- `1.0.X` → Bugfixes, pequenas correções
- `1.X.0` → Novas funcionalidades
- `X.0.0` → Mudanças breaking/grandes refactors

**Exemplos:**
- Fix de bug → 1.0.0 → 1.0.1
- Nova feature (visitas) → 1.0.1 → 1.1.0
- Migração SSR (breaking) → 1.1.0 → 2.0.0

### 2. **Script helper para incrementar versão**

Use o comando:
```bash
npm run version:patch  # 1.0.0 → 1.0.1
npm run version:minor  # 1.0.0 → 1.1.0
npm run version:major  # 1.0.0 → 2.0.0
```

### 3. **Formato de commit**

Incluir a versão no commit message:
```
feat: Descrição da feature [v1.1.0]

ou

fix: Descrição do bugfix [v1.0.1]
```

## 🔄 Workflow Padrão

### Antes de CADA push:

```bash
# 1. Incrementar versão (escolha um):
npm run version:patch   # para bugfixes
npm run version:minor   # para features
npm run version:major   # para breaking changes

# 2. Verificar que mudou:
cat lib/version.ts

# 3. Commit normalmente:
git add -A
git commit -m "feat: Nova funcionalidade [v1.1.0]"

# 4. Push:
git push
```

## 📁 Estrutura do Projeto

```
rip-com/
├── app/                    # Next.js 15 App Router
├── components/             # Componentes React
├── contexts/              # React Contexts (Auth, etc)
├── lib/
│   ├── version.ts         # ⚠️ VERSÃO - Mudar antes de push!
│   ├── supabase/
│   │   ├── client.ts      # Cliente browser
│   │   └── server.ts      # Cliente server (async)
│   └── db.ts              # Funções de banco
├── supabase/              # SQL migrations e schemas
└── DEVELOPMENT.md         # ← Você está aqui
```

## 🔐 Autenticação

- **Package:** `@supabase/ssr` (migrado de @supabase/auth-helpers-nextjs)
- **Session persistence:** localStorage
- **Auto-refresh:** Habilitado
- **Flow:** PKCE

### Problemas Comuns:

**Logout automático?**
- Verificar `lib/supabase/client.ts` → `autoRefreshToken: true`
- Verificar `contexts/AuthContext.tsx` → tratamento de TOKEN_REFRESHED

**RLS errors?**
- Sempre incluir `unidade_id` ao criar registros
- Verificar sessão ativa antes de queries

## 🗄️ Banco de Dados

**Supabase PostgreSQL com RLS**

Timeouts configurados:
- `anon`: 30s
- `authenticated`: 60s
- `service_role`: 120s

### Queries lentas?
1. Verificar índices
2. Ver `supabase/URGENT_fix_timeout_and_rls.sql`
3. Logs detalhados em `lib/db.ts`

## 🐛 Debug

**Logs importantes:**
- `🔔 Auth event:` → Eventos de autenticação
- `🔄 Token renovado` → Refresh bem-sucedido
- `❌ [createEstabelecimento]` → Erro ao criar registro
- `⏱️ Carregamento de estabelecimentos` → Performance

## 📝 TODOs para Próximas Sessões

- [ ] Implementar middleware com RLS (atualmente desabilitado)
- [ ] Adicionar testes automatizados
- [ ] Implementar sistema de notificações
- [ ] Dashboard analytics
- [ ] Export de relatórios PDF

## 🚨 Alertas Críticos

### NÃO FAZER:
- ❌ Push sem incrementar versão
- ❌ Modificar RLS policies sem testar
- ❌ Usar getSession() ao invés de getUser() em server
- ❌ Criar registros sem `unidade_id`
- ❌ Commits sem mensagem descritiva

### SEMPRE FAZER:
- ✅ Incrementar versão antes de push
- ✅ Testar autenticação após mudanças
- ✅ Logs detalhados em operações críticas
- ✅ Verificar que servidor está rodando (npm run dev)

---

No mais, o Lucão (sempre chame ele assim) é muito gente boa. Estamos construindo este app sensacional que vai mudar a vida dele, então sempre capriche e esteja muito atento!!!

**Última atualização:** 2025-10-28
**Versão atual do documento:** 1.0.0
