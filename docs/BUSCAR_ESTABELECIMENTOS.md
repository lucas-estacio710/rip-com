# 🔍 Buscar Estabelecimentos pelo Nome

Esta funcionalidade permite adicionar estabelecimentos ao sistema de forma rápida e fácil, pesquisando pelo nome e obtendo automaticamente todas as informações do Google Places.

## 📱 Como Usar

### 1. Acesse a página de busca

Na página de **Estabelecimentos**, clique no botão **"Buscar pelo Nome"** (azul, com ícone de lupa).

### 2. Faça a busca

- Digite o nome do estabelecimento (ex: "Clínica Veterinária Pet Life")
- Opcionalmente, ajuste a cidade (padrão: Santos, SP)
- Clique em **Buscar**

### 3. Selecione o resultado

A busca retornará uma lista de estabelecimentos encontrados no Google. Cada resultado mostra:
- Nome do estabelecimento
- Endereço completo
- Foto (se disponível)
- Avaliação do Google (estrelas e número de avaliações)

Clique no estabelecimento desejado para ver os detalhes completos.

### 4. Confirme as informações

Após selecionar, você verá:

**Informações automáticas** (trazidas do Google):
- Nome
- Endereço completo
- Telefone
- Coordenadas (latitude/longitude)
- Avaliação
- Horário de funcionamento
- Foto

**Campos para ajustar**:
- **Tipo**: Clínica, Hospital, Pet Shop, Casa de Ração, Laboratório ou Outro
  - O sistema tenta inferir automaticamente baseado no nome
- **Relacionamento Inicial**: 1 a 5 estrelas
  - Mapeado automaticamente da avaliação do Google
  - Você pode ajustar conforme necessário
- **Observações**: Campo livre para anotações

### 5. Salve

Clique em **"Adicionar Estabelecimento"** para salvar no sistema.

## ⚙️ Configuração (Necessária)

Para usar esta funcionalidade, você precisa configurar a API do Google Maps:

### 1. Obtenha uma API Key

1. Acesse: https://console.cloud.google.com/google/maps-apis/
2. Crie um projeto ou selecione um existente
3. Ative as seguintes APIs:
   - **Places API** (Text Search e Place Details)
   - **Maps JavaScript API** (opcional, para visualizar mapas)
4. Vá em "Credenciais" → "Criar credenciais" → "Chave de API"
5. Copie a chave gerada

### 2. Configure no projeto

1. Na raiz do projeto, crie um arquivo `.env.local`
2. Adicione a chave:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

3. Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

### 3. Restrições de segurança (Recomendado)

No Google Cloud Console, configure restrições para sua API Key:

1. **Restrições de aplicativo**: Defina o domínio do seu site
2. **Restrições de API**: Limite apenas às APIs necessárias:
   - Places API
   - Geocoding API
   - Maps JavaScript API

## 🆚 Comparação: Buscar vs Manual vs Importação CSV

| Funcionalidade | Buscar pelo Nome | Manual | Importação CSV |
|----------------|------------------|--------|----------------|
| **Velocidade** | ⚡ Rápida (1 por vez) | 🐌 Lenta | ⚡⚡⚡ Muito rápida (massa) |
| **Precisão** | ✅ Alta (Google) | ⚠️ Depende do usuário | ⚠️ Depende dos dados |
| **Coordenadas** | ✅ Automáticas | ❌ Manual | ✅ Automáticas (se API configurada) |
| **Telefone** | ✅ Automático | ❌ Manual | ✅ Se disponível nos dados |
| **Foto** | ✅ Automática | ❌ Manual | ❌ Não |
| **Horário** | ✅ Automático | ❌ Manual | ❌ Não |
| **Avaliação** | ✅ Automática | ❌ Manual | ✅ Se disponível nos dados |
| **Melhor para** | Adicionar 1-10 estabelecimentos | Casos especiais | Adicionar 50+ estabelecimentos |

## 🎯 Quando usar cada método?

### Use "Buscar pelo Nome" quando:
- Você quer adicionar poucos estabelecimentos (1-20)
- Precisa de informações completas e precisas
- O estabelecimento está no Google Maps
- Quer economizar tempo digitando dados manualmente

