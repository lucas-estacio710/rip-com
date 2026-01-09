'use client';

import Link from 'next/link';
import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Estabelecimento, HistoricoAlteracao } from '@/lib/supabase';
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
  const { id } = use(params);

  const [activeTab, setActiveTab] = useState<'info' | 'inteligencia' | 'visitas' | 'contatos' | 'historico'>('info');
  const [estabelecimento, setEstabelecimento] = useState<Estabelecimento | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loadingVisitas, setLoadingVisitas] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Carregar estabelecimento
  useEffect(() => {
    async function load() {
      try {
        const { getEstabelecimentoById } = await import('@/lib/db');
        const data = await getEstabelecimentoById(id);
        setEstabelecimento(data);
      } catch (error) {
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Carregar visitas
  useEffect(() => {
    if (activeTab === 'visitas' && visitas.length === 0) {
      fetchVisitas();
    }
  }, [activeTab]);

  // Carregar histórico
  useEffect(() => {
    if (activeTab === 'historico' && historico.length === 0) {
      fetchHistorico();
    }
  }, [activeTab]);

  const fetchVisitas = async () => {
    setLoadingVisitas(true);
    try {
      const response = await fetch(`/api/visitas?estabelecimento_id=${id}`);
      if (response.ok) {
        setVisitas(await response.json());
      }
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingVisitas(false);
    }
  };

  const fetchHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const { getHistoricoByEstabelecimento } = await import('@/lib/db');
      const data = await getHistoricoByEstabelecimento(id);
      setHistorico(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const handleCreateVisita = async (data: CreateVisitaInput) => {
    const response = await fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar visita');
    await fetchVisitas();
    setIsModalOpen(false);
  };

  const handleDeleteVisita = async (visitaId: string) => {
    if (!confirm('Excluir esta visita?')) return;
    try {
      const response = await fetch(`/api/visitas/${visitaId}`, { method: 'DELETE' });
      if (response.ok) await fetchVisitas();
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const handleRelacionamentoChange = async (novoRelacionamento: number) => {
    if (!estabelecimento) return;
    try {
      const { updateEstabelecimento } = await import('@/lib/db');
      await updateEstabelecimento(id, { relacionamento: novoRelacionamento as any });
      setEstabelecimento({ ...estabelecimento, relacionamento: novoRelacionamento });
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!estabelecimento) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🔍</div>
        <h1 className="text-xl font-bold mb-2">Estabelecimento não encontrado</h1>
        <Link href="/estabelecimentos" className="text-primary hover:underline">← Voltar</Link>
      </div>
    );
  }

  // Helpers
  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      clinica: 'Clínica', hospital: 'Hospital', petshop: 'Pet Shop',
      'casa-racao': 'Casa de Ração', laboratorio: 'Laboratório', outro: 'Outro',
    };
    return labels[tipo] || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      clinica: '🏥', hospital: '🏨', petshop: '🐾',
      'casa-racao': '🍖', laboratorio: '🔬', outro: '🏢',
    };
    return icons[tipo] || '🏢';
  };

  const getPoliticaInfo = (politica: string | null) => {
    const info: Record<string, { label: string; color: string; icon: string }> = {
      'parceiro_exclusivo_nosso': { label: 'Exclusivo conosco', color: 'bg-green-500', icon: '⭐' },
      'parceiro_exclusivo_outro': { label: 'Exclusivo com outro', color: 'bg-red-500', icon: '🚫' },
      'aberto_todos': { label: 'Aberto a todos', color: 'bg-blue-500', icon: '🔓' },
      'seletivo': { label: 'Seletivo', color: 'bg-yellow-500', icon: '🎯' },
      'nao_indica': { label: 'Não indica', color: 'bg-gray-500', icon: '❌' },
    };
    return info[politica || ''] || null;
  };

  const getPorteLabel = (porte: string | null) => {
    const labels: Record<string, string> = {
      'ate_5': 'Até 5 funcionários', '5_10': '5 a 10 funcionários',
      '10_15': '10 a 15 funcionários', 'mais_15': 'Mais de 15 funcionários',
    };
    return labels[porte || ''] || null;
  };

  const getGratificacaoLabel = (modelo: string | null) => {
    const labels: Record<string, string> = {
      'direto_clinica': 'Direto para clínica', 'direto_veterinarios': 'Direto para veterinários',
      'indireto_veterinarios': 'Indireto para veterinários', 'brindes_tutores': 'Brindes para tutores',
      'desconto_tutores': 'Desconto para tutores', 'nao_aceita': 'Não aceita',
    };
    return labels[modelo || ''] || null;
  };

  const getConcorrenteLabel = (value: string) => {
    const labels: Record<string, string> = {
      'pet_memorial': 'Pet Memorial', 'allma': 'Allma', 'luna_pet': 'Luna Pet',
      'pet_assistencia': 'Pet Assistência', 'eden_pet': 'Eden Pet', 'mypetmemo': 'MyPetMemo',
    };
    return labels[value] || value;
  };

  const getIlhaLabel = (value: string) => {
    const labels: Record<string, string> = {
      'recepcao': 'Recepção', 'consultorios': 'Consultórios',
      'veterinarios': 'Direto com veterinários', 'nenhum': 'Nenhum local',
    };
    return labels[value] || value;
  };

  const politica = getPoliticaInfo(estabelecimento.politica_concorrencia);
  const diasDesdeVisita = estabelecimento.ultima_visita
    ? Math.floor((new Date().getTime() - new Date(estabelecimento.ultima_visita).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const tabs = [
    { id: 'info' as const, label: 'Informações', icon: '📋' },
    { id: 'inteligencia' as const, label: 'Inteligência', icon: '📊' },
    { id: 'visitas' as const, label: 'Visitas', icon: '📅', count: visitas.length },
    { id: 'contatos' as const, label: 'Contatos', icon: '👥' },
    { id: 'historico' as const, label: 'Histórico', icon: '📜' },
  ];

  return (
    <div className="space-y-4 pb-6">
      {/* Header com Foto */}
      <div className="card p-0 overflow-hidden">
        {/* Cover/Foto */}
        <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/20 to-primary/40">
          {estabelecimento.fotos && estabelecimento.fotos[0] ? (
            <img
              src={estabelecimento.fotos[0]}
              alt={estabelecimento.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
              {getTipoIcon(estabelecimento.tipo)}
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Botão Voltar */}
          <Link
            href="/estabelecimentos"
            className="absolute top-3 left-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Ações */}
          <div className="absolute top-3 right-3 flex gap-2">
            <Link
              href={`/estabelecimentos/${id}/editar`}
              className="px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-sm font-medium rounded-lg transition-colors"
            >
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 bg-red-500/90 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Excluir
            </button>
          </div>

          {/* Info sobre a foto */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-white/20 backdrop-blur text-white text-xs rounded-full">
                    {getTipoIcon(estabelecimento.tipo)} {getTipoLabel(estabelecimento.tipo)}
                  </span>
                  {politica && (
                    <span className={`px-2 py-0.5 ${politica.color} text-white text-xs rounded-full`}>
                      {politica.icon} {politica.label}
                    </span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">
                  {estabelecimento.nome}
                </h1>
                <p className="text-white/80 text-sm">
                  📍 {estabelecimento.cidade}, {estabelecimento.estado}
                </p>
              </div>

              {/* Estrelas */}
              <div className="flex flex-col items-end">
                <div className="flex gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRelacionamentoChange(star === estabelecimento.relacionamento ? 0 : star)}
                      className={`text-2xl transition-transform hover:scale-110 drop-shadow ${
                        star <= estabelecimento.relacionamento ? 'text-yellow-400' : 'text-white/40'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <span className="text-white/70 text-xs">
                  {estabelecimento.relacionamento === 0 ? 'Não pontuado' : `${estabelecimento.relacionamento} estrelas`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicadores Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{estabelecimento.veterinarios_fixos || 0}</p>
            <p className="text-xs text-gray-500">Vets Fixos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-500">{estabelecimento.qtde_media_obitos_mensal || '?'}</p>
            <p className="text-xs text-gray-500">Óbitos/mês</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{visitas.length}</p>
            <p className="text-xs text-gray-500">Visitas</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              diasDesdeVisita === null ? 'text-purple-500' :
              diasDesdeVisita > 30 ? 'text-red-500' : 'text-green-500'
            }`}>
              {diasDesdeVisita === null ? '∞' : diasDesdeVisita}
            </p>
            <p className="text-xs text-gray-500">Dias s/ visita</p>
          </div>
        </div>
      </div>

      {/* Ação Rápida - Registrar Visita */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Registrar Nova Visita
      </button>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-fit px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Tab: Informações */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoItem label="Endereço" value={estabelecimento.endereco} />
                <InfoItem label="Cidade/Estado" value={`${estabelecimento.cidade} - ${estabelecimento.estado}`} />
                {estabelecimento.cep && <InfoItem label="CEP" value={estabelecimento.cep} />}
                {estabelecimento.telefone && (
                  <InfoItem
                    label="Telefone"
                    value={estabelecimento.telefone}
                    link={`tel:${estabelecimento.telefone}`}
                  />
                )}
                {estabelecimento.whatsapp && (
                  <InfoItem
                    label="WhatsApp"
                    value={estabelecimento.whatsapp}
                    link={`https://wa.me/${estabelecimento.whatsapp.replace(/\D/g, '')}`}
                    linkColor="text-green-600"
                  />
                )}
                {estabelecimento.email && (
                  <InfoItem
                    label="E-mail"
                    value={estabelecimento.email}
                    link={`mailto:${estabelecimento.email}`}
                  />
                )}
                {estabelecimento.instagram && (
                  <InfoItem
                    label="Instagram"
                    value={estabelecimento.instagram}
                    link={`https://instagram.com/${estabelecimento.instagram.replace('@', '')}`}
                    linkColor="text-pink-600"
                  />
                )}
                {estabelecimento.website && (
                  <InfoItem
                    label="Website"
                    value={estabelecimento.website}
                    link={estabelecimento.website}
                  />
                )}
              </div>

              {estabelecimento.horario_funcionamento && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Horário de Funcionamento</p>
                  <p className="text-sm whitespace-pre-line">{estabelecimento.horario_funcionamento}</p>
                </div>
              )}

              {estabelecimento.observacoes && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">📝 Observações</p>
                  <p className="text-sm">{estabelecimento.observacoes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Inteligência Comercial */}
          {activeTab === 'inteligencia' && (
            <div className="space-y-6">
              {/* Equipe */}
              <Section title="👥 Equipe">
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Porte"
                    value={getPorteLabel(estabelecimento.porte_equipe) || 'Não informado'}
                    small
                  />
                  <StatCard
                    label="Vets Fixos"
                    value={estabelecimento.veterinarios_fixos?.toString() || '?'}
                    icon="👨‍⚕️"
                  />
                  <StatCard
                    label="Vets Volantes"
                    value={estabelecimento.veterinarios_volantes?.toString() || '?'}
                    icon="🚗"
                  />
                </div>
              </Section>

              {/* Material e Exibição */}
              <Section title="📍 Material e Exibição">
                {estabelecimento.ilha_de_exibicao && estabelecimento.ilha_de_exibicao.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {estabelecimento.ilha_de_exibicao.map((ilha) => (
                      <span key={ilha} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full">
                        {getIlhaLabel(ilha)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Não informado</p>
                )}
              </Section>

              {/* Concorrência */}
              <Section title="⚔️ Concorrência">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Política:</span>
                    {politica ? (
                      <span className={`px-2 py-1 ${politica.color} text-white text-sm rounded-full`}>
                        {politica.icon} {politica.label}
                      </span>
                    ) : (
                      <span className="text-gray-400">Não definida</span>
                    )}
                  </div>

                  {estabelecimento.concorrentes_presentes && estabelecimento.concorrentes_presentes.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Concorrentes presentes:</p>
                      <div className="flex flex-wrap gap-2">
                        {estabelecimento.concorrentes_presentes.map((c) => (
                          <span key={c} className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm rounded-full">
                            {getConcorrenteLabel(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Métricas de Óbitos */}
              <Section title="📈 Métricas de Óbitos">
                <div className="grid grid-cols-3 gap-3">
                  <StatCard
                    label="Média/mês"
                    value={estabelecimento.qtde_media_obitos_mensal?.toString() || '?'}
                    icon="💀"
                  />
                  <StatCard
                    label="% Prefeitura"
                    value={estabelecimento.percentual_prefeitura ? `${estabelecimento.percentual_prefeitura}%` : '?'}
                    icon="🏛️"
                  />
                  <StatCard
                    label="Valor 10kg"
                    value={estabelecimento.valor_prefeitura_10kg ? `R$ ${estabelecimento.valor_prefeitura_10kg}` : '?'}
                    icon="💰"
                  />
                </div>
              </Section>

              {/* Comercial */}
              <Section title="💼 Comercial">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Gratificação:</span>
                    <span className="font-medium">
                      {getGratificacaoLabel(estabelecimento.modelo_gratificacao) || 'Não definido'}
                    </span>
                  </div>

                  {estabelecimento.estrategia && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-1">🎯 Estratégia</p>
                      <p className="text-sm">{estabelecimento.estrategia}</p>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          )}

          {/* Tab: Visitas */}
          {activeTab === 'visitas' && (
            <div className="space-y-3">
              {loadingVisitas ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : visitas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>Nenhuma visita registrada</p>
                </div>
              ) : (
                visitas.map((visita) => (
                  <div key={visita.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {new Date(visita.data_visita).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {visita.tipo_visita && <span className="mr-2">{visita.tipo_visita}</span>}
                          {visita.duracao_minutos && <span>{visita.duracao_minutos} min</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {visita.temperatura_pos_visita && (
                          <span className="text-lg">
                            {visita.temperatura_pos_visita === 'quente' ? '🔥' :
                             visita.temperatura_pos_visita === 'morno' ? '🌤️' : '❄️'}
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteVisita(visita.id)}
                          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {visita.observacoes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{visita.observacoes}</p>
                    )}
                    {visita.proximos_passos && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                        → {visita.proximos_passos}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Contatos */}
          {activeTab === 'contatos' && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              <p>Em breve: gestão de contatos</p>
            </div>
          )}

          {/* Tab: Histórico */}
          {activeTab === 'historico' && (
            <div className="space-y-3">
              {loadingHistorico ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📜</div>
                  <p>Nenhuma alteração registrada</p>
                  <p className="text-xs mt-1">Alterações em campos estratégicos aparecerão aqui</p>
                </div>
              ) : (
                historico.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      item.tipo === 'conquista'
                        ? 'border-l-green-500 bg-green-50 dark:bg-green-900/10'
                        : item.tipo === 'alerta'
                        ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10'
                        : 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">
                        {item.tipo === 'conquista' ? '🏆' : item.tipo === 'alerta' ? '⚠️' : '📝'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.campo_label}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.criado_em).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <span className="line-through text-gray-400">{item.valor_anterior}</span>
                          <span>→</span>
                          <span className="font-medium text-primary">{item.valor_novo}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Visita */}
      <VisitaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateVisita}
        estabelecimentoId={estabelecimento.id}
        unidadeId={unidade?.id || ''}
      />

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Excluir estabelecimento?</h3>
            <p className="text-gray-500 text-sm mb-4">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    const { deleteEstabelecimento } = await import('@/lib/db');
                    await deleteEstabelecimento(id);
                    router.push('/estabelecimentos');
                  } catch (error) {
                    console.error('Erro:', error);
                    setDeleting(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componentes auxiliares
function InfoItem({ label, value, link, linkColor = 'text-primary' }: {
  label: string;
  value: string;
  link?: string;
  linkColor?: string;
}) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={`font-medium ${linkColor} hover:underline`}>
          {value}
        </a>
      ) : (
        <p className="font-medium">{value}</p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value, icon, small }: {
  label: string;
  value: string;
  icon?: string;
  small?: boolean;
}) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
      {icon && <span className="text-lg">{icon}</span>}
      <p className={`font-bold ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
