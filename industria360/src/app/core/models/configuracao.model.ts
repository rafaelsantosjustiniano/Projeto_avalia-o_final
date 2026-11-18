export interface PrioridadeConfig {
  nome: string;
  cor: string; // hexadecimal
  prazoHoras: number; // SLA sugerido para OS
}

export interface Configuracao {
  empresa: string;
  unidade: string;
  cnpj: string;
  endereco: string;
  setores: string[];
  categoriasEquipamento: string[];
  categoriasChamado: string[];
  categoriasPeca: string[];
  especialidades: string[];
  prioridades: PrioridadeConfig[];
  // Configurações gerais
  tema: 'dark' | 'light';
  diasAlertaPreventiva: number;
  atrasoAutomaticoOS: boolean;
  exibirAvisoDemo: boolean;
  horasOperacaoDia: number; // base para indicadores de disponibilidade
}

export interface Usuario {
  nome: string;
  login: string;
  perfil: string;
}
