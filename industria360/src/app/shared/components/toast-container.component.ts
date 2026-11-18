import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificacaoService } from '../../core/services/notificacao.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (n of svc.itens(); track n.id) {
        <div class="toast" [class]="'toast t-' + n.tipo" role="status">
          <span class="ic"><app-icon [name]="icone(n.tipo)" [size]="18" /></span>
          <div class="body">
            <strong>{{ n.titulo }}</strong>
            <span>{{ n.mensagem }}</span>
          </div>
          <button class="icon-btn" (click)="svc.fechar(n.id)" aria-label="Fechar"><app-icon name="fechar" [size]="15" /></button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toasts { position: fixed; right: 20px; bottom: 20px; z-index: 2000; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); }
    .toast { display: flex; gap: 12px; align-items: flex-start; padding: 12px 12px 12px 14px; border-radius: var(--radius);
      background: var(--surface); border: 1px solid var(--border-strong); box-shadow: var(--shadow-lg); animation: slideIn .25s ease;
      border-left: 4px solid var(--blue); }
    .ic { margin-top: 1px; }
    .body { flex: 1; display: flex; flex-direction: column; gap: 2px; font-size: 13px; color: var(--text-soft); min-width: 0; }
    .body strong { color: var(--text); font-size: 13.5px; }
    .t-sucesso { border-left-color: var(--green); } .t-sucesso .ic { color: #4ADE80; }
    .t-erro { border-left-color: var(--red); } .t-erro .ic { color: #F87171; }
    .t-aviso { border-left-color: var(--yellow); } .t-aviso .ic { color: var(--yellow); }
    .t-info .ic { color: #60A5FA; }
    @media (max-width: 560px) { .toasts { right: 16px; bottom: 16px; } }
  `],
})
export class ToastContainerComponent {
  readonly svc = inject(NotificacaoService);
  icone(tipo: string) {
    return tipo === 'sucesso' ? 'check-circulo' : tipo === 'erro' ? 'alerta' : tipo === 'aviso' ? 'alerta' : 'info';
  }
}
