'use client';

import Link from 'next/link';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Estabelecimento } from '@/lib/supabase';
import { Visita, CreateVisitaInput } from '@/types/visitas';
import VisitaModal from '@/components/VisitaModal';
import { useAuth } from '@/contexts/AuthContext';

export default function EstabelecimentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { unidade } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'info' | 'contatos' | 'visitas' | 'indicacoes'
  >('info');

  // Unwrap params usando React.use()
  const { id } = use(params);

  // Estado para estabelecimento
  const [estabelecimento, setEstabelecimento] = useState<Estabelecimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Estado para visitas
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loadingVisitas, setLoadingVisitas] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Carregar estabelecimento do Supabase
  useEffect(() => {
    async function loadEstabelecimento() {
      try {
        const { getEstabelecimentoById } = await import('@/lib/db');
        const data = await getEstabelecimentoById(id);
        setEstabelecimento(data);
      } catch (error) {
        console.error('Erro ao carregar estabelecimento:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEstabelecimento();
  }, [id]);

  // Carregar visitas quando a aba de visitas é ativada
  useEffect(() => {
    if (activeTab === 'visitas' && visitas.length === 0) {
      fetchVisitas();
    }
  }, [activeTab]);

  const fetchVisitas = async () => {
    try {
      setLoadingVisitas(true);
      const response = await fetch(`/api/visitas?estabelecimento_id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setVisitas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
    } finally {
      setLoadingVisitas(false);
    }
  };

  const handleCreateVisita = async (data: CreateVisitaInput) => {
    const response = await fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar visita');
    }

    await fetchVisitas();
    setIsModalOpen(false);
  };

  const handleDeleteVisita = async (visitaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta visita?')) return;

    try {
      const response = await fetch(`/api/visitas/${visitaId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchVisitas();
      }
    } catch (error) {
      console.error('Erro ao deletar visita:', error);
      alert('Erro ao deletar visita');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <p className="text-gray-500">Carregando estabelecimento...</p>
      </div>
    );
  }

  if (!estabelecimento) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Estabelecimento não encontrado</h1>
        <Link href="/estabelecimentos" className="btn-primary">
          Voltar para lista
        </Link>
      </div>
    );
  }

  // Mock: buscar dados relacionados (ainda em mock - migrar depois)
  const contatos: any[] = [];
  const indicacoes: any[] = [];

  const getTipoLabel = (tipo: string) => {
    const labels = {
      clinica: 'Clínica',
      hospital: 'Hospital',
      petshop: 'Pet Shop',
      'casa-racao': 'Casa de Ração',
      laboratorio: 'Laboratório',
      outro: 'Outro',
    };
    return labels[tipo as keyof typeof labels];
  };

  const getRelacionamentoColor = (nivel: number) => {
    if (nivel === 0) return 'bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600';
    if (nivel >= 5) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400';
    if (nivel >= 4) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400';
    if (nivel >= 3) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (nivel >= 2) return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400';
  };

  const getRelacionamentoLabel = (nivel: number) => {
    if (nivel === 0) {
      return '☆☆☆☆☆ (Não pontuado)';
    }
    const stars = '★'.repeat(nivel) + '☆'.repeat(5 - nivel);
    return `${stars} (${nivel} ${nivel === 1 ? 'estrela' : 'estrelas'})`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const tabs = [
    { id: 'info' as const, label: 'Informações', count: null },
    { id: 'contatos' as const, label: 'Contatos', count: contatos.length },
    { id: 'visitas' as const, label: 'Visitas', count: visitas.length },
    {
      id: 'indicacoes' as const,
      label: 'Indicações',
      count: indicacoes.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header - Sem cover, estilo limpo */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <Link
            href="/estabelecimentos"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>

          <div className="flex gap-2">
            <Link
              href={`/estabelecimentos/${estabelecimento.id}/editar`}
              className="btn-primary"
            >
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>

        {/* Modal de confirmação de exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-bold mb-4">Confirmar Exclusão</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Tem certeza que deseja excluir <strong>{estabelecimento.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={deleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      const { deleteEstabelecimento } = await import('@/lib/db');
                      await deleteEstabelecimento(estabelecimento.id);
                      router.push('/estabelecimentos');
                    } catch (error) {
                      console.error('Erro ao excluir:', error);
                      alert('Erro ao excluir estabelecimento');
                      setDeleting(false);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={deleting}
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="flex gap-4">
          {/* Foto de perfil */}
          {estabelecimento.fotos && estabelecimento.fotos.length > 0 ? (
            <img
              src={estabelecimento.fotos[0]}
              alt={estabelecimento.nome}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 shadow-lg flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 border-4 border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">
              {estabelecimento.nome}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {getTipoLabel(estabelecimento.tipo)}
            </p>
            <div className="flex items-center gap-2 mt-2 sm:mt-3">
              <span
                className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium border ${getRelacionamentoColor(
                  estabelecimento.relacionamento
                )}`}
              >
                {getRelacionamentoLabel(estabelecimento.relacionamento)}
              </span>
            </div>
          </div>
        </div>

        {/* Modern Stats Dashboard */}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          {/* Card: Visitas */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded bg-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">Visitas</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-400">30d</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{visitas.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600 dark:text-blue-400">90d</p>
                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{visitas.length}</p>
              </div>
            </div>
          </div>

          {/* Card: Indicações */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded bg-green-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-green-900 dark:text-green-100">Indicações</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-600 dark:text-green-400">30d</p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">{indicacoes.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600 dark:text-green-400">90d</p>
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">{indicacoes.length}</p>
              </div>
            </div>
          </div>

          {/* Card: Última Visita */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded bg-orange-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-orange-900 dark:text-orange-100">Última Visita</span>
            </div>
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                {estabelecimento.ultima_visita ? formatDate(new Date(estabelecimento.ultima_visita)) : 'Nunca'}
              </p>
              {estabelecimento.ultima_visita && (
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  {Math.floor((new Date().getTime() - new Date(estabelecimento.ultima_visita).getTime()) / (1000 * 60 * 60 * 24))} dias atrás
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-muted'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold mb-3">Dados do Estabelecimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Endereço</p>
                    <p className="font-medium">{estabelecimento.endereco}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cidade/Estado</p>
                    <p className="font-medium">
                      {estabelecimento.cidade} - {estabelecimento.estado}
                    </p>
                  </div>
                  {estabelecimento.cep && (
                    <div>
                      <p className="text-sm text-gray-500">CEP</p>
                      <p className="font-medium">{estabelecimento.cep}</p>
                    </div>
                  )}
                  {estabelecimento.telefone && (
                    <div>
                      <p className="text-sm text-gray-500">Telefone</p>
                      <p className="font-medium">{estabelecimento.telefone}</p>
                    </div>
                  )}
                  {estabelecimento.email && (
                    <div>
                      <p className="text-sm text-gray-500">E-mail</p>
                      <p className="font-medium">{estabelecimento.email}</p>
                    </div>
                  )}
                  {estabelecimento.instagram && (
                    <div>
                      <p className="text-sm text-gray-500">Instagram</p>
                      <a
                        href={estabelecimento.instagram.startsWith('http')
                          ? estabelecimento.instagram
                          : `https://instagram.com/${estabelecimento.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {estabelecimento.instagram}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                  {estabelecimento.whatsapp && (
                    <div>
                      <p className="text-sm text-gray-500">WhatsApp</p>
                      <a
                        href={`https://wa.me/${estabelecimento.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-green-600 hover:underline flex items-center gap-1"
                      >
                        {estabelecimento.whatsapp}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  )}
                  {estabelecimento.horario_funcionamento && (
                    <div>
                      <p className="text-sm text-gray-500">Horário</p>
                      <p className="font-medium">
                        {estabelecimento.horario_funcionamento}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {estabelecimento.observacoes && (
                <div>
                  <h3 className="font-bold mb-3">Observações</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {estabelecimento.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Contatos */}
          {activeTab === 'contatos' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Contatos do Estabelecimento</h3>
                <button className="btn-primary text-sm">Adicionar Contato</button>
              </div>

              {contatos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum contato cadastrado
                </div>
              ) : (
                contatos.map((contato) => (
                  <div
                    key={contato.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {contato.nome.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold">{contato.nome}</h4>
                          <p className="text-sm text-gray-500">
                            {contato.cargo === 'veterinario'
                              ? 'Veterinário(a)'
                              : contato.cargo === 'recepcionista'
                              ? 'Recepcionista'
                              : contato.cargo === 'gerente'
                              ? 'Gerente'
                              : contato.cargo === 'proprietario'
                              ? 'Proprietário(a)'
                              : 'Outro'}
                            {contato.especialidade &&
                              ` - ${contato.especialidade}`}
                          </p>
                          {contato.telefone && (
                            <p className="text-sm mt-1">{contato.telefone}</p>
                          )}
                          {contato.aniversario && (
                            <p className="text-sm text-primary mt-1">
                              Aniversário:{' '}
                              {new Date(contato.aniversario).toLocaleDateString(
                                'pt-BR',
                                { day: '2-digit', month: 'long' }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Visitas */}
          {activeTab === 'visitas' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Histórico de Visitas ({visitas.length})</h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary text-sm"
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Registrar Visita
                </button>
              </div>

              {loadingVisitas ? (
                <div className="text-center py-8 text-gray-500">
                  Carregando visitas...
                </div>
              ) : visitas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="mb-4">Nenhuma visita registrada</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary text-sm"
                  >
                    Registrar Primeira Visita
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {visitas.map((visita) => (
                    <div
                      key={visita.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold">
                            {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(visita.data_visita).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {visita.duracao_minutos && ` • ${visita.duracao_minutos} min`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {visita.status === 'realizada' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Realizada
                            </span>
                          ) : visita.status === 'agendada' ? (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Agendada
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                              {visita.status}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteVisita(visita.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                            title="Excluir visita"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {visita.tipo_visita && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Tipo:</span>
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                              {visita.tipo_visita}
                            </span>
                          </div>
                        )}

                        {visita.contato_realizado && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Contato:</span>
                            <span>{visita.contato_realizado}</span>
                            {visita.cargo_contato && <span className="text-gray-400">({visita.cargo_contato})</span>}
                          </div>
                        )}

                        {visita.temperatura_pos_visita && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Temperatura:</span>
                            <span>
                              {visita.temperatura_pos_visita === 'quente' && '🔥 Quente'}
                              {visita.temperatura_pos_visita === 'morno' && '🌤️ Morno'}
                              {visita.temperatura_pos_visita === 'frio' && '❄️ Frio'}
                            </span>
                          </div>
                        )}

                        {visita.potencial_negocio && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Potencial:</span>
                            <span>
                              {visita.potencial_negocio === 'alto' && '⭐ Alto'}
                              {visita.potencial_negocio === 'medio' && '📊 Médio'}
                              {visita.potencial_negocio === 'baixo' && '📉 Baixo'}
                            </span>
                          </div>
                        )}

                        {visita.objetivo && (
                          <div className="text-sm">
                            <span className="text-gray-500">Objetivo: </span>
                            <span>{visita.objetivo}</span>
                          </div>
                        )}

                        {visita.observacoes && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                            {visita.observacoes}
                          </p>
                        )}

                        {visita.proximos_passos && (
                          <div className="text-sm bg-blue-50 dark:bg-blue-900/10 p-2 rounded">
                            <span className="font-medium text-blue-700 dark:text-blue-400">Próximos passos:</span>
                            <p className="text-gray-700 dark:text-gray-300 mt-1">{visita.proximos_passos}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Modal de Criar Visita */}
              <VisitaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateVisita}
                estabelecimentoId={estabelecimento.id}
                unidadeId={unidade?.id || ''}
              />
            </div>
          )}

          {/* Tab: Indicações */}
          {activeTab === 'indicacoes' && (
            <div className="space-y-4">
              <h3 className="font-bold mb-4">Indicações Recebidas</h3>

              {indicacoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma indicação registrada
                </div>
              ) : (
                indicacoes.map((indicacao) => (
                  <div
                    key={indicacao.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold">{indicacao.nomeCliente}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(indicacao.dataIndicacao)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          indicacao.statusCaso === 'concluido'
                            ? 'bg-success/10 text-success'
                            : indicacao.statusCaso === 'em-andamento'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {indicacao.statusCaso}
                      </span>
                    </div>

                    {indicacao.statusCaso === 'concluido' &&
                      !indicacao.agradecimentoEnviado && (
                        <div className="mt-3 p-3 bg-warning/10 border border-warning rounded-lg text-sm text-warning">
                          Lembrete: Agradecer pela indicação!
                        </div>
                      )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
