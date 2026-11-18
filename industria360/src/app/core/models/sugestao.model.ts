import { Entidade } from './common.model';

export type TipoSugestao = 'Erro / problema' | 'Sugestão de melhoria' | 'Elogio' | 'Dúvida';

export type StatusSugestao = 'Nova' | 'Em análise' | 'Resolvida' | 'Descartada';

/** Sugestão, relato de erro ou comentário enviado por um usuário do sistema. */
export interface Sugestao extends Entidade {
  tipo: TipoSugestao;
  modulo: string; // página/módulo do sistema a que se refere
  titulo: string;
  descricao: string;
  autorNome: string;
  autorLogin: string;
  dataEnvio: string; // ISO
  status: StatusSugestao;
  resposta?: string; // retorno do administrador
  respondidoPor?: string;
  dataResposta?: string; // ISO
}
