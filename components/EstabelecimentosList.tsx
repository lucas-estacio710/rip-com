'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import type { EstabelecimentoTipo } from '@/types';
import type { Estabelecimento } from '@/lib/supabase';

export default function EstabelecimentosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<EstabelecimentoTipo | 'todos'>('todos');
  const [relacionamentoFilter, setRelacionamentoFilter] = useState<'todos' | '5' | '4' | '3' | '2' | '1' | '0'>('todos');
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar estabelecimentos do Supabase
  useEffect(() => {
    async function loadEstabelecimentos() {
      try {
        console.time('⏱️ Carregamento de estabelecimentos');
        console.log('🔄 Iniciando carregamento...');

        const { getAllEstabelecimentos } = await import('@/lib/db');
        console.log('✅ Módulo importado');

        const data = await getAllEstabelecimentos();
        console.log('✅ Dados recebidos:', data?.length || 0, 'estabelecimentos');

        setEstabelecimentos(data);
        console.timeEnd('⏱️ Carregamento de estabelecimentos');
      } catch (error) {
        console.error('❌ Erro ao carregar estabelecimentos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEstabelecimentos();
  }, []);

  // Filtrar estabelecimentos
  const estabelecimentosFiltrados = estabelecimentos.filter((est) => {
    const matchSearch =
      est.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.endereco.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.cidade.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTipo = tipoFilter === 'todos' || est.tipo === tipoFilter;
    const matchRelacionamento =
      relacionamentoFilter === 'todos' || est.relacionamento === Number(relacionamentoFilter);

    return matchSearch && matchTipo && matchRelacionamento;
  });

  const getTipoLabel = (tipo: EstabelecimentoTipo) => {
    const labels = {
      clinica: 'Clínica',
      hospital: 'Hospital',
      petshop: 'Pet Shop',
      'casa-racao': 'Casa de Ração',
      laboratorio: 'Laboratório',
      outro: 'Outro',
    };
    return labels[tipo];
  };

  const getDiasDesdeVisita = (ultimaVisita?: Date | string) => {
    if (!ultimaVisita) return null;
    const dias = Math.floor(
      (new Date().getTime() - new Date(ultimaVisita).getTime()) / (1000 * 60 * 60 * 24)
    );
    return dias;
  };

  const handleRelacionamentoChange = async (estabelecimentoId: string, novoRelacionamento: number) => {
    try {
      const { updateEstabelecimento } = await import('@/lib/db');
      await updateEstabelecimento(estabelecimentoId, {
        relacionamento: novoRelacionamento as any,
      });

      // Atualizar estado local
      setEstabelecimentos((prev) =>
        prev.map((est) =>
          est.id === estabelecimentoId
            ? { ...est, relacionamento: novoRelacionamento }
            : est
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar relacionamento:', error);
      alert('Erro ao atualizar relacionamento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-2">Buscar</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nome, endereço ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Tipo Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value as EstabelecimentoTipo | 'todos')}
            >
              <option value="todos">Todos os tipos</option>
              <option value="clinica">Clínica</option>
              <option value="hospital">Hospital</option>
              <option value="petshop">Pet Shop</option>
              <option value="casa-racao">Casa de Ração</option>
              <option value="laboratorio">Laboratório</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          {/* Relacionamento Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Relacionamento</label>
            <select
              value={relacionamentoFilter}
              onChange={(e) => setRelacionamentoFilter(e.target.value as 'todos' | '5' | '4' | '3' | '2' | '1' | '0')}
            >
              <option value="todos">Todos</option>
              <option value="5">★★★★★ (5 estrelas)</option>
              <option value="4">★★★★☆ (4 estrelas)</option>
              <option value="3">★★★☆☆ (3 estrelas)</option>
              <option value="2">★★☆☆☆ (2 estrelas)</option>
              <option value="1">★☆☆☆☆ (1 estrela)</option>
              <option value="0">☆☆☆☆☆ (Não pontuado)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {estabelecimentosFiltrados.length} estabelecimento(s) encontrado(s)
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500">Carregando estabelecimentos...</p>
        </div>
      )}

      {/* Lista de Estabelecimentos */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4">
          {estabelecimentosFiltrados.map((estabelecimento) => {
            const diasDesdeVisita = getDiasDesdeVisita(estabelecimento.ultima_visita || undefined);

            return (
              <div key={estabelecimento.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {/* Foto ou ícone */}
                      {estabelecimento.fotos && estabelecimento.fotos.length > 0 ? (
                        <img
                          src={estabelecimento.fotos[0]}
                          alt={estabelecimento.nome}
                          className="w-16 h-16 max-w-[64px] max-h-[64px] rounded-lg object-cover flex-shrink-0 border-2 border-gray-200 dark:border-gray-700"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      )}

                      <div className="flex-1">
                        <Link
                          href={`/estabelecimentos/${estabelecimento.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          <h3 className="font-bold text-lg mb-1">{estabelecimento.nome}</h3>
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {getTipoLabel(estabelecimento.tipo)} • {estabelecimento.endereco},{' '}
                          {estabelecimento.cidade} - {estabelecimento.estado}
                        </p>
                        {estabelecimento.telefone && (
                          <p className="text-sm text-gray-500">{estabelecimento.telefone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    {/* Seletor de Relacionamento Inline */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-500">Relacionamento:</span>
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRelacionamentoChange(estabelecimento.id, star);
                            }}
                            className={`text-2xl transition-all hover:scale-125 ${
                              star === 0
                                ? estabelecimento.relacionamento === 0
                                  ? 'text-gray-400'
                                  : 'text-gray-300 hover:text-gray-400'
                                : star <= estabelecimento.relacionamento
                                ? 'text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                            title={
                              star === 0
                                ? 'Não pontuado'
                                : `${star} ${star === 1 ? 'estrela' : 'estrelas'}`
                            }
                          >
                            {star === 0 ? '○' : '★'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex gap-2">
                      <Link
                        href={`/estabelecimentos/${estabelecimento.id}`}
                        className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Ver Perfil
                      </Link>
                      <Link
                        href={`/estabelecimentos/${estabelecimento.id}/editar`}
                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Editar
                      </Link>
                    </div>

                    {/* Última Visita */}
                    {diasDesdeVisita !== null && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Última visita</p>
                        <p
                          className={`text-sm font-medium ${
                            diasDesdeVisita > 60
                              ? 'text-danger'
                              : diasDesdeVisita > 30
                              ? 'text-warning'
                              : 'text-success'
                          }`}
                        >
                          {diasDesdeVisita === 0
                            ? 'Hoje'
                            : `${diasDesdeVisita} dia${diasDesdeVisita > 1 ? 's' : ''} atrás`}
                        </p>
                      </div>
                    )}
                    {!estabelecimento.ultima_visita && (
                      <p className="text-xs text-gray-400">Nunca visitado</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && estabelecimentosFiltrados.length === 0 && (
        <div className="card text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum estabelecimento encontrado</h3>
          <p className="text-gray-500 mb-6">
            Tente ajustar os filtros ou adicione um novo estabelecimento
          </p>
          <Link href="/estabelecimentos/adicionar-link" className="btn-primary">
            Adicionar Estabelecimento
          </Link>
        </div>
      )}
    </div>
  );
}
