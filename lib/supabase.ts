import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not configured. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types do banco (gerados automaticamente pelo Supabase)
export type Estabelecimento = {
  id: string;
  unidade_id: string; // FK para unidades - obrigatório para RLS
  nome: string;
  tipo: 'clinica' | 'hospital' | 'petshop' | 'casa-racao' | 'laboratorio' | 'outro';
  endereco: string;
  cidade: string;
  estado: string;
  cep: string | null;
  telefone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  whatsapp: string | null;
  horario_funcionamento: string | null;
  latitude: number | null;
  longitude: number | null;
  relacionamento: number; // 0-5 estrelas
  observacoes: string | null;
  fotos: string[] | null;
  ultima_visita: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type Contato = {
  id: string;
  estabelecimento_id: string;
  nome: string;
  cargo: 'veterinario' | 'recepcionista' | 'gerente' | 'proprietario' | 'outro';
  especialidade: string | null;
  telefone: string | null;
  email: string | null;
  aniversario: string | null;
  preferencias: string | null;
  hobbies: string | null;
  foto_url: string | null;
  observacoes: string | null;
  created_at: string;
};

export type Visita = {
  id: string;
  estabelecimento_id: string;
  data: string;
  visitado_por: string;
  assuntos: string | null;
  clima: 'positivo' | 'neutro' | 'tenso' | null;
  proxima_visita_sugerida: string | null;
  promessas: string | null;
  observacoes: string | null;
  fotos: string[] | null;
  created_at: string;
};

export type Indicacao = {
  id: string;
  estabelecimento_id: string | null;
  contato_id: string | null;
  data_indicacao: string;
  nome_cliente: string;
  status_caso: 'em-andamento' | 'concluido' | 'cancelado';
  agradecimento_enviado: boolean;
  data_agradecimento: string | null;
  observacoes: string | null;
  created_at: string;
};
