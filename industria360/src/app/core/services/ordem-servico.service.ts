import { inject, Injectable } from '@angular/core';
import { OrdemServico, RegistroHistorico, StatusOS } from '../models';
import { BaseCrudService } from './base-crud.service';
import { seedOrdensServico } from '../data/seed-data';
import { proximoSequencial } from '../../shared/utils/codigos';
import { agoraISO, hoje } from '../../shared/utils/datas';
import { STATUS_OS_ATIVOS } from '../constants/opcoes';
import { AuthService } from './auth.service';
import { ConfiguracaoService } from './configuracao.service';
import { ChamadoService } from './chamado.service';
import { TecnicoService } from './tecnico.service';

export type OrdemServicoDados = Pick<OrdemServico, 'equipamentoId' | 'tipo' | 'descricao' | 'tecnicoId' | 'prioridade' | 'prazo'>
  & { status?: StatusOS; chamadoId?: string };

/**
 * Ordens de serviço com histórico de alterações (data, horário e responsável).
 * Futuro: /api/ordens-servico e /api/ordens-servico/{id}/historico
 */
@Injectable({ providedIn: 'root' })
export class OrdemServicoService extends BaseCrudService<OrdemServico> {
  private readonly auth = inject(AuthService);
  private readonly config = inject(ConfiguracaoService);
  private readonly chamados = inject(ChamadoService);
  private readonly tecnicos = inject(TecnicoService);

  constructor() {
    super('ordens-servico', 'os', seedOrdensServico);
    this.verificarAtrasos();
  }

  /** Número automático no formato OS-AAAA-0000. */
  proximoNumero(): string {
    const prefixo = `OS-${new Date().getFullYear()}-`;
    return proximoSequencial(this._itens().map(o => o.numero), prefixo);
  }

  estaAtiva(os: OrdemServico): boolean {
    return STATUS_OS_ATIVOS.includes(os.status);
  }

  /** Prazo expirado e ainda não concluída/cancelada. */
  prazoVencido(os: OrdemServico): boolean {
    return this.estaAtiva(os) && os.prazo < hoje();
  }

  criar(dados: OrdemServicoDados, observacao?: string): OrdemServico {
    const responsavel = this.auth.nomeResponsavel();
    const status = dados.status ?? 'Aberta';
    const historico: RegistroHistorico[] = [
      { data: agoraISO(), acao: 'OS criada', para: status, responsavel, observacao }
    ];
    if (dados.tecnicoId) {
      historico.push({ data: agoraISO(), acao: 'Técnico atribuído', para: this.tecnicos.nome(dados.tecnicoId), responsavel });
    }
    return this.inserir({
      ...dados,
      numero: this.proximoNumero(),
      dataAbertura: agoraISO(),
      status,
      dataConclusao: status === 'Concluída' ? agoraISO() : undefined,
      historico,
    });
  }

  /**
   * Atualiza a OS registrando no histórico toda alteração de status,
   * técnico, prioridade e prazo.
   */
  atualizar(id: string, dados: Partial<OrdemServicoDados>, observacao?: string): OrdemServico | undefined {
    const atual = this.obter(id);
    if (!atual) return undefined;
    const responsavel = this.auth.nomeResponsavel();
    const agora = agoraISO();
    const novos: RegistroHistorico[] = [];

    if (dados.status && dados.status !== atual.status) {
      novos.push({ data: agora, acao: 'Alteração de status', de: atual.status, para: dados.status, responsavel, observacao });
    } else if (observacao) {
      novos.push({ data: agora, acao: 'Observação registrada', responsavel, observacao });
    }
    if (dados.tecnicoId !== undefined && dados.tecnicoId !== atual.tecnicoId) {
      novos.push({
        data: agora, acao: dados.tecnicoId ? 'Técnico atribuído' : 'Técnico removido',
        de: atual.tecnicoId ? this.tecnicos.nome(atual.tecnicoId) : undefined,
        para: dados.tecnicoId ? this.tecnicos.nome(dados.tecnicoId) : undefined, responsavel
      });
    }
    if (dados.prioridade && dados.prioridade !== atual.prioridade) {
      novos.push({ data: agora, acao: 'Prioridade alterada', de: atual.prioridade, para: dados.prioridade, responsavel });
    }
    if (dados.prazo && dados.prazo !== atual.prazo) {
      novos.push({ data: agora, acao: 'Prazo alterado', de: atual.prazo.split('-').reverse().join('/'), para: dados.prazo.split('-').reverse().join('/'), responsavel });
    }

    const alteracoes: Partial<OrdemServico> = { ...dados, historico: [...atual.historico, ...novos] };
    if (dados.status === 'Concluída' && atual.status !== 'Concluída') {
      alteracoes.dataConclusao = agora;
      this.chamados.resolverPorOS(id);
    } else if (dados.status && dados.status !== 'Concluída') {
      alteracoes.dataConclusao = undefined;
    }
    return this.substituir(id, alteracoes);
  }

  alterarStatus(id: string, status: StatusOS, observacao?: string) {
    return this.atualizar(id, { status }, observacao);
  }

  /** Marca automaticamente como "Atrasada" as OS com prazo vencido. */
  verificarAtrasos(): number {
    if (!this.config.config().atrasoAutomaticoOS) return 0;
    const vencidas = this._itens().filter(o => this.prazoVencido(o) && o.status !== 'Atrasada');
    if (!vencidas.length) return 0;
    const agora = agoraISO();
    this._itens.update(lista => lista.map(o => vencidas.includes(o)
      ? {
          ...o, status: 'Atrasada' as StatusOS,
          historico: [...o.historico, {
            data: agora, acao: 'Alteração de status', de: o.status, para: 'Atrasada',
            responsavel: 'Sistema (verificação automática)', observacao: 'Prazo de conclusão expirado.'
          }]
        }
      : o));
    this.persistir();
    return vencidas.length;
  }
}
