# 🚀 Guia Completo de Setup do Supabase

## Passo 1: Criar Projeto no Supabase

1. Acesse https://supabase.com
2. Clique em "Start your project"
3. Faça login (GitHub recomendado)
4. Clique em "New Project"
5. Preencha:
   - **Name**: rip-pet-comercial
   - **Database Password**: (escolha uma senha forte e guarde)
   - **Region**: South America (São Paulo) ← **IMPORTANTE**
   - **Pricing Plan**: Free
6. Clique em "Create new project"
7. Aguarde ~2 minutos para o banco ser criado

---

## Passo 2: Executar o Schema SQL

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados na sidebar)
2. Clique em "+ New query"
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie TODO o conteúdo
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** (ou Ctrl/Cmd + Enter)
7. Aguarde a execução (deve demorar ~5 segundos)
8. Veja a mensagem **"Success. No rows returned"**

### O que foi criado:
✅ 7 tabelas (estabelecimentos, contatos, visitas, etc)
✅ Índices para performance
✅ Triggers automáticos
✅ 20 estabelecimentos de Santos pré-cadastrados

---

## Passo 3: Configurar Variáveis de Ambiente

1. No painel do Supabase, vá em **Settings** > **API**
2. Copie os valores:

### 📋 Você vai precisar de:

**Project URL**:
```
https://seu-projeto-id.supabase.co
```

**anon (public) key**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.1. Criar arquivo .env.local

Na raiz do projeto `rip-com`, crie o arquivo `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: Substitua pelos SEUS valores copiados do Supabase!

---

## Passo 4: Verificar Dados no Banco

1. No Supabase, vá em **Table Editor**
2. Selecione a tabela **estabelecimentos**
3. Você deve ver **20 linhas** com estabelecimentos de Santos
4. Todos devem ter:
   - ✅ Nome
   - ✅ Endereço
   - ✅ Latitude/Longitude
   - ✅ Temperatura: "frio"

---

## Passo 5: Testar Conexão

Execute no terminal:

```bash
cd rip-com
npm run dev
```

Acesse: **http://localhost:3000**

O mapa deve carregar os 20 estabelecimentos do Supabase automaticamente!

---

## 🔐 Segurança (RLS - Row Level Security)

Por enquanto, as tabelas estão com acesso público (`Allow all` policy).

### Para produção, você deve:

1. Ir em **Authentication** > **Providers**
2. Habilitar **Email** ou **Google**
3. Ajustar as policies RLS para:
   ```sql
   -- Apenas usuários autenticados
   CREATE POLICY "Allow authenticated users"
   ON estabelecimentos
   FOR ALL
   USING (auth.uid() IS NOT NULL);
   ```

---

## 📊 Consultas Úteis

### Ver todos os estabelecimentos:
```sql
SELECT * FROM estabelecimentos ORDER BY nome;
```

### Contar por tipo:
```sql
SELECT tipo, COUNT(*) as total
FROM estabelecimentos
GROUP BY tipo
ORDER BY total DESC;
```

### Estabelecimentos por temperatura:
```sql
SELECT temperatura, COUNT(*) as total
FROM estabelecimentos
GROUP BY temperatura;
```

### Estabelecimentos nunca visitados:
```sql
SELECT nome, endereco
FROM estabelecimentos
WHERE ultima_visita IS NULL;
```

---

## 🚨 Troubleshooting

### Erro: "Invalid API key"
- Verifique se copiou a `anon key` correta
- Certifique-se que o `.env.local` está na raiz do projeto
- Reinicie o servidor (`npm run dev`)

### Erro: "relation does not exist"
- Execute novamente o `supabase-schema.sql`
- Verifique se há erros na execução

### Mapa não carrega dados:
- Abra o console do navegador (F12)
- Veja se há erros de CORS
- Verifique se as variáveis de ambiente estão corretas

---

## 📱 Próximos Passos

Depois de configurar o Supabase:

1. ✅ Dados reais de Santos já estão no banco
2. 🔄 Componentes vão buscar dados do Supabase (não mais mock)
3. ➕ Você pode adicionar novos estabelecimentos
4. ✏️ Editar informações
5. 📝 Registrar visitas
6. 📈 Acompanhar métricas reais

---

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique os logs do Supabase em **Logs** > **Database**
2. Teste a conexão no SQL Editor: `SELECT * FROM estabelecimentos LIMIT 5;`
3. Veja o console do browser (F12) para erros JavaScript

---

**Tudo pronto!** Agora você tem um banco de dados real com 20 estabelecimentos de Santos! 🎉
