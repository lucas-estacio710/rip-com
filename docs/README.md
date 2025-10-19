# R.I.P. Pet - Sistema de Inteligência Comercial

Sistema de gestão de relacionamento comercial desenvolvido para a R.I.P. Pet, focado em maximizar indicações através de relacionamento próximo com clínicas, hospitais e estabelecimentos veterinários.

## Funcionalidades Implementadas (Front-end)

### 1. Dashboard
- Visão geral com métricas principais
- Cards informativos com estatísticas
- Alertas de estabelecimentos que precisam de visita
- Últimas indicações recebidas
- Ações rápidas para agilizar o trabalho

### 2. Gestão de Estabelecimentos
- Lista completa com filtros (busca, tipo, temperatura de relacionamento)
- Perfil detalhado de cada estabelecimento
- Abas organizadas: Informações, Contatos, Visitas, Indicações
- Indicadores visuais de tempo desde última visita
- Sistema de temperatura (quente/morno/frio)

### 3. Preparar Visita (⭐ Feature Principal)
Tela estratégica que mostra ANTES da visita:
- Tempo desde a última visita
- Alertas se passou muito tempo
- Aniversariantes da semana
- Pendências de agradecimento por indicações
- Resumo da última visita (clima, assuntos, amenidades entregues)
- Lista de contatos com telefones
- Sugestões inteligentes de amenidades

### 4. Layout Responsivo
- **Mobile-first**: Navegação inferior para uso no campo
- **Desktop**: Sidebar lateral com navegação completa
- Design limpo e moderno com Tailwind CSS
- Dark mode automático

## Tecnologias Utilizadas

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **React 19**

## Estrutura do Projeto

```
rip-com/
├── app/                          # Páginas Next.js
│   ├── page.tsx                 # Dashboard
│   ├── estabelecimentos/        # Lista e perfil de estabelecimentos
│   ├── preparar-visita/         # Tela de preparação
│   ├── amenidades/              # Controle de amenidades (placeholder)
│   ├── visitas/                 # Histórico de visitas (placeholder)
│   ├── indicacoes/              # Gerenciar indicações (placeholder)
│   ├── relatorios/              # Análises (placeholder)
│   └── mais/                    # Menu adicional
├── components/
│   ├── layout/                  # Componentes de layout
│   │   ├── Navigation.tsx       # Navegação mobile
│   │   ├── Sidebar.tsx          # Sidebar desktop
│   │   └── Header.tsx           # Cabeçalho
│   └── ui/                      # Componentes reutilizáveis
│       └── StatCard.tsx         # Card de estatísticas
├── types/
│   └── index.ts                 # Tipos TypeScript
└── lib/
    └── mockData.ts              # Dados mock para desenvolvimento
```

## Como Executar

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Rodar produção
npm start
```

O projeto estará disponível em: **http://localhost:3000**

## Próximos Passos (Backend com Supabase)

### 1. Estrutura do Banco de Dados

**Tabelas principais:**
- `estabelecimentos` - Dados dos locais
- `contatos` - Pessoas de cada estabelecimento
- `visitas` - Histórico de visitas
- `amenidades_estoque` - Controle de estoque
- `amenidades_entregues` - O que foi entregue em cada visita
- `indicacoes` - Casos indicados
- `usuarios` - Sistema de autenticação

### 2. Autenticação Supabase
- Login/Logout
- Controle de acesso (você + representante)
- Row Level Security (RLS)

### 3. Features a Implementar
- [ ] Formulários de cadastro/edição
- [ ] Upload de fotos (Supabase Storage)
- [ ] Geolocalização e mapas
- [ ] Notificações push (aniversários, visitas atrasadas)
- [ ] Sincronização offline (PWA)
- [ ] Relatórios e gráficos
- [ ] Exportação de dados
- [ ] OCR para cartões de visita
- [ ] Gravação de áudio com transcrição

### 4. Integração com Vercel
- Deploy automático
- Variáveis de ambiente para Supabase
- Edge Functions para otimização

## Schema Supabase Sugerido

```sql
-- Estabelecimentos
create table estabelecimentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null,
  endereco text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  email text,
  horario_funcionamento text,
  latitude decimal,
  longitude decimal,
  temperatura text not null default 'morno',
  observacoes text,
  ultima_visita timestamp,
  proxima_visita timestamp,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Contatos
create table contatos (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id),
  nome text not null,
  cargo text not null,
  especialidade text,
  telefone text,
  email text,
  aniversario date,
  preferencias text,
  hobbies text,
  foto_url text,
  observacoes text,
  created_at timestamp default now()
);

-- Visitas
create table visitas (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id),
  data timestamp not null,
  visitado_por text not null,
  assuntos text,
  clima text,
  proxima_visita_sugerida timestamp,
  promessas text,
  observacoes text,
  created_at timestamp default now()
);

-- Indicações
create table indicacoes (
  id uuid primary key default gen_random_uuid(),
  estabelecimento_id uuid references estabelecimentos(id),
  contato_id uuid references contatos(id),
  data_indicacao timestamp not null,
  nome_cliente text not null,
  status_caso text not null,
  agradecimento_enviado boolean default false,
  data_agradecimento timestamp,
  observacoes text,
  created_at timestamp default now()
);
```

## Paleta de Cores

- **Primary (Roxo)**: #7c3aed - Sofisticação/Respeito
- **Secondary (Rosa)**: #ec4899 - Carinho/Afeto
- **Success (Verde)**: #10b981
- **Warning (Amarelo)**: #f59e0b
- **Danger (Vermelho)**: #ef4444

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
