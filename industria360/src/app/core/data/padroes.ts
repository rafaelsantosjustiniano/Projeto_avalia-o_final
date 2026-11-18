import { Configuracao } from '../models';

/**
 * Configuração padrão de um sistema novo (sem nenhum cadastro).
 * Usada até a configuração ser carregada do banco de dados.
 * Setores, categorias, especialidades e prioridades são cadastrados
 * pelo usuário em Configurações.
 */
export function configuracaoPadrao(): Configuracao {
  return {
    empresa: '',
    unidade: '',
    cnpj: '',
    endereco: '',
    setores: [],
    categoriasEquipamento: [],
    categoriasChamado: [],
    categoriasPeca: [],
    especialidades: [],
    prioridades: [],
    tema: 'dark',
    diasAlertaPreventiva: 7,
    atrasoAutomaticoOS: true,
    exibirAvisoDemo: false,
    horasOperacaoDia: 24,
  };
}
