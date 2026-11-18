import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, OnDestroy, viewChild
} from '@angular/core';
import { Chart, ChartConfiguration, ChartData, ChartOptions, ChartType, registerables } from 'chart.js';
import { ConfiguracaoService } from '../../core/services/configuracao.service';

Chart.register(...registerables);

/**
 * Componente reutilizável para gráficos Chart.js.
 * Atualiza automaticamente quando `data` muda (dados vêm dos serviços/localStorage)
 * e adapta as cores ao tema claro/escuro.
 */
@Component({
  selector: 'app-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="chart-box" [style.height.px]="height()"><canvas #canvas></canvas></div>`,
  styles: [':host{display:block} .chart-box{position:relative;width:100%}'],
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  private readonly config = inject(ConfiguracaoService);
  readonly type = input<ChartType>('bar');
  readonly data = input.required<ChartData>();
  readonly options = input<ChartOptions>({});
  readonly height = input<number>(280);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;
  private iniciado = false;

  constructor() {
    effect(() => {
      // Dependências reativas: dados, opções, tipo e tema
      const data = this.data();
      const options = this.options();
      const type = this.type();
      const tema = this.config.config().tema;
      if (!this.iniciado) return;
      if (this.chart && (this.chart.config as ChartConfiguration).type === type && this.chart.$tema === tema) {
        this.chart.data = data;
        this.chart.options = this.mesclarOpcoes(options, type, tema);
        this.chart.update();
      } else {
        this.criar(type, data, options, tema);
      }
    });
  }

  ngAfterViewInit(): void {
    this.iniciado = true;
    this.criar(this.type(), this.data(), this.options(), this.config.config().tema);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private criar(type: ChartType, data: ChartData, options: ChartOptions, tema: string) {
    this.chart?.destroy();
    this.chart = new Chart(this.canvas().nativeElement, {
      type, data, options: this.mesclarOpcoes(options, type, tema)
    });
    this.chart.$tema = tema;
  }

  /** Opções padrão com identidade visual do INDUSTRIA360. */
  private mesclarOpcoes(options: ChartOptions, type: ChartType, tema: string): ChartOptions {
    const escuro = tema !== 'light';
    const texto = escuro ? '#8DA2BB' : '#5B6B7F';
    const grade = escuro ? 'rgba(148,178,214,0.10)' : 'rgba(11,22,37,0.07)';
    const circular = type === 'doughnut' || type === 'pie' || type === 'polarArea';
    const base: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      color: texto,
      font: { family: 'Inter, system-ui, sans-serif', size: 12 },
      plugins: {
        legend: { position: circular ? 'right' : 'top', align: circular ? 'center' : 'end',
          labels: { color: texto, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 14, font: { size: 12 } } },
        tooltip: { backgroundColor: '#0B1625', borderColor: 'rgba(245,158,11,.4)', borderWidth: 1, titleColor: '#fff', bodyColor: '#E6EDF5', padding: 10, cornerRadius: 8, boxPadding: 4 },
      },
    } as ChartOptions;
    if (!circular) {
      (base as ChartOptions<'bar'>).scales = {
        x: { grid: { color: grade }, border: { display: false }, ticks: { color: texto } },
        y: { grid: { color: grade }, border: { display: false }, ticks: { color: texto, precision: 0 }, beginAtZero: true },
      };
    }
    return deepMerge(base, options);
  }
}

declare module 'chart.js' {
  interface Chart { $tema?: string; }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function deepMerge<T>(a: T, b: unknown): T {
  if (!isObj(b)) return a;
  const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
  for (const [k, v] of Object.entries(b)) {
    out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out as T;
}
