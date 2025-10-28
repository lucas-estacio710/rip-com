import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/visitas - Listar todas as visitas
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const estabelecimentoId = searchParams.get('estabelecimento_id');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    let query = supabase
      .from('visitas')
      .select(`
        *,
        estabelecimentos:estabelecimento_id (
          id,
          nome,
          endereco,
          cidade,
          estado,
          tipo
        )
      `)
      .order('data_visita', { ascending: false });

    // Filtros opcionais
    if (estabelecimentoId) {
      query = query.eq('estabelecimento_id', estabelecimentoId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar visitas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar visitas', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro inesperado ao buscar visitas' },
      { status: 500 }
    );
  }
}

// POST /api/visitas - Criar nova visita
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Validação básica
    if (!body.estabelecimento_id || !body.unidade_id) {
      return NextResponse.json(
        { error: 'estabelecimento_id e unidade_id são obrigatórios' },
        { status: 400 }
      );
    }

    // Obter o usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Criar a visita
    const visitaData = {
      estabelecimento_id: body.estabelecimento_id,
      unidade_id: body.unidade_id,
      usuario_id: user.id,
      data_visita: body.data_visita || new Date().toISOString(),
      tipo_visita: body.tipo_visita || 'presencial',
      objetivo: body.objetivo,
      status: body.status || 'realizada',
      contato_realizado: body.contato_realizado,
      cargo_contato: body.cargo_contato,
      observacoes: body.observacoes,
      proximos_passos: body.proximos_passos,
      data_proximo_contato: body.data_proximo_contato,
      temperatura_pos_visita: body.temperatura_pos_visita,
      potencial_negocio: body.potencial_negocio,
      duracao_minutos: body.duracao_minutos,
      latitude: body.latitude,
      longitude: body.longitude,
    };

    const { data, error } = await supabase
      .from('visitas')
      .insert(visitaData)
      .select(`
        *,
        estabelecimentos:estabelecimento_id (
          id,
          nome,
          endereco,
          cidade,
          estado,
          tipo
        )
      `)
      .single();

    if (error) {
      console.error('Erro ao criar visita:', error);
      return NextResponse.json(
        { error: 'Erro ao criar visita', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro inesperado ao criar visita' },
      { status: 500 }
    );
  }
}
