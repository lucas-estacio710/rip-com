-- =====================================================
-- TABELA DE CONTATOS (Profissionais dos Estabelecimentos)
-- =====================================================

CREATE TABLE IF NOT EXISTS contatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,

  -- Dados pessoais
  nome TEXT NOT NULL,
  cargo TEXT CHECK (cargo IN ('veterinario', 'recepcionista', 'gerente', 'proprietario', 'outro')),
  especialidade TEXT, -- Para veterinários

  -- Contato
  telefone TEXT,
  email TEXT,
  whatsapp TEXT,

  -- Informações pessoais (para relacionamento)
  aniversario DATE,
  preferencias TEXT, -- Ex: "Gosta de café, torce para o Santos FC"
  hobbies TEXT, -- Ex: "Corrida, leitura"

  -- Relacionamento
  foto_url TEXT,
  observacoes TEXT,

  -- Metadados
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_contatos_estabelecimento ON contatos(estabelecimento_id);
CREATE INDEX idx_contatos_unidade ON contatos(unidade_id);
CREATE INDEX idx_contatos_ativo ON contatos(ativo);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contatos_updated_at BEFORE UPDATE ON contatos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security)
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários veem apenas contatos da sua unidade
CREATE POLICY "Usuários veem contatos da sua unidade"
ON contatos FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem inserir contatos na sua unidade
CREATE POLICY "Usuários inserem contatos na sua unidade"
ON contatos FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem atualizar contatos da sua unidade
CREATE POLICY "Usuários atualizam contatos da sua unidade"
ON contatos FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem deletar contatos da sua unidade
CREATE POLICY "Usuários deletam contatos da sua unidade"
ON contatos FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- =====================================================
-- DADOS DE EXEMPLO (opcional)
-- =====================================================

-- Inserir contato de exemplo (ajuste o estabelecimento_id e unidade_id)
/*
INSERT INTO contatos (
  estabelecimento_id,
  unidade_id,
  nome,
  cargo,
  especialidade,
  telefone,
  email,
  aniversario,
  preferencias
) VALUES (
  '<UUID_DO_ESTABELECIMENTO>',
  '<UUID_DA_UNIDADE>',
  'Dr. João Silva',
  'veterinario',
  'Cirurgia',
  '(13) 99999-9999',
  'joao.silva@clinica.com',
  '1985-05-15',
  'Gosta de café expresso, torce para o Santos FC'
);
*/

-- =====================================================
-- CONCLUÍDO!
-- =====================================================
