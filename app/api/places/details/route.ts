import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('placeId');

  if (!placeId) {
    return NextResponse.json(
      { error: 'placeId parameter is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    );
  }

  try {
    // Todos os campos disponíveis da Places API
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
      'website',
      'url',                    // Link do Google Maps
      'business_status',        // OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY
      'price_level',            // 0-4 (Free to Very Expensive)
      'reviews',                // Avaliações dos usuários
      'editorial_summary',      // Resumo editorial do Google
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}&language=pt-BR`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places Details API error:', data.status);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    const place = data.result;

    const addressComponents = place.address_components || [];
    const cidade = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_2')
    )?.long_name || 'Santos';
    const estado = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_1')
    )?.short_name || 'SP';
    const cep = addressComponents.find((c: any) =>
      c.types.includes('postal_code')
    )?.long_name;
    // Bairro - pode vir de diferentes tipos
    const bairro = addressComponents.find((c: any) =>
      c.types.includes('sublocality_level_1') ||
      c.types.includes('sublocality') ||
      c.types.includes('neighborhood')
    )?.long_name;
    // Rua e número separados
    const rua = addressComponents.find((c: any) =>
      c.types.includes('route')
    )?.long_name;
    const numero = addressComponents.find((c: any) =>
      c.types.includes('street_number')
    )?.long_name;
    // Endereço simplificado (sem cidade/estado/cep)
    const enderecoSimplificado = rua ? (numero ? `${rua}, ${numero}` : rua) : place.formatted_address?.split(',')[0];

    let fotoUrl;
    if (place.photos && place.photos[0]) {
      const photoReference = place.photos[0].photo_reference;
      fotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`;
    }

    let horarioFuncionamento;
    if (place.opening_hours?.weekday_text) {
      horarioFuncionamento = place.opening_hours.weekday_text.join('\n');
    }

    // Múltiplas fotos
    const fotos: string[] = [];
    if (place.photos) {
      place.photos.slice(0, 10).forEach((photo: any) => {
        fotos.push(`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`);
      });
    }

    const result = {
      placeId: place.place_id,
      nome: place.name,
      endereco: enderecoSimplificado || place.formatted_address || '',
      enderecoCompleto: place.formatted_address || '',
      bairro,
      cidade,
      estado,
      cep,
      telefone: place.formatted_phone_number || place.international_phone_number,
      telefoneInternacional: place.international_phone_number,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating,
      totalReviews: place.user_ratings_total,
      tipos: place.types,
      foto: fotoUrl,
      fotos, // Todas as fotos disponíveis
      horarioFuncionamento,
      website: place.website,
      googleMapsUrl: place.url,
      statusNegocio: place.business_status,
      nivelPreco: place.price_level,
      resumoEditorial: place.editorial_summary?.overview,
      avaliacoes: place.reviews?.slice(0, 3).map((r: any) => ({
        autor: r.author_name,
        nota: r.rating,
        texto: r.text,
        tempo: r.relative_time_description
      })),
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
