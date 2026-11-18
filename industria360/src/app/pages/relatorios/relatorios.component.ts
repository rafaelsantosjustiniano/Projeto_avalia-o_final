import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartData, ChartOptions } from 'chart.js';
import { BadgeComponent, ChartComponent, EmptyStateComponent, IconComponent, KpiCardComponent, PageHeaderComponent } from '../../shared/components';
import {
  AuthService, ChamadoService, ConfiguracaoService, CorretivaService, EquipamentoService, NotificacaoService,
  OrdemServicoService, PreventivaService
} from '../../core/services';
import { STATUS_OS } from '../../core/constants/opcoes';
import { CORES_TONE, corDe } from '../../shared/utils/status-tone';
import { diferencaDias, diferencaHoras, hoje, mesesEntre, rotuloMes, somarDias } from '../../shared/utils/datas';
import { exportarCSV, exportarJSON } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, PageHeaderComponent, KpiCardComponent, ChartComponent, BadgeComponent, IconComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './relatorios.component.html',
  styleUrl: './relatorios.component.css',
})
export class RelatoriosComponent {
  private readonly eqSvc = inject(EquipamentoService);
  private readonly osSvc = inject(OrdemServicoService);
  private readonly chSvc = inject(ChamadoService);
  private readonly corrSvc = inject(CorretivaService);
  private readonly prevSvc = inject(PreventivaService);
  private readonly notif = inject(NotificacaoService);
  readonly auth = inject(AuthService);
  readonly config = inject(ConfiguracaoService);

  readonly geradoEm = new Date();

  // Filtros
  readonly inicio = signal(somarDias(hoje(), -180));
  readonly fim = signal(hoje());
  readonly setor = signal('');
  readonly equipamento = signal('');

  readonly equipamentosDoSetor = computed(() =>
    this.eqSvc.itens().filter(e => !this.setor() || e.setor === this.setor()).sort((a, b) => a.codigo.localeCompare(b.codigo)));

  readonly periodoValido = computed(() => this.inicio() && this.fim() && this.inicio() <= this.fim());

  aplicarPeriodo(dias: number) {
    this.fim.set(hoje());
    this.inicio.set(somarDias(hoje(), -dias));
  }

  alterarSetor(s: string) {
    this.setor.set(s);
    if (this.equipamento() && this.eqSvc.obter(this.equipamento())?.setor !== s && s) this.equipamento.set('');
  }

  limpar() { this.aplicarPeriodo(180); this.setor.set(''); this.equipamento.set(''); }

  // ------------------------------------------------------------------
  // Conjuntos filtrados
  // ------------------------------------------------------------------
  private noPeriodo(dataISO: string) {
    const d = dataISO.slice(0, 10);
    return d >= this.inicio() && d <= this.fim();
  }

  private equipOk = (equipamentoId: string) => {
    if (this.equipamento()) return equipamentoId === this.equipamento();
    if (this.setor()) return this.eqSvc.obter(equipamentoId)?.setor === this.setor();
    return true;
  };

  readonly equipamentosBase = computed(() => this.eqSvc.itens().filter(e => this.equipOk(e.id)));
  readonly os = computed(() => this.osSvc.itens().filter(o => this.noPeriodo(o.dataAbertura) && this.equipOk(o.equipamentoId)));
  readonly corretivas = computed(() => this.corrSvc.itens().filter(c => this.noPeriodo(c.dataOcorrencia) && this.equipOk(c.equipamentoId)));
  readonly chamados = computed(() => this.chSvc.itens().filter(c => this.noPeriodo(c.dataHora) && this.equipOk(c.equipamentoId)));
  readonly execucoesPrev = computed(() => this.prevSvc.itens()
    .filter(p => this.equipOk(p.equipamentoId))
    .reduce((n, p) => n + p.execucoes.filter(x => this.noPeriodo(x.data)).length, 0));

  // ------------------------------------------------------------------
  // Indicadores
  // ------------------------------------------------------------------
  readonly horasPeriodo = computed(() => Math.max(1, diferencaDias(this.inicio(), this.fim()) + 1) * this.config.config().horasOperacaoDia);

