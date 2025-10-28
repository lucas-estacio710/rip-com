export interface Visita {
  id: string;
  estabelecimento_id: string;
  unidade_id: string;
  usuario_id: string | null;

  // Dados da visita
  data_visita: string;
  tipo_visita: 'presencial' | 'online' | 'telefonema' | 'whatsapp';
  objetivo?: string;

  // Resultado da visita
  status: 'agendada' | 'realizada' | 'cancelada' | 'remarcada';
  contato_realizado?: string;
  cargo_contato?: string;

  // Feedback e próximos passos
  observacoes?: string;
  proximos_passos?: string;
  data_proximo_contato?: string;

  // Avaliação da visita
  temperatura_pos_visita?: 'quente' | 'morno' | 'frio';
  potencial_negocio?: 'alto' | 'medio' | 'baixo';

  // Metadados
  duracao_minutos?: number;
  latitude?: number;
  longitude?: number;

  criado_em: string;
  atualizado_em: string;

  // Relações (quando incluídas no select)
  estabelecimentos?: {
    id: string;
    nome: string;
    endereco: string;
    cidade: string;
    estado: string;
    tipo: string;
  };
}

export interface CreateVisitaInput {
  estabelecimento_id: string;
  unidade_id: string;
  data_visita?: string;
  tipo_visita?: 'presencial' | 'online' | 'telefonema' | 'whatsapp';
  objetivo?: string;
  status?: 'agendada' | 'realizada' | 'cancelada' | 'remarcada';
  contato_realizado?: string;
  cargo_contato?: string;
  observacoes?: string;
  proximos_passos?: string;
  data_proximo_contato?: string;
  temperatura_pos_visita?: 'quente' | 'morno' | 'frio';
  potencial_negocio?: 'alto' | 'medio' | 'baixo';
  duracao_minutos?: number;
  latitude?: number;
  longitude?: number;
}

export interface UpdateVisitaInput {
  data_visita?: string;
  tipo_visita?: 'presencial' | 'online' | 'telefonema' | 'whatsapp';
  objetivo?: string;
  status?: 'agendada' | 'realizada' | 'cancelada' | 'remarcada';
  contato_realizado?: string;
  cargo_contato?: string;
  observacoes?: string;
  proximos_passos?: string;
  data_proximo_contato?: string;
  temperatura_pos_visita?: 'quente' | 'morno' | 'frio';
  potencial_negocio?: 'alto' | 'medio' | 'baixo';
  duracao_minutos?: number;
  latitude?: number;
  longitude?: number;
}
