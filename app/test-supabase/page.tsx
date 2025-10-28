'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function TestSupabasePage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function runTests() {
      const testResults: any = {};

      try {
        // Test 1: Check session
        console.log('Test 1: Verificando sessao...');
        const start1 = Date.now();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        const duration1 = Date.now() - start1;

        testResults.session = {
          duration: duration1,
          success: !sessionError,
          hasSession: !!session,
          userId: session?.user?.id,
          error: sessionError?.message,
        };
        console.log('Test 1 completou em', duration1, 'ms');

        if (!session) {
          console.error('Sem sessao - nao pode testar queries');
          setResults(testResults);
          setLoading(false);
          return;
        }

        // Test 2: Query perfis (with timeout)
        console.log('Test 2: Query em perfis...');
        const start2 = Date.now();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT after 5s')), 5000)
        );

        const queryPromise = supabase
          .from('perfis')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        try {
          const { data: perfilData, error: perfilError } = await Promise.race([
            queryPromise,
            timeoutPromise as any
          ]);

          const duration2 = Date.now() - start2;
          testResults.perfil = {
            duration: duration2,
            success: !perfilError,
            hasData: !!perfilData,
            data: perfilData,
            error: perfilError?.message,
          };
          console.log('Test 2 completou em', duration2, 'ms');
        } catch (timeoutError: any) {
          const duration2 = Date.now() - start2;
          testResults.perfil = {
            duration: duration2,
            success: false,
            timeout: true,
            error: timeoutError.message,
          };
          console.error('Test 2 TIMEOUT apos', duration2, 'ms');
        }

        // Test 3: Query estabelecimentos (with timeout)
        console.log('Test 3: Query em estabelecimentos...');
        const start3 = Date.now();

        const timeoutPromise3 = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT after 5s')), 5000)
        );

        const queryPromise3 = supabase
          .from('estabelecimentos')
          .select('id, nome')
          .limit(1);

        try {
          const { data: estabData, error: estabError } = await Promise.race([
            queryPromise3,
            timeoutPromise3 as any
          ]);

          const duration3 = Date.now() - start3;
          testResults.estabelecimentos = {
            duration: duration3,
            success: !estabError,
            hasData: !!estabData,
            count: estabData?.length || 0,
            error: estabError?.message,
          };
          console.log('Test 3 completou em', duration3, 'ms');
        } catch (timeoutError: any) {
          const duration3 = Date.now() - start3;
          testResults.estabelecimentos = {
            duration: duration3,
            success: false,
            timeout: true,
            error: timeoutError.message,
          };
          console.error('Test 3 TIMEOUT apos', duration3, 'ms');
        }

      } catch (error: any) {
        console.error('Erro geral nos testes:', error);
        testResults.generalError = error.message;
      }

      setResults(testResults);
      setLoading(false);
    }

    runTests();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Testando Supabase...</h1>
        <p>Executando testes...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Resultados dos Testes Supabase</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-bold text-lg mb-2">Test 1: Sessao</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(results.session, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold text-lg mb-2">Test 2: Query Perfil</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(results.perfil, null, 2)}
          </pre>
          {results.perfil?.timeout && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
              TIMEOUT! Query travou por mais de 5 segundos.
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold text-lg mb-2">Test 3: Query Estabelecimentos</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(results.estabelecimentos, null, 2)}
          </pre>
          {results.estabelecimentos?.timeout && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
              TIMEOUT! Query travou por mais de 5 segundos.
            </div>
          )}
        </div>

        {results.generalError && (
          <div className="border-red-500 border-2 p-4 rounded bg-red-50">
            <h2 className="font-bold text-lg mb-2 text-red-700">Erro Geral</h2>
            <p className="text-red-600">{results.generalError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
