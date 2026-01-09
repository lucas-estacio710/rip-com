'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EstabelecimentoTipo } from '@/types';
import type { Estabelecimento } from '@/lib/supabase';

// Importar mapa dinamicamente (sem SSR)
const MapaEstabelecimentos = dynamic(
  () => import('@/components/MapaEstabelecimentos'),
  { ssr: false, loading: () => <div className="h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" /> }
);

export default function EstabelecimentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<EstabelecimentoTipo | 'todos'>('todos');
  const [relacionamentoFilter, setRelacionamentoFilter] = useState<string>('todos');
  const [cidadeFilter, setCidadeFilter] = useState<string>('todos');
  const [concorrenciaFilter, setConcorrenciaFilter] = useState<string>('todos');
  const [visitaFilter, setVisitaFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'mapa'>('grid');
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<string | null>(null);
  const [showOutrasCidades, setShowOutrasCidades] = useState(false);

  // Cidades principais da Baixada Santista
  const cidadesPrincipais = ['Santos', 'São Vicente', 'Praia Grande', 'Guarujá'];

  // Carregar estabelecimentos do Supabase
  useEffect(() => {
    async function loadEstabelecimentos() {
      const startTime = performance.now();
      try {
        const { getAllEstabelecimentos } = await import('@/lib/db');
        const data = await getAllEstabelecimentos();
        setEstabelecimentos(data);
        console.log(`⏱️ Carregamento de estabelecimentos: ${performance.now() - startTime} ms`);
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEstabelecimentos();
  }, []);

  // Cidades únicas para filtro
  const cidadesUnicas = useMemo(() => {
    const cidades = [...new Set(estabelecimentos.map(e => e.cidade))].sort();
    return cidades;
  }, [estabelecimentos]);

  // Outras cidades (que não são as principais)
  const outrasCidades = useMemo(() => {
    return cidadesUnicas.filter(c => !cidadesPrincipais.includes(c));
  }, [cidadesUnicas]);

  // Contadores por relacionamento
  const contadores = useMemo(() => {
    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    estabelecimentos.forEach(e => {
      counts[e.relacionamento as keyof typeof counts]++;
    });
    return counts;
  }, [estabelecimentos]);

  // Dias desde última visita
  const getDiasDesdeVisita = (ultimaVisita: string | null) => {
    if (!ultimaVisita) return null;
    const dias = Math.floor(
      (new Date().getTime() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias;
  };

  // Filtrar estabelecimentos
  const estabelecimentosFiltrados = useMemo(() => {
    return estabelecimentos.filter((est) => {
      const matchSearch =
        est.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (est.bairro && est.bairro.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchTipo = tipoFilter === 'todos' || est.tipo === tipoFilter;

      const matchRelacionamento = relacionamentoFilter === 'todos' ||
        est.relacionamento === Number(relacionamentoFilter);

      const matchCidade = cidadeFilter === 'todos' ||
        est.cidade === cidadeFilter ||
        (cidadeFilter === 'outras' && !cidadesPrincipais.includes(est.cidade));

      // Filtro de concorrência
      let matchConcorrencia = true;
      if (concorrenciaFilter === 'sem_concorrente') {
        matchConcorrencia = !est.concorrentes_presentes || est.concorrentes_presentes.length === 0;
      } else if (concorrenciaFilter === 'com_concorrente') {
        matchConcorrencia = est.concorrentes_presentes && est.concorrentes_presentes.length > 0;
      } else if (concorrenciaFilter === 'exclusivo_nosso') {
        matchConcorrencia = est.politica_concorrencia === 'parceiro_exclusivo_nosso';
      }

      // Filtro de última visita
      let matchVisita = true;
      const dias = getDiasDesdeVisita(est.ultima_visita);
      if (visitaFilter === 'nunca') {
        matchVisita = !est.ultima_visita;
      } else if (visitaFilter === '7dias') {
        matchVisita = dias !== null && dias <= 7;
      } else if (visitaFilter === '30dias') {
        matchVisita = dias !== null && dias <= 30;
      } else if (visitaFilter === 'atrasado') {
        matchVisita = dias === null || dias > 30;
      }

      return matchSearch && matchTipo && matchRelacionamento && matchCidade && matchConcorrencia && matchVisita;
    });
  }, [estabelecimentos, searchTerm, tipoFilter, relacionamentoFilter, cidadeFilter, concorrenciaFilter, visitaFilter]);

  const getTipoLabel = (tipo: EstabelecimentoTipo) => {
    const labels: Record<string, string> = {
      clinica: 'Clínica',
      hospital: 'Hospital',
      petshop: 'Pet Shop',
      'casa-racao': 'Casa de Ração',
      laboratorio: 'Laboratório',
      outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const getTipoIcon = (tipo: EstabelecimentoTipo) => {
    const icons: Record<string, string> = {
      clinica: '🏥',
      hospital: '🏨',
      petshop: '🐾',
      'casa-racao': '🍖',
      laboratorio: '🔬',
      outro: '🏢',
    };
    return icons[tipo] || '🏢';
  };

  const getPoliticaLabel = (politica: string | null) => {
    const labels: Record<string, { label: string; color: string; icon: string }> = {
      'parceiro_exclusivo_nosso': { label: 'Exclusivo', color: 'bg-green-500', icon: '⭐' },
      'parceiro_exclusivo_outro': { label: 'Exclusivo outro', color: 'bg-red-500', icon: '🚫' },
      'aberto_todos': { label: 'Aberto', color: 'bg-blue-500', icon: '🔓' },
      'seletivo': { label: 'Seletivo', color: 'bg-yellow-500', icon: '🎯' },
      'nao_indica': { label: 'Não indica', color: 'bg-gray-500', icon: '❌' },
    };
    return labels[politica || ''] || null;
  };

  const handleRelacionamentoChange = async (estabelecimentoId: string, novoRelacionamento: number) => {
    try {
      const { updateEstabelecimento } = await import('@/lib/db');
      await updateEstabelecimento(estabelecimentoId, {
        relacionamento: novoRelacionamento as any,
      });
      setEstabelecimentos((prev) =>
        prev.map((est) =>
          est.id === estabelecimentoId ? { ...est, relacionamento: novoRelacionamento } : est
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar relacionamento:', error);
    }
  };

  const funnelStages = [
    { level: 0, label: 'Frio', icon: '❄️', color: 'from-gray-400 to-gray-500' },
    { level: 1, label: 'Gelado', icon: '🧊', color: 'from-blue-400 to-blue-500' },
    { level: 2, label: 'Morno', icon: '🌤️', color: 'from-yellow-400 to-yellow-500' },
    { level: 3, label: 'Quente', icon: '🔥', color: 'from-orange-400 to-orange-500' },
    { level: 4, label: 'Parceiro', icon: '🤝', color: 'from-green-400 to-green-500' },
    { level: 5, label: 'Exclusivo', icon: '⭐', color: 'from-purple-400 to-purple-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estabelecimentos</h1>
          <p className="text-sm text-gray-500">{estabelecimentosFiltrados.length} de {estabelecimentos.length}</p>
        </div>
        <Link href="/estabelecimentos/buscar" className="btn-primary text-sm">
          + Adicionar
        </Link>
      </div>

      {/* Funil Visual - Pipeline de Relacionamento */}
      <div className="card p-3">
        <div className="grid grid-cols-6 gap-2">
          {funnelStages.map((stage) => (
            <button
              key={stage.level}
              onClick={() => setRelacionamentoFilter(
                relacionamentoFilter === String(stage.level) ? 'todos' : String(stage.level)
              )}
              className={`relative p-2 rounded-lg transition-all ${
                relacionamentoFilter === String(stage.level)
                  ? `bg-gradient-to-br ${stage.color} text-white shadow-lg scale-105`
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className="text-center">
                <span className="text-xl">{stage.icon}</span>
                <p className="text-xs font-bold mt-1">{contadores[stage.level as keyof typeof contadores]}</p>
                <p className="text-[10px] opacity-80 hidden sm:block">{stage.label}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Filtros e Toggle */}
      <div className="card p-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Busca */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por nome, endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Toggle Buttons de Cidades */}
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => {
                setCidadeFilter('todos');
                setShowOutrasCidades(false);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                cidadeFilter === 'todos'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Todas
            </button>
            {cidadesPrincipais.map(cidade => {
              const count = estabelecimentos.filter(e => e.cidade === cidade).length;
              return (
                <button
                  key={cidade}
                  onClick={() => {
                    setCidadeFilter(cidadeFilter === cidade ? 'todos' : cidade);
                    setShowOutrasCidades(false);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    cidadeFilter === cidade
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cidade.replace(' ', '\u00A0')} {count > 0 && <span className="opacity-70">({count})</span>}
                </button>
              );
            })}
            {outrasCidades.length > 0 && (
              <button
                onClick={() => {
                  if (showOutrasCidades) {
                    setShowOutrasCidades(false);
                    if (cidadeFilter !== 'todos' && !cidadesPrincipais.includes(cidadeFilter) && cidadeFilter !== 'outras') {
                      setCidadeFilter('todos');
                    }
                  } else {
                    setShowOutrasCidades(true);
                    setCidadeFilter('outras');
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  showOutrasCidades || cidadeFilter === 'outras' || (!cidadesPrincipais.includes(cidadeFilter) && cidadeFilter !== 'todos')
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Outras {outrasCidades.length > 0 && <span className="opacity-70">({outrasCidades.length})</span>}
                <span className="ml-1">{showOutrasCidades ? '▲' : '▼'}</span>
              </button>
            )}
          </div>

          {/* Outras cidades expandidas */}
          {showOutrasCidades && outrasCidades.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
              <button
                onClick={() => setCidadeFilter('outras')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  cidadeFilter === 'outras'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                Todas outras
              </button>
              {outrasCidades.map(cidade => {
                const count = estabelecimentos.filter(e => e.cidade === cidade).length;
                return (
                  <button
                    key={cidade}
                    onClick={() => setCidadeFilter(cidadeFilter === cidade ? 'outras' : cidade)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      cidadeFilter === cidade
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cidade} {count > 0 && <span className="opacity-70">({count})</span>}
                  </button>
                );
              })}
            </div>
          )}

          {/* Outros Filtros em linha */}
          <div className="flex flex-wrap gap-2">
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as EstabelecimentoTipo | 'todos')}
              className="text-sm py-2 px-3 min-w-[100px]"
            >
              <option value="todos">Todos tipos</option>
              <option value="clinica">Clínica</option>
              <option value="hospital">Hospital</option>
              <option value="petshop">Pet Shop</option>
            </select>

            <select
              value={concorrenciaFilter}
              onChange={(e) => setConcorrenciaFilter(e.target.value)}
              className="text-sm py-2 px-3 min-w-[130px]"
            >
              <option value="todos">Concorrência</option>
              <option value="sem_concorrente">Sem concorrente</option>
              <option value="com_concorrente">Com concorrente</option>
              <option value="exclusivo_nosso">Exclusivo nosso</option>
            </select>

            <select
              value={visitaFilter}
              onChange={(e) => setVisitaFilter(e.target.value)}
              className="text-sm py-2 px-3 min-w-[120px]"
            >
              <option value="todos">Última visita</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
              <option value="atrasado">Atrasados (+30d)</option>
              <option value="nunca">Nunca visitados</option>
            </select>
          </div>

          {/* Toggle View */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('mapa')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                viewMode === 'mapa'
                  ? 'bg-white dark:bg-gray-700 shadow text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      )}

      {/* Conteúdo Principal */}
      {!loading && (
        <div className={viewMode === 'mapa' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}>
          {/* Grid de Cards */}
          <div className={viewMode === 'mapa' ? 'h-[600px] overflow-y-auto space-y-3 pr-2' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}>
            {estabelecimentosFiltrados.map((est) => {
              const dias = getDiasDesdeVisita(est.ultima_visita);
              const politica = getPoliticaLabel(est.politica_concorrencia);
              const isSelected = selectedEstabelecimento === est.id;

              return (
                <div
                  key={est.id}
                  onClick={() => setSelectedEstabelecimento(est.id)}
                  className={`card p-0 overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                  }`}
                >
                  {/* Header com foto */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                    {est.fotos && est.fotos[0] ? (
                      <img
                        src={est.fotos[0]}
                        alt={est.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">
                        {getTipoIcon(est.tipo)}
                      </div>
                    )}

                    {/* Overlay com badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 bg-black/60 text-white text-xs rounded-full">
                        {getTipoIcon(est.tipo)} {getTipoLabel(est.tipo)}
                      </span>
                    </div>

                    {/* Badge de política */}
                    {politica && (
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 ${politica.color} text-white text-xs rounded-full`}>
                          {politica.icon} {politica.label}
                        </span>
                      </div>
                    )}

                    {/* Indicador de urgência */}
                    {(dias === null || dias > 30) && (
                      <div className="absolute bottom-2 right-2">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          dias === null ? 'bg-purple-500' : dias > 60 ? 'bg-red-500' : 'bg-orange-500'
                        } text-white`}>
                          {dias === null ? '🆕 Nunca visitado' : `⏰ ${dias}d atrás`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{est.nome}</h3>
                        <p className="text-xs text-gray-500 truncate">{est.bairro ? `${est.bairro} - ${est.cidade}` : est.cidade}</p>
                      </div>

                      {/* Estrelas interativas */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRelacionamentoChange(est.id, star === est.relacionamento ? 0 : star);
                            }}
                            className={`text-lg transition-transform hover:scale-125 ${
                              star <= est.relacionamento ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Métricas rápidas */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {est.qtde_media_obitos_mensal && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                          💀 {est.qtde_media_obitos_mensal}/mês
                        </span>
                      )}
                      {est.concorrentes_presentes && est.concorrentes_presentes.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs rounded">
                          ⚠️ {est.concorrentes_presentes.length} concorrente(s)
                        </span>
                      )}
                      {est.veterinarios_fixos && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded">
                          👨‍⚕️ {est.veterinarios_fixos} vet
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2">
                      <Link
                        href={`/estabelecimentos/${est.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-center px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Ver Detalhes
                      </Link>
                      <Link
                        href={`/estabelecimentos/${est.id}/editar`}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Editar
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mapa */}
          {viewMode === 'mapa' && (
            <div className="h-[600px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <MapaEstabelecimentos
                estabelecimentos={estabelecimentosFiltrados}
                selectedId={selectedEstabelecimento}
                onSelect={setSelectedEstabelecimento}
              />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && estabelecimentosFiltrados.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-lg font-medium mb-2">Nenhum estabelecimento encontrado</h3>
          <p className="text-gray-500 text-sm mb-4">Tente ajustar os filtros</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setTipoFilter('todos');
              setRelacionamentoFilter('todos');
              setCidadeFilter('todos');
              setConcorrenciaFilter('todos');
              setVisitaFilter('todos');
            }}
            className="text-primary hover:underline text-sm"
          >
            Limpar todos os filtros
          </button>
        </div>
      )}
    </div>
  );
}
