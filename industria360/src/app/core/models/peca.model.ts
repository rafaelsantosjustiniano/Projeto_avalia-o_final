import { Entidade } from './common.model';

export type TipoMovimentacao = 'Entrada' | 'Saída';
export type NivelEstoque = 'Normal' | 'Baixo' | 'Zerado';

export interface MovimentacaoEstoque {
  data: string; // ISO
  tipo: TipoMovimentacao;
  quantidade: number;
  saldo: number;
  motivo: string;
  responsavel: string;
  ordemServico?: string;
}

export interface Peca extends Entidade {
  codigo: string;
  nome: string;
  categoria: string;
  quantidade: number;
  estoqueMinimo: number;
  unidade: string;
  localizacao: string;
  fornecedor: string;
  movimentacoes: MovimentacaoEstoque[];
}
