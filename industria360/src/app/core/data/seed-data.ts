/**
 * DADOS DE DEMONSTRAÇÃO – INDUSTRIA360
 * ------------------------------------------------------------------
 * Todos os registros abaixo são FICTÍCIOS e servem apenas para
 * demonstrar o funcionamento do sistema. Nomes de fabricantes, pessoas,
 * telefones e e-mails (domínio .demo) foram inventados.
 *
 * As datas são calculadas em relação ao dia do primeiro acesso
 * (deslocamentos fixos em dias), e então gravadas no localStorage —
 * ou seja, não mudam a cada recarregamento.
 */
import {
  Chamado, Configuracao, Corretiva, Equipamento, OrdemServico, Peca,
  Preventiva, RegistroHistorico, StatusOS, Tecnico
} from '../models';
import { paraDataISO } from '../../shared/utils/datas';

/** Data 'YYYY-MM-DD' deslocada N dias a partir de hoje. */
function d(offset: number): string {
  const x = new Date();
  x.setDate(x.getDate() + offset);
  return paraDataISO(x);
}

/** Data/hora ISO deslocada N dias a partir de hoje, no horário informado. */
function dt(offset: number, hora = 8, minuto = 0): string {
  const x = new Date();
  x.setDate(x.getDate() + offset);
  x.setHours(hora, minuto, 0, 0);
  return x.toISOString();
}

const ano = new Date().getFullYear();

// ------------------------------------------------------------------
// Configuração inicial
// ------------------------------------------------------------------
export function seedConfiguracao(): Configuracao {
  return {
    empresa: 'Empresa Demonstração S.A.',
    unidade: 'Unidade Industrial Demo – Refinaria Modelo',
    cnpj: '00.000.000/0001-00',
    endereco: 'Distrito Industrial, s/n – Cidade Exemplo/BR',
    setores: [
      'Destilação', 'Craqueamento', 'Utilidades', 'Geração de Energia',
      'Compressão de Gás', 'Tratamento de Água', 'Logística', 'Segurança Industrial'
    ],
    categoriasEquipamento: [
      'Bombas industriais', 'Motores elétricos', 'Compressores', 'Geradores', 'Turbinas',
      'Válvulas', 'Esteiras transportadoras', 'Sistemas hidráulicos', 'Equipamentos de segurança'
    ],
    categoriasChamado: [
      'Falha mecânica', 'Falha elétrica', 'Problema hidráulico', 'Vazamento',
      'Falha operacional', 'Segurança', 'Outros'
    ],
    categoriasPeca: [
      'Rolamentos', 'Vedações', 'Filtros', 'Lubrificantes', 'Elétricos',
      'Instrumentação', 'Correias', 'Válvulas e conexões', 'EPIs'
    ],
    especialidades: [
      'Mecânica', 'Elétrica', 'Instrumentação', 'Hidráulica',
      'Caldeiraria e Soldagem', 'Segurança do Trabalho', 'Automação'
    ],
    prioridades: [
      { nome: 'Baixa', cor: '#16A34A', prazoHoras: 168 },
      { nome: 'Média', cor: '#EAB308', prazoHoras: 72 },
      { nome: 'Alta', cor: '#F59E0B', prazoHoras: 24 },
      { nome: 'Crítica', cor: '#DC2626', prazoHoras: 8 },
    ],
    tema: 'dark',
    diasAlertaPreventiva: 7,
    atrasoAutomaticoOS: true,
    exibirAvisoDemo: true,
    horasOperacaoDia: 24,
  };
}

