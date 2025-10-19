'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface DashboardStats {
  visitasEstaSemana: number;
  totalEstrelas: number;
  mediaRelacionamento: number;
  contatosCadastradosMes: number;
  estabelecimentosCadastradosMes: number;
  indicacoesMes: number;
  totalEstabelecimentos: number;
}

export default function Home() {
  const { perfil } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    visitasEstaSemana: 0,
    totalEstrelas: 0,
    mediaRelacionamento: 0,
    contatosCadastradosMes: 0,
    estabelecimentosCadastradosMes: 0,
    indicacoesMes: 0,
    totalEstabelecimentos: 0,
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');

  // Determina saudação baseada na hora
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Bom dia');
    } else if (hour < 18) {
      setGreeting('Boa tarde');
    } else {
      setGreeting('Boa noite');
    }
  }, []);

  // Carrega estatísticas
  useEffect(() => {
    async function loadStats() {
      try {
        console.log('📊 Iniciando carregamento de estatísticas...');
        const { createClient } = await import('@/lib/supabase-client');
        const supabase = createClient();

        // Total de estabelecimentos
        console.log('📍 Buscando total de estabelecimentos...');
        const { count: totalEstabelecimentos, error: errorEstab } = await supabase
          .from('estabelecimentos')
          .select('*', { count: 'exact', head: true });

        if (errorEstab) console.error('❌ Erro ao buscar estabelecimentos:', errorEstab);
        console.log('✅ Total estabelecimentos:', totalEstabelecimentos);

        // Visitas esta semana (tabela ainda não existe)
        console.log('📅 Visitas esta semana: funcionalidade desabilitada (tabela não existe)');
        const visitasEstaSemana = 0;

        // Relacionamento (soma e média)
        console.log('⭐ Calculando relacionamento...');
        const { data: estabelecimentos, error: errorRelac } = await supabase
          .from('estabelecimentos')
          .select('relacionamento');

        if (errorRelac) console.error('❌ Erro ao buscar relacionamento:', errorRelac);

        let totalEstrelas = 0;
        let mediaRelacionamento = 0;
        if (estabelecimentos && estabelecimentos.length > 0) {
          totalEstrelas = estabelecimentos.reduce((sum, est) => sum + (est.relacionamento || 0), 0);
          mediaRelacionamento = totalEstrelas / estabelecimentos.length;
        }
        console.log('✅ Relacionamento calculado:', { totalEstrelas, mediaRelacionamento });

        // Contatos cadastrados este mês
        console.log('👥 Buscando contatos do mês...');
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const { count: contatosCadastradosMes, error: errorContatos } = await supabase
          .from('contatos')
          .select('*', { count: 'exact', head: true })
          .gte('criado_em', inicioMes.toISOString());

        if (errorContatos) console.error('❌ Erro ao buscar contatos:', errorContatos);
        console.log('✅ Contatos do mês:', contatosCadastradosMes);

        // Estabelecimentos cadastrados este mês
        console.log('🏢 Buscando estabelecimentos do mês...');
        const { count: estabelecimentosCadastradosMes, error: errorEstabMes } = await supabase
          .from('estabelecimentos')
          .select('*', { count: 'exact', head: true })
          .gte('criado_em', inicioMes.toISOString());

        if (errorEstabMes) console.error('❌ Erro ao buscar estabelecimentos do mês:', errorEstabMes);
        console.log('✅ Estabelecimentos do mês:', estabelecimentosCadastradosMes);

        // Indicações este mês (tabela ainda não existe)
        console.log('💡 Indicações do mês: funcionalidade desabilitada (tabela não existe)');
        const indicacoesMes = 0;

        console.log('🎉 Definindo estatísticas no estado...');
        setStats({
          visitasEstaSemana: visitasEstaSemana || 0,
          totalEstrelas,
          mediaRelacionamento,
          contatosCadastradosMes: contatosCadastradosMes || 0,
          estabelecimentosCadastradosMes: estabelecimentosCadastradosMes || 0,
          indicacoesMes: indicacoesMes || 0,
          totalEstabelecimentos: totalEstabelecimentos || 0,
        });
        console.log('✅ Estatísticas carregadas com sucesso!');
      } catch (error) {
        console.error('💥 Erro crítico ao carregar estatísticas:', error);
      } finally {
        console.log('🏁 Finalizando loading...');
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          {greeting}, {perfil?.nome_completo?.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Visitas Esta Semana */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Visitas Esta Semana
              </p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {stats.visitasEstaSemana}
              </p>
              <Link
                href="/visitas"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
              >
                Ver todas as visitas →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Relacionamento Médio */}
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Relacionamento Médio
              </p>
              <p className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">
                {stats.mediaRelacionamento.toFixed(1)} ★
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Total: {stats.totalEstrelas} estrelas
              </p>
              <Link
                href="/locais"
                className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline mt-2 inline-block"
              >
                Ver estabelecimentos →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Estabelecimentos */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">
                Total de Locais
              </p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {stats.totalEstabelecimentos}
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                +{stats.estabelecimentosCadastradosMes} este mês
              </p>
              <Link
                href="/locais"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block"
              >
                Adicionar novo →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Contatos Cadastrados */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                Contatos Este Mês
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {stats.contatosCadastradosMes}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Novos profissionais
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Estabelecimentos Cadastrados */}
        <div className="card bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border-indigo-200 dark:border-indigo-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-1">
                Novos Estabelecimentos
              </p>
              <p className="text-3xl font-bold text-indigo-900 dark:text-indigo-100">
                {stats.estabelecimentosCadastradosMes}
              </p>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                Cadastrados este mês
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Indicações do Mês */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                Indicações do Mês
              </p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {stats.indicacoesMes}
              </p>
              <Link
                href="/indicacoes"
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline mt-2 inline-block"
              >
                Ver indicações →
              </Link>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/estabelecimentos/adicionar-link"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Adicionar Local</p>
            </div>
          </Link>

          <Link
            href="/visitas/agendar"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Agendar Visita</p>
            </div>
          </Link>

          <Link
            href="/relatorios"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Ver Relatórios</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
