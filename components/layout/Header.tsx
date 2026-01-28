'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Header({ title }: { title?: string }) {
  const { perfil, unidade, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

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
              <span className="text-sm text-white font-semibold">Comercial</span>
              <span className="text-sm text-white font-semibold">Station</span>
            </div>
          </div>

          {/* Texto - Apenas desktop */}
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm text-white font-semibold">Comercial</span>
            <span className="text-sm text-white font-semibold">Station</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative">
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {perfil?.nome_completo?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white">
                  {perfil?.nome_completo || 'Usuário'}
                </p>
                <p className="text-xs text-blue-200">{unidade?.nome || 'Sem unidade'}</p>
              </div>
              <svg
                className="w-4 h-4 text-white hidden md:block"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {perfil?.nome_completo}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{perfil?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {unidade?.nome} • {perfil?.cargo || 'Sem cargo'}
                  </p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
