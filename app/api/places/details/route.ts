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

    let fotoUrl;
    if (place.photos && place.photos[0]) {
      const photoReference = place.photos[0].photo_reference;
      fotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${apiKey}`;
    }

    let horarioFuncionamento;
    if (place.opening_hours?.weekday_text) {
      horarioFuncionamento = place.opening_hours.weekday_text.join('\n');
    }

    const result = {
      placeId: place.place_id,
      nome: place.name,
      endereco: place.formatted_address || '',
      cidade,
      estado,
      cep,
      telefone: place.formatted_phone_number || place.international_phone_number,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating,
      totalReviews: place.user_ratings_total,
      tipos: place.types,
      foto: fotoUrl,
      horarioFuncionamento,
      website: place.website,
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
