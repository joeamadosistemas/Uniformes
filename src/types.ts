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
  unidade_origem_destino: string;
  data: string;
  itens: ItemTransferencia[];
  segmentos: string[];
}

export interface UsuarioCadastro {
  id: string;
  nome: string;
  email_escola: string;
}
