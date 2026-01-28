'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EstabelecimentoTipo } from '@/types';
import type { Estabelecimento } from '@/lib/supabase';

const MapaEstabelecimentos = dynamic(
  () => import('@/components/MapaEstabelecimentos'),
  { ssr: false, loading: () => <div className="h-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" /> }
);

export default function EstabelecimentosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'lista' | 'mapa'>('cards');
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Estado para modal de normalização
  const [normalizarEst, setNormalizarEst] = useState<Estabelecimento | null>(null);

  const cidadesPrincipais = ['Santos', 'São Vicente', 'Praia Grande', 'Guarujá'];

  useEffect(() => {
    async function load() {
      try {
        const { getAllEstabelecimentos } = await import('@/lib/db');
        const data = await getAllEstabelecimentos();
        setEstabelecimentos(data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = estabelecimentos.length;
    const exclusivos = estabelecimentos.filter(e => e.politica_concorrencia === 'parceiro_exclusivo_nosso').length;
    const semVisita = estabelecimentos.filter(e => !e.ultima_visita).length;
    const atrasados = estabelecimentos.filter(e => {
      if (!e.ultima_visita) return false;
      const dias = Math.floor((Date.now() - new Date(e.ultima_visita).getTime()) / 86400000);
      return dias > 30;
    }).length;
    const semConcorrencia = estabelecimentos.filter(e => !e.concorrentes_presentes?.length).length;
    const obitosTotais = estabelecimentos.reduce((sum, e) => sum + (e.qtde_media_obitos_mensal || 0), 0);

    return { total, exclusivos, semVisita, atrasados, semConcorrencia, obitosTotais };
  }, [estabelecimentos]);

  // Contagem por cidade
  const contagemCidades = useMemo(() => {
    const counts: Record<string, number> = {};
    estabelecimentos.forEach(e => {
      counts[e.cidade] = (counts[e.cidade] || 0) + 1;
    });
    return counts;
  }, [estabelecimentos]);

  // Outras cidades
  const outrasCidades = useMemo(() => {
    return Object.keys(contagemCidades)
      .filter(c => !cidadesPrincipais.includes(c))
      .sort((a, b) => contagemCidades[b] - contagemCidades[a]);
  }, [contagemCidades]);

  // Pipeline de relacionamento
  const pipeline = useMemo(() => {
    const stages = [
      { id: 'frio', label: 'Frio', levels: [0, 1], color: 'bg-slate-500' },
      { id: 'morno', label: 'Morno', levels: [2], color: 'bg-amber-500' },
      { id: 'quente', label: 'Quente', levels: [3], color: 'bg-orange-500' },
      { id: 'parceiro', label: 'Parceiro', levels: [4], color: 'bg-emerald-500' },
      { id: 'exclusivo', label: 'Exclusivo', levels: [5], color: 'bg-violet-500' },
    ];
    return stages.map(s => ({
      ...s,
      count: estabelecimentos.filter(e => s.levels.includes(e.relacionamento)).length,
    }));
  }, [estabelecimentos]);

  // Dias desde visita
  const getDias = (data: string | null) => {
    if (!data) return null;
    return Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
  };

  // Filtrar
  const filtrados = useMemo(() => {
    return estabelecimentos.filter(e => {
      // Busca
      if (searchTerm) {
        const termo = searchTerm.toLowerCase();
        const match = e.nome.toLowerCase().includes(termo) ||
          e.endereco.toLowerCase().includes(termo) ||
          e.cidade.toLowerCase().includes(termo) ||
          (e.bairro && e.bairro.toLowerCase().includes(termo));
        if (!match) return false;
      }

      // Cidade
      if (cidadeFilter !== 'todos') {
        if (cidadeFilter === 'outras') {
          if (cidadesPrincipais.includes(e.cidade)) return false;
        } else if (e.cidade !== cidadeFilter) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'todos') {
        if (statusFilter === 'exclusivo' && e.politica_concorrencia !== 'parceiro_exclusivo_nosso') return false;
        if (statusFilter === 'semVisita' && e.ultima_visita) return false;
        if (statusFilter === 'atrasado') {
          const dias = getDias(e.ultima_visita);
          if (dias === null || dias <= 30) return false;
        }
        if (statusFilter === 'semConcorrencia' && e.concorrentes_presentes?.length) return false;
        if (statusFilter === 'oportunidade') {
          const temConcorrente = e.concorrentes_presentes?.length;
          const exclusivoOutro = e.politica_concorrencia === 'parceiro_exclusivo_outro';
          if (temConcorrente || exclusivoOutro) return false;
        }
      }

      return true;
    });
  }, [estabelecimentos, searchTerm, cidadeFilter, statusFilter]);

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      clinica: '🏥', hospital: '🏨', petshop: '🐾', 'casa-racao': '🍖', laboratorio: '🔬', outro: '🏢'
    };
    return icons[tipo] || '🏢';
  };

  const handleStarClick = async (id: string, star: number, current: number) => {
    const novo = star === current ? 0 : star;
    try {
      const { updateEstabelecimento } = await import('@/lib/db');
      await updateEstabelecimento(id, { relacionamento: novo as any });
      setEstabelecimentos(prev => prev.map(e => e.id === id ? { ...e, relacionamento: novo } : e));
    } catch (err) {
      console.error(err);
    }
  };

  // Callback para atualizar estabelecimento após normalização
  const handleNormalizarSuccess = (updated: Estabelecimento) => {
    setEstabelecimentos(prev => prev.map(e => e.id === updated.id ? updated : e));
    setNormalizarEst(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando estabelecimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estabelecimentos</h1>
          <p className="text-gray-500 text-sm">{metricas.total} cadastrados na sua região</p>
        </div>
        <Link
          href="/estabelecimentos/buscar"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: metricas.total, icon: '📊', color: 'from-blue-500 to-blue-600' },
          { label: 'Exclusivos', value: metricas.exclusivos, icon: '⭐', color: 'from-violet-500 to-violet-600' },
          { label: 'Sem Visita', value: metricas.semVisita, icon: '🆕', color: 'from-purple-500 to-purple-600', alert: metricas.semVisita > 0 },
          { label: 'Atrasados', value: metricas.atrasados, icon: '⏰', color: 'from-orange-500 to-orange-600', alert: metricas.atrasados > 0 },
          { label: 'Sem Concorr.', value: metricas.semConcorrencia, icon: '🎯', color: 'from-emerald-500 to-emerald-600' },
          { label: 'Óbitos/mês', value: metricas.obitosTotais, icon: '📈', color: 'from-slate-500 to-slate-600' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${kpi.color} p-4 text-white`}
          >
            {kpi.alert && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <div className="text-xs opacity-80">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline de Relacionamento */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Pipeline de Relacionamento</h2>
          <span className="text-xs text-gray-400">{filtrados.length} exibindo</span>
        </div>
        <div className="flex gap-1">
          {pipeline.map((stage, i) => (
            <button
              key={stage.id}
              onClick={() => setStatusFilter(statusFilter === stage.id ? 'todos' : stage.id)}
              className={`flex-1 relative group ${i === 0 ? 'rounded-l-xl' : ''} ${i === pipeline.length - 1 ? 'rounded-r-xl' : ''}`}
            >
              <div
                className={`h-12 flex items-center justify-center transition-all ${stage.color} ${
                  statusFilter === stage.id ? 'ring-2 ring-offset-2 ring-gray-400' : 'opacity-80 hover:opacity-100'
                }`}
                style={{
                  clipPath: i === pipeline.length - 1
                    ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%)'
                    : i === 0
                    ? 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                    : 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%)',
                }}
              >
                <div className="text-white text-center px-2">
                  <div className="text-lg font-bold leading-none">{stage.count}</div>
                  <div className="text-[10px] opacity-80 hidden sm:block">{stage.label}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar estabelecimento, bairro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20"
            />
            <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Cidades */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 flex-shrink-0">Região:</span>
            {['todos', ...cidadesPrincipais, ...(outrasCidades.length ? ['outras'] : [])].map((cidade) => (
              <button
                key={cidade}
                onClick={() => setCidadeFilter(cidade)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  cidadeFilter === cidade
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cidade === 'todos' ? 'Todas' : cidade === 'outras' ? `+${outrasCidades.length}` : cidade}
                {cidade !== 'todos' && cidade !== 'outras' && contagemCidades[cidade] && (
                  <span className="ml-1 opacity-60">{contagemCidades[cidade]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs text-gray-400 flex-shrink-0">Filtro:</span>
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'oportunidade', label: '🎯 Oportunidade' },
              { id: 'semVisita', label: '🆕 Nunca visitado' },
              { id: 'atrasado', label: '⏰ Atrasado' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === f.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 flex-shrink-0">
            {[
              { id: 'cards', icon: '⊞' },
              { id: 'lista', icon: '☰' },
              { id: 'mapa', icon: '🗺' },
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  viewMode === v.id
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-primary font-medium'
                    : 'text-gray-500'
                }`}
              >
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">Nenhum resultado</h3>
          <p className="text-gray-500 text-sm mb-4">Tente ajustar os filtros de busca</p>
          <button
            onClick={() => { setSearchTerm(''); setCidadeFilter('todos'); setStatusFilter('todos'); }}
            className="text-primary hover:underline text-sm font-medium"
          >
            Limpar filtros
          </button>
        </div>
      ) : viewMode === 'mapa' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 h-[600px] overflow-y-auto space-y-2 pr-2">
            {filtrados.map((est) => (
              <EstabelecimentoRow
                key={est.id}
                est={est}
                selected={selectedId === est.id}
                onClick={() => setSelectedId(est.id)}
                getDias={getDias}
                onStarClick={handleStarClick}
              />
            ))}
          </div>
          <div className="lg:col-span-3 h-[600px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <MapaEstabelecimentos
              estabelecimentos={filtrados}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>
      ) : viewMode === 'lista' ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtrados.map((est) => (
              <EstabelecimentoRow
                key={est.id}
                est={est}
                selected={selectedId === est.id}
                onClick={() => setSelectedId(est.id)}
                getDias={getDias}
                onStarClick={handleStarClick}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtrados.map((est) => (
            <EstabelecimentoCard
              key={est.id}
              est={est}
              getDias={getDias}
              getTipoIcon={getTipoIcon}
              onStarClick={handleStarClick}
              onNormalizarClick={() => setNormalizarEst(est)}
            />
          ))}
        </div>
      )}

      {/* Modal de Normalização */}
      {normalizarEst && (
        <ModalNormalizar
          estabelecimento={normalizarEst}
          onClose={() => setNormalizarEst(null)}
          onSuccess={handleNormalizarSuccess}
        />
      )}
    </div>
  );
}

