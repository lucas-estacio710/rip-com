# Documentação do Banco de Dados Supabase - R.I.P. Pet CRM

## Visão Geral

Sistema multi-tenant de CRM para gerenciamento de relacionamento com estabelecimentos veterinários. Cada unidade (Santos, Guarujá, etc.) tem acesso isolado aos seus próprios dados através de Row Level Security (RLS).

---

## Estrutura de Tabelas

### 1. **unidades**
Representa as diferentes unidades da empresa (ex: Santos, Guarujá).

**Campos:**
- `id` (UUID, PK): Identificador único
- `nome` (TEXT, NOT NULL): Nome da unidade
- `cidade` (TEXT, NOT NULL): Cidade da unidade
- `estado` (TEXT, DEFAULT 'SP'): Estado
- `endereco` (TEXT): Endereço completo
- `telefone` (TEXT): Telefone de contato
- `email` (TEXT): Email de contato
- `ativo` (BOOLEAN, DEFAULT true): Status ativo/inativo
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())
- `atualizado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Unidades Iniciais:**
- R.I.P. Pet Santos (Santos, SP)
- R.I.P. Pet Guarujá (Guarujá, SP)

---

### 2. **perfis**
Complementa `auth.users` com informações adicionais dos usuários.

**Campos:**
- `id` (UUID, PK, FK → auth.users.id): Mesmo ID do usuário de autenticação
- `nome_completo` (TEXT, NOT NULL): Nome completo do usuário
- `email` (TEXT, NOT NULL): Email do usuário
- `unidade_id` (UUID, FK → unidades.id): Unidade à qual o usuário pertence
- `cargo` (TEXT, CHECK): Cargo do usuário
  - Valores permitidos: `'admin'`, `'gestor'`, `'vendedor'`
- `avatar_url` (TEXT): URL do avatar
- `telefone` (TEXT): Telefone de contato
- `ativo` (BOOLEAN, DEFAULT true): Status ativo/inativo
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())
- `atualizado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Trigger:**
- `handle_new_user()`: Cria automaticamente um perfil quando um novo usuário é registrado via auth.users
- Cargo padrão: `'vendedor'`

---

### 3. **estabelecimentos**
Clinicas, hospitais, petshops e outros estabelecimentos veterinários.

**Campos:**
- `id` (UUID, PK): Identificador único
- `unidade_id` (UUID, FK → unidades.id): Unidade responsável
- `nome` (TEXT, NOT NULL): Nome do estabelecimento
- `tipo` (TEXT, NOT NULL): Tipo de estabelecimento
  - Valores: `'clinica'`, `'hospital'`, `'petshop'`, `'casa-racao'`, `'laboratorio'`, `'outro'`
- `endereco` (TEXT, NOT NULL): Endereço completo
- `cidade` (TEXT, DEFAULT 'Santos'): Cidade
- `estado` (TEXT, DEFAULT 'SP'): Estado
- `cep` (TEXT): CEP
- `telefone` (TEXT): Telefone principal
- `email` (TEXT): Email de contato
- `instagram` (TEXT): Instagram do estabelecimento
- `whatsapp` (TEXT): WhatsApp comercial
- `website` (TEXT): Site oficial
- `horario_funcionamento` (TEXT): Horário de funcionamento
- `latitude` (DOUBLE PRECISION): Latitude GPS
- `longitude` (DOUBLE PRECISION): Longitude GPS
- `relacionamento` (INTEGER, DEFAULT 0, CHECK 0-5): Nível de relacionamento (estrelas)
- `observacoes` (TEXT): Observações gerais
- `fotos` (TEXT[]): Array de URLs de fotos
- `ultima_visita` (TIMESTAMPTZ): Data da última visita
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())
- `atualizado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Índices:**
- `idx_estabelecimentos_cidade` (cidade)
- `idx_estabelecimentos_tipo` (tipo)
- `idx_estabelecimentos_relacionamento` (relacionamento)
- `idx_estabelecimentos_ultima_visita` (ultima_visita)

---

### 4. **contatos**
Pessoas de contato dentro dos estabelecimentos.

**Campos:**
- `id` (UUID, PK): Identificador único
- `estabelecimento_id` (UUID, FK → estabelecimentos.id, CASCADE): Estabelecimento ao qual pertence
- `unidade_id` (UUID, FK → unidades.id): Unidade (copiado do estabelecimento)
- `nome` (TEXT, NOT NULL): Nome do contato
- `cargo` (TEXT): Cargo da pessoa
  - Valores: `'veterinario'`, `'recepcionista'`, `'gerente'`, `'proprietario'`, `'outro'`
- `especialidade` (TEXT): Especialidade (para veterinários)
- `telefone` (TEXT): Telefone pessoal
- `email` (TEXT): Email pessoal
- `aniversario` (DATE): Data de aniversário
- `observacoes` (TEXT): Observações sobre o contato
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())
- `atualizado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Índices:**
- `idx_contatos_estabelecimento` (estabelecimento_id)

