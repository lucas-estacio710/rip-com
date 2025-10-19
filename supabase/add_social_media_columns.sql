-- ============================================
-- ADICIONAR COLUNAS DE REDES SOCIAIS
-- ============================================
-- Adiciona campos de Instagram e WhatsApp na tabela estabelecimentos

-- Adicionar coluna de Instagram
ALTER TABLE estabelecimentos
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Adicionar coluna de WhatsApp
ALTER TABLE estabelecimentos
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'estabelecimentos'
AND column_name IN ('instagram', 'whatsapp')
ORDER BY column_name;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN estabelecimentos.instagram IS 'Nome de usuário do Instagram (sem @)';
COMMENT ON COLUMN estabelecimentos.whatsapp IS 'Número de WhatsApp com DDD (ex: 13991234567)';
