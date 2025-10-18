-- ============================================
-- R.I.P. PET - SCHEMA COMPLETO DO SUPABASE
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. TABELA DE ESTABELECIMENTOS
CREATE TABLE estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('clinica', 'hospital', 'petshop', 'casa-racao', 'laboratorio', 'outro')),
  endereco TEXT,
  cidade TEXT NOT NULL,
  estado TEXT NOT NULL,
  cep TEXT,
  telefone TEXT,
  email TEXT,
  horario_funcionamento TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  temperatura TEXT NOT NULL DEFAULT 'frio' CHECK (temperatura IN ('quente', 'morno', 'frio')),
  observacoes TEXT,
  fotos TEXT[], -- Array de URLs
  ultima_visita TIMESTAMP,
  proxima_visita TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. TABELA DE CONTATOS
CREATE TABLE contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL CHECK (cargo IN ('veterinario', 'recepcionista', 'gerente', 'proprietario', 'outro')),
  especialidade TEXT, -- Para veterinários
  telefone TEXT,
  email TEXT,
  aniversario DATE,
  preferencias TEXT,
  hobbies TEXT,
  foto_url TEXT,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. TABELA DE VISITAS
CREATE TABLE visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE CASCADE,
  data TIMESTAMP NOT NULL DEFAULT NOW(),
  visitado_por TEXT NOT NULL, -- Nome do representante
  assuntos TEXT,
  clima TEXT CHECK (clima IN ('positivo', 'neutro', 'tenso')),
  proxima_visita_sugerida TIMESTAMP,
  promessas TEXT,
  observacoes TEXT,
  fotos TEXT[], -- Array de URLs
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. TABELA DE CONTATOS PRESENTES NA VISITA (relacionamento N:N)
CREATE TABLE visitas_contatos (
  visita_id UUID REFERENCES visitas(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES contatos(id) ON DELETE CASCADE,
  PRIMARY KEY (visita_id, contato_id)
);

-- 5. TABELA DE AMENIDADES ENTREGUES
CREATE TABLE amenidades_entregues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visita_id UUID REFERENCES visitas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('bolo', 'chocolate', 'bala', 'caneta', 'calendario', 'bloco', 'outro')),
  quantidade INTEGER NOT NULL DEFAULT 1,
  descricao TEXT
);

-- 6. TABELA DE ESTOQUE DE AMENIDADES
CREATE TABLE amenidades_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('bolo', 'chocolate', 'bala', 'caneta', 'calendario', 'bloco', 'outro')),
  descricao TEXT NOT NULL,
  quantidade_disponivel INTEGER NOT NULL DEFAULT 0,
  quantidade_minima INTEGER NOT NULL DEFAULT 5,
  ultima_reposicao TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. TABELA DE INDICAÇÕES
CREATE TABLE indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estabelecimento_id UUID REFERENCES estabelecimentos(id) ON DELETE SET NULL,
  contato_id UUID REFERENCES contatos(id) ON DELETE SET NULL,
  data_indicacao TIMESTAMP NOT NULL DEFAULT NOW(),
  nome_cliente TEXT NOT NULL,
  status_caso TEXT NOT NULL CHECK (status_caso IN ('em-andamento', 'concluido', 'cancelado')),
  agradecimento_enviado BOOLEAN DEFAULT FALSE,
  data_agradecimento TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_estabelecimentos_cidade ON estabelecimentos(cidade);
CREATE INDEX idx_estabelecimentos_temperatura ON estabelecimentos(temperatura);
CREATE INDEX idx_estabelecimentos_ultima_visita ON estabelecimentos(ultima_visita);
CREATE INDEX idx_contatos_estabelecimento ON contatos(estabelecimento_id);
CREATE INDEX idx_contatos_aniversario ON contatos(aniversario);
CREATE INDEX idx_visitas_estabelecimento ON visitas(estabelecimento_id);
CREATE INDEX idx_visitas_data ON visitas(data);
CREATE INDEX idx_indicacoes_estabelecimento ON indicacoes(estabelecimento_id);
CREATE INDEX idx_indicacoes_status ON indicacoes(status_caso);

-- ============================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER estabelecimentos_updated_at
  BEFORE UPDATE ON estabelecimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER amenidades_estoque_updated_at
  BEFORE UPDATE ON amenidades_estoque
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- TRIGGER PARA ATUALIZAR ÚLTIMA VISITA
-- ============================================

CREATE OR REPLACE FUNCTION update_ultima_visita()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE estabelecimentos
  SET ultima_visita = NEW.data
  WHERE id = NEW.estabelecimento_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER visitas_update_estabelecimento
  AFTER INSERT ON visitas
  FOR EACH ROW
  EXECUTE FUNCTION update_ultima_visita();

-- ============================================
-- ROW LEVEL SECURITY (RLS) - Básico
-- ============================================
-- Por enquanto, permitir acesso total (depois configurar auth)

