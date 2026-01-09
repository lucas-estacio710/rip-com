'use client';

import { useState, useEffect } from 'react';
import type { HistoricoAlteracao } from '@/lib/supabase';

interface HistoricoTimelineProps {
  estabelecimentoId: string;
}

export default function HistoricoTimeline({ estabelecimentoId }: HistoricoTimelineProps) {
  const [historico, setHistorico] = useState<HistoricoAlteracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'conquista' | 'alerta'>('todos');

  useEffect(() => {
    async function loadHistorico() {
      try {
        const { getHistoricoByEstabelecimento } = await import('@/lib/db');
        const data = await getHistoricoByEstabelecimento(estabelecimentoId);
        setHistorico(data);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      } finally {
        setLoading(false);
      }
    }
    loadHistorico();
  }, [estabelecimentoId]);

  const historicoFiltrado = filtro === 'todos'
    ? historico
    : historico.filter(h => h.tipo === filtro);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'conquista':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span className="text-xl">🏆</span>
          </div>
        );
      case 'alerta':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-xl">📝</span>
          </div>
        );
    }
  };

  const getBgColor = (tipo: string) => {
    switch (tipo) {
      case 'conquista':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'alerta':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-gray-500">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filtro === 'todos'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Todos ({historico.length})
        </button>
        <button
          onClick={() => setFiltro('conquista')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filtro === 'conquista'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          🏆 Conquistas ({historico.filter(h => h.tipo === 'conquista').length})
        </button>
        <button
          onClick={() => setFiltro('alerta')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filtro === 'alerta'
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          ⚠️ Alertas ({historico.filter(h => h.tipo === 'alerta').length})
        </button>
      </div>

      {/* Timeline */}
      {historicoFiltrado.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📜</p>
          <p>Nenhum histórico registrado ainda.</p>
          <p className="text-sm mt-1">As alterações em campos estratégicos serão registradas automaticamente.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historicoFiltrado.map((item) => (
            <div
              key={item.id}
              className={`flex gap-4 p-4 rounded-lg border-l-4 ${getBgColor(item.tipo)}`}
            >
              {getIcon(item.tipo)}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{item.campo_label}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(item.criado_em)}
                    </p>
                  </div>
                  {item.tipo === 'conquista' && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      Conquista!
                    </span>
                  )}
                  {item.tipo === 'alerta' && (
                    <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                      Atenção
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded line-through text-gray-500">
                      {item.valor_anterior || 'Não definido'}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded font-medium">
                      {item.valor_novo || 'Não definido'}
                    </span>
                  </div>
                </div>
                {item.nota && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                    💬 {item.nota}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