// ------------------------------------------------------------------
// Equipamentos
// ------------------------------------------------------------------
export function seedEquipamentos(): Equipamento[] {
  const base = (
    id: string, codigo: string, nome: string, categoria: string, fabricante: string, modelo: string,
    numeroSerie: string, setor: string, localizacao: string, dataAquisicao: string,
    ultima: number, proxima: number, situacao: Equipamento['situacao'], descricao: string
  ): Equipamento => ({
    id, codigo, nome, categoria, fabricante, modelo, numeroSerie, setor, localizacao, dataAquisicao,
    ultimaManutencao: d(ultima), proximaManutencao: d(proxima), situacao, descricao, criadoEm: dt(-200)
  });

  return [
    base('eq-001', 'EQ-0001', 'Bomba Centrífuga de Carga P-101A', 'Bombas industriais', 'HidroForte', 'HF-CN 150',
      'HF150-22871', 'Destilação', 'Unidade U-100 · Área 2', '2019-03-12', -24, 6, 'Em operação',
      'Bomba de alimentação da torre de destilação atmosférica. Vazão nominal 320 m³/h.'),
    base('eq-002', 'EQ-0002', 'Bomba de Água de Resfriamento P-205', 'Bombas industriais', 'HidroForte', 'HF-AR 200',
      'HF200-10544', 'Utilidades', 'Torre de resfriamento TR-02', '2017-08-05', -3, 27, 'Em manutenção',
      'Circulação de água de resfriamento para os trocadores da unidade.'),
    base('eq-003', 'EQ-0003', 'Motor Elétrico 250 cv M-301', 'Motores elétricos', 'Voltaris', 'VX-250 IP55',
      'VX250-77812', 'Craqueamento', 'Unidade U-300 · Casa de máquinas', '2020-01-20', -40, 50, 'Em operação',
      'Motor de indução trifásico 6,6 kV que aciona o soprador de ar da regeneradora.'),
    base('eq-004', 'EQ-0004', 'Motor Elétrico 75 cv M-112', 'Motores elétricos', 'Voltaris', 'VX-75 IP55',
      'VX075-30219', 'Destilação', 'Unidade U-100 · Área 4', '2021-06-02', -15, 75, 'Disponível',
      'Motor reserva para bombas de refluxo.'),
    base('eq-005', 'EQ-0005', 'Compressor de Ar de Instrumentos C-401', 'Compressores', 'Compretec', 'CT-PA 90',
      'CT90-55120', 'Utilidades', 'Casa de compressores · Sala 1', '2018-11-14', -28, 2, 'Em operação',
      'Compressor de parafuso para geração de ar de instrumentos (seco e isento de óleo).'),
    base('eq-006', 'EQ-0006', 'Compressor de Gás Natural K-501', 'Compressores', 'Compretec', 'CT-REC 2000',
      'CTR2000-0098', 'Compressão de Gás', 'Módulo de compressão M-05', '2016-04-30', -60, -5, 'Crítico',
      'Compressor alternativo de gás natural, 2 estágios. Vibração elevada registrada.'),
    base('eq-007', 'EQ-0007', 'Gerador Diesel de Emergência G-601', 'Geradores', 'Geratrix', 'GX-1250',
      'GX1250-4471', 'Geração de Energia', 'Subestação SE-01', '2015-09-18', -35, 25, 'Disponível',
      'Gerador de emergência 1.250 kVA para cargas essenciais.'),
    base('eq-008', 'EQ-0008', 'Turbogerador a Vapor TG-701', 'Turbinas', 'TurboSul', 'TS-15MW',
      'TS15-0012', 'Geração de Energia', 'Casa de força · Nível 0', '2014-02-10', -90, 0, 'Em operação',
      'Turbina a vapor de contrapressão acoplada a gerador de 15 MW.'),
    base('eq-009', 'EQ-0009', 'Válvula de Controle de Pressão PCV-115', 'Válvulas', 'Valvicon', 'VC-G300',
      'VCG300-8821', 'Destilação', 'Unidade U-100 · Rack de tubulação 3', '2022-03-08', -70, 20, 'Em operação',
      'Válvula globo com atuador pneumático para controle de pressão do topo da torre.'),
    base('eq-010', 'EQ-0010', 'Válvula de Segurança PSV-220', 'Válvulas', 'Valvicon', 'VS-4P6',
      'VS4P6-1290', 'Craqueamento', 'Unidade U-300 · Vaso V-220', '2019-07-22', -1, 179, 'Em manutenção',
      'Válvula de alívio de pressão do vaso separador. Em recalibração programada.'),
    base('eq-011', 'EQ-0011', 'Esteira Transportadora de Coque TC-801', 'Esteiras transportadoras', 'Esteiramax', 'EM-1200',
      'EM1200-3307', 'Logística', 'Pátio de coque', '2013-05-16', -120, 30, 'Inativo',
      'Correia transportadora de 1.200 mm. Fora de operação aguardando reforma estrutural.'),
    base('eq-012', 'EQ-0012', 'Unidade Hidráulica de Potência UH-901', 'Sistemas hidráulicos', 'Hydrauflex', 'HX-UHP 45',
      'HX45-6610', 'Logística', 'Píer de carregamento', '2020-10-01', -20, 10, 'Em operação',
      'Unidade hidráulica dos braços de carregamento marítimo.'),
    base('eq-013', 'EQ-0013', 'Sistema de Detecção de Gás SDG-01', 'Equipamentos de segurança', 'SafeGuard Ind.', 'SG-DET 32',
      'SG32-1180', 'Segurança Industrial', 'Sala de controle central', '2021-01-25', -10, 20, 'Em operação',
      'Central com 32 detectores de gás combustível e H₂S distribuídos nas unidades.'),
    base('eq-014', 'EQ-0014', 'Bomba de Combate a Incêndio BCI-02', 'Bombas industriais', 'HidroForte', 'HF-FIRE 500',
      'HFF500-2093', 'Segurança Industrial', 'Casa de bombas de incêndio', '2016-12-12', -6, 1, 'Disponível',
      'Bomba principal do sistema de água de combate a incêndio, acionada a diesel.'),
  ];
}

