'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('lucasmestacio@gmail.com');
  const [password, setPassword] = useState('senha123');

  const createUser = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Criar usuário
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            nome_completo: 'Lucas Estacio',
          },
          emailRedirectTo: undefined, // Não enviar email de confirmação
        },
      });

      console.log('✅ Usuário criado:', { data, error });

      setResult({
        action: 'CREATE_USER',
        email: email,
        success: !error,
        data: data,
        error: error?.message,
      });
    } catch (error) {
      console.error('💥 Erro:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // Teste 1: Verificar URL e Key
      console.log('🔗 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔑 Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...');

      // Teste 2: Tentar buscar unidades (sem auth)
      const { data: unidades, error: unidadesError } = await supabase
        .from('unidades')
        .select('*');

      console.log('📦 Unidades:', { unidades, unidadesError });

      // Teste 3: Tentar login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      console.log('🔐 Login:', { loginData, loginError });

      setResult({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...',
        unidades: unidades || unidadesError,
        login: loginData || loginError,
      });
    } catch (error) {
      console.error('💥 Erro:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Teste Supabase</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Senha</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={createUser}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Criando...' : '1. Criar Usuário'}
        </button>

        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          {loading ? 'Testando...' : '2. Testar Login'}
        </button>
      </div>

      {result && (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
