import { Entidade, Prioridade } from './common.model';

export type StatusCorretiva = 'Aberta' | 'Em diagnóstico' | 'Em reparo' | 'Aguardando peças' | 'Concluída';

export interface AndamentoCorretiva {
  data: string; // ISO
  status: StatusCorretiva;
  nota: string;
  responsavel: string;
}

export interface Corretiva extends Entidade {
  equipamentoId: string;
  descricaoFalha: string;
  dataOcorrencia: string; // ISO
  prioridade: Prioridade;
  tecnicoId: string | null;
  tempoParadaHoras: number;
  causa: string;
  solucao: string;
  status: StatusCorretiva;
  dataConclusao?: string; // ISO
  ordemServicoId?: string;
  andamento: AndamentoCorretiva[];
}
