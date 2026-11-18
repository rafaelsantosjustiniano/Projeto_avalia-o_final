import { ChangeDetectionStrategy, Component, computed, HostListener, inject, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components';
import { AuthService, ChamadoService, ConfiguracaoService, EquipamentoService, OrdemServicoService } from '../services';
import { iniciais } from '../../shared/utils/codigos';

interface Alerta { titulo: string; detalhe: string; rota: string; tom: 'danger' | 'warning'; }

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IconComponent, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly config = inject(ConfiguracaoService);
  private readonly os = inject(OrdemServicoService);
  private readonly chamados = inject(ChamadoService);
  private readonly equipamentos = inject(EquipamentoService);
  private readonly router = inject(Router);

  readonly menu = output<void>();
  readonly painel = signal<'alertas' | 'usuario' | null>(null);
  readonly agora = signal(new Date());
  readonly iniciais = computed(() => iniciais(this.auth.usuario()?.nome ?? ''));

  /** Alertas operacionais: chamados críticos, OS atrasadas e equipamentos críticos. */
  readonly alertas = computed<Alerta[]>(() => {
    const critica = this.config.prioridadeCritica();
    const lista: Alerta[] = [];
    this.chamados.itens()
      .filter(c => c.prioridade === critica && (c.status === 'Aberto' || c.status === 'Em análise'))
      .forEach(c => lista.push({ titulo: `Chamado crítico ${c.protocolo}`, detalhe: this.equipamentos.rotulo(c.equipamentoId), rota: '/chamados', tom: 'danger' }));
    this.os.itens().filter(o => o.status === 'Atrasada')
      .forEach(o => lista.push({ titulo: `${o.numero} atrasada`, detalhe: this.equipamentos.rotulo(o.equipamentoId), rota: '/ordens-servico', tom: 'warning' }));
    this.equipamentos.itens().filter(e => e.situacao === 'Crítico')
      .forEach(e => lista.push({ titulo: 'Equipamento em estado crítico', detalhe: `${e.codigo} · ${e.nome}`, rota: '/equipamentos', tom: 'danger' }));
    return lista;
  });

  constructor() {
    setInterval(() => this.agora.set(new Date()), 30_000);
  }

  alternar(p: 'alertas' | 'usuario', ev: Event) {
    ev.stopPropagation();
    this.painel.update(atual => (atual === p ? null : p));
  }

  abrir(rota: string) {
    this.painel.set(null);
    this.router.navigateByUrl(rota);
  }

  @HostListener('document:click')
  fecharPaineis() { this.painel.set(null); }
}
