'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Visita, CreateVisitaInput, UpdateVisitaInput } from '@/types/visitas';
import VisitaModal from '@/components/VisitaModal';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'dia' | '3dias' | 'semana' | 'mes';

export default function VisitasPage() {
  const { unidade } = useAuth();
  const [activeTab, setActiveTab] = useState<'historico' | 'proximas' | 'calendario'>('historico');
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVisita, setEditingVisita] = useState<Visita | null>(null);

  useEffect(() => {
    fetchVisitas();
  }, []);

  const fetchVisitas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/visitas');
      if (response.ok) {
        const data = await response.json();
        setVisitas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar visitas:', error);
    } finally {
      setLoading(false);
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
  };

  const handleUpdateVisita = async (data: UpdateVisitaInput) => {
    if (!editingVisita) return;

    const response = await fetch(`/api/visitas/${editingVisita.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Erro ao atualizar visita');
    }

    await fetchVisitas();
    setEditingVisita(null);
  };

  const handleDeleteVisita = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta visita?')) return;

    try {
      const response = await fetch(`/api/visitas/${id}`, {
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

  const handleMarcarRealizada = async (visita: Visita) => {
    try {
      const response = await fetch(`/api/visitas/${visita.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'realizada' }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar visita');
      }

      await fetchVisitas();
    } catch (error) {
      console.error('Erro ao marcar visita como realizada:', error);
      alert('Erro ao marcar visita como realizada');
    }
  };

  // Filtrar visitas por status
  const visitasHistorico = visitas.filter((v) => v.status === 'realizada');
  const visitasProximas = visitas.filter((v) => v.status === 'agendada');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Visitas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie visitas realizadas e agendadas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Visita
        </button>
      </div>

      {/* Modal */}
      <VisitaModal
        isOpen={isModalOpen || !!editingVisita}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVisita(null);
        }}
        onSave={editingVisita ? handleUpdateVisita : handleCreateVisita}
        visita={editingVisita}
        unidadeId={unidade?.id || ''}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('historico')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'historico'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Histórico
            </div>
          </button>
          <button
            onClick={() => setActiveTab('proximas')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'proximas'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Próximas
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calendario')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'calendario'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Calendário
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* HISTÓRICO */}
        {activeTab === 'historico' && (
          <div className="space-y-4">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Carregando visitas...</p>
              </div>
            ) : visitasHistorico.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Nenhuma visita realizada ainda</p>
              </div>
            ) : (
              visitasHistorico.map((visita) => (
                <div key={visita.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">
                        {visita.estabelecimentos?.nome || 'Estabelecimento'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {visita.estabelecimentos?.endereco}, {visita.estabelecimentos?.cidade}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(visita.data_visita).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {new Date(visita.data_visita).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">
                          {visita.tipo_visita}
                        </span>
                        {visita.temperatura_pos_visita && (
                          <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">
                            {visita.temperatura_pos_visita === 'quente' && '🔥'}
                            {visita.temperatura_pos_visita === 'morno' && '🌤️'}
                            {visita.temperatura_pos_visita === 'frio' && '❄️'}
                          </span>
                        )}
                      </div>
                      {visita.observacoes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                          {visita.observacoes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Realizada
                      </span>
                      <div className="relative group">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10">
                          <button
                            onClick={() => setEditingVisita(visita)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteVisita(visita.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PRÓXIMAS */}
        {activeTab === 'proximas' && (
          <div className="space-y-4">
            {loading ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Carregando visitas...</p>
              </div>
            ) : visitasProximas.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Nenhuma visita agendada</p>
              </div>
            ) : (
              visitasProximas.map((visita) => (
                <div key={visita.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">
                        {visita.estabelecimentos?.nome || 'Estabelecimento'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {visita.estabelecimentos?.endereco}, {visita.estabelecimentos?.cidade}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(visita.data_visita).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {new Date(visita.data_visita).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700">
                          {visita.tipo_visita}
                        </span>
                      </div>
                      {visita.objetivo && (
                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 font-medium">
                          <span className="text-gray-500">Objetivo:</span> {visita.objetivo}
                        </p>
                      )}
                      {visita.observacoes && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          {visita.observacoes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Agendada
                      </span>
                      <div className="relative group">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden group-hover:block z-10">
                          <button
                            onClick={() => setEditingVisita(visita)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={() => handleMarcarRealizada(visita)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Marcar como Realizada
                          </button>
                          <button
                            onClick={() => handleDeleteVisita(visita.id)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CALENDÁRIO */}
        {activeTab === 'calendario' && (
          <div className="space-y-4">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('dia')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'dia'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setViewMode('3dias')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === '3dias'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  3 Dias
                </button>
                <button
                  onClick={() => setViewMode('semana')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'semana'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('mes')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'mes'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  Mês
                </button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Outubro 2025
              </div>
            </div>

            {/* Calendar View */}
            <div className="card">
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Calendário - Visualização {viewMode}</h3>
                <p className="text-gray-500">
                  Componente de calendário será implementado em breve
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Modo atual: {viewMode === 'dia' ? 'Dia' : viewMode === '3dias' ? 'Ontem, Hoje e Amanhã' : viewMode === 'semana' ? 'Semana' : 'Mês'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
