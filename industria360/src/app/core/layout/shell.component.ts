import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { ConfirmDialogComponent } from '../../shared/components';

/** Layout principal autenticado: sidebar + cabeçalho + conteúdo. */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, ConfirmDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="layout" [class.open]="menuAberto()">
      <app-sidebar class="side" (navegou)="menuAberto.set(false)" />
      <div class="overlay" (click)="menuAberto.set(false)"></div>
      <div class="main">
        <app-header (menu)="menuAberto.set(!menuAberto())" />
        <main class="content">
          <router-outlet />
        </main>
        <footer class="foot no-print">
          <span><b>INDUSTRIA360</b> – Gestão Industrial Inteligente</span>
          <span>Dados armazenados no banco de dados MySQL</span>
        </footer>
      </div>
    </div>
    <app-confirm-dialog />
  `,
  styles: [`
    .layout { min-height: 100vh; }
    .side { position: fixed; left: 0; top: 0; bottom: 0; width: var(--sidebar-w); z-index: 200; transition: transform .25s ease; }
    .main { margin-left: var(--sidebar-w); min-height: 100vh; display: flex; flex-direction: column; min-width: 0; }
    .content { flex: 1; padding: 24px; max-width: 1600px; width: 100%; margin: 0 auto; }
    .overlay { display: none; }
    .foot { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; padding: 14px 24px; font-size: 12px; color: var(--text-muted); border-top: 1px solid var(--border); }
    .foot b { color: var(--text-soft); }
    @media (max-width: 1024px) {
      .side { transform: translateX(-100%); box-shadow: var(--shadow-lg); }
      .main { margin-left: 0; }
      .open .side { transform: none; }
      .open .overlay { display: block; position: fixed; inset: 0; background: rgba(4,10,20,.6); z-index: 150; animation: fadeIn .2s; }
      .content { padding: 16px; }
    }
    @media print { .main { margin-left: 0; } .content { padding: 0; max-width: none; } }
  `],
})
export class ShellComponent {
  readonly menuAberto = signal(false);

  constructor() {
    // Fecha o menu lateral (mobile) a cada navegação
    inject(Router).events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.menuAberto.set(false));
  }
}