// ------------------------------------------------------------------
// Técnicos
// ------------------------------------------------------------------
export function seedTecnicos(): Tecnico[] {
  return [
    { id: 'tec-001', nome: 'Carlos Eduardo Mendes', matricula: 'TEC-1001', especialidade: 'Mecânica', setor: 'Destilação', telefone: '(21) 98811-2034', email: 'carlos.mendes@industria360.demo', situacao: 'Disponível' },
    { id: 'tec-002', nome: 'Ana Paula Ribeiro', matricula: 'TEC-1002', especialidade: 'Elétrica', setor: 'Geração de Energia', telefone: '(21) 99702-4410', email: 'ana.ribeiro@industria360.demo', situacao: 'Em atendimento' },
    { id: 'tec-003', nome: 'Marcos Vinícius Souza', matricula: 'TEC-1003', especialidade: 'Instrumentação', setor: 'Destilação', telefone: '(21) 98340-7781', email: 'marcos.souza@industria360.demo', situacao: 'Em atendimento' },
    { id: 'tec-004', nome: 'Juliana Ferreira Costa', matricula: 'TEC-1004', especialidade: 'Hidráulica', setor: 'Logística', telefone: '(21) 99155-0923', email: 'juliana.costa@industria360.demo', situacao: 'Disponível' },
    { id: 'tec-005', nome: 'Roberto Almeida Santos', matricula: 'TEC-1005', especialidade: 'Mecânica', setor: 'Compressão de Gás', telefone: '(21) 98477-3156', email: 'roberto.santos@industria360.demo', situacao: 'Em atendimento' },
    { id: 'tec-006', nome: 'Fernanda Lima Rocha', matricula: 'TEC-1006', especialidade: 'Segurança do Trabalho', setor: 'Segurança Industrial', telefone: '(21) 99620-8847', email: 'fernanda.rocha@industria360.demo', situacao: 'Disponível' },
    { id: 'tec-007', nome: 'Diego Martins Oliveira', matricula: 'TEC-1007', especialidade: 'Elétrica', setor: 'Utilidades', telefone: '(21) 98233-6612', email: 'diego.oliveira@industria360.demo', situacao: 'Indisponível' },
    { id: 'tec-008', nome: 'Patrícia Gomes Silva', matricula: 'TEC-1008', especialidade: 'Caldeiraria e Soldagem', setor: 'Craqueamento', telefone: '(21) 99088-1475', email: 'patricia.silva@industria360.demo', situacao: 'Disponível' },
  ];
}

// ------------------------------------------------------------------
// Ordens de serviço
// ------------------------------------------------------------------
const FLUXO: StatusOS[] = ['Aberta', 'Aguardando atendimento', 'Em execução'];

/** Monta o histórico simulado coerente com o status final da OS. */
function historicoOS(aberturaOffset: number, final: StatusOS, responsavel: string, conclusaoOffset?: number): RegistroHistorico[] {
  const h: RegistroHistorico[] = [
    { data: dt(aberturaOffset, 8, 15), acao: 'OS criada', para: 'Aberta', responsavel: 'Supervisor de Manutenção' }
  ];
  if (final === 'Aberta') return h;
  if (final === 'Cancelada') {
    h.push({ data: dt(aberturaOffset + 1, 10, 0), acao: 'Alteração de status', de: 'Aberta', para: 'Cancelada', responsavel: 'Supervisor de Manutenção', observacao: 'Serviço incorporado a outra ordem.' });
    return h;
  }
  h.push({ data: dt(aberturaOffset, 9, 40), acao: 'Alteração de status', de: 'Aberta', para: 'Aguardando atendimento', responsavel: 'Supervisor de Manutenção' });
  if (final === 'Aguardando atendimento') return h;
  if (final === 'Atrasada') {
    h.push({ data: dt(aberturaOffset + 4, 7, 0), acao: 'Alteração de status', de: 'Aguardando atendimento', para: 'Atrasada', responsavel: 'Sistema (verificação automática)', observacao: 'Prazo de conclusão expirado.' });
    return h;
  }
  h.push({ data: dt(aberturaOffset + 1, 7, 30), acao: 'Alteração de status', de: 'Aguardando atendimento', para: 'Em execução', responsavel });
  if (final === 'Em execução') return h;
  if (final === 'Aguardando peças') {
    h.push({ data: dt(aberturaOffset + 1, 15, 10), acao: 'Alteração de status', de: 'Em execução', para: 'Aguardando peças', responsavel, observacao: 'Solicitada reposição ao almoxarifado.' });
    return h;
  }
  // Concluída
  h.push({ data: dt(conclusaoOffset ?? aberturaOffset + 2, 16, 45), acao: 'Alteração de status', de: 'Em execução', para: 'Concluída', responsavel, observacao: 'Serviço executado e equipamento liberado para operação.' });
  return h;
}

