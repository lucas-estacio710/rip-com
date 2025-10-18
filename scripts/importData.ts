/**
 * Script para importar dados de estabelecimentos veterinários
 *
 * Formato esperado do CSV:
 * Nome,classificação,avaliação,Tipo,Categoria,Endereço,tel,cidade
 *
 * Exemplo:
 * Instituto Viva Bicho Santos,4.6,829,Veterinário,Saúde,R. João Guerra 319,(13) 99611-5779,Santos
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Estabelecimento, EstabelecimentoTipo, NivelRelacionamento } from '../types';

interface RawClinicData {
  Nome: string;
  classificação: string;
  avaliação: string;
  Tipo: string;
  Categoria: string;
  Endereço: string;
  tel: string;
  cidade: string;
}

/**
 * Mapeia a classificação (0-5) para o relacionamento em estrelas (1-5)
 * Clinicas novas sem visita começam com relacionamento baseado na avaliação pública
 */
function mapRatingToRelationship(rating: number): NivelRelacionamento {
  if (rating >= 4.5) return 5;
  if (rating >= 3.5) return 4;
  if (rating >= 2.5) return 3;
  if (rating >= 1.5) return 2;
  return 1;
}

/**
 * Infere o tipo de estabelecimento baseado nas palavras-chave
 */
function inferEstabelecimentoTipo(nome: string, tipo: string, categoria: string): EstabelecimentoTipo {
  const text = `${nome} ${tipo} ${categoria}`.toLowerCase();

  if (text.includes('hospital') || text.includes('24h') || text.includes('emergência')) {
    return 'hospital';
  }
  if (text.includes('clínica') || text.includes('veterinár')) {
    return 'clinica';
  }
  if (text.includes('pet shop') || text.includes('petshop') || text.includes('banho') || text.includes('tosa')) {
    return 'petshop';
  }
  if (text.includes('ração') || text.includes('racao') || text.includes('alimento')) {
    return 'casa-racao';
  }
  if (text.includes('laboratório') || text.includes('laboratorio') || text.includes('exame')) {
    return 'laboratorio';
  }

  // Padrão: se tem "veterinário" no tipo, considera clínica
  if (tipo.toLowerCase().includes('veterinár')) {
    return 'clinica';
  }

  return 'outro';
}

/**
 * Limpa e formata o número de telefone
 */
function formatTelefone(tel: string): string {
  // Remove caracteres extra e mantém apenas números e parênteses/traços
  return tel.trim().replace(/\s+/g, ' ');
}

/**
 * Limpa e formata o endereço
 */
function formatEndereco(endereco: string, cidade: string): string {
  // Remove números duplicados e formata
  let formatted = endereco.trim();

  // Se não tem vírgula e tem número sem vírgula, adiciona vírgula antes do número
  if (!formatted.includes(',') && /\d+$/.test(formatted)) {
    formatted = formatted.replace(/(\D)(\d+)$/, '$1, $2');
  }

  return formatted;
}

/**
 * Geocodifica um endereço usando a API do Google Maps
 * IMPORTANTE: Você precisará de uma API Key do Google Maps
 * https://developers.google.com/maps/documentation/geocoding/start
 */
