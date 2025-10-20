# Diagnóstico: Timeout em Todas as Queries Supabase

## Problema Identificado

**Todas as queries do Supabase estão travando indefinidamente (mais de 10 segundos).**

### Evidências

1. ✅ **AuthContext timeout** - loadUserData trava ao buscar perfil/unidade
2. ✅ **EstabelecimentosList timeout** - query de estabelecimentos trava
3. ✅ **Página de teste trava** - nem consegue completar `getSession()`

### Conclusão

**Não é um problema específico do AuthContext.** É um problema GLOBAL do Supabase afetando TODAS as queries.

## Causas Possíveis

### 1. RLS (Row Level Security) Mal Configurado ⭐ MAIS PROVÁVEL

**Sintomas:**
- Queries iniciam mas nunca retornam
- Timeout após 10+ segundos
- Afeta todas as tabelas

**Por que acontece:**
- RLS está habilitado mas SEM políticas adequadas
- Políticas existentes têm erro de sintaxe ou lógica circular
- Usuário não tem permissão para acessar NADA

**Como confirmar:**
Execute o script `supabase/EMERGENCY_disable_rls.sql` no Supabase Dashboard → SQL Editor

**Se funcionar após desabilitar RLS:** Confirmado que RLS é o problema

### 2. Conexão com Supabase Bloqueada

**Sintomas:**
- Queries nem iniciam
- Timeout imediato

**Causas:**
- Firewall bloqueando conexões
- URL ou API key incorretos
- Projeto Supabase pausado/suspenso

**Como verificar:**
- Abrir Supabase Dashboard e ver se projeto está ativo
- Verificar se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos

### 3. Pool de Conexões Esgotado

**Sintomas:**
- Funciona por um tempo depois trava
- Queries pendentes no Dashboard → Database → Logs

**Como verificar:**
```sql
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE datname = current_database();
```

## Solução Imediata (EMERGÊNCIA)

### Opção 1: Desabilitar RLS Temporariamente

**⚠️ APENAS PARA DESENVOLVIMENTO - NUNCA EM PRODUÇÃO**

1. Acesse: **Supabase Dashboard → SQL Editor**
2. Execute o script: `supabase/EMERGENCY_disable_rls.sql`
3. Teste se o sistema funciona
4. **Se funcionar:** Confirma que RLS é o problema

**Resultado esperado:**
```
rls_enabled = false (para todas as tabelas)
```

### Opção 2: Verificar Configuração do Projeto

1. Acesse: **Supabase Dashboard → Settings → API**
2. Confirme:
   - ✅ Project URL está correto
   - ✅ anon/public key está correto
   - ✅ Projeto está ativo (não pausado)

3. Compare com suas variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Solução Permanente

### Se RLS for o problema:

1. **Manter RLS desabilitado** (temporário, desenvolvimento only)
2. **Criar políticas RLS corretas:**
   - Execute `supabase/enable_rls_with_policies.sql`
   - Teste cada política individualmente
   - Verificar se usuário tem `unidade_id` preenchido

3. **Verificar dados do usuário:**
```sql
-- Ver dados do seu perfil
SELECT * FROM perfis WHERE email = 'seu-email@example.com';

-- Deve ter unidade_id preenchido!
-- Se não tiver, executar:
UPDATE perfis SET unidade_id = 'uuid-da-sua-unidade' WHERE email = 'seu-email@example.com';
```

### Se conexão for o problema:

1. Verificar variáveis de ambiente no Vercel
2. Recriar API keys no Supabase se necessário
3. Verificar se projeto não foi pausado por inatividade

## Próximos Passos

### AGORA (Urgente)

1. ✅ Execute `EMERGENCY_disable_rls.sql`
2. ✅ Refresh a página `/test-supabase`
3. ✅ Veja se os testes completam

### Se funcionar (RLS é o problema)

1. Verificar se seu perfil tem `unidade_id` preenchido
2. Executar `enable_rls_with_policies.sql` para criar políticas corretas
3. Habilitar RLS novamente
4. Testar se tudo funciona

### Se NÃO funcionar (outro problema)

1. Verificar logs no Supabase Dashboard → Logs
2. Verificar variáveis de ambiente
3. Testar conexão direta via SQL Editor
4. Verificar status do projeto Supabase

## Comandos Úteis

### Verificar status RLS
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Ver conexões ativas
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Ver queries lentas
```sql
SELECT query, state, wait_event
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY query_start;
```

### Ver seu perfil
```sql
SELECT * FROM perfis WHERE email = 'seu-email';
```

## Links Úteis

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Debugging RLS Policies](https://supabase.com/docs/guides/database/postgres/row-level-security#testing-policies)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Status:** 🔴 CRÍTICO - Sistema completamente travado
**Prioridade:** 🔥 MÁXIMA - Bloqueia uso do sistema
**Última atualização:** 2025-01-19
