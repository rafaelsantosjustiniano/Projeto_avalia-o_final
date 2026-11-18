import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="ic"><app-icon [name]="icon()" [size]="26" /></span>
      <strong>{{ title() }}</strong>
      <p>{{ message() }}</p>
      <ng-content />
    </div>
  `,
  styles: [`
    .empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; padding: 40px 20px; color: var(--text-muted); }
    .ic { width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); border: 1px dashed var(--border-strong); margin-bottom: 6px; }
    strong { color: var(--text); font-size: 15px; }
    p { font-size: 13px; max-width: 380px; margin-bottom: 8px; }
  `],
})
export class EmptyStateComponent {
  readonly icon = input<string>('busca');
  readonly title = input<string>('Nenhum registro encontrado');
  readonly message = input<string>('Ajuste a pesquisa ou os filtros para encontrar o que procura.');
}