---

### 5. **visitas**
Registro de visitas realizadas aos estabelecimentos.

**Campos:**
- `id` (UUID, PK): Identificador único
- `estabelecimento_id` (UUID, FK → estabelecimentos.id, CASCADE): Estabelecimento visitado
- `unidade_id` (UUID, FK → unidades.id, CASCADE): Unidade responsável
- `usuario_id` (UUID, FK → auth.users.id): Usuário que realizou a visita
- `data_visita` (TIMESTAMPTZ, DEFAULT NOW()): Data e hora da visita
- `tipo_visita` (TEXT, DEFAULT 'presencial'): Tipo de visita
  - Valores: `'presencial'`, `'online'`, `'telefonema'`, `'whatsapp'`
- `objetivo` (TEXT): Objetivo da visita (apresentação, follow-up, negociação, suporte)
- `status` (TEXT, DEFAULT 'realizada'): Status da visita
  - Valores: `'agendada'`, `'realizada'`, `'cancelada'`, `'remarcada'`
- `contato_realizado` (TEXT): Nome da pessoa que atendeu
- `cargo_contato` (TEXT): Cargo da pessoa que atendeu
- `observacoes` (TEXT): Observações da visita
- `proximos_passos` (TEXT): Próximos passos a serem tomados
- `data_proximo_contato` (DATE): Data sugerida para próximo contato
- `temperatura_pos_visita` (TEXT): Temperatura do relacionamento pós-visita
  - Valores: `'quente'`, `'morno'`, `'frio'`
- `potencial_negocio` (TEXT): Potencial de negócio
  - Valores: `'alto'`, `'medio'`, `'baixo'`
- `duracao_minutos` (INTEGER): Duração da visita em minutos
- `latitude` (DECIMAL(10,8)): Latitude GPS da visita
- `longitude` (DECIMAL(11,8)): Longitude GPS da visita
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())
- `atualizado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Índices:**
- `idx_visitas_estabelecimento` (estabelecimento_id)
- `idx_visitas_unidade` (unidade_id)
- `idx_visitas_usuario` (usuario_id)
- `idx_visitas_data` (data_visita)

**Trigger:**
- `update_ultima_visita_on_insert`: Atualiza automaticamente o campo `ultima_visita` do estabelecimento quando uma nova visita é inserida

---

### 6. **indicacoes**
Indicações de novos estabelecimentos feitas por estabelecimentos existentes.

**Campos:**
- `id` (UUID, PK): Identificador único
- `estabelecimento_origem_id` (UUID, FK → estabelecimentos.id, CASCADE): Estabelecimento que fez a indicação
- `unidade_id` (UUID, FK → unidades.id, CASCADE): Unidade responsável
- `usuario_id` (UUID, FK → auth.users.id): Usuário que registrou a indicação
- `nome_indicado` (TEXT, NOT NULL): Nome do estabelecimento indicado
- `tipo_estabelecimento` (TEXT): Tipo (clinica, hospital, petshop, etc.)
- `telefone` (TEXT): Telefone do indicado
- `email` (TEXT): Email do indicado
- `endereco` (TEXT): Endereço do indicado
- `cidade` (TEXT): Cidade do indicado
- `estado` (TEXT, DEFAULT 'SP'): Estado do indicado
- `status` (TEXT, DEFAULT 'nova'): Status da indicação
  - Valores: `'nova'`, `'em_contato'`, `'agendada'`, `'convertida'`, `'perdida'`
- `data_primeiro_contato` (TIMESTAMPTZ): Data do primeiro contato realizado
- `data_conversao` (TIMESTAMPTZ): Data em que virou cliente
- `observacoes` (TEXT): Observações gerais
- `motivo_indicacao` (TEXT): Por que foi indicado
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())
- `atualizado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Índices:**
- `idx_indicacoes_origem` (estabelecimento_origem_id)
- `idx_indicacoes_unidade` (unidade_id)
- `idx_indicacoes_usuario` (usuario_id)
- `idx_indicacoes_status` (status)

---

### 7. **fichas**
Fichas de cadastro preenchidas via formulário público.

**Campos:**
- `id` (UUID, PK): Identificador único
- `nome_pet` (TEXT): Nome do pet
- `tipo_pet` (TEXT): Tipo do pet
- `nome_tutor` (TEXT): Nome do tutor
- `telefone` (TEXT): Telefone do tutor
- `email` (TEXT): Email do tutor
- `criado_em` (TIMESTAMPTZ, DEFAULT NOW())

**Observação:** Esta tabela tem políticas especiais permitindo inserção anônima (role `anon`) para formulários públicos.

---

## Row Level Security (RLS) - Políticas de Segurança

