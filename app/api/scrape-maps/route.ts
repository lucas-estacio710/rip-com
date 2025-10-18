import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Faz fetch da página do Google Maps
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Google Maps page' },
        { status: 500 }
      );
    }

    const html = await response.text();

    // Extrai informações usando regex dos metadados
    const data: any = {};

    // Nome do og:title - formato: "Nome · Endereço"
    // Tenta com property primeiro, depois content primeiro
    let ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/);
    if (!ogTitleMatch) {
      ogTitleMatch = html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/);
    }
    if (ogTitleMatch) {
      const fullTitle = ogTitleMatch[1];
      // Separa nome do endereço (usa · como separador)
      const parts = fullTitle.split(' · ');
      if (parts.length > 0) {
        data.nome = parts[0].trim();
      }
      // O endereço completo está na segunda parte
      if (parts.length > 1) {
        data.endereco = parts[1].trim();
      }
    }

    // Imagem do estabelecimento (og:image)
    let ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
    if (!ogImageMatch) {
      ogImageMatch = html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:image"/);
    }
    if (ogImageMatch) {
      data.fotoUrl = ogImageMatch[1];
    }

    // Descrição (contém rating e tipo)
    let ogDescMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"/);
    if (!ogDescMatch) {
      ogDescMatch = html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:description"/);
    }
    if (ogDescMatch) {
      const desc = ogDescMatch[1];
      // Extrai rating se houver estrelas
      // Formato: "★★★★★ · Veterinário"
      const starsMatch = desc.match(/([★☆]+)/);
      if (starsMatch) {
        const stars = starsMatch[1];
        const fullStars = (stars.match(/★/g) || []).length;
        data.rating = fullStars;
      }

      // Extrai tipo
      const typeMatch = desc.match(/·\s*([^·]+)$/);
      if (typeMatch) {
        data.googleType = typeMatch[1].trim();
      }
    }

    // Coordenadas - extrai da URL primeiro (mais confiável)
    const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      data.latitude = parseFloat(coordMatch[1]);
      data.longitude = parseFloat(coordMatch[2]);
    }

    // Tenta pegar rating e reviews de JSON-LD se houver
    const ratingMatch = html.match(/"ratingValue":"?(\d+\.?\d*)"?/);
    if (ratingMatch && !data.rating) {
      data.rating = parseFloat(ratingMatch[1]);
    }

    const reviewsMatch = html.match(/"reviewCount":"?(\d+)"?/);
    if (reviewsMatch) {
      data.totalReviews = parseInt(reviewsMatch[1]);
    }

    // Telefone - tenta múltiplos padrões
    let phoneMatch = html.match(/"telephone":"([^"]+)"/);
    if (!phoneMatch) {
      phoneMatch = html.match(/aria-label="[^"]*telefone[^"]*"[^>]*>([^<]+)</i);
    }
    if (!phoneMatch) {
      phoneMatch = html.match(/Tel[:\s]+([+\d\s()-]+)/i);
    }
    if (!phoneMatch) {
      // Procura por padrão brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
      phoneMatch = html.match(/\(?\d{2}\)?[\s-]?\d{4,5}[-\s]?\d{4}/);
    }
    if (phoneMatch) {
      data.telefone = phoneMatch[1] ? phoneMatch[1].trim() : phoneMatch[0].trim();
    }

    // Website
    const websiteMatch = html.match(/"url":"(https?:\/\/[^"]+)"/);
    if (websiteMatch && !websiteMatch[1].includes('google.com')) {
      data.website = websiteMatch[1];
    }

    // Horário de funcionamento
    // Tenta extrair de diferentes formatos do Google Maps
    let horarioMatch = html.match(/"openingHours":\s*\[([^\]]+)\]/);
    if (horarioMatch) {
      try {
        const horarios = horarioMatch[1].match(/"([^"]+)"/g);
        if (horarios && horarios.length > 0) {
          // Remove aspas e formata
          const horarioFormatado = horarios
            .map(h => h.replace(/"/g, ''))
            .join(', ');
          data.horarioFuncionamento = horarioFormatado;
        }
      } catch (e) {
        // Ignora erro de parsing
      }
    }

    // Fallback: procura por padrões de texto de horário
    if (!data.horarioFuncionamento) {
      // Padrão: "Aberto ⋅ Fecha às 18:00"
      const horarioTextoMatch = html.match(/Aberto[^<]*Fecha às (\d{1,2}:\d{2})/i);
      if (horarioTextoMatch) {
        data.horarioFuncionamento = `Fecha às ${horarioTextoMatch[1]}`;
      }
    }

    if (!data.horarioFuncionamento) {
      // Padrão: "Segunda a sexta: 08:00–18:00"
      const horarioSemanaMatch = html.match(/([Ss]egunda[^:]*):[\s]*(\d{1,2}:\d{2})[–-](\d{1,2}:\d{2})/);
      if (horarioSemanaMatch) {
        data.horarioFuncionamento = `${horarioSemanaMatch[1]}: ${horarioSemanaMatch[2]}–${horarioSemanaMatch[3]}`;
      }
    }

    // Extrai cidade e estado do endereço
    // Formato esperado: "Av. Senador Pinheiro Machado, 372 - Marapé, Santos - SP, 11075-000"
    if (data.endereco) {
      const parts = data.endereco.split(',').map((p: string) => p.trim());

      // Procura por padrão "Cidade - UF" ou "UF"
      for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];

        // Procura por CEP e remove
        const cepMatch = part.match(/\d{5}-?\d{3}/);

        // Procura por estado (sigla UF ou "Cidade - UF")
        const estadoMatch = part.match(/\b([A-Z]{2})\b/);
        if (estadoMatch && !data.estado) {
          data.estado = estadoMatch[1];

          // Se tem formato "Cidade - UF", extrai cidade
          const cidadeEstadoMatch = part.match(/^(.+?)\s*-\s*([A-Z]{2})/);
          if (cidadeEstadoMatch) {
            data.cidade = cidadeEstadoMatch[1].trim();
          }
        }

        // Se ainda não achou cidade, procura na parte anterior
        if (!data.cidade && i > 0 && data.estado) {
          const prevPart = parts[i - 1];
          // Remove bairro (geralmente após traço) e pega só a cidade
          const cidadeMatch = prevPart.split('-');
          if (cidadeMatch.length > 1) {
            data.cidade = cidadeMatch[cidadeMatch.length - 1].trim();
          } else {
            data.cidade = prevPart.trim();
          }
        }
      }

      // Fallback: se tem "Santos" no endereço
      if (!data.cidade && data.endereco.includes('Santos')) {
        data.cidade = 'Santos';
        data.estado = 'SP';
      }
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error scraping Google Maps:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from Google Maps' },
      { status: 500 }
    );
  }
}
