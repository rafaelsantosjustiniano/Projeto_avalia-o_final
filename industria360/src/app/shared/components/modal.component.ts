import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Modal genérico. O componente pai controla a exibição com @if.
 * Conteúdo: <ng-content>; rodapé: elemento com atributo [modal-footer].
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (mousedown)="fecharFora($event)">
      <div class="modal" [class]="'modal size-' + size()" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <header class="m-header">
          <div class="m-title">
            @if (icon()) { <span class="m-icon"><app-icon [name]="icon()!" [size]="18" /></span> }
            <div>
              <h3>{{ title() }}</h3>
              @if (subtitle()) { <p>{{ subtitle() }}</p> }
            </div>
          </div>
          <button type="button" class="icon-btn" (click)="close.emit()" aria-label="Fechar"><app-icon name="fechar" /></button>
        </header>
        <div class="m-body"><ng-content /></div>
        <footer class="m-footer"><ng-content select="[modal-footer]" /></footer>
      </div>
    </div>
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(4, 10, 20, .68); backdrop-filter: blur(3px);
      display: flex; align-items: flex-start; justify-content: center; padding: 5vh 16px; overflow-y: auto; animation: fadeIn .18s ease; }
    .modal { width: 100%; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg); animation: scaleIn .22s ease; display: flex; flex-direction: column; max-height: none; }
    .size-sm { max-width: 460px; } .size-md { max-width: 640px; } .size-lg { max-width: 860px; } .size-xl { max-width: 1080px; }
    .m-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 18px 20px; border-bottom: 1px solid var(--border); }
    .m-title { display: flex; gap: 12px; align-items: center; }
    .m-icon { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; background: rgba(245,158,11,.14); color: var(--orange); flex: none; }
    h3 { font-size: 16px; }
    p { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }
    .m-body { padding: 20px; }
    .m-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid var(--border); background: var(--surface-2); border-radius: 0 0 var(--radius-lg) var(--radius-lg); flex-wrap: wrap; }
    .m-footer:empty { display: none; }
    @media (max-width: 560px) { .backdrop { padding: 0; align-items: stretch; } .modal { border-radius: 0; min-height: 100%; } .m-footer { border-radius: 0; } }
  `],
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string | null>(null);
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');
  readonly close = output<void>();

  @HostListener('document:keydown.escape')
  onEsc() { this.close.emit(); }

  fecharFora(ev: MouseEvent) {
    if (ev.target === ev.currentTarget) this.close.emit();
  }
}
