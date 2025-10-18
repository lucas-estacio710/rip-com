# 🚀 Setup do Supabase - R.I.P. Pet Santos

## 1. Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha:
   - **Name**: rip-pet-santos
   - **Database Password**: (gere uma senha forte e salve)
   - **Region**: South America (São Paulo) - mais próximo do Brasil
   - **Pricing Plan**: Free (até 500MB, perfeito para começar)
5. Clique em **"Create new project"**
6. Aguarde 1-2 minutos até o projeto ser provisionado

## 2. Executar o Schema SQL

1. No dashboard do Supabase, vá em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Copie todo o conteúdo do arquivo `supabase/schema.sql`
4. Cole no editor SQL
5. Clique em **"Run"** ou pressione `Ctrl+Enter`
6. Verifique se apareceu "Success" - todas as tabelas foram criadas!

## 3. Configurar Variáveis de Ambiente

1. No dashboard do Supabase, vá em **Settings** > **API**
2. Copie os valores:
   - **Project URL** (ex: https://abc123.supabase.co)
   - **anon public** key (chave pública, começa com "eyJ...")

3. Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Na raiz do projeto (C:\Users\kel_v\rip-com)
cp .env.example .env.local
```

4. Edite `.env.local` e cole os valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sua-url-aqui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sua-chave-aqui...
```

## 4. Testar Conexão

1. Reinicie o servidor Next.js:
   - Pare o servidor (Ctrl+C)
   - Rode novamente: `npm run dev`

2. Abra o console do navegador
3. Você NÃO deve ver o warning: "⚠️ Supabase credentials not configured"
4. Tente adicionar um estabelecimento - agora deve salvar no Supabase!

## 5. Verificar Dados Salvos

1. No dashboard do Supabase, vá em **Table Editor**
2. Selecione a tabela **estabelecimentos**
3. Você deve ver os dados que adicionou no app!

## 📊 Estrutura das Tabelas

- **estabelecimentos**: Clínicas, hospitais, petshops, etc
- **contatos**: Pessoas (veterinários, recepcionistas) de cada estabelecimento
- **visitas**: Histórico de visitas aos estabelecimentos
- **amenidades**: Brindes entregues em cada visita
- **indicacoes**: Clientes indicados por estabelecimentos

## 🔐 Segurança

**IMPORTANTE**:
- Nunca commite o arquivo `.env.local` no Git (já está no .gitignore)
- A chave `ANON_KEY` é segura para uso público (frontend)
- O Supabase usa Row Level Security (RLS) para proteger dados
  - Por enquanto RLS está desabilitado para facilitar desenvolvimento
  - Habilite quando adicionar autenticação de usuários

## 🎯 Próximos Passos

Depois que configurar:
1. Testar adicionar estabelecimento via link do Google Maps
2. Verificar se a foto está sendo salva
3. Navegar para lista e ver se o estabelecimento aparece
4. Abrir o estabelecimento e confirmar todos os dados

## ❓ Troubleshooting

**Erro "Failed to fetch" ao adicionar estabelecimento:**
- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor após adicionar `.env.local`
- Verifique se o schema SQL foi executado sem erros

**Dados não aparecem:**
- Abra o console do navegador (F12) e veja se há erros
- Verifique no Supabase Table Editor se os dados estão lá
- Pode ser erro de mapeamento de campos (ex: criado_em vs criadoEm)

**Warning de credenciais:**
- Se aparecer o warning, o `.env.local` não foi carregado
- Certifique-se que está na raiz do projeto
- Reinicie o servidor Next.js
