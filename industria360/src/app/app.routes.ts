import { Routes } from '@angular/router';
import { ShellComponent } from './core/layout/shell.component';
import { authGuard } from './core/guards/auth.guard';

const t = (pagina: string) => `${pagina} | INDUSTRIA360`;

export const routes: Routes = [
  {
    path: 'login',
    title: t('Acesso'),
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', title: t('Dashboard'), loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'equipamentos', title: t('Equipamentos'), loadComponent: () => import('./pages/equipamentos/equipamentos.component').then(m => m.EquipamentosComponent) },
      { path: 'ordens-servico', title: t('Ordens de Serviço'), loadComponent: () => import('./pages/ordens-servico/ordens-servico.component').then(m => m.OrdensServicoComponent) },
      { path: 'chamados', title: t('Chamados'), loadComponent: () => import('./pages/chamados/chamados.component').then(m => m.ChamadosComponent) },
      { path: 'preventiva', title: t('Manutenção Preventiva'), loadComponent: () => import('./pages/preventiva/preventiva.component').then(m => m.PreventivaComponent) },
      { path: 'corretiva', title: t('Manutenção Corretiva'), loadComponent: () => import('./pages/corretiva/corretiva.component').then(m => m.CorretivaComponent) },
      { path: 'estoque', title: t('Estoque e Peças'), loadComponent: () => import('./pages/estoque/estoque.component').then(m => m.EstoqueComponent) },
      { path: 'tecnicos', title: t('Técnicos'), loadComponent: () => import('./pages/tecnicos/tecnicos.component').then(m => m.TecnicosComponent) },
      { path: 'relatorios', title: t('Relatórios'), loadComponent: () => import('./pages/relatorios/relatorios.component').then(m => m.RelatoriosComponent) },
      { path: 'configuracoes', title: t('Configurações'), loadComponent: () => import('./pages/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
