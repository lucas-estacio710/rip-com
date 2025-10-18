'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Header({ title }: { title?: string }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const mockNotifications = [
    { id: 1, text: 'Nova visita agendada para amanhã', time: '5 min atrás', unread: true },
    { id: 2, text: 'Relatório semanal disponível', time: '1 hora atrás', unread: true },
    { id: 3, text: 'Estabelecimento atualizou informações', time: '2 horas atrás', unread: false },
  ];

  return (
    <header className="bg-blue-900 border-b border-blue-800 sticky top-0 z-40">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo - Apenas mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <Image
              src="/rippet_logo.png"
              alt="R.I.P. Pet Santos"
              width={140}
              height={45}
              className="object-contain"
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-white font-semibold">Inteligência</span>
              <span className="text-sm text-white font-semibold">Comercial</span>
            </div>
          </div>

          {/* Texto - Apenas desktop */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm text-white font-semibold">Inteligência</span>
            <span className="text-sm text-white font-semibold">Comercial</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative">
          {/* Notificações */}
          <button
            className="relative p-2 rounded-lg hover:bg-blue-800 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Badge de notificação */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full"></span>
          </button>

          {/* Painel de Notificações */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {mockNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      notification.unread ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <p className="text-sm text-gray-900 dark:text-white">{notification.text}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  Ver todas as notificações
                </button>
              </div>
            </div>
          )}


          {/* Avatar Mobile */}
          <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm md:hidden">
            U
          </button>
        </div>
      </div>
    </header>
  );
}