  readonly indicadores = computed(() => {
    const os = this.os();
    const concl = os.filter(o => o.status === 'Concluída' && o.dataConclusao);
    const tempoMedioOS = concl.length ? concl.reduce((s, o) => s + diferencaHoras(o.dataAbertura, o.dataConclusao!), 0) / concl.length : 0;
    const corrConcl = this.corretivas().filter(c => c.status === 'Concluída' && c.dataConclusao);
    const mttr = corrConcl.length ? corrConcl.reduce((s, c) => s + diferencaHoras(c.dataOcorrencia, c.dataConclusao!), 0) / corrConcl.length : 0;
    const falhas = this.corretivas().length;
    const parada = this.corretivas().reduce((s, c) => s + (c.tempoParadaHoras || 0), 0);
    const nEq = Math.max(1, this.equipamentosBase().length);
    const horasTotais = this.horasPeriodo() * nEq;
    const disponibilidade = Math.max(0, ((horasTotais - parada) / horasTotais) * 100);
    const mtbf = falhas ? (horasTotais - parada) / falhas : 0;
    return {
      totalManutencoes: os.length + this.execucoesPrev(),
      totalOS: os.length,
      osConcluidas: concl.length,
      falhas,
      chamados: this.chamados().length,
      tempoMedioOS,
      mttr,
      mtbf,
      parada,
      disponibilidade,
      conformidadePrazo: concl.length ? (concl.filter(o => o.dataConclusao!.slice(0, 10) <= o.prazo).length / concl.length) * 100 : 0,
    };
  });

  /** Equipamentos com mais ocorrências (OS + chamados + corretivas). */
  readonly ranking = computed(() => {
    const mapa = new Map<string, { os: number; chamados: number; corretivas: number; parada: number }>();
    const reg = (id: string) => mapa.get(id) ?? mapa.set(id, { os: 0, chamados: 0, corretivas: 0, parada: 0 }).get(id)!;
    this.os().forEach(o => reg(o.equipamentoId).os++);
    this.chamados().forEach(c => reg(c.equipamentoId).chamados++);
    this.corretivas().forEach(c => { const r = reg(c.equipamentoId); r.corretivas++; r.parada += c.tempoParadaHoras || 0; });
    const lista = [...mapa.entries()].map(([id, r]) => ({
      id, rotulo: this.eqSvc.rotulo(id), setor: this.eqSvc.obter(id)?.setor ?? '—', ...r, total: r.os + r.chamados + r.corretivas,
    })).sort((a, b) => b.total - a.total || b.parada - a.parada);
    const max = lista[0]?.total ?? 1;
    return lista.slice(0, 8).map(l => ({ ...l, pct: (l.total / max) * 100 }));
  });

  /** Disponibilidade por equipamento = (horas do período − horas de parada) / horas do período. */
  readonly disponibilidadeEquip = computed(() => {
    const h = this.horasPeriodo();
    return this.equipamentosBase().map(e => {
      const parada = this.corretivas().filter(c => c.equipamentoId === e.id).reduce((s, c) => s + (c.tempoParadaHoras || 0), 0);
      const falhas = this.corretivas().filter(c => c.equipamentoId === e.id).length;
      return { id: e.id, codigo: e.codigo, nome: e.nome, situacao: e.situacao, parada, falhas, disp: Math.max(0, ((h - parada) / h) * 100) };
    }).sort((a, b) => a.disp - b.disp || b.parada - a.parada);
  });

  tomDisp(d: number) { return d >= 98 ? '' : d >= 95 ? 'warning' : 'danger'; }

  // ------------------------------------------------------------------
  // Gráficos
  // ------------------------------------------------------------------
  readonly chartPeriodo = computed<ChartData>(() => {
    const meses = this.periodoValido() ? mesesEntre(this.inicio(), this.fim()) : [];
    const os = this.os();
    return {
      labels: meses.map(rotuloMes),
      datasets: [
        { label: 'Abertas', data: meses.map(m => os.filter(o => o.dataAbertura.slice(0, 7) === m).length), borderColor: CORES_TONE.info, backgroundColor: 'rgba(59,130,246,.15)', fill: true, tension: .35, pointRadius: 4 },
        { label: 'Concluídas', data: meses.map(m => os.filter(o => o.dataConclusao?.slice(0, 7) === m).length), borderColor: CORES_TONE.success, backgroundColor: 'rgba(22,163,74,.12)', fill: true, tension: .35, pointRadius: 4 },
        { label: 'Falhas (corretivas)', data: meses.map(m => this.corretivas().filter(c => c.dataOcorrencia.slice(0, 7) === m).length), borderColor: CORES_TONE.danger, backgroundColor: 'transparent', borderDash: [5, 4], tension: .35, pointRadius: 3 },
      ],
    } as ChartData;
  });

