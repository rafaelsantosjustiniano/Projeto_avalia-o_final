import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import {
  BadgeComponent, ChartComponent, EmptyStateComponent, IconComponent, KpiCardComponent, PageHeaderComponent
} from '../../shared/components';
import {
  AuthService, ChamadoService, ConfiguracaoService, CorretivaService, EquipamentoService, EstoqueService,
  OrdemServicoService, PreventivaService, TecnicoService
} from '../../core/services';
import { SITUACOES_EQUIPAMENTO } from '../../core/constants/opcoes';
import { CORES_TONE, corDe } from '../../shared/utils/status-tone';
import { rotuloMes, ultimosMeses } from '../../shared/utils/datas';

/** Linha da tabela de atividades recentes (consolidada de vários módulos). */
interface Atividade {
  equipamento: string;
  codigo: string;
  tipo: string;
  referencia: string;
  responsavel: string;
  data: string;
  prioridade: string;
  status: string;
  rota: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PageHeaderComponent, KpiCardComponent, ChartComponent, BadgeComponent, IconComponent, EmptyStateComponent, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  private readonly equipamentos = inject(EquipamentoService);
  private readonly os = inject(OrdemServicoService);
  private readonly chamados = inject(ChamadoService);
  private readonly preventivas = inject(PreventivaService);
  private readonly corretivas = inject(CorretivaService);
  private readonly tecnicos = inject(TecnicoService);
  private readonly estoque = inject(EstoqueService);
  private readonly config = inject(ConfiguracaoService);
  readonly auth = inject(AuthService);

