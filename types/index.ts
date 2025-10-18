// Tipos de estabelecimento
export type EstabelecimentoTipo =
  | 'clinica'
  | 'hospital'
  | 'petshop'
  | 'casa-racao'
  | 'laboratorio'
  | 'outro';

// Tipos de contato
export type ContatoCargo =
  | 'veterinario'
  | 'recepcionista'
  | 'gerente'
  | 'proprietario'
  | 'outro';

// Nível de relacionamento (estrelas)
// 0 = Novo/Não pontuado, 1-5 = Relacionamento estabelecido
export type NivelRelacionamento = 0 | 1 | 2 | 3 | 4 | 5;

// Tipo de amenidade
export type AmenidadeTipo =
  | 'bolo'
  | 'chocolate'
  | 'bala'
  | 'caneta'
  | 'calendario'
  | 'bloco'
  | 'outro';

// Interface do Estabelecimento
export interface Estabelecimento {
  id: string;
  nome: string;
  tipo: EstabelecimentoTipo;
  endereco: string;
  cidade: string;
  estado: string;
  cep?: string;
  telefone?: string;
  email?: string;
  horarioFuncionamento?: string;
  latitude?: number;
  longitude?: number;
  fotos?: string[];
  observacoes?: string;
  relacionamento: NivelRelacionamento;
  ultimaVisita?: Date;
  proximaVisita?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Interface de Contato
export interface Contato {
  id: string;
  estabelecimentoId: string;
  nome: string;
  cargo: ContatoCargo;
  especialidade?: string; // para veterinários
  telefone?: string;
  email?: string;
  aniversario?: Date;
  preferencias?: string;
  hobbies?: string;
  foto?: string;
  observacoes?: string;
  criadoEm: Date;
}

// Interface de Visita
export interface Visita {
  id: string;
  estabelecimentoId: string;
  data: Date;
  visitadoPor: string; // nome do representante
  amenidadesEntregues: AmenidadeEntregue[];
  contatosPresentes: string[]; // IDs dos contatos
  assuntos: string;
  clima: 'positivo' | 'neutro' | 'tenso';
  proximaVisitaSugerida?: Date;
  promessas?: string;
  fotos?: string[];
  observacoes?: string;
  criadoEm: Date;
}

// Interface de Amenidade Entregue
export interface AmenidadeEntregue {
  tipo: AmenidadeTipo;
  quantidade: number;
  descricao?: string;
}

// Interface de Amenidade em Estoque
export interface AmenidadeEstoque {
  id: string;
  tipo: AmenidadeTipo;
  descricao: string;
  quantidadeDisponivel: number;
  quantidadeMinima: number;
  ultimaReposicao?: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Interface de Indicação
export interface Indicacao {
  id: string;
  estabelecimentoId: string;
  contatoId?: string;
  dataIndicacao: Date;
  nomeCliente: string;
  statusCaso: 'em-andamento' | 'concluido' | 'cancelado';
  agradecimentoEnviado: boolean;
  dataAgradecimento?: Date;
  observacoes?: string;
  criadoEm: Date;
}

// Interface de Dashboard Stats
export interface DashboardStats {
  totalEstabelecimentos: number;
  visitasEsteMes: number;
  proximasVisitas: number;
  indicacoesAtivas: number;
  estabelecimentosSemVisita30Dias: number;
  aniversariantesProximos: number;
}

// Interface de Preparação de Visita
export interface PreparacaoVisita {
  estabelecimento: Estabelecimento;
  contatos: Contato[];
  ultimaVisita?: Visita;
  diasDesdeUltimaVisita?: number;
  amenidadesSugeridas: AmenidadeTipo[];
  aniversariantes: Contato[];
  pendencias: string[];
  indicacoesRecentes: Indicacao[];
}

// ===== TIPOS DE AUTENTICAÇÃO =====

// Tipo de unidade
export interface Unidade {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

// Tipo de cargo de usuário
export type UserCargo = 'admin' | 'gestor' | 'vendedor';

// Perfil de usuário
export interface Perfil {
  id: string;
  nome_completo: string;
  email: string;
  unidade_id: string | null;
  cargo: UserCargo | null;
  avatar_url?: string;
  telefone?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

// Contexto de autenticação
export interface AuthContextType {
  user: any | null; // User do Supabase
  perfil: Perfil | null;
  unidade: Unidade | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updatePerfil: (data: Partial<Perfil>) => Promise<void>;
}
