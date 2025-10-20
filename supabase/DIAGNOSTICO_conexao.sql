-- ============================================
-- DIAGNÓSTICO: Conexão e Performance do Supabase
-- ============================================

-- 1. Teste simples - se isso demorar, o problema é no Supabase mesmo
SELECT 1 as test;

-- 2. Ver versão do PostgreSQL
SELECT version();

-- 3. Ver conexões ativas
SELECT
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle
FROM pg_stat_activity;

-- 4. Ver queries lentas/travadas
SELECT
    pid,
    now() - pg_stat_activity.query_start AS duration,
    state,
    query
FROM pg_stat_activity
WHERE state != 'idle'
AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- 5. Testar query simples em perfis
SELECT count(*) FROM perfis;

-- 6. Testar query simples em estabelecimentos
SELECT count(*) FROM estabelecimentos;

-- 7. Ver índices nas tabelas
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. Ver tamanho das tabelas
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