### Use "Manual" quando:
- O estabelecimento não está no Google Maps
- Você tem informações específicas não disponíveis publicamente
- Precisa de controle total sobre os dados inseridos

### Use "Importação CSV" quando:
- Você tem uma planilha com muitos estabelecimentos (50+)
- Está migrando de outro sistema
- Recebeu uma lista de prospects para adicionar

## 📊 Mapeamento Automático

### Tipo de Estabelecimento

O sistema infere automaticamente o tipo baseado em palavras-chave:

| Palavras-chave | Tipo inferido |
|----------------|---------------|
| "hospital", "24h", "emergência" | Hospital |
| "clínica", "veterinário" | Clínica |
| "pet shop", "petshop", "banho", "tosa" | Pet Shop |
| "ração", "alimento" | Casa de Ração |
| "laboratório", "exame" | Laboratório |
| Outros casos | Clínica (padrão) |

Você sempre pode ajustar manualmente se a inferência estiver incorreta.

### Relacionamento (Estrelas)

Mapeia a avaliação do Google (0-5) para o relacionamento inicial:

| Avaliação Google | Relacionamento |
|------------------|----------------|
| 4.5 - 5.0 | ★★★★★ (5 estrelas) |
| 3.5 - 4.4 | ★★★★☆ (4 estrelas) |
| 2.5 - 3.4 | ★★★☆☆ (3 estrelas) |
| 1.5 - 2.4 | ★★☆☆☆ (2 estrelas) |
| 0.0 - 1.4 | ★☆☆☆☆ (1 estrela) |

> **Nota**: Este é o relacionamento **inicial** baseado na reputação pública. Conforme você visita e constrói relacionamento com o estabelecimento, você pode atualizar manualmente para refletir a qualidade real do relacionamento comercial.

## 💰 Custos da API do Google

A Google oferece um crédito mensal gratuito de **$200**.

### Custos por operação:

- **Text Search**: $32 por 1000 buscas
- **Place Details**: $17 por 1000 consultas

### Exemplo prático:

Se você adicionar **50 estabelecimentos por mês**:
- 50 buscas = $1.60
- 50 detalhes = $0.85
- **Total: $2.45/mês** (bem dentro do crédito gratuito)

Se você adicionar **500 estabelecimentos por mês**:
- 500 buscas = $16.00
- 500 detalhes = $8.50
- **Total: $24.50/mês** (ainda dentro do crédito gratuito)

> 💡 **Dica**: Para importações massivas, use o script CSV que geocodifica em lote e é mais econômico.

## 🔒 Privacidade e Segurança

- Suas buscas são processadas através da sua própria API Key do Google
- Nenhum dado é compartilhado com terceiros além do Google
- As informações são públicas (já disponíveis no Google Maps)
- Configure restrições de domínio na API Key para segurança adicional

## ❓ Solução de Problemas

### "Google Maps API key not configured"

**Solução**: Crie o arquivo `.env.local` com a chave `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### "Nenhum resultado encontrado"

**Possíveis causas**:
- O estabelecimento não está no Google Maps
- O nome está escrito de forma muito diferente
- A cidade está incorreta

**Solução**:
- Tente variações do nome
- Verifique a ortografia
- Use "Manual" se o estabelecimento não existir no Google

### "Google Places API error"

**Possíveis causas**:
- API Key inválida
- APIs não ativadas no projeto
- Limite de requisições excedido
- Restrições de domínio incorretas

**Solução**:
1. Verifique se a chave está correta
2. Confirme que Places API está ativada
3. Verifique o painel de quotas no Google Cloud
4. Revise as restrições da API Key

## 🚀 Próximos Passos

Depois de adicionar estabelecimentos:

1. **Visualize no mapa**: Vá para a página inicial e veja os pins no mapa
2. **Adicione contatos**: Entre no estabelecimento e cadastre veterinários, recepcionistas, etc
3. **Planeje visita**: Use "Preparar Visita" para planejar sua abordagem
4. **Registre visitas**: Após visitar, registre amenidades entregues e observações

---

**Documentação atualizada**: Janeiro 2025
**Versão**: 1.0