// Card de Estabelecimento
function EstabelecimentoCard({ est, getDias, getTipoIcon, onStarClick, onNormalizarClick }: {
  est: Estabelecimento;
  getDias: (d: string | null) => number | null;
  getTipoIcon: (t: string) => string;
  onStarClick: (id: string, star: number, current: number) => void;
  onNormalizarClick: () => void;
}) {
  const dias = getDias(est.ultima_visita);
  const urgente = dias === null || dias > 30;

  return (
    <Link
      href={`/estabelecimentos/${est.id}`}
      className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-lg hover:border-primary/30 transition-all"
    >
      {/* Foto */}
      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
        {est.fotos?.[0] ? (
          <img src={est.fotos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
            {getTipoIcon(est.tipo)}
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <span className="px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded-lg">
            {getTipoIcon(est.tipo)}
          </span>
          <div className="flex items-center gap-1">
            {/* Botão Normalizar */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onNormalizarClick();
              }}
              className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
              title="Normalizar dados via Google"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {est.politica_concorrencia === 'parceiro_exclusivo_nosso' && (
              <span className="px-2 py-1 bg-violet-500 text-white text-xs rounded-lg">
                ⭐ Exclusivo
              </span>
            )}
          </div>
        </div>

        {/* Urgência */}
        {urgente && (
          <div className="absolute bottom-2 right-2">
            <span className={`px-2 py-1 text-xs rounded-lg text-white ${
              dias === null ? 'bg-purple-500' : dias > 60 ? 'bg-red-500' : 'bg-orange-500'
            }`}>
              {dias === null ? '🆕 Novo' : `⏰ ${dias}d`}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {est.nome}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {est.bairro ? `${est.bairro}, ${est.cidade}` : est.cidade}
            </p>
          </div>
          <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.preventDefault()}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onStarClick(est.id, star, est.relacionamento);
                }}
                className={`text-base transition-all hover:scale-110 ${
                  star <= est.relacionamento ? 'text-amber-400' : 'text-gray-200 dark:text-gray-700'
                }`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Métricas */}
        <div className="flex flex-wrap gap-1.5">
          {est.qtde_media_obitos_mensal ? (
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md">
              {est.qtde_media_obitos_mensal} óbitos/mês
            </span>
          ) : null}
          {est.veterinarios_fixos ? (
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded-md">
              {est.veterinarios_fixos} vets
            </span>
          ) : null}
          {est.concorrentes_presentes?.length ? (
            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-md">
              {est.concorrentes_presentes.length} concorr.
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-md">
              Sem concorrência
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// Row para lista/mapa
function EstabelecimentoRow({ est, selected, onClick, getDias, onStarClick }: {
  est: Estabelecimento;
  selected: boolean;
  onClick: () => void;
  getDias: (d: string | null) => number | null;
  onStarClick: (id: string, star: number, current: number) => void;
}) {
  const dias = getDias(est.ultima_visita);

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
        selected ? 'bg-primary/5 border-l-2 border-primary' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
        {est.fotos?.[0] ? (
          <img src={est.fotos[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl opacity-50">
            {est.tipo === 'clinica' ? '🏥' : est.tipo === 'hospital' ? '🏨' : '🐾'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">{est.nome}</h3>
          {est.politica_concorrencia === 'parceiro_exclusivo_nosso' && (
            <span className="text-violet-500 text-xs">⭐</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {est.bairro ? `${est.bairro}, ${est.cidade}` : est.cidade}
        </p>
      </div>

      {/* Estrelas */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={(e) => {
              e.stopPropagation();
              onStarClick(est.id, star, est.relacionamento);
            }}
            className={`text-sm ${star <= est.relacionamento ? 'text-amber-400' : 'text-gray-200'}`}
          >
            ★
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="text-right flex-shrink-0">
        {dias === null ? (
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-600 text-xs rounded-lg">Novo</span>
        ) : dias > 30 ? (
          <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 text-xs rounded-lg">{dias}d</span>
        ) : (
          <span className="text-xs text-gray-400">{dias}d atrás</span>
        )}
      </div>

      {/* Link */}
      <Link
        href={`/estabelecimentos/${est.id}`}
        onClick={(e) => e.stopPropagation()}
        className="p-2 text-gray-400 hover:text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// Modal de Normalização (provisório)
interface PlaceResult {
  placeId: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  latitude: number;
  longitude: number;
  rating?: number;
  totalReviews?: number;
  tipos: string[];
  foto?: string;
}

interface PlaceDetails extends PlaceResult {
  telefone?: string;
  cep?: string;
  horarioFuncionamento?: string;
  website?: string;
  googleMapsUrl?: string;
  bairro?: string;
  fotos?: string[];
}

function ModalNormalizar({
  estabelecimento,
  onClose,
  onSuccess,
}: {
  estabelecimento: Estabelecimento;
  onClose: () => void;
  onSuccess: (updated: Estabelecimento) => void;
}) {
  const [cidadeBusca, setCidadeBusca] = useState(estabelecimento.cidade || 'Santos, SP');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Campos editáveis
  const [nome, setNome] = useState(estabelecimento.nome);
  const [endereco, setEndereco] = useState(estabelecimento.endereco || '');
  const [bairro, setBairro] = useState(estabelecimento.bairro || '');
  const [cidade, setCidade] = useState(estabelecimento.cidade || '');
  const [estado, setEstado] = useState(estabelecimento.estado || '');
  const [cep, setCep] = useState(estabelecimento.cep || '');
  const [telefone, setTelefone] = useState(estabelecimento.telefone || '');
  const [website, setWebsite] = useState(estabelecimento.website || '');
  const [horarioFuncionamento, setHorarioFuncionamento] = useState(estabelecimento.horario_funcionamento || '');
  const [latitude, setLatitude] = useState<number | null>(estabelecimento.latitude || null);
  const [longitude, setLongitude] = useState<number | null>(estabelecimento.longitude || null);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(estabelecimento.fotos?.[0] || null);

  const handleSearch = async () => {
    if (!estabelecimento.nome.trim()) return;

    setIsSearching(true);
    setResults([]);
    setSelectedPlace(null);

    try {
      const cidadeFormatada = cidadeBusca.includes(',') ? cidadeBusca : `${cidadeBusca}, SP`;
      const response = await fetch(
        `/api/places/search?query=${encodeURIComponent(estabelecimento.nome)}&cidade=${encodeURIComponent(cidadeFormatada)}`
      );

      if (!response.ok) throw new Error('Erro ao buscar');

      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao buscar no Google.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = async (place: PlaceResult) => {
    setIsLoadingDetails(true);

    try {
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(place.placeId)}`
      );

      if (!response.ok) throw new Error('Erro ao buscar detalhes');

      const data = await response.json();
      const result = data.result;

      setSelectedPlace(result);

      // Preenche campos com dados do Google
      setNome(result.nome || estabelecimento.nome);
      setEndereco(result.endereco || '');
      setBairro(result.bairro || '');
      setCidade(result.cidade || '');
      setEstado(result.estado || '');
      setCep(result.cep || '');
      setTelefone(result.telefone || '');
      setWebsite(result.website || '');
      setHorarioFuncionamento(result.horarioFuncionamento || '');
      setLatitude(result.latitude || null);
      setLongitude(result.longitude || null);

      // Foto
      const fotos = result.fotos || (result.foto ? [result.foto] : []);
      if (fotos.length > 0) {
        setFotoSelecionada(fotos[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
      alert('Erro ao buscar detalhes.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSave = async () => {
    if (!nome || !endereco) {
      alert('Nome e endereço são obrigatórios');
      return;
    }

    setIsSaving(true);

    try {
      // Se a foto é do Google, faz upload pro Supabase
      let fotoFinal = fotoSelecionada;
      if (fotoSelecionada && fotoSelecionada.includes('googleapis.com')) {
        console.log('📸 Fazendo upload da foto do Google...');
        const uploadRes = await fetch('/api/upload-foto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fotoUrl: fotoSelecionada }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fotoFinal = uploadData.url;
        }
      }

      const { updateEstabelecimento } = await import('@/lib/db');

      const updates = {
        nome,
        endereco,
        bairro: bairro || null,
        cidade,
        estado,
        cep: cep || null,
        telefone: telefone || null,
        website: website || null,
        horario_funcionamento: horarioFuncionamento || null,
        latitude,
        longitude,
        fotos: fotoFinal ? [fotoFinal] : estabelecimento.fotos,
      };

      const updated = await updateEstabelecimento(estabelecimento.id, updates);

      if (updated) {
        alert('Estabelecimento atualizado com sucesso!');
        onSuccess(updated);
      } else {
        throw new Error('Erro ao atualizar');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">🔍 Normalizar Dados</h2>
            <p className="text-sm text-gray-500">Buscar e atualizar via Google Places</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Info do estabelecimento atual */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-1">Estabelecimento atual:</p>
            <p className="font-bold text-amber-900 dark:text-amber-100">{estabelecimento.nome}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{estabelecimento.cidade || 'Cidade não definida'}</p>
          </div>

          {/* Busca */}
          {!selectedPlace && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Cidade para busca</label>
                  <input
                    type="text"
                    value={cidadeBusca}
                    onChange={(e) => setCidadeBusca(e.target.value)}
                    placeholder="Ex: Santos, SP"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {/* Resultados */}
              {results.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b">
                    <p className="text-sm font-medium">{results.length} resultados encontrados</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y">
                    {results.map((place) => (
                      <div
                        key={place.placeId}
                        onClick={() => handleSelectPlace(place)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        {place.foto ? (
                          <img src={place.foto} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">🏥</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{place.nome}</p>
                          <p className="text-xs text-gray-500 truncate">{place.endereco}</p>
                          {place.rating && (
                            <p className="text-xs text-yellow-600">⭐ {place.rating.toFixed(1)}</p>
                          )}
                        </div>
                        <span className="text-gray-400">→</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Buscando no Google...</p>
                </div>
              )}
            </>
          )}

          {/* Loading detalhes */}
          {isLoadingDetails && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Carregando detalhes...</p>
            </div>
          )}

          {/* Formulário de edição */}
          {selectedPlace && !isLoadingDetails && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
                <p className="text-sm text-green-800 dark:text-green-200">✅ Dados carregados do Google. Revise e salve.</p>
              </div>

              {/* Preview foto */}
              {fotoSelecionada && (
                <img src={fotoSelecionada} alt="" className="w-full h-32 object-cover rounded-xl" />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome</label>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Endereço</label>
                  <input type="text" value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bairro</label>
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cidade</label>
                  <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-3 py-2 border rounded-lg" maxLength={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CEP</label>
                  <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Horário de Funcionamento</label>
                  <textarea value={horarioFuncionamento} onChange={(e) => setHorarioFuncionamento(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <button
                onClick={() => setSelectedPlace(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Voltar aos resultados
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          {selectedPlace && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
