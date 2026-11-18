import { Entidade } from './common.model';

export type SituacaoEquipamento = 'Disponível' | 'Em operação' | 'Em manutenção' | 'Inativo' | 'Crítico';

export interface Equipamento extends Entidade {
  codigo: string;
  nome: string;
  categoria: string;
  fabricante: string;
  modelo: string;
  numeroSerie: string;
  setor: string;
  localizacao: string;
  dataAquisicao: string; // YYYY-MM-DD
  ultimaManutencao: string; // YYYY-MM-DD
  proximaManutencao: string; // YYYY-MM-DD
  situacao: SituacaoEquipamento;
  descricao: string;
  criadoEm: string; // ISO
}
