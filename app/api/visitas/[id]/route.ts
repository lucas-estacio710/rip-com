import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/visitas/[id] - Buscar visita específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
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
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Erro ao buscar visita:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar visita', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Visita não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro inesperado ao buscar visita' },
      { status: 500 }
    );
  }
}

// PUT /api/visitas/[id] - Atualizar visita
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Verificar se a visita existe e se o usuário tem permissão
    const { data: existingVisita, error: fetchError } = await supabase
      .from('visitas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingVisita) {
      return NextResponse.json(
        { error: 'Visita não encontrada' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização (não incluir campos que não devem ser alterados)
    const updateData: any = {};

    // Campos que podem ser atualizados
    const allowedFields = [
      'data_visita',
      'tipo_visita',
      'objetivo',
      'status',
      'contato_realizado',
      'cargo_contato',
      'observacoes',
      'proximos_passos',
      'data_proximo_contato',
      'temperatura_pos_visita',
      'potencial_negocio',
      'duracao_minutos',
      'latitude',
      'longitude',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    const { data, error } = await supabase
      .from('visitas')
      .update(updateData)
      .eq('id', params.id)
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
      console.error('Erro ao atualizar visita:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar visita', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro inesperado ao atualizar visita' },
      { status: 500 }
    );
  }
}

// PATCH /api/visitas/[id] - Atualização parcial
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  return PUT(request, { params });
}

// DELETE /api/visitas/[id] - Deletar visita
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verificar se a visita existe
    const { data: existingVisita, error: fetchError } = await supabase
      .from('visitas')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !existingVisita) {
      return NextResponse.json(
        { error: 'Visita não encontrada' },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('visitas')
      .delete()
      .eq('id', params.id);

    if (error) {
      console.error('Erro ao deletar visita:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar visita', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Visita deletada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro inesperado ao deletar visita' },
      { status: 500 }
    );
  }
}
