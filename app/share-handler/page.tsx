'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function ShareHandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const handleShare = async () => {
      try {
        // Captura os parâmetros compartilhados
        const title = searchParams.get('title');
        const text = searchParams.get('text');
        const url = searchParams.get('url');

        console.log('Recebido compartilhamento:', { title, text, url });

        // Redireciona para página de busca
        setStatus('success');
        setTimeout(() => {
          router.push('/estabelecimentos/buscar');
        }, 1000);
      } catch (error) {
        console.error('Erro ao processar compartilhamento:', error);
        setStatus('error');
        setTimeout(() => {
          router.push('/estabelecimentos');
        }, 2000);
      }
    };

    handleShare();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="card max-w-md text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4">
              <svg className="animate-spin text-blue-600" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Processando compartilhamento...</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Extraindo informações do Google Maps
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-green-700 dark:text-green-400">
              Link recebido!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Carregando informações da clínica...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 text-orange-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2 text-orange-700 dark:text-orange-400">
              Link não reconhecido
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Por favor, compartilhe um link do Google Maps
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function ShareHandlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="card max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg className="animate-spin text-blue-600" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Carregando...</h2>
        </div>
      </div>
    }>
      <ShareHandlerContent />
    </Suspense>
  );
}
