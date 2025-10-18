// Mock data para desenvolvimento do front-end
import type {
  Estabelecimento,
  Contato,
  Visita,
  DashboardStats,
  Indicacao,
} from '@/types';

// Helper para carregar dados do localStorage
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// Helper para salvar dados no localStorage
export const saveToStorage = <T,>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
  }
};

export const mockStats: DashboardStats = {
  totalEstabelecimentos: 0,
  visitasEsteMes: 0,
  proximasVisitas: 0,
  indicacoesAtivas: 0,
  estabelecimentosSemVisita30Dias: 0,
  aniversariantesProximos: 0,
};

export const mockEstabelecimentos: Estabelecimento[] = loadFromStorage('estabelecimentos', []);

export const mockContatos: Contato[] = loadFromStorage('contatos', []);

export const mockVisitas: Visita[] = loadFromStorage('visitas', []);

export const mockIndicacoes: Indicacao[] = loadFromStorage('indicacoes', []);
