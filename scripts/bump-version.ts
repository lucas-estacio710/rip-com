#!/usr/bin/env tsx
/**
 * Script para incrementar versão do projeto
 * Uso: npm run version:patch | version:minor | version:major
 */

import * as fs from 'fs';
import * as path from 'path';

const versionFilePath = path.join(process.cwd(), 'lib', 'version.ts');

// Tipo de incremento: patch | minor | major
const bumpType = process.argv[2] as 'patch' | 'minor' | 'major';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ Uso: npm run version:patch | version:minor | version:major');
  process.exit(1);
}

// Ler arquivo de versão
const content = fs.readFileSync(versionFilePath, 'utf-8');

// Extrair versão atual
const versionMatch = content.match(/export const APP_VERSION = '(\d+)\.(\d+)\.(\d+)'/);

if (!versionMatch) {
  console.error('❌ Não foi possível encontrar APP_VERSION no arquivo');
  process.exit(1);
}

let [, major, minor, patch] = versionMatch.map(Number);

// Incrementar baseado no tipo
switch (bumpType) {
  case 'major':
    major++;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor++;
    patch = 0;
    break;
  case 'patch':
    patch++;
    break;
}

const newVersion = `${major}.${minor}.${patch}`;
const today = new Date().toISOString().split('T')[0];

// Substituir no conteúdo
let newContent = content.replace(
  /export const APP_VERSION = '[^']+'/,
  `export const APP_VERSION = '${newVersion}'`
);

newContent = newContent.replace(
  /export const APP_BUILD_DATE = '[^']+'/,
  `export const APP_BUILD_DATE = '${today}'`
);

// Salvar arquivo
fs.writeFileSync(versionFilePath, newContent, 'utf-8');

console.log('✅ Versão atualizada com sucesso!');
console.log(`📦 Nova versão: ${newVersion}`);
console.log(`📅 Data: ${today}`);
console.log('');
console.log('Próximos passos:');
console.log('  1. git add lib/version.ts');
console.log(`  2. git commit -m "chore: Bump version to ${newVersion}"`);
console.log('  3. git push');
