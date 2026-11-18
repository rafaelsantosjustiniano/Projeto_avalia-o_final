import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconComponent, LogoComponent } from '../../shared/components';
import {
  AuthService, ChamadoService, ConfiguracaoService, EstoqueService, OrdemServicoService, PreventivaService, SugestaoService
} from '../services';

interface ItemMenu { rota: string; rotulo: string; icone: string; contador?: () => number; tom?: 'danger' | 'warning' | 'info'; }
interface GrupoMenu { titulo: string; itens: ItemMenu[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  private readonly os = inject(OrdemServicoService);
  private readonly chamados = inject(ChamadoService);
  private readonly preventivas = inject(PreventivaService);
  private readonly estoque = inject(EstoqueService);
  private readonly sugestoes = inject(SugestaoService);
  private readonly auth = inject(AuthService);
  readonly config = inject(ConfiguracaoService);
  readonly navegou = output<void>();

  private readonly osAbertas = computed(() => this.os.itens().filter(o => this.os.estaAtiva(o)).length);
  private readonly chamadosAbertos = computed(() => this.chamados.itens().filter(c => c.status === 'Aberto' || c.status === 'Em análise').length);
  private readonly prevPendentes = computed(() => this.preventivas.itens().filter(p => {
    const s = this.preventivas.status(p); return s === 'Atrasada' || s === 'Próxima do vencimento';
  }).length);
  private readonly estoqueAlerta = computed(() => this.estoque.itens().filter(p => this.estoque.nivel(p) !== 'Normal').length);
  /** Só o administrador vê o contador de sugestões novas. */
  private readonly sugestoesNovas = computed(() => (this.auth.ehAdmin() ? this.sugestoes.novas() : 0));

  readonly grupos: GrupoMenu[] = [
    { titulo: 'Visão geral', itens: [
      { rota: '/dashboard', rotulo: 'Dashboard', icone: 'dashboard' },
    ]},
    { titulo: 'Operação', itens: [
      { rota: '/equipamentos', rotulo: 'Equipamentos', icone: 'equipamento' },
      { rota: '/ordens-servico', rotulo: 'Ordens de Serviço', icone: 'os', contador: this.osAbertas, tom: 'info' },
      { rota: '/chamados', rotulo: 'Chamados', icone: 'chamado', contador: this.chamadosAbertos, tom: 'danger' },
    ]},
    { titulo: 'Manutenção', itens: [
      { rota: '/preventiva', rotulo: 'Manutenção Preventiva', icone: 'calendario', contador: this.prevPendentes, tom: 'warning' },
      { rota: '/corretiva', rotulo: 'Manutenção Corretiva', icone: 'ferramenta' },
    ]},
    { titulo: 'Recursos', itens: [
      { rota: '/estoque', rotulo: 'Estoque e Peças', icone: 'estoque', contador: this.estoqueAlerta, tom: 'warning' },
      { rota: '/tecnicos', rotulo: 'Técnicos', icone: 'equipe' },
    ]},
    { titulo: 'Gestão', itens: [
      { rota: '/relatorios', rotulo: 'Relatórios', icone: 'relatorio' },
      { rota: '/sugestoes', rotulo: 'Sugestões', icone: 'mensagem', contador: this.sugestoesNovas, tom: 'info' },
      { rota: '/configuracoes', rotulo: 'Configurações', icone: 'config' },
    ]},
  ];
}