async function geocodeAddress(endereco: string, cidade: string, estado: string = 'SP'): Promise<{ lat: number; lng: number } | null> {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('⚠️  GOOGLE_MAPS_API_KEY não configurada. Usando coordenadas padrão de Santos.');
    // Retorna coordenadas aproximadas do centro de Santos
    return {
      lat: -23.9618 + (Math.random() - 0.5) * 0.02, // Varia ±0.01 graus
      lng: -46.3322 + (Math.random() - 0.5) * 0.02
    };
  }

  try {
    const fullAddress = `${endereco}, ${cidade} - ${estado}, Brasil`;
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.warn(`⚠️  Não foi possível geocodificar: ${fullAddress} (Status: ${data.status})`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Erro ao geocodificar ${endereco}:`, error);
    return null;
  }
}

/**
 * Converte uma linha de dados brutos em um Estabelecimento
 */
async function convertToEstabelecimento(raw: RawClinicData, index: number): Promise<Estabelecimento> {
  const rating = parseFloat(raw.classificação) || 0;
  const relacionamento = mapRatingToRelationship(rating);
  const tipo = inferEstabelecimentoTipo(raw.Nome, raw.Tipo, raw.Categoria);
  const endereco = formatEndereco(raw.Endereço, raw.cidade);
  const telefone = formatTelefone(raw.tel);

  // Geocodifica o endereço
  const coords = await geocodeAddress(endereco, raw.cidade);

  const estabelecimento: Estabelecimento = {
    id: (index + 1).toString(),
    nome: raw.Nome.trim(),
    tipo,
    endereco,
    cidade: raw.cidade.trim(),
    estado: 'SP',
    telefone: telefone || undefined,
    latitude: coords?.lat,
    longitude: coords?.lng,
    relacionamento,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  };

  return estabelecimento;
}

/**
 * Processa um arquivo CSV e retorna array de estabelecimentos
 */
async function processCSV(csvContent: string): Promise<Estabelecimento[]> {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV vazio ou sem dados');
  }

  // Pega o header (primeira linha)
  const header = lines[0].split(',').map(h => h.trim());

  // Processa cada linha de dados
  const estabelecimentos: Estabelecimento[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());

    if (values.length !== header.length) {
      console.warn(`⚠️  Linha ${i + 1} tem número incorreto de campos. Pulando...`);
      continue;
    }

    // Cria objeto com os dados da linha
    const rawData: any = {};
    header.forEach((key, index) => {
      rawData[key] = values[index];
    });

    try {
      const estabelecimento = await convertToEstabelecimento(rawData as RawClinicData, i - 1);
      estabelecimentos.push(estabelecimento);
      console.log(`✅ ${i}/${lines.length - 1}: ${estabelecimento.nome}`);

      // Aguarda 200ms entre requisições para não exceder limite da API
      if (process.env.GOOGLE_MAPS_API_KEY) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`❌ Erro ao processar linha ${i + 1}:`, error);
    }
  }

  return estabelecimentos;
}

/**
 * Gera código TypeScript para mockData.ts
 */
function generateTypeScriptOutput(estabelecimentos: Estabelecimento[]): string {
  const now = new Date().toISOString();

  let output = `// Estabelecimentos importados automaticamente em ${now}\n`;
  output += `// Total: ${estabelecimentos.length} estabelecimentos\n\n`;
  output += `export const mockEstabelecimentos: Estabelecimento[] = [\n`;

  estabelecimentos.forEach((est, index) => {
    output += `  {\n`;
    output += `    id: '${est.id}',\n`;
    output += `    nome: '${est.nome}',\n`;
    output += `    tipo: '${est.tipo}',\n`;
    output += `    endereco: '${est.endereco}',\n`;
    output += `    cidade: '${est.cidade}',\n`;
    output += `    estado: '${est.estado}',\n`;
    if (est.telefone) output += `    telefone: '${est.telefone}',\n`;
    if (est.latitude) output += `    latitude: ${est.latitude},\n`;
    if (est.longitude) output += `    longitude: ${est.longitude},\n`;
    output += `    relacionamento: ${est.relacionamento},\n`;
    output += `    criadoEm: new Date('${est.criadoEm.toISOString()}'),\n`;
    output += `    atualizadoEm: new Date('${est.atualizadoEm.toISOString()}'),\n`;
    output += `  }${index < estabelecimentos.length - 1 ? ',' : ''}\n`;
  });

  output += `];\n`;

  return output;
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
📋 Script de Importação de Dados - R.I.P. Pet Santos

Uso:
  npm run import <arquivo.csv>

Formato do CSV:
  Nome,classificação,avaliação,Tipo,Categoria,Endereço,tel,cidade

Exemplo:
  Instituto Viva Bicho Santos,4.6,829,Veterinário,Saúde,R. João Guerra 319,(13) 99611-5779,Santos

Configuração:
  1. Crie um arquivo .env.local na raiz do projeto
  2. Adicione: GOOGLE_MAPS_API_KEY=sua_chave_aqui
  3. Obtenha uma chave em: https://console.cloud.google.com/google/maps-apis/

Sem a API Key, o script usará coordenadas aproximadas aleatórias em Santos.
    `);
    process.exit(0);
  }

  const csvFilePath = args[0];

  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Arquivo não encontrado: ${csvFilePath}`);
    process.exit(1);
  }

  console.log(`\n📂 Lendo arquivo: ${csvFilePath}\n`);

  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');

  console.log('🔄 Processando dados...\n');

  const estabelecimentos = await processCSV(csvContent);

  console.log(`\n✅ ${estabelecimentos.length} estabelecimentos processados com sucesso!\n`);

  // Estatísticas
  const tipoCount: { [key: string]: number } = {};
  const relacionamentoCount: { [key: number]: number } = {};

  estabelecimentos.forEach(est => {
    tipoCount[est.tipo] = (tipoCount[est.tipo] || 0) + 1;
    relacionamentoCount[est.relacionamento] = (relacionamentoCount[est.relacionamento] || 0) + 1;
  });

  console.log('📊 Estatísticas:\n');
  console.log('Por tipo:');
  Object.entries(tipoCount).forEach(([tipo, count]) => {
    console.log(`  - ${tipo}: ${count}`);
  });

  console.log('\nPor relacionamento:');
  Object.entries(relacionamentoCount).forEach(([stars, count]) => {
    console.log(`  - ${'★'.repeat(Number(stars))}${'☆'.repeat(5 - Number(stars))}: ${count}`);
  });

  // Gera arquivo de saída
  const outputTS = generateTypeScriptOutput(estabelecimentos);
  const outputPath = path.join(process.cwd(), 'scripts', 'output', 'importedData.ts');

  // Cria pasta output se não existir
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, outputTS, 'utf-8');

  console.log(`\n💾 Arquivo gerado: ${outputPath}`);
  console.log('\n📝 Próximos passos:');
  console.log('  1. Revise o arquivo gerado em scripts/output/importedData.ts');
  console.log('  2. Copie o conteúdo para lib/mockData.ts');
  console.log('  3. Ajuste manualmente se necessário\n');
}

// Executa o script
main().catch(console.error);
