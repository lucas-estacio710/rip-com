-- =====================================================
-- SCHEMA COMPLETO: Sistema Multi-Tenant R.I.P. Pet CRM
-- =====================================================

-- 1. CRIAR TABELA DE UNIDADES
-- =====================================================
CREATE TABLE IF NOT EXISTS unidades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'SP',
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir unidades iniciais
INSERT INTO unidades (nome, cidade, estado) VALUES
  ('R.I.P. Pet Santos', 'Santos', 'SP'),
  ('R.I.P. Pet Guarujá', 'Guarujá', 'SP')
ON CONFLICT DO NOTHING;


-- 2. CRIAR TABELA DE PERFIS (complementa auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT NOT NULL,
  email TEXT NOT NULL,
  unidade_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
  cargo TEXT CHECK (cargo IN ('admin', 'gestor', 'vendedor')),
  avatar_url TEXT,
  telefone TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_perfis_updated_at BEFORE UPDATE ON perfis
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 3. ATUALIZAR TABELA ESTABELECIMENTOS
-- =====================================================
-- Adicionar coluna unidade_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estabelecimentos' AND column_name = 'unidade_id'
  ) THEN
    ALTER TABLE estabelecimentos ADD COLUMN unidade_id UUID REFERENCES unidades(id);
  END IF;
END $$;

-- Atualizar estabelecimentos existentes para a primeira unidade (Santos)
UPDATE estabelecimentos
SET unidade_id = (SELECT id FROM unidades WHERE nome = 'R.I.P. Pet Santos' LIMIT 1)
WHERE unidade_id IS NULL;


-- 4. CRIAR TABELA DE VISITAS
-- =====================================================
CREATE TABLE IF NOT EXISTS visitas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dados da visita
  data_visita TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  tipo_visita TEXT CHECK (tipo_visita IN ('presencial', 'online', 'telefonema', 'whatsapp')) DEFAULT 'presencial',
  objetivo TEXT, -- 'apresentação', 'follow-up', 'negociação', 'suporte'

  -- Resultado da visita
  status TEXT CHECK (status IN ('agendada', 'realizada', 'cancelada', 'remarcada')) DEFAULT 'realizada',
  contato_realizado TEXT, -- Nome da pessoa que atendeu
  cargo_contato TEXT, -- Cargo da pessoa

  -- Feedback e próximos passos
  observacoes TEXT,
  proximos_passos TEXT,
  data_proximo_contato DATE,

  -- Avaliação da visita
  temperatura_pos_visita TEXT CHECK (temperatura_pos_visita IN ('quente', 'morno', 'frio')),
  potencial_negocio TEXT CHECK (potencial_negocio IN ('alto', 'medio', 'baixo')),

  -- Metadados
  duracao_minutos INTEGER, -- Duração da visita em minutos
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visitas_estabelecimento ON visitas(estabelecimento_id);
CREATE INDEX idx_visitas_unidade ON visitas(unidade_id);
CREATE INDEX idx_visitas_usuario ON visitas(usuario_id);
CREATE INDEX idx_visitas_data ON visitas(data_visita);

CREATE TRIGGER update_visitas_updated_at BEFORE UPDATE ON visitas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 5. CRIAR TABELA DE INDICAÇÕES
-- =====================================================
CREATE TABLE IF NOT EXISTS indicacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estabelecimento_origem_id UUID NOT NULL REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Dados da indicação
  nome_indicado TEXT NOT NULL,
  tipo_estabelecimento TEXT, -- 'clinica', 'hospital', 'petshop', etc.
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT DEFAULT 'SP',

  -- Status da indicação
  status TEXT CHECK (status IN ('nova', 'em_contato', 'agendada', 'convertida', 'perdida')) DEFAULT 'nova',
  data_primeiro_contato TIMESTAMP WITH TIME ZONE,
  data_conversao TIMESTAMP WITH TIME ZONE, -- Quando virou cliente

  -- Informações adicionais
  observacoes TEXT,
  motivo_indicacao TEXT, -- Por que foi indicado

  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_indicacoes_origem ON indicacoes(estabelecimento_origem_id);
CREATE INDEX idx_indicacoes_unidade ON indicacoes(unidade_id);
CREATE INDEX idx_indicacoes_usuario ON indicacoes(usuario_id);
CREATE INDEX idx_indicacoes_status ON indicacoes(status);

CREATE TRIGGER update_indicacoes_updated_at BEFORE UPDATE ON indicacoes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;

-- ========== POLICIES PARA PERFIS ==========
-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários veem seu próprio perfil"
ON perfis FOR SELECT
USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
ON perfis FOR UPDATE
USING (auth.uid() = id);

-- ========== POLICIES PARA UNIDADES ==========
-- Usuários podem ver apenas sua unidade
CREATE POLICY "Usuários veem sua unidade"
ON unidades FOR SELECT
USING (
  id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- ========== POLICIES PARA ESTABELECIMENTOS ==========
-- Usuários veem apenas estabelecimentos da sua unidade
CREATE POLICY "Usuários veem estabelecimentos da sua unidade"
ON estabelecimentos FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem inserir estabelecimentos na sua unidade
CREATE POLICY "Usuários inserem estabelecimentos na sua unidade"
ON estabelecimentos FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar estabelecimentos da sua unidade
CREATE POLICY "Usuários atualizam estabelecimentos da sua unidade"
ON estabelecimentos FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem deletar estabelecimentos da sua unidade
CREATE POLICY "Usuários deletam estabelecimentos da sua unidade"
ON estabelecimentos FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- ========== POLICIES PARA VISITAS ==========
-- Usuários veem apenas visitas da sua unidade
CREATE POLICY "Usuários veem visitas da sua unidade"
ON visitas FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem inserir visitas na sua unidade
CREATE POLICY "Usuários inserem visitas na sua unidade"
ON visitas FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar visitas da sua unidade
CREATE POLICY "Usuários atualizam visitas da sua unidade"
ON visitas FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem deletar visitas da sua unidade
CREATE POLICY "Usuários deletam visitas da sua unidade"
ON visitas FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- ========== POLICIES PARA INDICAÇÕES ==========
-- Usuários veem apenas indicações da sua unidade
CREATE POLICY "Usuários veem indicações da sua unidade"
ON indicacoes FOR SELECT
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem inserir indicações na sua unidade
CREATE POLICY "Usuários inserem indicações na sua unidade"
ON indicacoes FOR INSERT
WITH CHECK (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem atualizar indicações da sua unidade
CREATE POLICY "Usuários atualizam indicações da sua unidade"
ON indicacoes FOR UPDATE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);

-- Usuários podem deletar indicações da sua unidade
CREATE POLICY "Usuários deletam indicações da sua unidade"
ON indicacoes FOR DELETE
USING (
  unidade_id IN (
    SELECT unidade_id FROM perfis WHERE id = auth.uid()
  )
);


-- 7. FUNCTIONS ÚTEIS
-- =====================================================

-- Função para criar perfil automaticamente quando um usuário se registra
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 8. VIEWS ÚTEIS
-- =====================================================

-- View de estatísticas por estabelecimento
CREATE OR REPLACE VIEW vw_estatisticas_estabelecimentos AS
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


-- =====================================================
-- CONCLUÍDO! Execute este script no SQL Editor do Supabase
-- =====================================================
