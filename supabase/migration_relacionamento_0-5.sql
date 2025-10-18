-- =====================================================
-- Migração: Atualizar relacionamento para aceitar 0-5 estrelas
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Remover constraint antiga
ALTER TABLE estabelecimentos
DROP CONSTRAINT IF EXISTS estabelecimentos_relacionamento_check;

-- 2. Adicionar nova constraint (0-5 estrelas)
ALTER TABLE estabelecimentos
ADD CONSTRAINT estabelecimentos_relacionamento_check
CHECK (relacionamento >= 0 AND relacionamento <= 5);

-- 3. Atualizar default para 0 (novo estabelecimento sem pontuação)
ALTER TABLE estabelecimentos
ALTER COLUMN relacionamento SET DEFAULT 0;

-- ✅ Pronto! Agora relacionamento aceita 0-5 estrelas
-- 0 estrelas = Novo/Não pontuado (cinza)
-- 1-5 estrelas = Sistema atual
