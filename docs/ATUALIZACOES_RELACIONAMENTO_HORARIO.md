# ✨ Atualizações: Sistema de Relacionamento e Horários

## 🎯 O que mudou?

### 1. Sistema de Relacionamento 0-5 Estrelas

**ANTES:** Estabelecimentos começavam com 1 estrela (frio)
**AGORA:** Estabelecimentos começam com 0 estrelas (não pontuado) em cinza

#### Escala de Relacionamento:
- **0 estrelas (☆☆☆☆☆)** - Não pontuado / Novo estabelecimento - **CINZA**
- **1 estrela (★☆☆☆☆)** - Relacionamento frio - **VERMELHO**
- **2 estrelas (★★☆☆☆)** - Relacionamento morno - **LARANJA**
- **3 estrelas (★★★☆☆)** - Relacionamento regular - **AMARELO**
- **4 estrelas (★★★★☆)** - Bom relacionamento - **VERDE**
- **5 estrelas (★★★★★)** - Relacionamento excelente - **VERDE**

### 2. Editor de Horários Facilitado

Novo componente `HorarioFuncionamentoInput` com:

#### Modelos Prontos:
- ✅ **24 horas** - "24h - Aberto todos os dias"
- ✅ **Comercial (Seg-Sex 9h-18h)** - "Segunda a sexta das 9h às 18h"
- ✅ **Comercial + Sábado manhã** - "Segunda a sexta das 9h às 18h, Sábado das 9h às 12h"
- ✅ **Comercial + Sábado** - "Segunda a sábado das 9h às 18h"
- ✅ **Meio período (Seg-Sex 9h-13h)** - "Segunda a sexta das 9h às 13h"
- ✅ **Tarde/Noite (Seg-Sex 14h-22h)** - "Segunda a sexta das 14h às 22h"

#### Modo Personalizado:
- Campo de texto livre para escrever qualquer horário
- Preview em tempo real de como vai aparecer
- Dicas de formatação

---

## 🔧 Como Aplicar no Supabase

### Passo 1: Executar Migration SQL

Acesse o **Supabase Dashboard** → **SQL Editor** → **New Query**

Copie e execute o seguinte SQL:

```sql
-- Migração: Atualizar relacionamento para aceitar 0-5 estrelas

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

-- ✅ Pronto!
```

### Passo 2: Verificar

Execute para verificar a mudança:

```sql
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'estabelecimentos' AND column_name = 'relacionamento';
```

Deve mostrar `DEFAULT 0`.

---

## 📁 Arquivos Modificados

### 1. **Schema do Banco**
- `/supabase/schema.sql` - Atualizado para relacionamento 0-5
- `/supabase/migration_relacionamento_0-5.sql` - Script de migração

### 2. **Componentes**
- `/components/HorarioFuncionamentoInput.tsx` - **NOVO** componente facilitado

### 3. **Tipos TypeScript**
- `/types/index.ts` - `NivelRelacionamento` agora inclui 0

### 4. **Páginas Atualizadas**
- `/app/estabelecimentos/page.tsx` - Filtro e exibição de 0 estrelas
- `/app/estabelecimentos/adicionar-link/page.tsx` - Usa componente de horário + default 0 estrelas
- `/app/estabelecimentos/[id]/page.tsx` - Exibe 0 estrelas corretamente

---

## 🎨 Cores do Sistema

```typescript
const cores = {
  0: 'CINZA',   // Não pontuado
  1: 'VERMELHO', // Frio
  2: 'LARANJA',  // Morno
  3: 'AMARELO',  // Regular
  4: 'VERDE',    // Bom
  5: 'VERDE',    // Excelente
};
```

---

## ✅ Como Usar

### Adicionar Novo Estabelecimento:

1. Vá em **Estabelecimentos** → **Adicionar por Link**
2. Cole o link do Google Maps
3. Clique em **Continuar**
4. **Horário de Funcionamento:**
   - Clique em **Modelos Prontos** e escolha um preset
   - OU clique em **Personalizado** e escreva livre
5. **Relacionamento:** Automaticamente inicia em 0 estrelas (cinza)
6. Clique em **Adicionar Estabelecimento**

### Filtrar por Relacionamento:

Na lista de estabelecimentos, use o filtro:
- **Todos**
- **★★★★★ (5 estrelas)**
- **★★★★☆ (4 estrelas)**
- **★★★☆☆ (3 estrelas)**
- **★★☆☆☆ (2 estrelas)**
- **★☆☆☆☆ (1 estrela)**
- **☆☆☆☆☆ (Não pontuado)** ← NOVO!

---

## 🚀 Benefícios

### Sistema de 0 Estrelas:
- ✅ Diferencia estabelecimentos novos dos "frios"
- ✅ Visual mais claro (cinza vs vermelho)
- ✅ Não penaliza estabelecimentos recém-cadastrados
- ✅ Permite rastrear quais ainda não foram pontuados

### Editor de Horários:
- ✅ **Rápido:** 1 clique para horários comuns (24h, comercial, etc)
- ✅ **Flexível:** Modo personalizado para casos especiais
- ✅ **Preview:** Veja como vai aparecer antes de salvar
- ✅ **Consistente:** Formatos padronizados
- ✅ **Armazenamento:** Salva como texto simples no Supabase

---

## 📊 Exemplo de Uso no Banco

```sql
-- Estabelecimento novo (0 estrelas)
INSERT INTO estabelecimentos (nome, endereco, horario_funcionamento, relacionamento)
VALUES (
  'Clínica Pet Life',
  'Rua das Flores, 123',
  'Segunda a sexta das 9h às 18h, Sábado das 9h às 12h',
  0
);

-- Buscar estabelecimentos não pontuados
SELECT nome, relacionamento
FROM estabelecimentos
WHERE relacionamento = 0;

-- Buscar horários 24h
SELECT nome, horario_funcionamento
FROM estabelecimentos
WHERE horario_funcionamento LIKE '%24h%';
```

---

**Pronto!** 🎉 O sistema agora tem:
- ✅ Relacionamento 0-5 estrelas com cores distintas
- ✅ Editor de horários com presets e modo personalizado
- ✅ Tudo integrado com o Supabase

Após executar a migration SQL, todos os novos estabelecimentos começarão com 0 estrelas automaticamente!
