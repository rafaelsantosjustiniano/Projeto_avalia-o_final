import { Entidade, Prioridade, RegistroHistorico } from './common.model';

export type TipoManutencao = 'Corretiva' | 'Preventiva' | 'Preditiva' | 'Inspeção' | 'Melhoria';

export type StatusOS =
  | 'Aberta'
  | 'Aguardando atendimento'
  | 'Em execução'
  | 'Aguardando peças'
  | 'Concluída'
  | 'Cancelada'
  | 'Atrasada';

export interface OrdemServico extends Entidade {
  numero: string; // gerado automaticamente: OS-AAAA-0000
  equipamentoId: string;
  tipo: TipoManutencao;
  descricao: string;
  tecnicoId: string | null;
  prioridade: Prioridade;
  dataAbertura: string; // ISO
  prazo: string; // YYYY-MM-DD
  status: StatusOS;
  dataConclusao?: string; // ISO
  chamadoId?: string; // quando originada de um chamado
  historico: RegistroHistorico[];
}
