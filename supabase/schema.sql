-- =====================================================
-- R.I.P. Pet Santos - Schema do Banco de Dados
-- Supabase PostgreSQL
-- =====================================================

-- TABELA: estabelecimentos
CREATE TABLE IF NOT EXISTS estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('clinica', 'hospital', 'petshop', 'casa-racao', 'laboratorio', 'outro')),
  endereco TEXT NOT NULL,
  cidade TEXT NOT NULL DEFAULT 'Santos',
  estado TEXT NOT NULL DEFAULT 'SP',
  cep TEXT,
  telefone TEXT,
  email TEXT,
  website TEXT,
  horario_funcionamento TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  relacionamento INTEGER NOT NULL DEFAULT 0 CHECK (relacionamento >= 0 AND relacionamento <= 5),
  observacoes TEXT,
  fotos TEXT[], -- Array de URLs de fotos
  ultima_visita TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: contatos
CREATE TABLE IF NOT EXISTS contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT CHECK (cargo IN ('veterinario', 'recepcionista', 'gerente', 'proprietario', 'outro')),
  especialidade TEXT,
  telefone TEXT,
  email TEXT,
  aniversario DATE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: visitas
CREATE TABLE IF NOT EXISTS visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  data TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visitado_por TEXT NOT NULL,
  clima TEXT NOT NULL CHECK (clima IN ('positivo', 'neutro', 'negativo')),
  assuntos TEXT NOT NULL,
  observacoes TEXT,
  proxima_visita TIMESTAMPTZ,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: amenidades (brindes entregues nas visitas)
CREATE TABLE IF NOT EXISTS amenidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID NOT NULL REFERENCES visitas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  descricao TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: indicacoes
CREATE TABLE IF NOT EXISTS indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  nome_cliente TEXT NOT NULL,
  nome_pet TEXT,
  tipo_caso TEXT,
  data_indicacao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status_caso TEXT NOT NULL CHECK (status_caso IN ('pendente', 'em-andamento', 'concluido')),
  agradecimento_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES para performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_estabelecimentos_cidade ON estabelecimentos(cidade);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_tipo ON estabelecimentos(tipo);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_relacionamento ON estabelecimentos(relacionamento);
CREATE INDEX IF NOT EXISTS idx_estabelecimentos_ultima_visita ON estabelecimentos(ultima_visita);
CREATE INDEX IF NOT EXISTS idx_contatos_estabelecimento ON contatos(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_visitas_estabelecimento ON visitas(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_visitas_data ON visitas(data DESC);
CREATE INDEX IF NOT EXISTS idx_amenidades_visita ON amenidades(visita_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_estabelecimento ON indicacoes(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_status ON indicacoes(status_caso);

-- =====================================================
-- TRIGGERS para atualizar automaticamente updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_estabelecimentos_updated_at
  BEFORE UPDATE ON estabelecimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contatos_updated_at
  BEFORE UPDATE ON contatos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visitas_updated_at
  BEFORE UPDATE ON visitas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indicacoes_updated_at
  BEFORE UPDATE ON indicacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER para atualizar ultima_visita automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_estabelecimento_ultima_visita()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estabelecimentos
  SET ultima_visita = NEW.data
  WHERE id = NEW.estabelecimento_id
    AND (ultima_visita IS NULL OR ultima_visita < NEW.data);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ultima_visita_on_insert
  AFTER INSERT ON visitas
  FOR EACH ROW
  EXECUTE FUNCTION update_estabelecimento_ultima_visita();

-- =====================================================
-- ROW LEVEL SECURITY (Desabilitado por enquanto)
-- Habilite quando adicionar autenticação
-- =====================================================

-- ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE amenidades ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;
