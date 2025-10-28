-- =====================================================
-- SECURITY FIXES - Supabase Linter Recommendations
-- =====================================================

-- =====================================================
-- FIX 1: Function Search Path Mutable
-- =====================================================
-- The update_updated_at_column function is vulnerable to search_path attacks.
-- We need to recreate it with a fixed search_path.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

-- Re-apply the function to ensure it's updated
COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates atualizado_em timestamp. Fixed search_path for security.';


-- =====================================================
-- FIX 2: Security Definer View
-- =====================================================
-- The vw_estatisticas_estabelecimentos view should use SECURITY INVOKER
-- instead of SECURITY DEFINER to enforce RLS policies properly.

CREATE OR REPLACE VIEW vw_estatisticas_estabelecimentos
WITH (security_invoker = true) AS
SELECT
  e.id,
  e.nome,
  e.unidade_id,
  COUNT(DISTINCT v.id) AS total_visitas,
  COUNT(DISTINCT i.id) AS total_indicacoes,
  MAX(v.data_visita) AS ultima_visita,
  COUNT(DISTINCT v.id) FILTER (WHERE v.data_visita >= NOW() - INTERVAL '30 days') AS visitas_30d,
  COUNT(DISTINCT v.id) FILTER (WHERE v.data_visita >= NOW() - INTERVAL '90 days') AS visitas_90d,
  COUNT(DISTINCT i.id) FILTER (WHERE i.criado_em >= NOW() - INTERVAL '30 days') AS indicacoes_30d,
  COUNT(DISTINCT i.id) FILTER (WHERE i.criado_em >= NOW() - INTERVAL '90 days') AS indicacoes_90d
FROM estabelecimentos e
LEFT JOIN visitas v ON e.id = v.estabelecimento_id
LEFT JOIN indicacoes i ON e.id = i.estabelecimento_origem_id
GROUP BY e.id, e.nome, e.unidade_id;

COMMENT ON VIEW vw_estatisticas_estabelecimentos IS 'Statistics per establishment. Uses SECURITY INVOKER to respect RLS policies.';


-- =====================================================
-- FIX 3: Update other functions to have secure search_path
-- =====================================================

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo, email, cargo)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email),
    NEW.email,
    'vendedor' -- cargo padrão
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile on registration. Fixed search_path for security.';


-- Fix update_estabelecimento_ultima_visita function if it exists
CREATE OR REPLACE FUNCTION update_estabelecimento_ultima_visita()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estabelecimentos
  SET ultima_visita = NEW.data
  WHERE id = NEW.estabelecimento_id
    AND (ultima_visita IS NULL OR ultima_visita < NEW.data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

COMMENT ON FUNCTION update_estabelecimento_ultima_visita() IS 'Updates last visit timestamp. Fixed search_path for security.';


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the fixes:

-- Check function search paths:
-- SELECT
--   proname as function_name,
--   prosecdef as is_security_definer,
--   proconfig as config_settings
-- FROM pg_proc
-- WHERE pronamespace = 'public'::regnamespace
-- AND proname IN ('update_updated_at_column', 'handle_new_user', 'update_estabelecimento_ultima_visita');

-- Check view security settings:
-- SELECT
--   viewname,
--   viewowner,
--   definition
-- FROM pg_views
-- WHERE viewname = 'vw_estatisticas_estabelecimentos';