export function seedOrdensServico(): OrdemServico[] {
  type Linha = [string, string, OrdemServico['tipo'], string, string | null, string, number, number, StatusOS, number?, string?];
  const tecNome: Record<string, string> = {
    'tec-001': 'Carlos Eduardo Mendes', 'tec-002': 'Ana Paula Ribeiro', 'tec-003': 'Marcos Vinícius Souza',
    'tec-004': 'Juliana Ferreira Costa', 'tec-005': 'Roberto Almeida Santos', 'tec-006': 'Fernanda Lima Rocha',
    'tec-007': 'Diego Martins Oliveira', 'tec-008': 'Patrícia Gomes Silva'
  };
  // [id, equipamento, tipo, descrição, técnico, prioridade, aberturaOffset, prazoOffset, status, conclusaoOffset, chamadoId]
  const linhas: Linha[] = [
    ['os-001', 'eq-001', 'Preventiva', 'Lubrificação dos mancais e inspeção do selo mecânico.', 'tec-001', 'Média', -158, -150, 'Concluída', -152],
    ['os-002', 'eq-003', 'Inspeção', 'Termografia do painel de acionamento e medição de isolamento.', 'tec-002', 'Baixa', -140, -130, 'Concluída', -137],
    ['os-003', 'eq-006', 'Corretiva', 'Substituição das válvulas de sucção do 1º estágio.', 'tec-005', 'Alta', -128, -124, 'Concluída', -125],
    ['os-004', 'eq-008', 'Preventiva', 'Inspeção boroscópica e troca de filtros de óleo de lubrificação.', 'tec-001', 'Média', -118, -110, 'Concluída', -112],
    ['os-005', 'eq-012', 'Corretiva', 'Vazamento na mangueira de alta pressão do braço 2.', 'tec-004', 'Alta', -101, -99, 'Concluída', -100],
    ['os-006', 'eq-005', 'Preventiva', 'Troca do elemento separador ar/óleo e filtros.', 'tec-007', 'Média', -92, -85, 'Concluída', -89],
    ['os-007', 'eq-009', 'Preditiva', 'Diagnóstico do posicionador e assinatura da válvula.', 'tec-003', 'Baixa', -80, -70, 'Concluída', -76],
    ['os-008', 'eq-002', 'Corretiva', 'Ruído anormal no rolamento lado acoplado.', 'tec-001', 'Alta', -66, -63, 'Concluída', -64],
    ['os-009', 'eq-011', 'Melhoria', 'Projeto de reforço estrutural dos cavaletes da esteira.', 'tec-008', 'Baixa', -55, -20, 'Cancelada'],
    ['os-010', 'eq-007', 'Preventiva', 'Teste de partida com carga e verificação do banco de baterias.', 'tec-002', 'Média', -45, -40, 'Concluída', -42],
    ['os-011', 'eq-013', 'Inspeção', 'Calibração dos detectores de H₂S da área U-300.', 'tec-003', 'Alta', -37, -33, 'Concluída', -34],
    ['os-012', 'eq-006', 'Corretiva', 'Vibração elevada no mancal do virabrequim – análise e correção.', 'tec-005', 'Crítica', -12, -8, 'Atrasada', undefined, 'ch-002'],
    ['os-013', 'eq-002', 'Corretiva', 'Troca do selo mecânico com vazamento.', 'tec-001', 'Alta', -4, 2, 'Aguardando peças', undefined, 'ch-004'],
    ['os-014', 'eq-010', 'Preventiva', 'Recalibração da PSV-220 em bancada.', 'tec-008', 'Alta', -2, 3, 'Em execução'],
    ['os-015', 'eq-008', 'Preventiva', 'Inspeção trimestral do sistema de óleo de selagem.', 'tec-002', 'Média', -1, 5, 'Em execução'],
    ['os-016', 'eq-005', 'Preventiva', 'Análise de óleo e limpeza do radiador.', null, 'Média', -1, 6, 'Aguardando atendimento'],
    ['os-017', 'eq-014', 'Inspeção', 'Teste semanal de partida da bomba de incêndio.', 'tec-006', 'Alta', 0, 1, 'Aberta'],
    ['os-018', 'eq-003', 'Preditiva', 'Coleta de vibração e análise espectral do conjunto motor-soprador.', 'tec-003', 'Baixa', 0, 10, 'Aberta'],
  ];

  return linhas.map(([id, equipamentoId, tipo, descricao, tecnicoId, prioridade, ab, pr, status, concl, chamadoId], i) => ({
    id,
    numero: `OS-${ano}-${String(i + 1).padStart(4, '0')}`,
    equipamentoId, tipo, descricao, tecnicoId, prioridade,
    dataAbertura: dt(ab, 8, 15),
    prazo: d(pr),
    status,
    dataConclusao: status === 'Concluída' ? dt(concl ?? ab + 2, 16, 45) : undefined,
    chamadoId,
    historico: historicoOS(ab, status, tecnicoId ? tecNome[tecnicoId] : 'Supervisor de Manutenção', concl),
  }));
}