### Conceito Multi-Tenant
Cada usuário só tem acesso aos dados da sua `unidade_id`. O sistema usa o `auth.uid()` para identificar o usuário logado e buscar sua `unidade_id` na tabela `perfis`.

### Políticas por Tabela

#### **perfis**
| Operação | Política | Regra |
|----------|----------|-------|
| SELECT | Usuários podem ver seu próprio perfil | `auth.uid() = id` |
| UPDATE | Usuários podem atualizar seu próprio perfil | `auth.uid() = id` |
| INSERT | Sistema pode inserir novos perfis | `auth.uid() = id` |

#### **unidades**
| Operação | Política | Regra |
|----------|----------|-------|
| SELECT | Usuários podem ver sua unidade | `id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| INSERT | Admins podem criar unidades | `EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND cargo = 'admin')` |
| UPDATE | Admins podem atualizar unidades | `EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND cargo = 'admin')` |

#### **estabelecimentos**
| Operação | Política | Regra |
|----------|----------|-------|
| SELECT | Ver estabelecimentos da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| INSERT | Criar estabelecimentos na sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| UPDATE | Atualizar estabelecimentos da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| DELETE | Deletar estabelecimentos da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |

#### **contatos**
| Operação | Política | Regra |
|----------|----------|-------|
| SELECT | Ver contatos da sua unidade | `estabelecimento_id IN (SELECT id FROM estabelecimentos WHERE unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid()))` |
| INSERT | Criar contatos na sua unidade | `estabelecimento_id IN (SELECT id FROM estabelecimentos WHERE unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid()))` |
| UPDATE | Atualizar contatos da sua unidade | `estabelecimento_id IN (SELECT id FROM estabelecimentos WHERE unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid()))` |
| DELETE | Deletar contatos da sua unidade | `estabelecimento_id IN (SELECT id FROM estabelecimentos WHERE unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid()))` |

**Nota:** Contatos usa JOIN via `estabelecimento_id` porque a tabela não tem `unidade_id` direto.

#### **visitas**
| Operação | Política | Regra |
|----------|----------|-------|
| SELECT | Ver visitas da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| INSERT | Criar visitas na sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| UPDATE | Atualizar visitas da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| DELETE | Deletar visitas da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |

#### **indicacoes**
| Operação | Política | Regra |
|----------|----------|-------|
| SELECT | Ver indicações da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| INSERT | Criar indicações na sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| UPDATE | Atualizar indicações da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |
| DELETE | Deletar indicações da sua unidade | `unidade_id IN (SELECT unidade_id FROM perfis WHERE id = auth.uid())` |

#### **fichas**
| Operação | Política | Regra | Role |
|----------|----------|-------|------|
| INSERT | Permitir inserção pública de fichas | `true` | `anon` |
| SELECT | Permitir leitura para usuários autenticados | `true` | `authenticated` |

---

## Políticas Duplicadas (Para Limpeza)

**Observação:** Existem algumas políticas duplicadas no sistema atual que podem ser removidas:

### Contatos - Políticas Duplicadas:
- `Usuários atualizam contatos da sua unidade` (filtro direto por unidade_id) ❌ REMOVER
- `Usuários deletam contatos da sua unidade` (filtro direto por unidade_id) ❌ REMOVER
- `Usuários inserem contatos na sua unidade` (filtro direto por unidade_id) ❌ REMOVER
- `Usuários veem contatos da sua unidade` (filtro direto por unidade_id) ❌ REMOVER

**Manter apenas:**
- `Usuários podem ver contatos da sua unidade` ✅
- `Usuários podem criar contatos na sua unidade` ✅
- `Usuários podem atualizar contatos da sua unidade` ✅
- `Usuários podem deletar contatos da sua unidade` ✅

### Estabelecimentos - Políticas Duplicadas:
- `Usuários veem apenas estabelecimentos da sua unidade` ❌ REMOVER

**Manter:**
- `Usuários podem ver estabelecimentos da sua unidade` ✅
- `Usuários podem inserir estabelecimentos na sua unidade` ✅
- `Usuários podem atualizar estabelecimentos da sua unidade` ✅
- `Usuários podem deletar estabelecimentos da sua unidade` ✅

---

## Functions e Triggers

### 1. **update_updated_at_column()**
Função que atualiza automaticamente o campo `atualizado_em` para NOW().

**Utilizada em:**
- perfis
- unidades
- estabelecimentos
- contatos
- visitas
- indicacoes

### 2. **handle_new_user()**
Trigger que cria automaticamente um perfil quando um usuário é registrado.

**Comportamento:**
- Disparado em: `AFTER INSERT ON auth.users`
- Cria registro em `perfis` com:
  - `id` = ID do novo usuário
  - `nome_completo` = valor de `raw_user_meta_data->>'nome_completo'` ou email
  - `email` = email do usuário
  - `cargo` = `'vendedor'` (padrão)

### 3. **update_estabelecimento_ultima_visita()**
Atualiza o campo `ultima_visita` do estabelecimento quando uma nova visita é registrada.

**Comportamento:**
- Disparado em: `AFTER INSERT ON visitas`
- Atualiza `estabelecimentos.ultima_visita` apenas se:
  - `ultima_visita` é NULL, OU
  - Nova data de visita é mais recente que `ultima_visita`

---

## Views

### **vw_estatisticas_estabelecimentos**
View agregada com estatísticas por estabelecimento.

**Campos retornados:**
- `id` (UUID): ID do estabelecimento
- `nome` (TEXT): Nome do estabelecimento
- `unidade_id` (UUID): ID da unidade
- `total_visitas` (BIGINT): Total de visitas
- `total_indicacoes` (BIGINT): Total de indicações
- `ultima_visita` (TIMESTAMPTZ): Data da última visita
- `visitas_30d` (BIGINT): Visitas nos últimos 30 dias
- `visitas_90d` (BIGINT): Visitas nos últimos 90 dias
- `indicacoes_30d` (BIGINT): Indicações nos últimos 30 dias
- `indicacoes_90d` (BIGINT): Indicações nos últimos 90 dias

**Query:**
```sql
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
```

---

## Fluxo de Autenticação

1. **Registro:**
   - Usuário se registra via `supabase.auth.signUp()`
   - Trigger `on_auth_user_created` cria automaticamente um perfil em `perfis`
   - Perfil criado com cargo `'vendedor'` por padrão
   - Admin deve atualizar `unidade_id` manualmente

2. **Login:**
   - Usuário faz login via `supabase.auth.signInWithPassword()`
   - Sistema busca `perfis` pelo `auth.uid()`
   - Sistema busca `unidades` pelo `perfil.unidade_id`
   - Contexto de autenticação carregado no frontend

3. **Acesso aos Dados:**
   - Todas as queries automáticas são filtradas por RLS
   - Sistema só retorna dados da `unidade_id` do usuário logado
   - Admins têm privilégios extras (criar/editar unidades)

---

## Queries Úteis

### Verificar Status do RLS
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Listar Todas as Políticas
```sql
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
```

### Contar Estabelecimentos por Unidade
```sql
SELECT
  u.nome AS unidade,
  COUNT(e.id) AS total_estabelecimentos