  readonly saudacao = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  })();

  // ------------------------------------------------------------------
  // Indicadores (calculados a partir dos dados armazenados)
  // ------------------------------------------------------------------
  readonly kpis = computed(() => {
    const eq = this.equipamentos.itens();
    const os = this.os.itens();
    const critica = this.config.prioridadeCritica();
    const sit = this.equipamentos.porSituacao();
    const prevStatus = this.preventivas.itens().map(p => this.preventivas.status(p));
    return {
      totalEquip: eq.length,
      emOperacao: sit['Em operação'],
      emManutencao: sit['Em manutenção'],
      inativos: sit['Inativo'],
      criticos: sit['Crítico'],
      osAbertas: os.filter(o => this.os.estaAtiva(o)).length,
      osAtrasadas: os.filter(o => o.status === 'Atrasada').length,
      osConcluidas: os.filter(o => o.status === 'Concluída').length,
      prevPendentes: prevStatus.filter(s => s === 'Atrasada' || s === 'Próxima do vencimento').length,
      prevAtrasadas: prevStatus.filter(s => s === 'Atrasada').length,
      chamadosCriticos: this.chamados.itens().filter(c => c.prioridade === critica && (c.status === 'Aberto' || c.status === 'Em análise')).length,
      chamadosAbertos: this.chamados.itens().filter(c => c.status === 'Aberto' || c.status === 'Em análise').length,
    };
  });

  /** Disponibilidade física: equipamentos aptos (operação + disponíveis) / total. */
  readonly disponibilidade = computed(() => {
    const k = this.kpis();
    return k.totalEquip ? Math.round(((k.emOperacao + this.equipamentos.porSituacao()['Disponível']) / k.totalEquip) * 1000) / 10 : 0;
  });

  // ------------------------------------------------------------------
  // Gráficos
  // ------------------------------------------------------------------
  readonly chartMeses = computed<ChartData>(() => {
    const meses = ultimosMeses(6);
    const contar = (filtro: (tipo: string) => boolean) =>
      meses.map(m => this.os.itens().filter(o => o.dataAbertura.slice(0, 7) === m && filtro(o.tipo)).length);
    return {
      labels: meses.map(rotuloMes),
      datasets: [
        { label: 'Preventivas', data: contar(t => t === 'Preventiva'), backgroundColor: CORES_TONE.success, borderRadius: 5, stack: 's' },
        { label: 'Corretivas', data: contar(t => t === 'Corretiva'), backgroundColor: CORES_TONE.danger, borderRadius: 5, stack: 's' },
        { label: 'Preditivas / Inspeções / Melhorias', data: contar(t => !['Preventiva', 'Corretiva'].includes(t)), backgroundColor: CORES_TONE.info, borderRadius: 5, stack: 's' },
      ],
    };
  });
  readonly optEmpilhado: ChartOptions = { scales: { x: { stacked: true }, y: { stacked: true } } } as ChartOptions;

  readonly chartSituacao = computed<ChartData>(() => {
    const sit = this.equipamentos.porSituacao();
    return {
      labels: SITUACOES_EQUIPAMENTO,
      datasets: [{
        data: SITUACOES_EQUIPAMENTO.map(s => sit[s]),
        backgroundColor: SITUACOES_EQUIPAMENTO.map(s => corDe(s)),
        borderColor: 'transparent', hoverOffset: 8,
      }],
    };
  });
  readonly optRosca: ChartOptions = { cutout: '68%' } as ChartOptions;

  readonly chartCategoria = computed<ChartData>(() => {
    const mapa = new Map<string, number>();
    this.os.itens().forEach(o => {
      const cat = this.equipamentos.obter(o.equipamentoId)?.categoria ?? 'Sem equipamento';
      mapa.set(cat, (mapa.get(cat) ?? 0) + 1);
    });
    const ordenado = [...mapa.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: ordenado.map(([k]) => k),
      datasets: [{ label: 'Ordens de serviço', data: ordenado.map(([, v]) => v), backgroundColor: '#F59E0B', borderRadius: 5, barThickness: 16 }],
    };
  });
  readonly optHorizontal: ChartOptions = { indexAxis: 'y', plugins: { legend: { display: false } } } as ChartOptions;

  readonly chartPrevCorr = computed<ChartData>(() => {
    const os = this.os.itens();
    return {
      labels: ['Preventivas', 'Corretivas', 'Preditivas', 'Inspeções', 'Melhorias'],
      datasets: [{
        data: ['Preventiva', 'Corretiva', 'Preditiva', 'Inspeção', 'Melhoria'].map(t => os.filter(o => o.tipo === t).length),
        backgroundColor: [CORES_TONE.success, CORES_TONE.danger, CORES_TONE.info, CORES_TONE.purple, CORES_TONE.neutral],
        borderColor: 'transparent', hoverOffset: 8,
      }],
    };
  });

  readonly razaoPreventiva = computed(() => {
    const os = this.os.itens();
    const p = os.filter(o => o.tipo === 'Preventiva').length;
    const c = os.filter(o => o.tipo === 'Corretiva').length;
    return p + c ? Math.round((p / (p + c)) * 100) : 0;
  });

  readonly chartTecnicos = computed<ChartData>(() => {
    const tecs = this.tecnicos.ordenados();
    const os = this.os.itens();
    return {
      labels: tecs.map(t => { const n = t.nome.split(' '); return `${n[0]} ${n.length > 1 ? n[n.length - 1][0] + '.' : ''}`; }),
      datasets: [
        { label: 'Concluídas', data: tecs.map(t => os.filter(o => o.tecnicoId === t.id && o.status === 'Concluída').length), backgroundColor: CORES_TONE.success, borderRadius: 5 },
        { label: 'Em andamento', data: tecs.map(t => os.filter(o => o.tecnicoId === t.id && this.os.estaAtiva(o)).length), backgroundColor: CORES_TONE.orange, borderRadius: 5 },
      ],
    };
  });

  // ------------------------------------------------------------------
  // Atividades recentes e próximas preventivas
  // ------------------------------------------------------------------
  readonly atividades = computed<Atividade[]>(() => {
    const lista: Atividade[] = [];
    this.os.itens().forEach(o => {
      const ultimo = o.historico[o.historico.length - 1];
      lista.push({
        equipamento: this.equipamentos.nome(o.equipamentoId), codigo: this.equipamentos.obter(o.equipamentoId)?.codigo ?? '—', tipo: `OS ${o.tipo}`, referencia: o.numero,
        responsavel: this.tecnicos.nome(o.tecnicoId), data: ultimo?.data ?? o.dataAbertura,
        prioridade: o.prioridade, status: o.status, rota: '/ordens-servico',
      });
    });
    this.chamados.itens().forEach(c => lista.push({
      equipamento: this.equipamentos.nome(c.equipamentoId), codigo: this.equipamentos.obter(c.equipamentoId)?.codigo ?? '—', tipo: `Chamado · ${c.categoria}`, referencia: c.protocolo,
      responsavel: c.solicitante, data: c.dataHora, prioridade: c.prioridade, status: c.status, rota: '/chamados',
    }));
    this.corretivas.itens().forEach(c => {
      const ultimo = c.andamento[c.andamento.length - 1];
      lista.push({
        equipamento: this.equipamentos.nome(c.equipamentoId), codigo: this.equipamentos.obter(c.equipamentoId)?.codigo ?? '—', tipo: 'Manutenção corretiva', referencia: c.descricaoFalha,
        responsavel: this.tecnicos.nome(c.tecnicoId), data: ultimo?.data ?? c.dataOcorrencia,
        prioridade: c.prioridade, status: c.status, rota: '/corretiva',
      });
    });
    return lista.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8);
  });

  readonly proximasPreventivas = computed(() =>
    this.preventivas.itens()
      .filter(p => p.situacao === 'Ativo')
      .sort((a, b) => a.proximaManutencao.localeCompare(b.proximaManutencao))
      .slice(0, 6)
      .map(p => ({
        id: p.id, equipamento: this.equipamentos.rotulo(p.equipamentoId), tipo: p.tipoManutencao,
        data: p.proximaManutencao, status: this.preventivas.status(p), dias: this.preventivas.diasParaVencer(p),
      }))
  );

  readonly alertasEstoque = computed(() =>
    this.estoque.itens().filter(p => this.estoque.nivel(p) !== 'Normal')
      .map(p => ({ ...p, nivel: this.estoque.nivel(p) }))
      .sort((a, b) => a.quantidade - b.quantidade)
      .slice(0, 5)
  );

  textoDias(d: number): string {
    if (d === 0) return 'Vence hoje';
    if (d < 0) return `${Math.abs(d)} dia(s) em atraso`;
    return `Em ${d} dia(s)`;
  }
}
