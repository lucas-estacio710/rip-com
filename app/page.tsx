'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { Estabelecimento } from '@/lib/supabase';

// Carregar mapa dinamicamente (client-side only)
const MapView = dynamic(() => import('@/components/ui/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] bg-muted rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Carregando mapa...</p>
    </div>
  ),
});

export default function Home() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar estabelecimentos do Supabase
  useEffect(() => {
    async function loadEstabelecimentos() {
      try {
        const { getAllEstabelecimentos } = await import('@/lib/db');
        const data = await getAllEstabelecimentos();
        setEstabelecimentos(data);
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEstabelecimentos();
  }, []);

  // Centro do mapa em Santos
  const santosCenter: [number, number] = [-23.9618, -46.3322];

  if (loading) {
    return (
      <div className="h-full -m-6 relative z-0 flex items-center justify-center bg-muted">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500">Carregando estabelecimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full -m-6 relative z-0">
      {/* Mapa em tela cheia */}
      <MapView
        estabelecimentos={estabelecimentos}
        center={santosCenter}
        zoom={14}
        height="calc(100vh - 80px)"
      />
    </div>
  );
}
