import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const cidade = searchParams.get('cidade') || 'Santos, SP';

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' },
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
    const searchQuery = `${query} ${cidade}`;
    const encodedQuery = encodeURIComponent(searchQuery);

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodedQuery}&key=${apiKey}&language=pt-BR`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    // Mapeia os resultados
    const results = (data.results || []).map((place: any) => {
      const addressComponents = place.address_components || [];
      const cidade = addressComponents.find((c: any) =>
        c.types.includes('administrative_area_level_2')
      )?.long_name || 'Santos';
      const estado = addressComponents.find((c: any) =>
        c.types.includes('administrative_area_level_1')
      )?.short_name || 'SP';

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
        tipos: place.types,
        foto: fotoUrl,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching places:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
