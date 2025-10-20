-- ============================================
-- DIAGNÓSTICO: Por que RLS está bloqueando tudo?
-- ============================================

-- 1. Ver quais políticas RLS existem atualmente
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Ver se as tabelas têm RLS habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Ver dados do seu perfil de usuário
-- ⚠️ IMPORTANTE: Trocar 'seu-email@example.com' pelo seu email real!
SELECT
    id,
    email,
    nome_completo,
    cargo,
    unidade_id,
    created_at
FROM perfis
WHERE email = 'seu-email@example.com';

-- Se o resultado acima mostrar unidade_id = NULL, ESSE É O PROBLEMA!
-- RLS policies dependem de unidade_id para funcionar.

-- 4. Ver suas unidades disponíveis
SELECT id, nome, cidade FROM unidades;

-- 5. Se você não tiver unidade_id, precisa atualizar:
-- ⚠️ Descomente e ajuste o comando abaixo com seu email e unidade_id
-- UPDATE perfis
-- SET unidade_id = 'uuid-da-sua-unidade-aqui'
-- WHERE email = 'seu-email@example.com';

-- 6. Verificar auth.uid() atual
SELECT auth.uid() as current_user_id;

-- 7. Testar se consegue ver seu próprio perfil
SELECT * FROM perfis WHERE id = auth.uid();

-- Se isso retornar vazio = RLS está bloqueando
-- Se retornar dados = RLS está funcionando

-- ============================================
-- ANÁLISE DOS RESULTADOS
-- ============================================

-- Cenário A: perfil tem unidade_id NULL
--   → Problema: RLS policies dependem de unidade_id
--   → Solução: UPDATE perfis SET unidade_id = '...' WHERE id = auth.uid()

-- Cenário B: políticas RLS não existem
--   → Problema: RLS habilitado mas sem políticas = bloqueia tudo
--   → Solução: Executar enable_rls_with_policies.sql

-- Cenário C: políticas existem mas têm erro
--   → Problema: Sintaxe SQL incorreta ou lógica circular
--   → Solução: DROP policies antigas e recriar corretas

-- Cenário D: policies existem e perfil tem unidade_id
--   → Problema: Algo mais complexo (roles, auth, etc)
--   → Solução: Investigação mais profunda
