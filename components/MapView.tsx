'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import Link from 'next/link';
import type { Estabelecimento } from '@/lib/supabase';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para os ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Função para criar ícone customizado baseado no relacionamento
const createCustomIcon = (relacionamento: number) => {
  let color = '#6B7280'; // gray-500 para não pontuado

  if (relacionamento >= 5) color = '#10B981'; // green-500
  else if (relacionamento >= 4) color = '#3B82F6'; // blue-500
  else if (relacionamento >= 3) color = '#F59E0B'; // amber-500
  else if (relacionamento >= 2) color = '#EF4444'; // red-500
  else if (relacionamento >= 1) color = '#DC2626'; // red-600

  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z"
            fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

export default function MapView() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEstabelecimentos() {
      try {
        const { getAllEstabelecimentos } = await import('@/lib/db');
        const data = await getAllEstabelecimentos();

        // Filtrar apenas estabelecimentos com coordenadas
        const comCoordenadas = data.filter(
          (est) => est.latitude !== null && est.longitude !== null
        );

        setEstabelecimentos(comCoordenadas);
      } catch (error) {
        console.error('Erro ao carregar estabelecimentos para o mapa:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEstabelecimentos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <p className="text-gray-500">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (estabelecimentos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2">Nenhum estabelecimento com localização</h3>
          <p className="text-gray-500 mb-6">
            Adicione coordenadas aos estabelecimentos para visualizá-los no mapa
          </p>
          <Link href="/estabelecimentos/adicionar-link" className="btn-primary">
            Adicionar Estabelecimento
          </Link>
        </div>
      </div>
    );
  }

  // Centro do mapa baseado na média das coordenadas
  const centerLat = estabelecimentos.reduce((sum, est) => sum + (est.latitude || 0), 0) / estabelecimentos.length;
  const centerLng = estabelecimentos.reduce((sum, est) => sum + (est.longitude || 0), 0) / estabelecimentos.length;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {estabelecimentos.map((estabelecimento) => (
        <Marker
          key={estabelecimento.id}
          position={[estabelecimento.latitude!, estabelecimento.longitude!]}
          icon={createCustomIcon(estabelecimento.relacionamento)}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-lg mb-2">{estabelecimento.nome}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {estabelecimento.endereco}
              </p>

              {/* Relacionamento com estrelas */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">Relacionamento:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-lg ${
                        star <= estabelecimento.relacionamento
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <Link
                href={`/estabelecimentos/${estabelecimento.id}`}
                className="inline-block px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                Ver Perfil Completo
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
