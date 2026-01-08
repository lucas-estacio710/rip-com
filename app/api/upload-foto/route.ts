import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

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

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Otimiza: redimensiona pra max 800px e converte pra WebP com qualidade 80
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(800, 600, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Gera nome único para o arquivo
    const timestamp = Date.now();
    const fileName = `${estabelecimentoId || 'novo'}_${timestamp}.webp`;

    // Upload para Supabase Storage
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/fotos/${fileName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'image/webp',
        },
        body: optimizedBuffer,
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Erro no upload:', error);
      throw new Error('Falha no upload para Supabase Storage');
    }

    // Retorna URL pública da imagem
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/fotos/${fileName}`;

    console.log(`📸 Foto otimizada: ${imageBuffer.length} bytes → ${optimizedBuffer.length} bytes (${Math.round((1 - optimizedBuffer.length/imageBuffer.length) * 100)}% menor)`);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      originalSize: imageBuffer.length,
      optimizedSize: optimizedBuffer.length
    });

  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    return NextResponse.json(
      { error: 'Falha ao processar imagem' },
      { status: 500 }
    );
  }
}
