-- ============================================
-- HABILITAR RLS COM POLÍTICAS DE SEGURANÇA
-- ============================================
-- Schema completo para produção com segurança multi-tenant

-- ============================================
-- 1. REMOVER POLÍTICAS EXISTENTES (SE HOUVER)
-- ============================================

-- Remover políticas de perfis
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Sistema pode inserir novos perfis" ON perfis;
DROP POLICY IF EXISTS "Usuários veem seu próprio perfil" ON perfis;

-- Remover políticas de unidades
DROP POLICY IF EXISTS "Usuários podem ver sua unidade" ON unidades;
DROP POLICY IF EXISTS "Admins podem criar unidades" ON unidades;
DROP POLICY IF EXISTS "Admins podem atualizar unidades" ON unidades;
DROP POLICY IF EXISTS "Usuários veem sua unidade" ON unidades;

-- Remover políticas de estabelecimentos
DROP POLICY IF EXISTS "Usuários podem ver estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem criar estabelecimentos na sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem atualizar estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem deletar estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários veem estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários inserem estabelecimentos na sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários atualizam estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários deletam estabelecimentos da sua unidade" ON estabelecimentos;

-- Remover políticas de contatos
DROP POLICY IF EXISTS "Usuários podem ver contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários podem criar contatos na sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários podem atualizar contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários podem deletar contatos da sua unidade" ON contatos;

-- Remover políticas de visitas
DROP POLICY IF EXISTS "Usuários podem ver visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários podem criar visitas na sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários podem atualizar visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários podem deletar visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários veem visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários inserem visitas na sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários atualizam visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários deletam visitas da sua unidade" ON visitas;

-- Remover políticas de indicações
DROP POLICY IF EXISTS "Usuários podem ver indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários podem criar indicações na sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários podem deletar indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários veem indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários inserem indicações na sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários atualizam indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários deletam indicações da sua unidade" ON indicacoes;

-- ============================================
-- 2. HABILITAR RLS EM TODAS AS TABELAS
-- ============================================

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS PARA PERFIS
-- ============================================

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários podem ver seu próprio perfil"
ON perfis FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON perfis FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Sistema pode inserir novos perfis (via trigger)
CREATE POLICY "Sistema pode inserir novos perfis"
ON perfis FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- 4. POLÍTICAS PARA UNIDADES
-- ============================================

-- Usuários podem ver unidades associadas ao seu perfil
CREATE POLICY "Usuários podem ver sua unidade"
ON unidades FOR SELECT
USING (
  id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = auth.uid()
  )
);

-- Apenas admins podem criar unidades
CREATE POLICY "Admins podem criar unidades"
ON unidades FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid()
    AND cargo = 'admin'
  )
);

-- Apenas admins podem atualizar unidades
CREATE POLICY "Admins podem atualizar unidades"
ON unidades FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid()
    AND cargo = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = auth.uid()
    AND cargo = 'admin'
  )
);

-- ============================================
-- 5. POLÍTICAS PARA ESTABELECIMENTOS
-- ============================================

-- Usuários podem ver estabelecimentos da sua unidade
CREATE POLICY "Usuários podem ver estabelecimentos da sua unidade"
ON estabelecimentos FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = auth.uid()
  )
);

-- Usuários podem criar estabelecimentos na sua unidade
CREATE POLICY "Usuários podem criar estabelecimentos na sua unidade"
ON estabelecimentos FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar estabelecimentos da sua unidade
CREATE POLICY "Usuários podem atualizar estabelecimentos da sua unidade"
ON estabelecimentos FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = auth.uid()
  )
);

-- Usuários podem deletar estabelecimentos da sua unidade
CREATE POLICY "Usuários podem deletar estabelecimentos da sua unidade"
ON estabelecimentos FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = auth.uid()
  )
);

-- ============================================
-- 6. POLÍTICAS PARA CONTATOS
-- ============================================

-- Usuários podem ver contatos de estabelecimentos da sua unidade
CREATE POLICY "Usuários podem ver contatos da sua unidade"
ON contatos FOR SELECT
USING (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = auth.uid()
    )
  )
);

-- Usuários podem criar contatos em estabelecimentos da sua unidade
CREATE POLICY "Usuários podem criar contatos na sua unidade"
ON contatos FOR INSERT
WITH CHECK (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = auth.uid()
    )
  )
);

-- Usuários podem atualizar contatos de estabelecimentos da sua unidade
CREATE POLICY "Usuários podem atualizar contatos da sua unidade"
ON contatos FOR UPDATE
USING (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = auth.uid()
    )
  )
);

-- Usuários podem deletar contatos de estabelecimentos da sua unidade
CREATE POLICY "Usuários podem deletar contatos da sua unidade"
ON contatos FOR DELETE
USING (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = auth.uid()
    )
  )
);

-- ============================================
-- 7. POLÍTICAS PARA VISITAS
-- ============================================

-- Usuários podem ver visitas da sua unidade
CREATE POLICY "Usuários podem ver visitas da sua unidade"
ON visitas FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem criar visitas na sua unidade
CREATE POLICY "Usuários podem criar visitas na sua unidade"
ON visitas FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar visitas da sua unidade
CREATE POLICY "Usuários podem atualizar visitas da sua unidade"
ON visitas FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem deletar visitas da sua unidade
CREATE POLICY "Usuários podem deletar visitas da sua unidade"
ON visitas FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- ============================================
-- 8. POLÍTICAS PARA INDICAÇÕES
-- ============================================

-- Usuários podem ver indicações da sua unidade
CREATE POLICY "Usuários podem ver indicações da sua unidade"
ON indicacoes FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem criar indicações na sua unidade
CREATE POLICY "Usuários podem criar indicações na sua unidade"
ON indicacoes FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar indicações da sua unidade
CREATE POLICY "Usuários podem atualizar indicações da sua unidade"
ON indicacoes FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem deletar indicações da sua unidade
CREATE POLICY "Usuários podem deletar indicações da sua unidade"
ON indicacoes FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- ============================================
-- 9. VERIFICAR STATUS DO RLS E POLÍTICAS
-- ============================================

-- Ver status do RLS em todas as tabelas
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver todas as políticas criadas
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

-- ============================================
-- INSTRUÇÕES DE USO:
-- ============================================
--
-- 1. Execute este script no Supabase SQL Editor
-- 2. Aguarde confirmação de que todas as políticas foram criadas
-- 3. Teste a aplicação para verificar que:
--    - Usuários só veem dados da sua unidade
--    - Operações CRUD funcionam corretamente
--    - Não há vazamento de dados entre unidades
--
-- SEGURANÇA MULTI-TENANT:
-- - Cada usuário só acessa dados da sua unidade_id
-- - Perfis são isolados por auth.uid()
-- - Estabelecimentos e relacionados filtrados por unidade
-- - Admins têm controle sobre unidades
--
-- PARA DESABILITAR (APENAS PARA DEBUG):
-- Execute o script disable_rls_for_testing.sql
--
