import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    // Verifica se existe Street View nessa localização
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(metadataUrl);
    const data = await response.json();

    if (data.status === 'OK') {
      // Retorna a URL do Street View
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&key=${apiKey}`;
      return NextResponse.json({ url: streetViewUrl });
    }

    return NextResponse.json({ url: null });
  } catch (error) {
    console.error('Erro ao verificar Street View:', error);
    return NextResponse.json({ error: 'Failed to check Street View' }, { status: 500 });
  }
}