ALTER TABLE estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenidades_entregues ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenidades_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicacoes ENABLE ROW LEVEL SECURITY;

-- Política temporária: permitir tudo (ajustar depois com auth)
CREATE POLICY "Allow all" ON estabelecimentos FOR ALL USING (true);
CREATE POLICY "Allow all" ON contatos FOR ALL USING (true);
CREATE POLICY "Allow all" ON visitas FOR ALL USING (true);
CREATE POLICY "Allow all" ON amenidades_entregues FOR ALL USING (true);
CREATE POLICY "Allow all" ON amenidades_estoque FOR ALL USING (true);
CREATE POLICY "Allow all" ON indicacoes FOR ALL USING (true);

-- ============================================
-- POPULAR COM DADOS DE SANTOS (20 ESTABELECIMENTOS)
-- ============================================

INSERT INTO estabelecimentos (nome, tipo, endereco, cidade, estado, latitude, longitude, temperatura) VALUES
  ('Hospital Veterinário Barra', 'hospital', 'Av. Ana Costa, 456 - Gonzaga', 'Santos', 'SP', -23.9662, -46.3288, 'frio'),
  ('Clínica Veterinária Aparecida', 'clinica', 'Rua Carvalho de Mendonça, 234 - Aparecida', 'Santos', 'SP', -23.9638, -46.3357, 'frio'),
  ('Pet Center Embaré', 'petshop', 'Av. Conselheiro Nébias, 789 - Embaré', 'Santos', 'SP', -23.9561, -46.3211, 'frio'),
  ('Clínica Vet Ponta da Praia', 'clinica', 'Av. Almirante Cochrane, 156 - Ponta da Praia', 'Santos', 'SP', -23.9881, -46.2962, 'frio'),
  ('Hospital 24h Animal Care Santos', 'hospital', 'Av. Senador Pinheiro Machado, 48 - Vila Mathias', 'Santos', 'SP', -23.9425, -46.3275, 'frio'),
  ('PetShop Boqueirão', 'petshop', 'Av. Vicente de Carvalho, 92 - Boqueirão', 'Santos', 'SP', -23.9736, -46.3089, 'frio'),
  ('Casa de Ração Macuco', 'casa-racao', 'Rua Silva Jardim, 178 - Macuco', 'Santos', 'SP', -23.9489, -46.3184, 'frio'),
  ('Clínica Veterinária Campo Grande', 'clinica', 'Av. Nossa Senhora de Fátima, 567 - Campo Grande', 'Santos', 'SP', -23.9715, -46.3423, 'frio'),
  ('Hospital Veterinário José Menino', 'hospital', 'Av. Washington Luís, 234 - José Menino', 'Santos', 'SP', -23.9527, -46.3089, 'frio'),
  ('Clínica Pet Vida - Gonzaga', 'clinica', 'Rua Euclydes da Cunha, 89 - Gonzaga', 'Santos', 'SP', -23.9642, -46.3267, 'frio'),
  ('PetShop Vila Belmiro', 'petshop', 'Rua Princesa Isabel, 345 - Vila Belmiro', 'Santos', 'SP', -23.9526, -46.3374, 'frio'),
  ('Lab Veterinário Santos', 'laboratorio', 'Rua Amador Bueno, 234 - Centro', 'Santos', 'SP', -23.9398, -46.3289, 'frio'),
  ('Casa de Ração Pet Shopping', 'casa-racao', 'Rua Euclides da Cunha, 21 - Gonzaga', 'Santos', 'SP', -23.9651, -46.3301, 'frio'),
  ('Clínica Veterinária Marapé', 'clinica', 'Av. Pedro Lessa, 456 - Marapé', 'Santos', 'SP', -23.9458, -46.3087, 'frio'),
  ('Hospital Pet Pompéia', 'hospital', 'Av. Governador Mário Covas Jr, 789 - Pompéia', 'Santos', 'SP', -23.9398, -46.3167, 'frio'),
  ('PetShop Vila Nova', 'petshop', 'Rua Brás Cubas, 123 - Vila Nova', 'Santos', 'SP', -23.9323, -46.3223, 'frio'),
  ('Clínica Vet Praia Santos', 'clinica', 'Av. Presidente Wilson, 567 - Gonzaga', 'Santos', 'SP', -23.9677, -46.3312, 'frio'),
  ('Casa de Ração Caneleira', 'casa-racao', 'Rua Almirante Tamandaré, 234 - Caneleira', 'Santos', 'SP', -23.9289, -46.3156, 'frio'),
  ('Clínica Veterinária Saboó', 'clinica', 'Rua João Pessoa, 789 - Saboó', 'Santos', 'SP', -23.9412, -46.3389, 'frio'),
  ('Hospital Veterinário Encruzilhada', 'hospital', 'Av. Afonso Pena, 456 - Encruzilhada', 'Santos', 'SP', -23.9278, -46.3289, 'frio');

-- ============================================
-- FIM DO SCHEMA
-- ============================================
