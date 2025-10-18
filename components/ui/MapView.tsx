'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Estabelecimento } from '@/lib/supabase';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para ícones do Leaflet no Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Ícones customizados por relacionamento (estrelas)
const getMarkerIcon = (relacionamento: number) => {
  const colorMap: { [key: number]: string } = {
    0: '#9ca3af', // cinza claro - não pontuado
    1: '#ef4444', // vermelho - frio
    2: '#f97316', // laranja - morno
    3: '#f59e0b', // amarelo - regular
    4: '#22c55e', // verde - bom
    5: '#10b981', // verde escuro - excelente
  };

  const color = colorMap[relacionamento] || '#9ca3af';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 22px;
          height: 22px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 14px;
          height: 14px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
};

interface MapViewProps {
  estabelecimentos: Estabelecimento[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  useGeolocation?: boolean;
}

// Componente para centralizar o mapa na localização do usuário
function LocationController({ userLocation, zoom }: { userLocation: [number, number] | null; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, zoom);
    }
  }, [userLocation, zoom, map]);

  return null;
}

// Ícone customizado para localização do usuário
const getUserLocationIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(59, 130, 246, 0.2);
          border: 2px solid rgba(59, 130, 246, 0.5);
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

export default function MapView({
  estabelecimentos,
  center = [-23.5629, -46.6544], // Centro de SP
  zoom = 13,
  height = '500px',
  useGeolocation = true,
}: MapViewProps) {
  const [isClient, setIsClient] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Buscar geolocalização do usuário
  useEffect(() => {
    if (isClient && useGeolocation && 'geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationError('Não foi possível obter sua localização');
          setIsLoadingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  }, [isClient, useGeolocation]);

  const handleRecenterMap = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          setLocationError('Não foi possível obter sua localização');
          setIsLoadingLocation(false);
        }
      );
    }
  };

  if (!isClient) {
    return (
      <div
        className="w-full bg-muted rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    );
  }

  // Filtrar apenas estabelecimentos com coordenadas
  const estabelecimentosComCoordenadas = estabelecimentos.filter(
    (est) => est.latitude && est.longitude
  );

  const getDiasDesdeVisita = (ultima_visita?: string | null) => {
    if (!ultima_visita) return null;
    return Math.floor(
      (new Date().getTime() - new Date(ultima_visita).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border relative z-0">
      <MapContainer
        center={userLocation || center}
        zoom={zoom}
        style={{ height, width: '100%', zIndex: 0 }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Controlador para atualizar o centro do mapa */}
        <LocationController userLocation={userLocation} zoom={zoom} />

        {/* Marcador da localização do usuário */}
        {userLocation && (
          <Marker position={userLocation} icon={getUserLocationIcon()}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-sm">Você está aqui</h3>
                <p className="text-xs text-gray-600 mt-1">Sua localização atual</p>
              </div>
            </Popup>
          </Marker>
        )}

        {estabelecimentosComCoordenadas.map((estabelecimento) => {
          const diasDesdeVisita = getDiasDesdeVisita(
            estabelecimento.ultima_visita
          );

          return (
            <Marker
              key={estabelecimento.id}
              position={[estabelecimento.latitude!, estabelecimento.longitude!]}
              icon={getMarkerIcon(estabelecimento.relacionamento)}
            >
              <Popup maxWidth={300} className="custom-popup">
                <div className="p-0 min-w-[280px]">
                  {/* Imagem do estabelecimento */}
                  <div className="w-full h-32 bg-gray-200 relative overflow-hidden">
                    {estabelecimento.fotos && estabelecimento.fotos.length > 0 ? (
                      <img
                        src={estabelecimento.fotos[0]}
                        alt={estabelecimento.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                        <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="p-3">
                    <h3 className="font-bold text-base mb-2">
                      {estabelecimento.nome}
                    </h3>

                    <div className="space-y-2 text-sm mb-3">
                      <p className="text-sm text-gray-700">{estabelecimento.endereco}</p>

                      {/* Informações visuais */}
                      <div className="space-y-2 pt-2 border-t">
                        {/* Data da última visita */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-600">Última visita:</span>
                          <span className="text-xs font-semibold text-gray-800">
                            {estabelecimento.ultima_visita
                              ? new Date(estabelecimento.ultima_visita).toLocaleDateString('pt-BR')
                              : 'Nunca visitado'}
                          </span>
                        </div>

                        {/* Relacionamento com estrelas */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-xs text-gray-600">Relacionamento:</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= estabelecimento.relacionamento ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>

                        {/* Nome do proprietário */}
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs text-gray-600">Proprietário:</span>
                          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Incluir
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Botões de navegação */}
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b">
                      <span className="text-xs text-gray-600 font-medium">Navegar:</span>
                      <a
                        href={`https://waze.com/ul?ll=${estabelecimento.latitude},${estabelecimento.longitude}&navigate=yes`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#33ccff] text-white rounded-lg hover:bg-[#00a8e8] transition-colors text-xs font-medium"
                        title="Abrir no Waze"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 48 48" fill="currentColor">
                          <path d="M47.5 26.9c-1.3 6.8-5.7 12.4-11.8 15.3.7 2.1.1 4.4-1.6 5.9-1.3 1.2-3.1 1.7-4.8 1.4-1.1 0-2.2-.4-3.1-1.1-1.7-1.3-2.5-3.4-2.1-5.4-3.9 0-7.7-.1-8.3-.1-1.6 1.8-4.1 2.6-6.5 2.1-1.8-.4-3.4-1.5-4.4-3-1.1-1.7-1.4-3.8-.8-5.7-6.1-3.1-10.7-8.8-12.3-15.8C-1.6 8.7 7.9-1.3 19.6.2c7.7.9 14.5 5.8 17.4 12.7.6 1.3 1.1 2.6 1.5 4 1.1 3.3.8 6.9-1.1 9.9-.5.7-1.1 1.4-1.7 2 0 .5-.2 1-.6 1.4-.5.6-1.3.9-2.1.7-1.1-.3-1.9-1.2-2-2.3-.1-.8-.3-1.6-.5-2.4-.4-1.9-.9-3.7-1.7-5.4-1-2.2-2.5-4.2-4.4-5.7-1.3-1.1-2.8-2-4.4-2.6-2.8-1-5.8-1.2-8.7-.5-1.2.3-2.4.7-3.5 1.3-1.5.8-2.8 1.8-4 3-.9.9-1.6 1.9-2.2 3-.7 1.5-1.2 3.1-1.3 4.8-.1 1.5.1 3 .5 4.4.3 1 .7 2 1.2 2.9.8 1.4 1.8 2.7 3 3.8 1.7 1.5 3.7 2.6 5.9 3.2-.7 2.1-.1 4.4 1.7 5.8 1.7 1.4 4.1 1.7 6.1.7 1.4-.7 2.5-2 3-3.5 3.9 0 7.7-.1 8.3-.1.5 1.5 1.6 2.8 3 3.5 2 1 4.4.7 6.1-.7 1.7-1.4 2.3-3.7 1.6-5.8 2.2-.6 4.2-1.7 5.9-3.2 2.4-2 4.3-4.6 5.3-7.6 1.2-3.6 1.4-7.5.5-11.2-.7-2.9-2-5.7-3.8-8.1-2.4-3.2-5.6-5.7-9.3-7.1-4.7-1.9-10-2.3-14.9-1.1-3.8.9-7.3 2.7-10.2 5.3-1.8 1.6-3.3 3.4-4.5 5.5-1 1.8-1.8 3.7-2.3 5.7-.4 1.7-.6 3.5-.4 5.3.1 1.2.3 2.3.6 3.5.5 1.8 1.2 3.5 2.2 5.1 1.5 2.3 3.5 4.3 5.8 5.8 0-2.2 1.4-4.2 3.4-5.1 2.3-1.1 5.1-.8 7.2.7 1.5 1.1 2.5 2.7 2.7 4.5.3 0 .6.1.9.1 2.5 0 4.8-1.3 6.1-3.4 1.4-2.3 1.7-5.1.8-7.7-.6-1.8-1.7-3.4-3.2-4.6-1.9-1.5-4.3-2.3-6.7-2.1-1.9.1-3.7.8-5.2 1.9-1.1.8-2 1.8-2.7 3-.5.9-.9 1.9-1.1 2.9-.2.9-.2 1.9-.1 2.8.1.7.3 1.5.5 2.2.3.9.7 1.8 1.3 2.5.8 1 1.8 1.8 3 2.3 1.4.6 3 .7 4.5.3.7-.2 1.4-.5 2-1 .5-.4.9-1 1.2-1.6.2-.5.3-1 .3-1.5 0-1.1-.4-2.2-1.2-3-.7-.7-1.6-1.1-2.6-1.1-.7 0-1.4.2-2 .6-.4.3-.7.7-.8 1.2-.1.4-.1.8.1 1.2.2.3.5.5.9.5.3 0 .5-.1.7-.3.1-.1.2-.3.2-.5 0-.1 0-.3-.1-.4-.1-.1-.2-.1-.3-.1-.2 0-.4.1-.5.2 0 .1-.1.2-.1.3 0 .2.1.3.3.4.1 0 .3 0 .4-.1.1-.1.2-.2.2-.4 0-.3-.2-.6-.5-.7-.4-.2-.9-.1-1.2.2-.4.4-.6.9-.5 1.5.1.7.5 1.2 1.1 1.5.7.4 1.6.4 2.4.1.9-.4 1.5-1.2 1.7-2.1.2-1.1-.1-2.2-.9-3-1-1-2.5-1.4-3.9-1.2-1.6.3-3 1.2-3.9 2.5-1 1.5-1.3 3.3-.9 5 .5 2 1.8 3.6 3.6 4.6 2.1 1.1 4.6 1.3 6.9.5 2.5-1 4.5-2.9 5.6-5.3.9-2 1.2-4.2.9-6.4-.3-2.5-1.4-4.9-3.1-6.7-2-2.1-4.6-3.5-7.5-3.9-3.2-.5-6.5.2-9.2 1.9-2.9 1.8-5.2 4.5-6.4 7.7-1.3 3.6-1.4 7.5-.3 11.2 1 3.3 3 6.2 5.7 8.3 2.9 2.3 6.5 3.7 10.2 3.9h.6c3.7-.2 7.3-1.6 10.2-3.9 2.7-2.1 4.7-5 5.7-8.3.9-3.7.8-7.6-.5-11.2z"/>
                        </svg>
                        Waze
                      </a>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${estabelecimento.latitude},${estabelecimento.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4285F4] text-white rounded-lg hover:bg-[#357ae8] transition-colors text-xs font-medium"
                        title="Abrir no Google Maps"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        Maps
                      </a>
                    </div>

                    {/* Botões de ação */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/estabelecimentos/${estabelecimento.id}`}
                        className="px-3 py-2 rounded-lg transition-colors text-center"
                        style={{
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        Ver Perfil
                      </Link>
                      <Link
                        href={`/preparar-visita?id=${estabelecimento.id}`}
                        className="px-3 py-2 rounded-lg transition-colors text-center"
                        style={{
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        Preparar Visita
                      </Link>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Botão para recentralizar na localização do usuário */}
      {useGeolocation && (
        <button
          onClick={handleRecenterMap}
          disabled={isLoadingLocation}
          className="absolute top-4 right-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Centralizar na minha localização"
        >
          {isLoadingLocation ? (
            <svg className="w-5 h-5 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      )}

      {/* Mensagem de erro de localização */}
      {locationError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-lg shadow-lg text-sm">
          {locationError}
        </div>
      )}

      {/* Legenda */}
      <div className="bg-white dark:bg-gray-900 p-3 border-t border-border">
        <div className="flex items-center justify-center space-x-4 text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span>★★★★★</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
            <span>★★★★☆</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>★★★☆☆</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
            <span>★★☆☆☆</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span>★☆☆☆☆</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#9ca3af' }}></div>
            <span>☆☆☆☆☆</span>
          </div>
          <div className="text-gray-500 ml-2">
            {estabelecimentosComCoordenadas.length} local(is)
          </div>
        </div>
      </div>
    </div>
  );
}
