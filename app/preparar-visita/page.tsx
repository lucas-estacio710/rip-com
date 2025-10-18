'use client';

import Link from 'next/link';
import { useState } from 'react';
import { mockEstabelecimentos, mockContatos, mockVisitas, mockIndicacoes } from '@/lib/mockData';
import type { Estabelecimento } from '@/types';

export default function PrepararVisitaPage() {
  const [selectedEstabelecimento, setSelectedEstabelecimento] =
    useState<Estabelecimento | null>(null);

  const getDiasDesdeVisita = (ultimaVisita?: Date) => {
    if (!ultimaVisita) return null;
    return Math.floor(
      (new Date().getTime() - new Date(ultimaVisita).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Se um estabelecimento está selecionado, mostrar detalhes
  if (selectedEstabelecimento) {
    const diasDesdeVisita = getDiasDesdeVisita(
      selectedEstabelecimento.ultimaVisita
    );
    const contatos = mockContatos.filter(
      (c) => c.estabelecimentoId === selectedEstabelecimento.id
    );
    const visitas = mockVisitas.filter(
      (v) => v.estabelecimentoId === selectedEstabelecimento.id
    );
    const ultimaVisita = visitas[0]; // mock já está ordenado
    const indicacoes = mockIndicacoes.filter(
      (i) =>
        i.estabelecimentoId === selectedEstabelecimento.id &&
        i.statusCaso === 'concluido' &&
        !i.agradecimentoEnviado
    );

    // Aniversariantes nos próximos 7 dias
    const hoje = new Date();
    const aniversariantes = contatos.filter((contato) => {
      if (!contato.aniversario) return false;
      const aniver = new Date(contato.aniversario);
      const diasAteAniver = Math.floor(
        (new Date(
          hoje.getFullYear(),
          aniver.getMonth(),
          aniver.getDate()
        ).getTime() -
          hoje.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return diasAteAniver >= 0 && diasAteAniver <= 7;
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <button
              onClick={() => setSelectedEstabelecimento(null)}
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
            </button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Preparar Visita
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {selectedEstabelecimento.nome}
              </p>
            </div>
          </div>

          <Link
            href={`/visitas/nova?estabelecimento=${selectedEstabelecimento.id}`}
            className="btn-primary"
          >
            Registrar Visita
          </Link>
        </div>

        {/* Alerta: Tempo desde última visita */}
        {diasDesdeVisita !== null && diasDesdeVisita > 30 && (
          <div className="card bg-warning/10 border-warning">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-warning flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-bold text-warning mb-1">
                  Atenção: Visita Atrasada
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Faz {diasDesdeVisita} dias desde a última visita. Considere
                  levar um agrado especial!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aniversariantes */}
        {aniversariantes.length > 0 && (
          <div className="card bg-secondary/10 border-secondary">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-secondary flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z"
                />
              </svg>
              <div>
                <h3 className="font-bold text-secondary mb-1">
                  Aniversariante(s)!
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {aniversariantes.map((c) => c.nome).join(', ')} faz(em)
                  aniversário nos próximos dias
                </p>
                <p className="text-xs text-gray-600">
                  Sugestão: Levar um bolo ou presente especial
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Indicações pendentes de agradecimento */}
        {indicacoes.length > 0 && (
          <div className="card bg-success/10 border-success">
            <div className="flex items-start space-x-3">
              <svg
                className="w-6 h-6 text-success flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <div>
                <h3 className="font-bold text-success mb-1">
                  Agradecer Indicação!
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {indicacoes.length} indicação(ões) concluída(s) aguardando
                  agradecimento
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Última Visita */}
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-primary"
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
              <span>Última Visita</span>
            </h3>

            {ultimaVisita ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-medium">{formatDate(ultimaVisita.data)}</p>
                  <p className="text-xs text-gray-500">
                    ({diasDesdeVisita} dias atrás)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Visitado por</p>
                  <p className="font-medium">{ultimaVisita.visitadoPor}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clima</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      ultimaVisita.clima === 'positivo'
                        ? 'bg-success/10 text-success'
                        : ultimaVisita.clima === 'neutro'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-danger/10 text-danger'
                    }`}
                  >
                    {ultimaVisita.clima}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">O que foi falado</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {ultimaVisita.assuntos}
                  </p>
                </div>
                {ultimaVisita.amenidadesEntregues.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Amenidades entregues
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ultimaVisita.amenidadesEntregues.map((a, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-muted px-2 py-1 rounded"
                        >
                          {a.quantidade}x {a.tipo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {ultimaVisita.promessas && (
                  <div className="p-3 bg-warning/10 rounded-lg">
                    <p className="text-sm font-medium text-warning mb-1">
                      Promessas/Pendências
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {ultimaVisita.promessas}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Nenhuma visita registrada ainda</p>
            )}
          </div>

          {/* Contatos */}
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Contatos ({contatos.length})</span>
            </h3>

            {contatos.length === 0 ? (
              <p className="text-gray-500">Nenhum contato cadastrado</p>
            ) : (
              <div className="space-y-3">
                {contatos.map((contato) => (
                  <div
                    key={contato.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-muted"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                      {contato.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contato.nome}</p>
                      <p className="text-xs text-gray-500">
                        {contato.cargo === 'veterinario'
                          ? 'Veterinário(a)'
                          : contato.cargo === 'recepcionista'
                          ? 'Recepcionista'
                          : contato.cargo === 'gerente'
                          ? 'Gerente'
                          : 'Proprietário'}
                      </p>
                      {contato.telefone && (
                        <p className="text-xs text-gray-600 mt-1">
                          {contato.telefone}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sugestões de Amenidades */}
        <div className="card">
          <h3 className="font-bold mb-4 flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <span>Sugestões de Amenidades</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {diasDesdeVisita && diasDesdeVisita > 45 ? (
              <>
                <div className="p-3 border-2 border-primary rounded-lg text-center">
                  <p className="font-bold text-primary">Bolo</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Muito tempo sem visita
                  </p>
                </div>
                <div className="p-3 border border-border rounded-lg text-center">
                  <p className="font-medium">Chocolates</p>
                  <p className="text-xs text-gray-500 mt-1">Complemento</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 border border-border rounded-lg text-center">
                  <p className="font-medium">Balas</p>
                  <p className="text-xs text-gray-500 mt-1">Padrão</p>
                </div>
                <div className="p-3 border border-border rounded-lg text-center">
                  <p className="font-medium">Canetas</p>
                  <p className="text-xs text-gray-500 mt-1">Material</p>
                </div>
              </>
            )}
            {aniversariantes.length > 0 && (
              <div className="p-3 border-2 border-secondary rounded-lg text-center">
                <p className="font-bold text-secondary">Bolo Especial</p>
                <p className="text-xs text-gray-500 mt-1">Aniversário</p>
              </div>
            )}
          </div>
        </div>

        {/* Informações do Estabelecimento */}
        <div className="card">
          <h3 className="font-bold mb-4">Informações do Local</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Endereço</p>
              <p className="font-medium">
                {selectedEstabelecimento.endereco}
              </p>
              <p className="text-sm text-gray-600">
                {selectedEstabelecimento.cidade} -{' '}
                {selectedEstabelecimento.estado}
              </p>
            </div>
            {selectedEstabelecimento.telefone && (
              <div>
                <p className="text-sm text-gray-500">Telefone</p>
                <p className="font-medium">
                  {selectedEstabelecimento.telefone}
                </p>
              </div>
            )}
            {selectedEstabelecimento.horarioFuncionamento && (
              <div>
                <p className="text-sm text-gray-500">Horário</p>
                <p className="font-medium">
                  {selectedEstabelecimento.horarioFuncionamento}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Lista de estabelecimentos para selecionar
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Preparar Visita</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Selecione um estabelecimento para ver informações antes da visita
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockEstabelecimentos.map((estabelecimento) => {
          const diasDesdeVisita = getDiasDesdeVisita(
            estabelecimento.ultimaVisita
          );

          return (
            <button
              key={estabelecimento.id}
              onClick={() => setSelectedEstabelecimento(estabelecimento)}
              className="card hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">
                    {estabelecimento.nome}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {estabelecimento.cidade} - {estabelecimento.estado}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  {diasDesdeVisita !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Última visita</p>
                      <p
                        className={`text-sm font-medium ${
                          diasDesdeVisita > 30
                            ? 'text-warning'
                            : 'text-success'
                        }`}
                      >
                        {diasDesdeVisita} dias
                      </p>
                    </div>
                  )}
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
