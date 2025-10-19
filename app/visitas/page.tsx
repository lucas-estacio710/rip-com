'use client';

import { useState } from 'react';
import Link from 'next/link';

type ViewMode = 'dia' | '3dias' | 'semana' | 'mes';

export default function VisitasPage() {
  const [activeTab, setActiveTab] = useState<'historico' | 'proximas' | 'calendario'>('historico');
  const [viewMode, setViewMode] = useState<ViewMode>('semana');

  // Mock data - será substituído por dados reais do Supabase
  const visitasHistorico = [
    {
      id: '1',
      estabelecimento: 'Clínica Veterinária da Villa',
      endereco: 'Santos, SP',
      data: '2025-10-15',
      hora: '14:30',
      status: 'concluida',
      observacoes: 'Boa conversa com Dr. João. Interessado em novos produtos.',
    },
    {
      id: '2',
      estabelecimento: 'Pet Shop Amigo Fiel',
      endereco: 'Santos, SP',
      data: '2025-10-12',
      hora: '10:00',
      status: 'concluida',
      observacoes: 'Pedido realizado. Retornar em 30 dias.',
    },
  ];

  const visitasProximas = [
    {
      id: '3',
      estabelecimento: 'Hospital Veterinário 24h',
      endereco: 'Guarujá, SP',
      data: '2025-10-20',
      hora: '15:00',
      status: 'agendada',
      observacoes: 'Levar catálogo de produtos premium.',
    },
    {
      id: '4',
      estabelecimento: 'Clínica Pet Care',
      endereco: 'Santos, SP',
      data: '2025-10-22',
      hora: '11:00',
      status: 'agendada',
      observacoes: 'Apresentar novo sistema de cremação.',
    },
  ];

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
        <Link
          href="/visitas/agendar"
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agendar Visita
        </Link>
      </div>

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
            {visitasHistorico.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Nenhuma visita realizada ainda</p>
              </div>
            ) : (
              visitasHistorico.map((visita) => (
                <div key={visita.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {visita.estabelecimento}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {visita.endereco}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(visita.data).toLocaleDateString('pt-BR')}
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
                          {visita.hora}
                        </div>
                      </div>
                      {visita.observacoes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                          {visita.observacoes}
                        </p>
                      )}
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Concluída
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* PRÓXIMAS */}
        {activeTab === 'proximas' && (
          <div className="space-y-4">
            {visitasProximas.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Nenhuma visita agendada</p>
              </div>
            ) : (
              visitasProximas.map((visita) => (
                <div key={visita.id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        {visita.estabelecimento}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {visita.endereco}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(visita.data).toLocaleDateString('pt-BR')}
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
                          {visita.hora}
                        </div>
                      </div>
                      {visita.observacoes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                          {visita.observacoes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Agendada
                      </span>
                      <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
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
