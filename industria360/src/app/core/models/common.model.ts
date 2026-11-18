/** Tipos e estruturas compartilhadas entre os módulos. */

/** Entidade persistível: todo registro possui um identificador único. */
export interface Entidade {
  id: string;
}

/** Prioridades padrão do sistema (podem ser estendidas em Configurações). */
export type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Crítica' | string;

/** Registro de histórico/auditoria (data, horário e responsável). */
export interface RegistroHistorico {
  data: string; // ISO 8601
  acao: string;
  de?: string;
  para?: string;
  responsavel: string;
  observacao?: string;
}
