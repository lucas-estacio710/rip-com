'use client';

import { useState } from 'react';

const SUPABASE_URL = 'https://eniplfcuwvhovxybyuey.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuaXBsZmN1d3Zob3Z4eWJ5dWV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MDM1MjIsImV4cCI6MjA3NTQ3OTUyMn0.VFftjEVtd4_Vwa2KnrY0YizC_9xBATpe0z14X-7I6Is';

export default function TestFetchPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  const testFetch = async () => {
    setLoading(true);
    setResult(null);
    const start = Date.now();

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/perfis?select=*&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      const data = await response.json();
      setDuration(Date.now() - start);
      setResult({ success: true, data });
    } catch (error: any) {
      setDuration(Date.now() - start);
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teste Fetch Direto</h1>

      <button
        onClick={testFetch}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testando...' : 'Testar Fetch Direto'}
      </button>

      {duration !== null && (
        <p className="mb-4">Tempo: <strong>{duration}ms</strong></p>
      )}

      {result && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
