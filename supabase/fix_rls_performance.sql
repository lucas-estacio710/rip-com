-- =====================================================
-- FIX RLS PERFORMANCE ISSUES
-- =====================================================
-- This migration fixes:
-- 1. auth_rls_initplan warnings: Wraps auth.uid() in subqueries for optimization
-- 2. multiple_permissive_policies warnings: Removes duplicate policies
--
-- IMPACT: Significantly improves query performance at scale
-- =====================================================

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Drop perfis policies (all variations)
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Sistema pode inserir novos perfis" ON perfis;
DROP POLICY IF EXISTS "Usuários veem seu próprio perfil" ON perfis;

-- Drop unidades policies (all variations)
DROP POLICY IF EXISTS "Usuários podem ver sua unidade" ON unidades;
DROP POLICY IF EXISTS "Admins podem criar unidades" ON unidades;
DROP POLICY IF EXISTS "Admins podem atualizar unidades" ON unidades;
DROP POLICY IF EXISTS "Usuários veem sua unidade" ON unidades;

-- Drop estabelecimentos policies (all variations)
DROP POLICY IF EXISTS "Usuários podem ver estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem criar estabelecimentos na sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem atualizar estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem deletar estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários veem apenas estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários veem estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários inserem estabelecimentos na sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários podem inserir estabelecimentos na sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários atualizam estabelecimentos da sua unidade" ON estabelecimentos;
DROP POLICY IF EXISTS "Usuários deletam estabelecimentos da sua unidade" ON estabelecimentos;

-- Drop contatos policies (all variations)
DROP POLICY IF EXISTS "Usuários podem ver contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários podem criar contatos na sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários podem atualizar contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários podem deletar contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários veem contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários inserem contatos na sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários atualizam contatos da sua unidade" ON contatos;
DROP POLICY IF EXISTS "Usuários deletam contatos da sua unidade" ON contatos;

-- Drop visitas policies (all variations)
DROP POLICY IF EXISTS "Usuários podem ver visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários podem criar visitas na sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários podem atualizar visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários podem deletar visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários veem visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários inserem visitas na sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários atualizam visitas da sua unidade" ON visitas;
DROP POLICY IF EXISTS "Usuários deletam visitas da sua unidade" ON visitas;

-- Drop indicacoes policies (all variations)
DROP POLICY IF EXISTS "Usuários podem ver indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários podem criar indicações na sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários podem atualizar indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários podem deletar indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários veem indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários inserem indicações na sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários atualizam indicações da sua unidade" ON indicacoes;
DROP POLICY IF EXISTS "Usuários deletam indicações da sua unidade" ON indicacoes;

-- ============================================
-- 2. CREATE OPTIMIZED POLICIES (NO DUPLICATES)
-- ============================================

-- ============================================
-- PERFIS POLICIES
-- ============================================

-- Users can see only their own profile
CREATE POLICY "Users view own profile"
ON perfis FOR SELECT
USING ((select auth.uid()) = id);

-- Users can update only their own profile
CREATE POLICY "Users update own profile"
ON perfis FOR UPDATE
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- System can insert new profiles (via trigger)
CREATE POLICY "System inserts profiles"
ON perfis FOR INSERT
WITH CHECK ((select auth.uid()) = id);

-- ============================================
-- UNIDADES POLICIES
-- ============================================

-- Users can see their unit
CREATE POLICY "Users view own unit"
ON unidades FOR SELECT
USING (
  id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = (select auth.uid())
  )
);

-- Only admins can create units
CREATE POLICY "Admins create units"
ON unidades FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = (select auth.uid())
    AND cargo = 'admin'
  )
);

-- Only admins can update units
CREATE POLICY "Admins update units"
ON unidades FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = (select auth.uid())
    AND cargo = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM perfis
    WHERE id = (select auth.uid())
    AND cargo = 'admin'
  )
);

-- ============================================
-- ESTABELECIMENTOS POLICIES
-- ============================================

-- Users view establishments from their unit
CREATE POLICY "Users view unit establishments"
ON estabelecimentos FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = (select auth.uid())
  )
);

-- Users create establishments in their unit
CREATE POLICY "Users create unit establishments"
ON estabelecimentos FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = (select auth.uid())
  )
);

-- Users update establishments in their unit
CREATE POLICY "Users update unit establishments"
ON estabelecimentos FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = (select auth.uid())
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = (select auth.uid())
  )
);

-- Users delete establishments in their unit
CREATE POLICY "Users delete unit establishments"
ON estabelecimentos FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id
    FROM perfis
    WHERE id = (select auth.uid())
  )
);

-- ============================================
-- CONTATOS POLICIES
-- ============================================

-- Users view contacts from their unit
CREATE POLICY "Users view unit contacts"
ON contatos FOR SELECT
USING (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
    )
  )
);

-- Users create contacts in their unit
CREATE POLICY "Users create unit contacts"
ON contatos FOR INSERT
WITH CHECK (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
    )
  )
);

-- Users update contacts in their unit
CREATE POLICY "Users update unit contacts"
ON contatos FOR UPDATE
USING (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
    )
  )
)
WITH CHECK (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
    )
  )
);

-- Users delete contacts in their unit
CREATE POLICY "Users delete unit contacts"
ON contatos FOR DELETE
USING (
  estabelecimento_id IN (
    SELECT id FROM estabelecimentos
    WHERE unidade_id IN (
      SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
    )
  )
);

-- ============================================
-- VISITAS POLICIES
-- ============================================

-- Users view visits from their unit
CREATE POLICY "Users view unit visits"
ON visitas FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- Users create visits in their unit
CREATE POLICY "Users create unit visits"
ON visitas FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- Users update visits in their unit
CREATE POLICY "Users update unit visits"
ON visitas FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- Users delete visits in their unit
CREATE POLICY "Users delete unit visits"
ON visitas FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- ============================================
-- INDICACOES POLICIES
-- ============================================

-- Users view referrals from their unit
CREATE POLICY "Users view unit referrals"
ON indicacoes FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- Users create referrals in their unit
CREATE POLICY "Users create unit referrals"
ON indicacoes FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- Users update referrals in their unit
CREATE POLICY "Users update unit referrals"
ON indicacoes FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
)
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- Users delete referrals in their unit
CREATE POLICY "Users delete unit referrals"
ON indicacoes FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = (select auth.uid())
  )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- View RLS status on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('perfis', 'unidades', 'estabelecimentos', 'contatos', 'visitas', 'indicacoes')
ORDER BY tablename;

-- View all policies (should see NO duplicates)
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- =====================================================
-- PERFORMANCE IMPROVEMENTS EXPLAINED
-- =====================================================
--
-- BEFORE: auth.uid() was evaluated for EACH ROW
-- Query with 1000 rows = 1000 function calls
--
-- AFTER: (select auth.uid()) is evaluated ONCE per query
-- Query with 1000 rows = 1 function call (constant folding)
--
-- PERFORMANCE GAIN: ~10-100x faster on large datasets
--
-- Additionally, removing duplicate policies means:
-- - Fewer policy evaluations per query
-- - Clearer security model
-- - Easier maintenance
--
-- =====================================================