// ------------------------------------------------------------------
// Chamados
// ------------------------------------------------------------------
export function seedChamados(): Chamado[] {
  const p = (offset: number, seq: number) => {
    const x = new Date(); x.setDate(x.getDate() + offset);
    return `CH-${paraDataISO(x).replace(/-/g, '')}-${String(seq).padStart(4, '0')}`;
  };
  return [
    { id: 'ch-001', protocolo: p(-30, 1), solicitante: 'Operador João Batista', equipamentoId: 'eq-013', setor: 'Segurança Industrial', localizacao: 'Sala de controle central', categoria: 'Segurança', descricao: 'Detector 14 indicando falha de comunicação intermitente.', prioridade: 'Alta', dataHora: dt(-30, 14, 22), status: 'Resolvido' },
    { id: 'ch-002', protocolo: p(-12, 1), solicitante: 'Operador Lucas Andrade', equipamentoId: 'eq-006', setor: 'Compressão de Gás', localizacao: 'Módulo de compressão M-05', categoria: 'Falha mecânica', descricao: 'Alarme de vibração alta no K-501 com ruído metálico no cárter.', prioridade: 'Crítica', dataHora: dt(-12, 7, 48), status: 'Convertido em OS', ordemServicoId: 'os-012' },
    { id: 'ch-003', protocolo: p(-8, 1), solicitante: 'Téc. Operação Renata Dias', equipamentoId: 'eq-009', setor: 'Destilação', localizacao: 'Unidade U-100 · Rack de tubulação 3', categoria: 'Falha operacional', descricao: 'Oscilação de pressão no topo da torre; PCV respondendo com atraso.', prioridade: 'Média', dataHora: dt(-8, 10, 5), status: 'Em análise' },
    { id: 'ch-004', protocolo: p(-4, 1), solicitante: 'Operador Marcelo Pires', equipamentoId: 'eq-002', setor: 'Utilidades', localizacao: 'Torre de resfriamento TR-02', categoria: 'Vazamento', descricao: 'Vazamento contínuo pelo selo mecânico da P-205.', prioridade: 'Alta', dataHora: dt(-4, 6, 30), status: 'Convertido em OS', ordemServicoId: 'os-013' },
    { id: 'ch-005', protocolo: p(-3, 1), solicitante: 'Supervisor Hélio Prado', equipamentoId: 'eq-012', setor: 'Logística', localizacao: 'Píer de carregamento', categoria: 'Problema hidráulico', descricao: 'Queda de pressão no circuito do braço de carregamento 1.', prioridade: 'Alta', dataHora: dt(-3, 15, 40), status: 'Aberto' },
    { id: 'ch-006', protocolo: p(-2, 1), solicitante: 'Operador Tiago Nunes', equipamentoId: 'eq-006', setor: 'Compressão de Gás', localizacao: 'Módulo de compressão M-05', categoria: 'Vazamento', descricao: 'Odor de gás próximo ao skid do K-501. Área isolada preventivamente.', prioridade: 'Crítica', dataHora: dt(-2, 22, 10), status: 'Aberto' },
    { id: 'ch-007', protocolo: p(-1, 1), solicitante: 'Eletricista Sandro Melo', equipamentoId: 'eq-003', setor: 'Craqueamento', localizacao: 'Unidade U-300 · Casa de máquinas', categoria: 'Falha elétrica', descricao: 'Aquecimento acima do normal na caixa de ligação do M-301.', prioridade: 'Média', dataHora: dt(-1, 9, 15), status: 'Aberto' },
    { id: 'ch-008', protocolo: p(-1, 2), solicitante: 'Técnica de Segurança Lívia Castro', equipamentoId: 'eq-014', setor: 'Segurança Industrial', localizacao: 'Casa de bombas de incêndio', categoria: 'Segurança', descricao: 'Manômetro de descarga da BCI-02 com leitura inconsistente.', prioridade: 'Crítica', dataHora: dt(-1, 13, 55), status: 'Em análise' },
    { id: 'ch-009', protocolo: p(-20, 1), solicitante: 'Operador João Batista', equipamentoId: 'eq-011', setor: 'Logística', localizacao: 'Pátio de coque', categoria: 'Outros', descricao: 'Solicitação de inspeção estrutural antes da reativação da esteira.', prioridade: 'Baixa', dataHora: dt(-20, 11, 0), status: 'Cancelado' },
    { id: 'ch-010', protocolo: p(0, 1), solicitante: 'Operador Rafael Teixeira', equipamentoId: 'eq-005', setor: 'Utilidades', localizacao: 'Casa de compressores · Sala 1', categoria: 'Falha mecânica', descricao: 'Ponto de orvalho do ar de instrumentos acima do limite.', prioridade: 'Média', dataHora: dt(0, 7, 20), status: 'Aberto' },
  ];
}

