'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Mensagens de erro baseadas no query param
const ERROR_MESSAGES: Record<string, string> = {
  session_expired: 'Sua sessão expirou ou não foi possível conectar. Faça login novamente.',
  profile_not_found: 'Não foi possível carregar seu perfil. Tente novamente.',
};

// Componente interno que usa searchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verifica se há erro na URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam && ERROR_MESSAGES[errorParam]) {
      setError(ERROR_MESSAGES[errorParam]);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🚀 Iniciando login...');
    console.log('📧 Email:', email);

    try {
      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('❌ Erro retornado:', signInError);
        setError(`Erro: ${signInError.message || 'Email ou senha inválidos'}`);
        setLoading(false);
        return;
      }

      console.log('✅ Login bem-sucedido! Redirecionando...');
      // Redireciona para a home após login bem-sucedido
      router.push('/');
    } catch (err) {
      console.error('💥 Erro crítico:', err);
      setError('Ocorreu um erro ao fazer login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="card max-w-md w-full">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
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
          <h1 className="text-2xl font-bold text-foreground">R.I.P. Pet CRM</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Faça login para acessar o sistema
          </p>
        </div>

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        {/* Links adicionais */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Não tem acesso?{' '}
            <a href="mailto:admin@rippet.com" className="text-primary hover:underline">
              Solicite ao administrador
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Página principal com Suspense para useSearchParams
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
