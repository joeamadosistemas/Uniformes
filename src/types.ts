export interface RegistroUniforme {
  id: string;
  escola: string;
  diretor: string;
  qtd_alunos: number;
  categoria: string;
  tipo_uniforme: string;
  qtd_sobrando: number;
  tamanho_sobrando: string;
  qtd_faltando: number;
  tamanho_faltando: string;
  data_registro: string;
}

export interface Filtros {
  categoria: string;
  tipo_uniforme: string;
  data: string;
}

export interface Usuario {
  escola: string;
  diretor: string;
}

export interface EscolaCadastro {
  id: string;
  nome: string;
  email: string;
  segmentos: string[];
  ativo?: boolean;
}

export interface ItemTransferencia {
  id: string;
  produto: string;
  quantidade: number;
  motivo?: string;
}

export interface Transferencia {
  id: string;
  tipo: 'recebida' | 'enviada';
  status: 'concluida' | 'pendente';
  /** Nome da escola que enviou o material */
  unidade_origem: string;
  /** E-mail da conta que criou a transferência (fallback para resolução de nome) */
  origem_email?: string;
  /** Nome da escola/destino que recebeu o material */
  unidade_origem_destino: string;
  data: string;
  itens: ItemTransferencia[];
  segmentos: string[];
}


export interface UsuarioCadastro {
  id: string;
  nome: string;
  email: string;
  perfil: 'Admin' | 'Escola';
  escola_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Uniforme {
  id: string;
  segmento: string;
  unidade: string;
  modelo: string;
  descricao: string;
  tamanho: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  dataCadastro: string;
}
export interface Recebimento {
  id: string;
  escola: string;
  data_recebimento: string;
  modelo_id: string;
  modelo_nome: string;
  descricao: string;
  tamanho: string;
  quantidade: number;
}