// ------------------------------------------------------------------
// Manutenção preventiva (planos)
// ------------------------------------------------------------------
export function seedPreventivas(): Preventiva[] {
  const plano = (
    id: string, equipamentoId: string, tipoManutencao: string, tecnicoId: string | null,
    frequencia: Preventiva['frequencia'], programada: number, ultima: number | null, proxima: number,
    situacao: Preventiva['situacao'] = 'Ativo', observacoes = ''
  ): Preventiva => ({
    id, equipamentoId, tipoManutencao, tecnicoId, frequencia,
    dataProgramada: d(programada),
    ultimaManutencao: ultima === null ? null : d(ultima),
    proximaManutencao: d(proxima),
    situacao, observacoes,
    execucoes: ultima === null ? [] : [{ data: d(ultima), responsavel: 'Equipe de manutenção', observacao: 'Execução registrada (dado de demonstração).' }],
  });
  return [
    plano('pv-001', 'eq-001', 'Lubrificação', 'tec-001', 'Mensal', -180, -24, 6, 'Ativo', 'Graxa EP2. Verificar temperatura dos mancais.'),
    plano('pv-002', 'eq-005', 'Troca de filtros', 'tec-007', 'Mensal', -150, -28, 2, 'Ativo', 'Filtro de ar, filtro de óleo e separador.'),
    plano('pv-003', 'eq-006', 'Análise de vibração', 'tec-005', 'Quinzenal', -120, -20, -5, 'Ativo', 'Pontos de medição 1H, 1V, 2H, 2V e axial.'),
    plano('pv-004', 'eq-007', 'Teste funcional', 'tec-002', 'Mensal', -200, -35, -5, 'Ativo', 'Partida com carga resistiva por 30 minutos.'),
    plano('pv-005', 'eq-008', 'Revisão geral', 'tec-001', 'Trimestral', -270, -90, 0, 'Ativo', 'Inclui inspeção boroscópica e alinhamento.'),
    plano('pv-006', 'eq-009', 'Calibração', 'tec-003', 'Trimestral', -160, -70, 20),
    plano('pv-007', 'eq-013', 'Calibração', 'tec-003', 'Mensal', -100, -10, 20, 'Ativo', 'Gás padrão: CH₄ 50% LIE e H₂S 25 ppm.'),
    plano('pv-008', 'eq-014', 'Teste funcional', 'tec-006', 'Semanal', -90, -6, 1, 'Ativo', 'Teste de partida automática e pressão de descarga.'),
    plano('pv-009', 'eq-003', 'Termografia', 'tec-002', 'Bimestral', -130, -40, 20),
    plano('pv-010', 'eq-012', 'Troca de óleo', 'tec-004', 'Semestral', -170, -20, 160),
    plano('pv-011', 'eq-011', 'Inspeção visual', 'tec-008', 'Mensal', -300, -120, -90, 'Suspenso', 'Plano suspenso enquanto a esteira estiver inativa.'),
  ];
}

