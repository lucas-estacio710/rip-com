# 🚨 PLANO DE AÇÃO IMEDIATO - Resolver Timeout de 10s

## 📊 RESUMO DA SITUAÇÃO

**Problema:** AuthContext timeout de 10 segundos + sessões inválidas
**Causa Raiz:** Múltiplos problemas identificados via pesquisa web
**Impacto:** Aplicação inutilizável, usuários não conseguem fazer login

---

## 🎯 AÇÕES PRIORITÁRIAS (ORDEM DE EXECUÇÃO)

### ✅ AÇÃO 1: SQL - Aumentar Timeout (5 minutos)
**URGÊNCIA:** 🔴 CRÍTICA

```bash
# 1. Abrir Supabase Dashboard → SQL Editor
# 2. Executar arquivo: supabase/URGENT_fix_timeout_and_rls.sql
```

**O que faz:**
- ⏱️ Aumenta timeout: 3s → 30s (anon), 8s → 60s (auth)
- 📊 Adiciona índices para RLS performance
- 🔍 Verifica políticas problemáticas

**Resultado esperado:** Timeout reduzido imediatamente

---

### ✅ AÇÃO 2: SQL - Otimizar RLS (2 minutos)
**URGÊNCIA:** 🟠 ALTA

```bash
# Se ainda não executou, execute:
# supabase/fix_rls_performance.sql
```

**O que faz:**
- Substitui `auth.uid()` por `(select auth.uid())`
- Remove políticas duplicadas
- Performance 10-100x melhor

---

### ✅ AÇÃO 3: Migração @supabase/ssr (30 minutos)
**URGÊNCIA:** 🟡 MÉDIA (mas resolve definitivamente)

```bash
# 1. Ler: MIGRATION_GUIDE_SSR.md
# 2. Desinstalar pacote antigo
npm uninstall @supabase/auth-helpers-nextjs

# 3. Instalar novo
npm install @supabase/ssr@latest @supabase/supabase-js@latest

# 4. Criar novos utilitários (seguir guia)
# 5. Atualizar AuthContext para usar getUser()
```

**Por que migrar:**
- ✅ Compatível com Next.js 15
- ✅ Cookies assíncronos funcionando
- ✅ getUser() confiável
- ✅ Sem mais timeouts aleatórios

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Após executar as ações acima, verificar:

### Teste 1: SQL Executado com Sucesso
```sql
-- No Supabase SQL Editor, executar:
SELECT rolname, rolconfig
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated');

-- Deve mostrar:
-- anon: statement_timeout=30s
-- authenticated: statement_timeout=60s
```

### Teste 2: Aplicação Funcionando
- [ ] Login funciona sem timeout
- [ ] Não há erro de cookies no console
- [ ] Perfil do usuário carrega em < 2s
- [ ] RLS não bloqueia queries

### Teste 3: Console Limpo
Abrir DevTools, não deve ter:
- ❌ `⏰ TIMEOUT: loadUserData demorou mais de 10 segundos!`
- ❌ `cookies() should be awaited`
- ❌ `Failed to parse cookie string`

---

## 🔍 DIAGNÓSTICO - O QUE ESTAVA ERRADO?

### Problema 1: Package Deprecado ❌
- **Usando:** `@supabase/auth-helpers-nextjs` (DEPRECADO)
- **Deveria usar:** `@supabase/ssr`
- **Impacto:** Incompatível com Next.js 15

### Problema 2: Timeout Muito Curto ⏱️
- **Padrão:** 3s (anon), 8s (authenticated)
- **Necessário:** 30s+
- **Impacto:** Queries RLS complexas falham

### Problema 3: RLS Não Otimizado 🐌
- **Código atual:** `WHERE id = auth.uid()` (avalia por row)
- **Correto:** `WHERE id = (select auth.uid())` (avalia 1x)
- **Impacto:** 10-100x mais lento

### Problema 4: getSession() Não Confiável 🚫
- **getSession():** Não revalida token
- **getUser():** Revalida no servidor
- **Impacto:** Sessões inválidas, logout aleatório

### Problema 5: Cookies Síncrono no Next.js 15 🍪
- **Next.js 15:** `cookies()` é async
- **Código atual:** Usa de forma síncrona
- **Impacto:** Erro + bloqueio de autenticação

---

## 📈 RESULTADOS ESPERADOS

### ANTES ❌
```
⏱️ loadUserData: 10,000ms+ (TIMEOUT)
🐌 RLS query: 5,000ms
❌ Login falha 50% das vezes
🔴 Console cheio de erros
```

### DEPOIS ✅
```
⚡ loadUserData: 200-500ms
🚀 RLS query: 50-100ms
✅ Login funciona 100%
✨ Console limpo
```

---

## 🆘 SE AINDA DER ERRO

### Cenário 1: Timeout persiste após SQL
**Causa provável:** PostgREST não recarregou
**Solução:**
```sql
-- Forçar reload
NOTIFY pgrst, 'reload config';

-- Aguardar 30s e testar novamente
```

### Cenário 2: Erro de cookies persiste
**Causa provável:** Ainda usando auth-helpers-nextjs
**Solução:** Executar AÇÃO 3 (migração SSR)

### Cenário 3: RLS ainda bloqueando
**Causa provável:** fix_rls_performance.sql não executado
**Solução:**
```bash
# Executar no Supabase:
supabase/fix_rls_performance.sql
```

---

## 📞 PRÓXIMOS PASSOS

1. **AGORA:** Executar AÇÃO 1 (SQL timeout)
2. **HOJE:** Executar AÇÃO 2 (RLS optimization)
3. **ESTA SEMANA:** Executar AÇÃO 3 (migração SSR)
4. **MONITORAR:** Logs do Supabase por 48h

---

## 🎓 LIÇÕES APRENDIDAS

1. ✅ Sempre usar pacotes oficiais atualizados
2. ✅ Timeout padrão (3s) é insuficiente para RLS
3. ✅ RLS precisa de índices + otimização
4. ✅ getUser() > getSession() SEMPRE
5. ✅ Next.js 15 mudou APIs para async

---

## 📚 REFERÊNCIAS

- [Supabase SSR Migration Guide](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Next.js 15 Breaking Changes](https://nextjs.org/docs/messages/sync-dynamic-apis)
- [Supabase Timeouts](https://supabase.com/docs/guides/database/postgres/timeouts)

---

**🚀 BOA SORTE! O problema SERÁ resolvido seguindo este plano.**
