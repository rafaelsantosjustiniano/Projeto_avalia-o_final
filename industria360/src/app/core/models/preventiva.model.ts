import { Entidade } from './common.model';

export type Frequencia = 'Semanal' | 'Quinzenal' | 'Mensal' | 'Bimestral' | 'Trimestral' | 'Semestral' | 'Anual';

/** Situação cadastral do plano (definida pelo usuário). */
export type SituacaoPlano = 'Ativo' | 'Suspenso';

/** Status calculado a partir das datas (não é persistido). */
export type StatusPreventiva = 'Em dia' | 'Próxima do vencimento' | 'Atrasada' | 'Suspensa';

export interface ExecucaoPreventiva {
  data: string; // YYYY-MM-DD
  responsavel: string;
  observacao?: string;
}

export interface Preventiva extends Entidade {
  equipamentoId: string;
  tipoManutencao: string;
  dataProgramada: string; // YYYY-MM-DD (data da primeira programação)
  tecnicoId: string | null;
  frequencia: Frequencia;
  ultimaManutencao: string | null; // YYYY-MM-DD
  proximaManutencao: string; // YYYY-MM-DD
  situacao: SituacaoPlano;
  observacoes: string;
  execucoes: ExecucaoPreventiva[];
}