FROM unidades u
LEFT JOIN estabelecimentos e ON u.id = e.unidade_id
GROUP BY u.id, u.nome;
```

### Estabelecimentos sem Visita há 30+ Dias
```sql
SELECT
  e.nome,
  e.cidade,
  e.ultima_visita,
  CURRENT_DATE - e.ultima_visita::date AS dias_sem_visita
FROM estabelecimentos e
WHERE
  e.ultima_visita IS NULL
  OR e.ultima_visita < NOW() - INTERVAL '30 days'
ORDER BY e.ultima_visita ASC NULLS FIRST;
```

---

## Scripts de Manutenção

### Habilitar RLS com Políticas
Arquivo: `/supabase/enable_rls_with_policies.sql`

### Desabilitar RLS (Apenas para Debug)
Arquivo: `/supabase/disable_rls_for_testing.sql`

**⚠️ AVISO:** Nunca desabilite RLS em produção!

---

## Estrutura de Pastas do Projeto

```
/supabase/
  ├── schema.sql                        # Schema básico de estabelecimentos
  ├── supabase_auth_schema.sql          # Schema completo multi-tenant
  ├── enable_rls_with_policies.sql      # Habilitar RLS e políticas
  ├── disable_rls_for_testing.sql       # Desabilitar RLS (debug)
  └── contatos_schema.sql               # Schema de contatos

/docs/
  └── supabase-database-documentation.md # Este arquivo
```

---

## Notas Importantes

1. **Sempre use `auth.uid()`** nas políticas RLS para identificar o usuário
2. **Unidade é o pivot** do sistema multi-tenant
3. **Contatos não tem `unidade_id`** direto - usa JOIN via estabelecimento
4. **Visitas e Indicações têm `unidade_id`** direto - queries mais rápidas
5. **Admins são identificados** por `cargo = 'admin'` na tabela perfis
6. **Fichas são públicas** - permitem inserção anônima para formulários
7. **Todas as datas** usam `TIMESTAMPTZ` para compatibilidade com timezone

---

## Versão do Banco

- **Última atualização:** 2025-01-19
- **Versão do Supabase:** Latest
- **PostgreSQL:** 15.x
- **RLS:** Habilitado em todas as tabelas (exceto fichas para inserção)

---

## Contato

Para dúvidas sobre o banco de dados, consulte este documento ou os arquivos SQL em `/supabase/`.
