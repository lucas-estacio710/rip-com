/**
 * Funções de banco de dados para R.I.P. Pet Santos
 * Usa Supabase como backend
 */

import { createClient } from './supabase/client';
import type { Estabelecimento } from './supabase';

// ============================================
// ESTABELECIMENTOS
// ============================================

export async function getAllEstabelecimentos(): Promise<Estabelecimento[]> {
  try {
    console.log('🔌 Criando cliente Supabase...');
    const supabase = createClient();

    console.log('📡 Fazendo query ao Supabase...');
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('estabelecimentos')
      .select('*')
      .order('nome', { ascending: true });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Query completou em ${duration}ms`);

    if (error) {
      console.error('❌ Erro ao buscar estabelecimentos:', error);
      console.error('❌ Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // Se for erro de autenticação, mensagem mais clara
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        console.error('❌ Sessão expirada - redirecionando para login');
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      throw error;
    }

    console.log(`✅ Retornando ${data?.length || 0} estabelecimentos`);
    return data || [];
  } catch (error) {
    console.error('💥 Erro crítico em getAllEstabelecimentos:', error);
    return [];
  }
}

export async function getEstabelecimentoById(id: string): Promise<Estabelecimento | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar estabelecimento:', error);
    return null;
  }

  return data;
}

export async function createEstabelecimento(estabelecimento: Omit<Estabelecimento, 'id' | 'criado_em' | 'atualizado_em'>): Promise<Estabelecimento | null> {
  try {
    console.log('🔌 [createEstabelecimento] Criando cliente Supabase...');
    const supabase = createClient();

    console.log('📡 [createEstabelecimento] Inserindo no banco...');
    console.log('📝 [createEstabelecimento] Dados:', estabelecimento);

    const { data, error } = await supabase
      .from('estabelecimentos')
      .insert([estabelecimento])
      .select()
      .single();

    if (error) {
      console.error('❌ [createEstabelecimento] Erro ao inserir:', error);
      console.error('❌ [createEstabelecimento] Detalhes:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      // Se for erro de autenticação, mensagem mais clara
      if (error.code === 'PGRST301' || error.message.includes('JWT')) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      throw error;
    }

    console.log('✅ [createEstabelecimento] Estabelecimento criado com sucesso!', data);
    return data;
  } catch (error) {
    console.error('💥 [createEstabelecimento] Erro crítico:', error);
    throw error;
  }
}

export async function updateEstabelecimento(id: string, updates: Partial<Omit<Estabelecimento, 'id' | 'criado_em' | 'atualizado_em'>>): Promise<Estabelecimento | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('estabelecimentos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar estabelecimento:', error);
    throw error;
  }

  return data;
}

export async function deleteEstabelecimento(id: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('estabelecimentos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar estabelecimento:', error);
    return false;
  }

  return true;
}

// ============================================
// CONTATOS
// ============================================

export async function getContatosByEstabelecimento(estabelecimentoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar contatos:', error);
    return [];
  }

  return data || [];
}

// ============================================
// VISITAS
// ============================================

export async function getVisitasByEstabelecimento(estabelecimentoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('visitas')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao buscar visitas:', error);
    return [];
  }

  return data || [];
}

// ============================================
// INDICAÇÕES
// ============================================

export async function getIndicacoesByEstabelecimento(estabelecimentoId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('indicacoes')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('data_indicacao', { ascending: false });

  if (error) {
    console.error('Erro ao buscar indicações:', error);
    return [];
  }

  return data || [];
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats() {
  const supabase = createClient();

  // Total de estabelecimentos
  const { count: totalEstabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true });

  // Visitas este mês
  const primeiroDiaMes = new Date();
  primeiroDiaMes.setDate(1);
  primeiroDiaMes.setHours(0, 0, 0, 0);

  const { count: visitasEsteMes } = await supabase
    .from('visitas')
    .select('*', { count: 'exact', head: true })
    .gte('data', primeiroDiaMes.toISOString());

  // Indicações ativas (em andamento)
  const { count: indicacoesAtivas } = await supabase
    .from('indicacoes')
    .select('*', { count: 'exact', head: true })
    .eq('status_caso', 'em-andamento');

  // Estabelecimentos sem visita há 30+ dias
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

  const { count: estabelecimentosSemVisita30Dias } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .or(`ultima_visita.is.null,ultima_visita.lt.${trintaDiasAtras.toISOString()}`);

  // Aniversariantes próximos (próximos 7 dias)
  // TODO: Implementar quando adicionar campo de aniversário em contatos

  return {
    totalEstabelecimentos: totalEstabelecimentos || 0,
    visitasEsteMes: visitasEsteMes || 0,
    proximasVisitas: 0, // TODO: implementar
    indicacoesAtivas: indicacoesAtivas || 0,
    estabelecimentosSemVisita30Dias: estabelecimentosSemVisita30Dias || 0,
    aniversariantesProximos: 0, // TODO: implementar
  };
}