// ------------------------------------------------------------------
// Manutenção corretiva
// ------------------------------------------------------------------
export function seedCorretivas(): Corretiva[] {
  return [
    {
      id: 'co-001', equipamentoId: 'eq-006', descricaoFalha: 'Vibração elevada no mancal principal com ruído metálico.',
      dataOcorrencia: dt(-12, 7, 40), prioridade: 'Crítica', tecnicoId: 'tec-005', tempoParadaHoras: 96,
      causa: 'Desgaste da bronzina do mancal por contaminação do óleo.', solucao: '', status: 'Aguardando peças', ordemServicoId: 'os-012',
      andamento: [
        { data: dt(-12, 8, 0), status: 'Aberta', nota: 'Equipamento parado por alarme de vibração.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(-11, 9, 0), status: 'Em diagnóstico', nota: 'Coletada amostra de óleo e espectro de vibração.', responsavel: 'Roberto Almeida Santos' },
        { data: dt(-9, 14, 0), status: 'Em reparo', nota: 'Desmontagem do cárter iniciada.', responsavel: 'Roberto Almeida Santos' },
        { data: dt(-6, 16, 30), status: 'Aguardando peças', nota: 'Aguardando bronzinas sobressalentes do fornecedor.', responsavel: 'Roberto Almeida Santos' },
      ]
    },
    {
      id: 'co-002', equipamentoId: 'eq-002', descricaoFalha: 'Vazamento pelo selo mecânico.',
      dataOcorrencia: dt(-4, 6, 20), prioridade: 'Alta', tecnicoId: 'tec-001', tempoParadaHoras: 30,
      causa: 'Face do selo com trinca térmica.', solucao: '', status: 'Em reparo', ordemServicoId: 'os-013',
      andamento: [
        { data: dt(-4, 6, 40), status: 'Aberta', nota: 'Bomba reserva P-205B colocada em operação.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(-3, 8, 0), status: 'Em diagnóstico', nota: 'Selo removido para inspeção.', responsavel: 'Carlos Eduardo Mendes' },
        { data: dt(-2, 10, 0), status: 'Em reparo', nota: 'Montagem do selo novo em andamento.', responsavel: 'Carlos Eduardo Mendes' },
      ]
    },
    {
      id: 'co-003', equipamentoId: 'eq-012', descricaoFalha: 'Rompimento de mangueira de alta pressão.',
      dataOcorrencia: dt(-101, 11, 15), prioridade: 'Alta', tecnicoId: 'tec-004', tempoParadaHoras: 6,
      causa: 'Mangueira com vida útil excedida e atrito com estrutura.', solucao: 'Substituição da mangueira e instalação de protetor espiral.', status: 'Concluída', dataConclusao: dt(-101, 17, 15),
      andamento: [
        { data: dt(-101, 11, 30), status: 'Aberta', nota: 'Operação de carregamento interrompida.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(-101, 13, 0), status: 'Em reparo', nota: 'Mangueira sobressalente retirada do almoxarifado.', responsavel: 'Juliana Ferreira Costa' },
        { data: dt(-101, 17, 15), status: 'Concluída', nota: 'Teste de estanqueidade aprovado.', responsavel: 'Juliana Ferreira Costa' },
      ]
    },
    {
      id: 'co-004', equipamentoId: 'eq-006', descricaoFalha: 'Perda de eficiência no 1º estágio de compressão.',
      dataOcorrencia: dt(-128, 9, 0), prioridade: 'Alta', tecnicoId: 'tec-005', tempoParadaHoras: 52,
      causa: 'Válvulas de sucção com placas quebradas.', solucao: 'Substituição do jogo de válvulas de sucção.', status: 'Concluída', dataConclusao: dt(-126, 13, 0),
      andamento: [
        { data: dt(-128, 9, 10), status: 'Aberta', nota: 'Queda de vazão identificada pela operação.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(-127, 8, 0), status: 'Em reparo', nota: 'Válvulas removidas.', responsavel: 'Roberto Almeida Santos' },
        { data: dt(-126, 13, 0), status: 'Concluída', nota: 'Compressor liberado após teste.', responsavel: 'Roberto Almeida Santos' },
      ]
    },
    {
      id: 'co-005', equipamentoId: 'eq-002', descricaoFalha: 'Ruído anormal no rolamento lado acoplado.',
      dataOcorrencia: dt(-66, 14, 0), prioridade: 'Alta', tecnicoId: 'tec-001', tempoParadaHoras: 20,
      causa: 'Falha de lubrificação do rolamento.', solucao: 'Troca do rolamento 6316 e ajuste do plano de lubrificação.', status: 'Concluída', dataConclusao: dt(-65, 10, 0),
      andamento: [
        { data: dt(-66, 14, 10), status: 'Aberta', nota: 'Bomba parada para inspeção.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(-65, 10, 0), status: 'Concluída', nota: 'Rolamento substituído.', responsavel: 'Carlos Eduardo Mendes' },
      ]
    },
    {
      id: 'co-006', equipamentoId: 'eq-013', descricaoFalha: 'Falha de comunicação no detector 14.',
      dataOcorrencia: dt(-30, 14, 22), prioridade: 'Alta', tecnicoId: 'tec-003', tempoParadaHoras: 3,
      causa: 'Conector oxidado no barramento de campo.', solucao: 'Substituição do conector e aplicação de proteção anticorrosiva.', status: 'Concluída', dataConclusao: dt(-30, 17, 30),
      andamento: [
        { data: dt(-30, 14, 30), status: 'Aberta', nota: 'Detector em bypass com ronda compensatória.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(-30, 17, 30), status: 'Concluída', nota: 'Detector normalizado.', responsavel: 'Marcos Vinícius Souza' },
      ]
    },
    {
      id: 'co-007', equipamentoId: 'eq-003', descricaoFalha: 'Aquecimento na caixa de ligação do motor.',
      dataOcorrencia: dt(-1, 9, 30), prioridade: 'Média', tecnicoId: 'tec-002', tempoParadaHoras: 0,
      causa: '', solucao: '', status: 'Em diagnóstico',
      andamento: [
        { data: dt(-1, 9, 40), status: 'Aberta', nota: 'Registrado a partir de inspeção de rotina.', responsavel: 'Supervisor de Manutenção' },
        { data: dt(0, 8, 0), status: 'Em diagnóstico', nota: 'Termografia agendada com motor em carga.', responsavel: 'Ana Paula Ribeiro' },
      ]
    },
    {
      id: 'co-008', equipamentoId: 'eq-001', descricaoFalha: 'Gotejamento no flange de descarga.',
      dataOcorrencia: dt(0, 6, 50), prioridade: 'Baixa', tecnicoId: null, tempoParadaHoras: 0,
      causa: '', solucao: '', status: 'Aberta',
      andamento: [
        { data: dt(0, 7, 0), status: 'Aberta', nota: 'Bandeja de contenção instalada.', responsavel: 'Supervisor de Manutenção' },
      ]
    },
  ];
}

// ------------------------------------------------------------------
// Estoque de peças
// ------------------------------------------------------------------
export function seedPecas(): Peca[] {
  const peca = (id: string, codigo: string, nome: string, categoria: string, quantidade: number, estoqueMinimo: number,
    unidade: string, localizacao: string, fornecedor: string): Peca => ({
    id, codigo, nome, categoria, quantidade, estoqueMinimo, unidade, localizacao, fornecedor,
    movimentacoes: [
      { data: dt(-60, 9, 0), tipo: 'Entrada', quantidade: quantidade + 2, saldo: quantidade + 2, motivo: 'Saldo inicial (demonstração)', responsavel: 'Almoxarifado' },
      ...(quantidade + 2 > 0 ? [{ data: dt(-15, 14, 0), tipo: 'Saída' as const, quantidade: 2, saldo: quantidade, motivo: 'Consumo em manutenção', responsavel: 'Almoxarifado' }] : []),
    ],
  });
  return [
    peca('pc-001', 'PC-0001', 'Rolamento rígido de esferas 6316', 'Rolamentos', 8, 4, 'un', 'Almox. A · Prateleira 03', 'Rolamax Distribuidora'),
    peca('pc-002', 'PC-0002', 'Rolamento de rolos cilíndricos NU 2218', 'Rolamentos', 3, 4, 'un', 'Almox. A · Prateleira 03', 'Rolamax Distribuidora'),
    peca('pc-003', 'PC-0003', 'Selo mecânico cartucho 75 mm', 'Vedações', 0, 2, 'un', 'Almox. A · Prateleira 07', 'Vedatec Industrial'),
    peca('pc-004', 'PC-0004', 'Junta espiralada 6" classe 300', 'Vedações', 24, 10, 'un', 'Almox. B · Gaveta 12', 'Vedatec Industrial'),
    peca('pc-005', 'PC-0005', 'Elemento separador ar/óleo', 'Filtros', 2, 2, 'un', 'Almox. A · Prateleira 11', 'FiltraPro'),
    peca('pc-006', 'PC-0006', 'Filtro de óleo lubrificante turbina', 'Filtros', 6, 3, 'un', 'Almox. A · Prateleira 11', 'FiltraPro'),
    peca('pc-007', 'PC-0007', 'Óleo turbina ISO VG 46', 'Lubrificantes', 420, 200, 'L', 'Casa de lubrificantes', 'LubriSul'),
    peca('pc-008', 'PC-0008', 'Graxa EP2 à base de lítio', 'Lubrificantes', 12, 15, 'kg', 'Casa de lubrificantes', 'LubriSul'),
    peca('pc-009', 'PC-0009', 'Contator tripolar 95 A', 'Elétricos', 5, 2, 'un', 'Almox. C · Armário 02', 'EletroParts'),
    peca('pc-010', 'PC-0010', 'Relé de sobrecarga 63-80 A', 'Elétricos', 1, 2, 'un', 'Almox. C · Armário 02', 'EletroParts'),
    peca('pc-011', 'PC-0011', 'Transmissor de pressão 0-40 bar', 'Instrumentação', 4, 2, 'un', 'Oficina de instrumentação', 'InstruMed'),
    peca('pc-012', 'PC-0012', 'Sensor catalítico para detector de gás', 'Instrumentação', 0, 3, 'un', 'Oficina de instrumentação', 'SafeGuard Ind.'),
    peca('pc-013', 'PC-0013', 'Correia em V perfil B-86', 'Correias', 14, 6, 'un', 'Almox. B · Gancho 04', 'TransMec'),
    peca('pc-014', 'PC-0014', 'Bronzina de mancal K-501', 'Rolamentos', 0, 2, 'jg', 'Almox. A · Prateleira 01', 'Compretec'),
    peca('pc-015', 'PC-0015', 'Mangueira hidráulica 1" 4 tramas', 'Válvulas e conexões', 18, 10, 'm', 'Almox. B · Bobina 02', 'Hydrauflex'),
    peca('pc-016', 'PC-0016', 'Luva de proteção nitrílica', 'EPIs', 60, 40, 'par', 'Almox. EPI', 'ProtegeMax'),
  ];
}
