# Configurações Recomendadas do Supabase

## Authentication Settings

Acesse: **Dashboard → Authentication → Settings**

### JWT Settings

| Configuração | Valor Recomendado | Descrição |
|--------------|-------------------|-----------|
| JWT Expiry | `3600` (1 hora) | Tempo de validade do token de acesso |
| Refresh Token Expiry | `2592000` (30 dias) | Tempo de validade do refresh token |
| JWT Secret | (auto-gerado) | Não altere manualmente |

### Refresh Token Settings

| Configuração | Valor | Descrição |
|--------------|-------|-----------|
| Enable Refresh Token Rotation | ✅ Habilitado | Melhora segurança ao renovar tokens |
| Refresh Token Reuse Interval | `10` segundos | Tempo que o mesmo token pode ser reutilizado |
| Detect and Revoke Compromised Tokens | ✅ Habilitado | Previne replay attacks |

### Auth Providers

| Provider | Status | Notas |
|----------|--------|-------|
| Email | ✅ Habilitado | Login padrão do sistema |
| Phone | ❌ Desabilitado | Não utilizado |
| Social (Google, etc) | ❌ Desabilitado | Não utilizado |

### Email Settings

| Configuração | Valor |
|--------------|-------|
| Enable Email Confirmations | Depende do ambiente |
| Enable Email Change Confirmations | ✅ Habilitado |
| Secure Email Change | ✅ Habilitado |
| Mailer Secure Email Change | ✅ Habilitado |

## Database Settings

Acesse: **Dashboard → Database → Settings**

### Connection Pooling

| Configuração | Valor | Descrição |
|--------------|-------|-----------|
| Connection Pooling Mode | Transaction | Para aplicações web |
| Pool Size | 15-25 | Ajuste conforme uso |

### Performance

| Configuração | Valor |
|--------------|-------|
| Statement Timeout | `60000ms` (60s) |
| Idle in Transaction Timeout | `600000ms` (10min) |

## Storage Settings

Acesse: **Dashboard → Storage → Settings**

### Políticas

- **Max file size**: 50MB (padrão é ok)
- **Allowed MIME types**: image/*, application/pdf

## API Settings

Acesse: **Dashboard → Settings → API**

### Rate Limiting

Configure limites apropriados para prevenir abuso:

| Endpoint | Limite Recomendado |
|----------|-------------------|
| Anonymous Requests | 60 requests/min |
| Authenticated Requests | 300 requests/min |

## Monitoring

### Logs Importantes

Ative logs em: **Dashboard → Logs**

- ✅ **Auth logs**: Monitorar logins e falhas
- ✅ **Database logs**: Queries lentas
- ✅ **API logs**: Erros de requisição

### Alertas Recomendados

Configure alertas para:
- Taxa de erro > 5%
- Latência média > 500ms
- CPU > 80%
- Conexões de banco > 90% do pool

## Troubleshooting

### Problema: "Travamento" após algum tempo

**Sintomas**:
- Usuário logado, mas queries param de funcionar
- Console mostra erros de token inválido
- Página precisa ser recarregada

**Possíveis Causas**:
1. **Token Refresh Interval muito baixo** → Aumentar para 10s
2. **autoRefreshToken desabilitado** → Verificar código
3. **Storage corrompido** → Limpar localStorage
4. **CORS mal configurado** → Verificar allowed origins

**Soluções**:
```javascript
// No código do cliente:
auth: {
  autoRefreshToken: true,  // ✅ Deve estar true
  persistSession: true,    // ✅ Deve estar true
  detectSessionInUrl: true,
  flowType: 'pkce',        // ✅ Mais seguro
}
```

### Problema: RLS bloqueia queries

**Sintomas**:
- Query retorna array vazio
- Erro: "new row violates row-level security"

**Solução**:
1. Verificar se políticas RLS estão corretas
2. Verificar se usuário tem `unidade_id` configurado
3. Testar query no SQL Editor como service_role

### Problema: Queries lentas

**Diagnóstico**:
```sql
-- Ver queries lentas
SELECT
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Soluções**:
1. Adicionar índices nas colunas filtradas
2. Otimizar joins
3. Usar .select() específico ao invés de *

## Backup e Segurança

### Backups Automáticos

- ✅ Point-in-time recovery habilitado
- ✅ Backup diário automático
- 📁 Reter por 30 dias

### Segurança

- ✅ RLS habilitado em todas as tabelas
- ✅ Service role key guardada com segurança
- ✅ Anon key usada apenas no frontend
- ❌ Nunca expor service_role_key no código do cliente

## Checklist de Produção

Antes de ir para produção, verificar:

- [ ] RLS habilitado e testado em todas as tabelas
- [ ] Políticas RLS permitem apenas acesso autorizado
- [ ] Refresh token rotation habilitado
- [ ] Backups automáticos configurados
- [ ] Rate limiting configurado
- [ ] Logs e monitoring ativos
- [ ] Alertas configurados
- [ ] CORS configurado corretamente
- [ ] Environment variables seguras
- [ ] SSL/TLS forçado

## Links Úteis

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [RLS Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Performance Tuning](https://supabase.com/docs/guides/database/performance)

---

**Última atualização**: 2025-01-19
