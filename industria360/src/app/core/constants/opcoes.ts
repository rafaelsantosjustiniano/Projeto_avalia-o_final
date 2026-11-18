import {
  Frequencia, SituacaoEquipamento, SituacaoTecnico, StatusChamado,
  StatusCorretiva, StatusOS, TipoManutencao
} from '../models';

/** Listas fixas de opções usadas em formulários e filtros. */
export const SITUACOES_EQUIPAMENTO: SituacaoEquipamento[] = ['Disponível', 'Em operação', 'Em manutenção', 'Inativo', 'Crítico'];

export const TIPOS_MANUTENCAO: TipoManutencao[] = ['Corretiva', 'Preventiva', 'Preditiva', 'Inspeção', 'Melhoria'];

export const STATUS_OS: StatusOS[] = ['Aberta', 'Aguardando atendimento', 'Em execução', 'Aguardando peças', 'Concluída', 'Cancelada', 'Atrasada'];

/** Status considerados "em aberto" (ainda exigem ação). */
export const STATUS_OS_ATIVOS: StatusOS[] = ['Aberta', 'Aguardando atendimento', 'Em execução', 'Aguardando peças', 'Atrasada'];

export const STATUS_CHAMADO: StatusChamado[] = ['Aberto', 'Em análise', 'Convertido em OS', 'Resolvido', 'Cancelado'];

export const SITUACOES_TECNICO: SituacaoTecnico[] = ['Disponível', 'Em atendimento', 'Indisponível'];

export const FREQUENCIAS: Frequencia[] = ['Semanal', 'Quinzenal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];

/** Dias correspondentes a cada frequência de preventiva. */
export const FREQUENCIA_DIAS: Record<Frequencia, number> = {
  Semanal: 7, Quinzenal: 15, Mensal: 30, Bimestral: 60, Trimestral: 90, Semestral: 180, Anual: 365
};

export const TIPOS_PREVENTIVA = [
  'Inspeção visual', 'Lubrificação', 'Análise de vibração', 'Termografia', 'Calibração',
  'Troca de óleo', 'Troca de filtros', 'Reaperto e limpeza', 'Teste funcional', 'Revisão geral'
];

export const STATUS_CORRETIVA: StatusCorretiva[] = ['Aberta', 'Em diagnóstico', 'Em reparo', 'Aguardando peças', 'Concluída'];

export const UNIDADES = ['un', 'pç', 'kg', 'L', 'm', 'cx', 'jg', 'par'];
