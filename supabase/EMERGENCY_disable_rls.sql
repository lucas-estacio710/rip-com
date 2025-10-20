-- ============================================
-- EMERGENCY: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================
-- USE APENAS EM DESENVOLVIMENTO/TESTE
-- NUNCA EM PRODUÇÃO COM DADOS REAIS!
--
-- Este script desabilita RLS em todas as tabelas para
-- identificar se RLS é a causa dos timeouts.
--
-- Se após executar isso o sistema funcionar,
-- confirma que o problema é RLS bloqueando queries.

-- Desabilitar RLS em todas as tabelas
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitas DISABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes DISABLE ROW LEVEL SECURITY;

-- Verificar status RLS
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado: rls_enabled = false para todas as tabelas

-- ============================================
-- IMPORTANTE: REABILITAR RLS DEPOIS
-- ============================================
-- Quando terminar os testes, execute:
-- ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
--
-- E depois execute o script: enable_rls_with_policies.sql
