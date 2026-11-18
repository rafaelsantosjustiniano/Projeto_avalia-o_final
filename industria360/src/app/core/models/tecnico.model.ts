import { Entidade } from './common.model';

export type SituacaoTecnico = 'Disponível' | 'Em atendimento' | 'Indisponível';

export interface Tecnico extends Entidade {
  nome: string;
  matricula: string;
  especialidade: string;
  setor: string;
  telefone: string;
  email: string;
  situacao: SituacaoTecnico;
}
