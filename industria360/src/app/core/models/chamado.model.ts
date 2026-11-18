import { Entidade, Prioridade } from './common.model';

export type StatusChamado = 'Aberto' | 'Em análise' | 'Convertido em OS' | 'Resolvido' | 'Cancelado';

export interface Chamado extends Entidade {
  protocolo: string; // gerado automaticamente: CH-AAAAMMDD-0000
  solicitante: string;
  equipamentoId: string;
  setor: string;
  localizacao: string;
  categoria: string;
  descricao: string;
  prioridade: Prioridade;
  dataHora: string; // ISO (automático)
  status: StatusChamado;
  ordemServicoId?: string;
}