  readonly chartSetor = computed<ChartData>(() => {
    const setores = this.config.config().setores.filter(s => !this.setor() || s === this.setor());
    const doSetor = (id: string) => this.eqSvc.obter(id)?.setor;
    return {
      labels: setores,
      datasets: [
        { label: 'Preventivas', data: setores.map(s => this.os().filter(o => doSetor(o.equipamentoId) === s && o.tipo === 'Preventiva').length), backgroundColor: CORES_TONE.success, borderRadius: 4, stack: 's' },
        { label: 'Corretivas', data: setores.map(s => this.os().filter(o => doSetor(o.equipamentoId) === s && o.tipo === 'Corretiva').length), backgroundColor: CORES_TONE.danger, borderRadius: 4, stack: 's' },
        { label: 'Outras', data: setores.map(s => this.os().filter(o => doSetor(o.equipamentoId) === s && !['Preventiva', 'Corretiva'].includes(o.tipo)).length), backgroundColor: CORES_TONE.info, borderRadius: 4, stack: 's' },
      ],
    };
  });
  readonly optEmpilhado: ChartOptions = { scales: { x: { stacked: true }, y: { stacked: true } } } as ChartOptions;

  readonly chartStatus = computed<ChartData>(() => {
    const presentes = STATUS_OS.filter(s => this.os().some(o => o.status === s));
    return {
      labels: presentes,
      datasets: [{ data: presentes.map(s => this.os().filter(o => o.status === s).length), backgroundColor: presentes.map(s => corDe(s)), borderColor: 'transparent' }],
    };
  });
  readonly optRosca: ChartOptions = { cutout: '62%' } as ChartOptions;

  // ------------------------------------------------------------------
  // Impressão e exportação
  // ------------------------------------------------------------------
  descricaoFiltros(): string {
    const p = `${this.inicio().split('-').reverse().join('/')} a ${this.fim().split('-').reverse().join('/')}`;
    const s = this.setor() || 'Todos os setores';
    const e = this.equipamento() ? this.eqSvc.rotulo(this.equipamento()) : 'Todos os equipamentos';
    return `${p} · ${s} · ${e}`;
  }

  imprimir() { window.print(); }

  exportarCSV() {
    const i = this.indicadores();
    const linhas: (string | number)[][] = [
      ['INDUSTRIA360 – Relatório gerencial de manutenção'], [this.config.config().empresa + ' · ' + this.config.config().unidade],
      ['Filtros', this.descricaoFiltros()], [],
      ['INDICADORES'], ['Total de manutenções', i.totalManutencoes], ['Ordens de serviço', i.totalOS], ['OS concluídas', i.osConcluidas],
      ['Falhas (corretivas)', i.falhas], ['Chamados', i.chamados], ['Tempo médio de OS (h)', i.tempoMedioOS.toFixed(1)],
      ['MTTR (h)', i.mttr.toFixed(1)], ['MTBF (h)', i.mtbf.toFixed(0)], ['Horas de parada', i.parada], ['Disponibilidade (%)', i.disponibilidade.toFixed(2)], [],
      ['EQUIPAMENTOS COM MAIS OCORRÊNCIAS'], ['Equipamento', 'Setor', 'OS', 'Chamados', 'Corretivas', 'Total', 'Parada (h)'],
      ...this.ranking().map(r => [r.rotulo, r.setor, r.os, r.chamados, r.corretivas, r.total, r.parada]), [],
      ['DISPONIBILIDADE POR EQUIPAMENTO'], ['Código', 'Equipamento', 'Falhas', 'Parada (h)', 'Disponibilidade (%)'],
      ...this.disponibilidadeEquip().map(d => [d.codigo, d.nome, d.falhas, d.parada, d.disp.toFixed(2)]),
    ];
    exportarCSV(`relatorio-manutencao-${hoje()}.csv`, linhas[0].map(String), linhas.slice(1));
    this.notif.info('Relatório exportado em CSV.', 'Exportação concluída');
  }

  exportarJSON() {
    exportarJSON(`relatorio-manutencao-${hoje()}.json`, {
      sistema: 'INDUSTRIA360', geradoEm: new Date().toISOString(), filtros: { inicio: this.inicio(), fim: this.fim(), setor: this.setor(), equipamento: this.equipamento() },
      indicadores: this.indicadores(), ranking: this.ranking(), disponibilidade: this.disponibilidadeEquip(),
    });
    this.notif.info('Relatório exportado em JSON.', 'Exportação concluída');
  }
}
