# Script de Importação de Dados

Este script permite importar dados de estabelecimentos veterinários em massa a partir de um arquivo CSV.

## 📋 Formato do CSV

O arquivo CSV deve conter as seguintes colunas (exatamente com esses nomes):

```
Nome,classificação,avaliação,Tipo,Categoria,Endereço,tel,cidade
```

### Exemplo de linha:
```
Instituto Viva Bicho Santos,4.6,829,Veterinário,Saúde,R. João Guerra 319,(13) 99611-5779,Santos
```

## 🚀 Como Usar

### 1. Instale as dependências

```bash
npm install
```

### 2. (Opcional) Configure a API do Google Maps

Para obter coordenadas precisas (latitude/longitude) dos endereços, você precisa de uma chave da API do Google Maps:

1. Acesse: https://console.cloud.google.com/google/maps-apis/
2. Crie um projeto ou use um existente
3. Ative a **Geocoding API**
4. Crie uma chave de API
5. Crie um arquivo `.env.local` na raiz do projeto:

```bash
GOOGLE_MAPS_API_KEY=sua_chave_aqui
```

**⚠️ Sem a API Key**: O script funcionará normalmente, mas usará coordenadas aproximadas aleatórias dentro da área de Santos.

### 3. Execute o script

```bash
npm run import scripts/sample-data.csv
```

Ou com seu próprio arquivo:

```bash
npm run import caminho/para/seu-arquivo.csv
```

## 📊 O que o script faz

1. **Lê o arquivo CSV** - Processa linha por linha
2. **Mapeia classificação para estrelas**:
   - 4.5-5.0 → ★★★★★ (5 estrelas)
   - 3.5-4.4 → ★★★★☆ (4 estrelas)
   - 2.5-3.4 → ★★★☆☆ (3 estrelas)
   - 1.5-2.4 → ★★☆☆☆ (2 estrelas)
   - 0.0-1.4 → ★☆☆☆☆ (1 estrela)
3. **Infere o tipo de estabelecimento**:
   - Hospital (palavras-chave: hospital, 24h, emergência)
   - Clínica (palavras-chave: clínica, veterinário)
   - Pet Shop (palavras-chave: pet shop, banho, tosa)
   - Casa de Ração (palavras-chave: ração, alimento)
   - Laboratório (palavras-chave: laboratório, exame)
   - Outro (casos não identificados)
4. **Geocodifica endereços** (se API Key configurada)
5. **Gera arquivo TypeScript** formatado

## 📁 Saída

O script gera um arquivo em:
```
scripts/output/importedData.ts
```

### Exemplo de saída:

```typescript
export const mockEstabelecimentos: Estabelecimento[] = [
  {
    id: '1',
    nome: 'Instituto Viva Bicho Santos',
    tipo: 'clinica',
    endereco: 'R. João Guerra, 319',
    cidade: 'Santos',
    estado: 'SP',
    telefone: '(13) 99611-5779',
    latitude: -23.9638,
    longitude: -46.3357,
    relacionamento: 5,
    criadoEm: new Date('2024-10-17T00:00:00.000Z'),
    atualizadoEm: new Date('2024-10-17T00:00:00.000Z'),
  },
  // ... mais estabelecimentos
];
```

## 📝 Próximos Passos

Após gerar o arquivo:

1. Revise o arquivo gerado: `scripts/output/importedData.ts`
2. Verifique se os tipos foram inferidos corretamente
3. Confirme as coordenadas no mapa (se usou a API)
4. Copie o array para `lib/mockData.ts`:

```typescript
// lib/mockData.ts
import type { Estabelecimento } from '@/types';

// Cole aqui o conteúdo gerado
export const mockEstabelecimentos: Estabelecimento[] = [
  // ... dados importados
];
```

5. Reinicie o servidor de desenvolvimento:

```bash
npm run dev
```

## 🔧 Solução de Problemas

### "Arquivo não encontrado"
- Verifique se o caminho do arquivo CSV está correto
- Use caminhos relativos a partir da raiz do projeto

### "CSV vazio ou sem dados"
- Confirme que o arquivo tem pelo menos 2 linhas (header + dados)
- Verifique se está usando vírgulas como separadores

### "Linha X tem número incorreto de campos"
- Verifique se todas as linhas têm exatamente 8 campos
- Remova linhas vazias do CSV
- Certifique-se de que não há vírgulas extras nos dados

### Coordenadas imprecisas
- Configure a `GOOGLE_MAPS_API_KEY` para obter coordenadas reais
- Verifique se os endereços estão completos e corretos
- A API do Google cobra após um certo limite gratuito mensal

## 📞 Suporte

Para mais informações, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.
