import { inject, Injectable } from '@angular/core';
import { Preventiva, StatusPreventiva } from '../models';
import { BaseCrudService } from './base-crud.service';
import { seedPreventivas } from '../data/seed-data';
import { diferencaDias, hoje, somarDias } from '../../shared/utils/datas';
import { FREQUENCIA_DIAS } from '../constants/opcoes';
import { ConfiguracaoService } from './configuracao.service';
import { EquipamentoService } from './equipamento.service';
import { AuthService } from './auth.service';

export type PreventivaDados = Omit<Preventiva, 'id' | 'proximaManutencao' | 'execucoes'>;

/** Programação de manutenções preventivas. Futuro: /api/preventivas */
@Injectable({ providedIn: 'root' })
export class PreventivaService extends BaseCrudService<Preventiva> {
  private readonly config = inject(ConfiguracaoService);
  private readonly equipamentos = inject(EquipamentoService);
  private readonly auth = inject(AuthService);

  constructor() {
    super('preventivas', 'pv', seedPreventivas);
  }

  /** Próxima data: última execução + frequência, ou a data programada inicial. */
  calcularProxima(dataProgramada: string, ultima: string | null, frequencia: Preventiva['frequencia']): string {
    return ultima ? somarDias(ultima, FREQUENCIA_DIAS[frequencia]) : dataProgramada;
  }

  /** Status calculado: em dia, próxima do vencimento (amarelo) ou atrasada (vermelho). */
  status(p: Preventiva): StatusPreventiva {
    if (p.situacao === 'Suspenso') return 'Suspensa';
    const dias = this.diasParaVencer(p);
    if (dias < 0) return 'Atrasada';
    if (dias <= this.config.config().diasAlertaPreventiva) return 'Próxima do vencimento';
    return 'Em dia';
  }

  diasParaVencer(p: Preventiva): number {
    return diferencaDias(hoje(), p.proximaManutencao);
  }

  criar(dados: PreventivaDados): Preventiva {
    const item = this.inserir({
      ...dados,
      proximaManutencao: this.calcularProxima(dados.dataProgramada, dados.ultimaManutencao, dados.frequencia),
      execucoes: [],
    });
    this.sincronizarEquipamento(item.equipamentoId);
    return item;
  }

  atualizar(id: string, dados: PreventivaDados) {
    const anterior = this.obter(id);
    const item = this.substituir(id, {
      ...dados,
      proximaManutencao: this.calcularProxima(dados.dataProgramada, dados.ultimaManutencao, dados.frequencia),
    });
    if (anterior && anterior.equipamentoId !== dados.equipamentoId) this.sincronizarEquipamento(anterior.equipamentoId);
    if (item) this.sincronizarEquipamento(item.equipamentoId);
    return item;
  }

  override excluir(id: string): void {
    const p = this.obter(id);
    super.excluir(id);
    if (p) this.sincronizarEquipamento(p.equipamentoId);
  }

  /** Registra a execução: atualiza última/próxima manutenção do plano e do equipamento. */
  registrarExecucao(id: string, data: string, observacao?: string) {
    const p = this.obter(id);
    if (!p) return;
    this.substituir(id, {
      ultimaManutencao: data,
      proximaManutencao: somarDias(data, FREQUENCIA_DIAS[p.frequencia]),
      execucoes: [{ data, responsavel: this.auth.nomeResponsavel(), observacao }, ...p.execucoes],
    });
    this.sincronizarEquipamento(p.equipamentoId);
  }

  /** Mantém as datas de manutenção do equipamento coerentes com os planos ativos. */
  private sincronizarEquipamento(equipamentoId: string) {
    const eq = this.equipamentos.obter(equipamentoId);
    if (!eq) return;
    const planos = this._itens().filter(p => p.equipamentoId === equipamentoId && p.situacao === 'Ativo');
    if (!planos.length) return;
    const proxima = planos.map(p => p.proximaManutencao).sort()[0];
    const ultimas = planos.map(p => p.ultimaManutencao).filter((x): x is string => !!x).sort();
    const ultima = ultimas.length ? ultimas[ultimas.length - 1] : eq.ultimaManutencao;
    this.equipamentos.atualizar(equipamentoId, {
      proximaManutencao: proxima,
      ultimaManutencao: ultima > eq.ultimaManutencao ? ultima : eq.ultimaManutencao,
    });
  }
}
