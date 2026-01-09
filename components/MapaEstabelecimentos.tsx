'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Estabelecimento } from '@/lib/supabase';

interface MapaEstabelecimentosProps {
  estabelecimentos: Estabelecimento[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Cores por nível de relacionamento
const getMarkerColor = (relacionamento: number) => {
  const colors: Record<number, string> = {
    0: '#9CA3AF', // gray
    1: '#3B82F6', // blue
    2: '#EAB308', // yellow
    3: '#F97316', // orange
    4: '#22C55E', // green
    5: '#A855F7', // purple
  };
  return colors[relacionamento] || colors[0];
};

// Criar ícone customizado
const createCustomIcon = (relacionamento: number, isSelected: boolean) => {
  const color = getMarkerColor(relacionamento);
  const size = isSelected ? 40 : 30;
  const borderWidth = isSelected ? 4 : 2;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: ${borderWidth}px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isSelected ? '16px' : '12px'};
        transition: all 0.2s ease;
      ">
        ${relacionamento === 0 ? '?' : relacionamento}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

export default function MapaEstabelecimentos({
  estabelecimentos,
  selectedId,
  onSelect,
}: MapaEstabelecimentosProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Centro na Baixada Santista
    const map = L.map(containerRef.current, {
      center: [-23.9618, -46.3322], // Santos
      zoom: 12,
      zoomControl: true,
    });

    // Tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Atualizar markers quando estabelecimentos mudam
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const newMarkers = new Map<string, L.Marker>();

    // Remover markers antigos
    markersRef.current.forEach((marker) => marker.remove());

    // Adicionar novos markers
    const bounds: L.LatLngExpression[] = [];

    estabelecimentos.forEach((est) => {
      if (!est.latitude || !est.longitude) return;

      const isSelected = est.id === selectedId;
      const position: L.LatLngExpression = [est.latitude, est.longitude];
      bounds.push(position);

      const marker = L.marker(position, {
        icon: createCustomIcon(est.relacionamento, isSelected),
      });

      // Popup com informações
      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${est.nome}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${est.cidade}</p>
          <div style="display: flex; gap: 4px; margin-top: 8px;">
            <span style="font-size: 14px;">${'★'.repeat(est.relacionamento)}${'☆'.repeat(5 - est.relacionamento)}</span>
          </div>
          <a href="/estabelecimentos/${est.id}"
             style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #6366f1; color: white; border-radius: 6px; text-decoration: none; font-size: 12px;">
            Ver Detalhes
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onSelect(est.id);
      });

      marker.addTo(map);
      newMarkers.set(est.id, marker);
    });

    markersRef.current = newMarkers;

    // Ajustar bounds se houver markers
    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, {
        padding: [50, 50],
        maxZoom: 14,
      });
    }
  }, [estabelecimentos, onSelect]);

  // Atualizar ícone do marker selecionado
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const est = estabelecimentos.find((e) => e.id === id);
      if (est) {
        const isSelected = id === selectedId;
        marker.setIcon(createCustomIcon(est.relacionamento, isSelected));

        if (isSelected && est.latitude && est.longitude) {
          mapRef.current?.setView([est.latitude, est.longitude], 15, {
            animate: true,
          });
          marker.openPopup();
        }
      }
    });
  }, [selectedId, estabelecimentos]);

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}
