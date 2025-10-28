-- =====================================================
-- URGENTE: FIX TIMEOUT + RLS PERFORMANCE
-- =====================================================
-- Este script resolve os problemas de timeout de 10s
-- e otimiza as políticas RLS para performance máxima
-- =====================================================

-- =====================================================
-- 1. AUMENTAR STATEMENT TIMEOUT
-- =====================================================
-- Default: 3s (anon) / 8s (authenticated) - MUITO CURTO!
-- Novo: 30s (anon) / 60s (authenticated)

-- Para usuários anônimos (API pública)
ALTER ROLE anon SET statement_timeout = '30s';

-- Para usuários autenticados
ALTER ROLE authenticated SET statement_timeout = '60s';

-- Para o role do serviço (se necessário)
ALTER ROLE service_role SET statement_timeout = '120s';

-- ⚠️ CRÍTICO: Recarregar config do PostgREST
NOTIFY pgrst, 'reload config';

-- Verificar configuração atual
SELECT rolname, rolconfig
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role');


-- =====================================================
-- 2. ADICIONAR ÍNDICES PARA RLS PERFORMANCE
-- =====================================================
-- Índices críticos para queries com auth.uid()

-- Perfis: busca por user id
CREATE INDEX IF NOT EXISTS idx_perfis_user_id ON perfis(id);
CREATE INDEX IF NOT EXISTS idx_perfis_unidade_id ON perfis(unidade_id);

-- Estabelecimentos: busca por unidade
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_unidade_id ON estabelecimentos(unidade_id);

-- Visitas: busca por unidade e usuário
CREATE INDEX IF NOT EXISTS idx_visitas_unidade_id ON visitas(unidade_id);
CREATE INDEX IF NOT EXISTS idx_visitas_usuario_id ON visitas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_visitas_estabelecimento_id ON visitas(estabelecimento_id);

-- Contatos: busca por unidade
CREATE INDEX IF NOT EXISTS idx_contatos_unidade_id ON contatos(unidade_id);
CREATE INDEX IF NOT EXISTS idx_contatos_estabelecimento_id ON contatos(estabelecimento_id);

-- Indicações: busca por unidade
CREATE INDEX IF NOT EXISTS idx_indicacoes_unidade_id ON indicacoes(unidade_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_estabelecimento_origem ON indicacoes(estabelecimento_origem_id);

COMMENT ON INDEX idx_perfis_user_id IS 'Performance: RLS auth.uid() lookups';
COMMENT ON INDEX idx_estabelecimentos_unidade_id IS 'Performance: RLS unit filtering';
COMMENT ON INDEX idx_visitas_unidade_id IS 'Performance: RLS unit filtering';


-- =====================================================
-- 3. OTIMIZAR POLÍTICAS RLS EXISTENTES
-- =====================================================
-- Problema: auth.uid() é avaliado PARA CADA LINHA
-- Solução: Usar (select auth.uid()) para avaliar 1 VEZ
--
-- Esta otimização já foi aplicada no arquivo:
-- fix_rls_performance.sql
--
-- Se você ainda não executou aquele arquivo, execute-o agora!
-- =====================================================


-- =====================================================
-- 4. VERIFICAR POLÍTICAS PROBLEMÁTICAS
-- =====================================================
-- Query para encontrar políticas que podem estar lentas

SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%'
    THEN '⚠️ PRECISA OTIMIZAÇÃO'
    ELSE '✅ OK'
  END as status,
  qual as policy_definition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY
  CASE
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%'
    THEN 0
    ELSE 1
  END,
  tablename;


-- =====================================================
-- 5. ANÁLISE DE PERFORMANCE (OPCIONAL)
-- =====================================================
-- Executar para ver estatísticas de queries lentas

-- Ativar logging de queries lentas (temporariamente)
-- ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 segundo
-- SELECT pg_reload_conf();

-- Ver queries mais lentas (requer pg_stat_statements)
-- SELECT
--   query,
--   calls,
--   total_exec_time::numeric(10,2) as total_ms,
--   mean_exec_time::numeric(10,2) as avg_ms,
--   max_exec_time::numeric(10,2) as max_ms
-- FROM pg_stat_statements
-- WHERE query LIKE '%perfis%' OR query LIKE '%estabelecimentos%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 20;


-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- 1. Verificar timeouts configurados
SELECT
  'Timeouts Configurados' as check_name,
  rolname,
  rolconfig
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role')
  AND rolconfig IS NOT NULL;

-- 2. Contar índices criados
SELECT
  'Índices Criados' as check_name,
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- 3. Status das políticas RLS
SELECT
  'Status RLS' as check_name,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(select auth.uid())%') as needs_optimization
FROM pg_policies
WHERE schemaname = 'public';

-- =====================================================
-- ✅ CONCLUSÃO
-- =====================================================
-- Após executar este script:
-- 1. Timeouts aumentados: 3s → 30s (anon), 8s → 60s (auth)
-- 2. Índices adicionados para queries RLS
-- 3. Queries de verificação executadas
--
-- PRÓXIMOS PASSOS:
-- 1. Execute fix_rls_performance.sql (se ainda não executou)
-- 2. Teste a aplicação - timeout deve desaparecer
-- 3. Monitore logs do Supabase por 24h
-- =====================================================
