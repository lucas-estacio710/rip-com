# Troubleshooting: Query Timeout no loadUserData

## Problema

Após ~1 hora idle, ao fazer refresh do token, a query de perfil/unidade trava por mais de 10 segundos.

## Diagnóstico

### 1. Verificar onde está travando

Observar os logs no console:

```
📥 Carregando dados do usuário: <user-id>
✅ Sessão válida, prosseguindo com queries  ← Se aparecer, sessão está OK
🔍 Buscando perfil...  ← Se aparecer, query iniciou
⏱️ Query de perfil completou em Xms  ← Se NÃO aparecer, query travou aqui
```

### 2. Possíveis Causas

#### Causa 1: RLS Policies Bloqueando Query

**Sintoma**: Query nunca retorna, fica pendente indefinidamente.

**Verificação**:
1. Acesse Supabase Dashboard → Database → Logs
2. Procure por queries lentas ou bloqueadas
3. Execute query manual no SQL Editor:

```sql
-- Como usuário autenticado (usando JWT token)
SELECT * FROM perfis WHERE id = '<seu-user-id>';
```

**Solução**:
- Se RLS estiver causando problema, execute o script: `supabase/enable_rls_with_policies.sql`
- Verifique se as políticas estão corretas
- Temporariamente desabilite RLS para testar: `ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;`

#### Causa 2: Token Expirado/Inválido

**Sintoma**: Query retorna erro de autenticação.

**Verificação**:
```javascript
// No console do navegador
const { data: { session } } = await supabase.auth.getSession();
console.log(session);
```

**Solução**:
- Verificar configurações de JWT Expiry no Supabase Dashboard
- Aumentar Refresh Token Reuse Interval para 10 segundos
- Habilitar Refresh Token Rotation

#### Causa 3: Connection Pool Esgotado

**Sintoma**: Muitas conexões abertas simultaneamente.

**Verificação**:
```sql
-- Ver conexões ativas
SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();
```

**Solução**:
- Aumentar pool size no Supabase Dashboard → Database → Settings
- Usar connection pooling mode "Transaction"

#### Causa 4: Query Genuinamente Lenta

**Sintoma**: Query demora muito mas eventualmente retorna.

**Verificação**:
```sql
-- Ver queries lentas
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%perfis%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solução**:
- Adicionar índices:
```sql
CREATE INDEX IF NOT EXISTS idx_perfis_id ON perfis(id);
CREATE INDEX IF NOT EXISTS idx_unidades_id ON unidades(id);
```

## Workarounds Implementados

### 1. Timeout de 10 segundos
- Se query demorar mais de 10s, aborta e mantém dados antigos
- Previne UI freeze

### 2. Verificação de Sessão
- Antes de fazer query, verifica se sessão é válida
- Economiza tempo se sessão já expirou

### 3. Skip Reload se Dados Existem
- Não recarrega perfil/unidade se já estão presentes
- Reduz queries desnecessárias

## Próximos Passos

1. **Identificar causa raiz** através dos logs
2. **Aplicar solução específica** conforme causa identificada
3. **Monitorar** se problema persiste após fix

## Logs para Compartilhar

Se o problema persistir, compartilhe:
- Console completo desde "Auth state changed" até o timeout
- Logs do Supabase Dashboard → Logs → Database
- Output do SQL: `EXPLAIN ANALYZE SELECT * FROM perfis WHERE id = '<user-id>';`
