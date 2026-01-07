import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { fotoUrl, estabelecimentoId } = await request.json();

    if (!fotoUrl) {
      return NextResponse.json({ error: 'fotoUrl is required' }, { status: 400 });
    }

    // Baixa a imagem do Google
    const imageResponse = await fetch(fotoUrl);
    if (!imageResponse.ok) {
      throw new Error('Falha ao baixar imagem');
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();

    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${estabelecimentoId || 'novo'}_${timestamp}.jpg`;

    // Upload para Supabase Storage
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/fotos/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'image/jpeg',
        },
        body: imageBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Erro no upload:', error);
      throw new Error('Falha no upload para Supabase Storage');
    }

    // Retorna URL pública da imagem
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/fotos/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl
    });

  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return NextResponse.json(
      { error: 'Falha ao processar imagem' },
      { status: 500 }
    );
  }
}
