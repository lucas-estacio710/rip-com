-- ============================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA TESTES
-- ============================================
-- Execute isso no Supabase SQL Editor se as queries estiverem muito lentas
-- AVISO: Isso remove a segurança! Use apenas para debug!

-- Desabilitar RLS em todas as tabelas
ALTER TABLE perfis DISABLE ROW LEVEL SECURITY;
ALTER TABLE unidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE contatos DISABLE ROW LEVEL SECURITY;
ALTER TABLE visitas DISABLE ROW LEVEL SECURITY;
ALTER TABLE amenidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes DISABLE ROW LEVEL SECURITY;

-- Verificar status do RLS
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Para REABILITAR depois dos testes:
-- ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE amenidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
