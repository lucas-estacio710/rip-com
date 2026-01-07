/**
 * Utilitário para buscar estabelecimentos usando Google Places API
 */

export interface PlaceSearchResult {
  placeId: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  totalReviews?: number;
  tipo?: string;
  foto?: string;
  horarioFuncionamento?: string[];
}

/**
 * Busca estabelecimentos veterinários pelo nome usando Google Places Text Search
 */
export async function searchPlacesByName(
  query: string,
  cidade: string = 'Santos, SP'
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada');
  }

  try {
    // Monta a query com a cidade
    const searchQuery = `${query} ${cidade}`;
    const encodedQuery = encodeURIComponent(searchQuery);

    // Text Search API
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}&language=pt-BR`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('Google Places API status:', data.status);
      return [];
    }

    // Mapeia os resultados
    const results: PlaceSearchResult[] = data.results.map((place: any) => {
      // Extrai cidade e estado do endereço
      const addressComponents = place.address_components || [];
      const cidade = addressComponents.find((c: any) =>
        c.types.includes('administrative_area_level_2')
      )?.long_name || 'Santos';
      const estado = addressComponents.find((c: any) =>
        c.types.includes('administrative_area_level_1')
      )?.short_name || 'SP';

      // URL da foto se disponível
      let fotoUrl;
      if (place.photos && place.photos[0]) {
        const photoReference = place.photos[0].photo_reference;
        fotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
      }

      return {
        placeId: place.place_id,
        nome: place.name,
        endereco: place.formatted_address || '',
        cidade,
        estado,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating,
        totalReviews: place.user_ratings_total,
        tipo: place.types?.[0],
        foto: fotoUrl,
      };
    });

    return results;
  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error);
    throw error;
  }
}

/**
 * Obtém detalhes completos de um estabelecimento pelo Place ID
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceSearchResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada');
  }

  try {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'address_components',
      'geometry',
      'formatted_phone_number',
      'international_phone_number',
      'rating',
      'user_ratings_total',
      'types',
      'photos',
      'opening_hours',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=pt-BR`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.warn('Google Places Details API status:', data.status);
      return null;
    }

    const place = data.result;

    // Extrai informações do endereço
    const addressComponents = place.address_components || [];
    const cidade = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_2')
    )?.long_name || 'Santos';
    const estado = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_1')
    )?.short_name || 'SP';

    // URL da foto
    let fotoUrl;
    if (place.photos && place.photos[0]) {
      const photoReference = place.photos[0].photo_reference;
      fotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${apiKey}`;
    }

    // Horário de funcionamento
    let horarioFuncionamento;
    if (place.opening_hours?.weekday_text) {
      horarioFuncionamento = place.opening_hours.weekday_text;
    }

    return {
      placeId: place.place_id,
      nome: place.name,
      endereco: place.formatted_address || '',
      cidade,
      estado,
      telefone: place.formatted_phone_number || place.international_phone_number,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating,
      totalReviews: place.user_ratings_total,
      tipo: place.types?.[0],
      foto: fotoUrl,
      horarioFuncionamento,
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do estabelecimento:', error);
    throw error;
  }
}

/**
 * Infere o tipo de estabelecimento baseado nos tipos do Google Places
 */
export function inferEstabelecimentoTipo(googleTypes: string[], nome: string): string {
  const typesStr = googleTypes.join(' ').toLowerCase();
  const nomeStr = nome.toLowerCase();

  if (typesStr.includes('hospital') || nomeStr.includes('hospital') || nomeStr.includes('24h')) {
    return 'hospital';
  }
  if (typesStr.includes('veterinary') || nomeStr.includes('veterinár') || nomeStr.includes('clínica')) {
    return 'clinica';
  }
  if (typesStr.includes('pet_store') || nomeStr.includes('pet shop') || nomeStr.includes('petshop')) {
    return 'petshop';
  }
  if (nomeStr.includes('ração') || nomeStr.includes('racao')) {
    return 'casa-racao';
  }
  if (nomeStr.includes('laboratório') || nomeStr.includes('laboratorio')) {
    return 'laboratorio';
  }

  return 'clinica'; // Padrão
}

/**
 * Gera URL do Google Street View para um estabelecimento
 */
export function getStreetViewUrl(latitude: number, longitude: number, size: string = '400x300'): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return '';
  }

  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${latitude},${longitude}&key=${apiKey}`;
}
