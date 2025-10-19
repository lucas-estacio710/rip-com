-- Adicionar campos de redes sociais à tabela estabelecimentos
-- Execute este script no SQL Editor do Supabase

ALTER TABLE estabelecimentos
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Comentários das colunas
COMMENT ON COLUMN estabelecimentos.instagram IS 'Username ou URL do Instagram do estabelecimento';
COMMENT ON COLUMN estabelecimentos.whatsapp IS 'Número de WhatsApp do estabelecimento (formato: 5513999999999)';
