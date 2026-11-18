import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

/** Cabeçalho padrão das páginas: ícone, título, descrição e ações. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ph">
      <div class="left">
        <span class="ic"><app-icon [name]="icon()" [size]="22" /></span>
        <div>
          <div class="crumb">INDUSTRIA360 <span>/</span> {{ title() }}</div>
          <h1>{{ title() }}</h1>
          @if (subtitle()) { <p>{{ subtitle() }}</p> }
        </div>
      </div>
      <div class="actions no-print"><ng-content /></div>
    </div>
  `,
  styles: [`
    .ph { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .left { display: flex; gap: 14px; align-items: center; min-width: 0; }
    .ic { width: 48px; height: 48px; border-radius: 12px; display: grid; place-items: center; flex: none;
      background: linear-gradient(135deg, rgba(245,158,11,.22), rgba(245,158,11,.06)); color: var(--orange); border: 1px solid rgba(245,158,11,.3); }
    .crumb { font-size: 11px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); font-weight: 600; }
    .crumb span { opacity: .5; margin: 0 4px; }
    h1 { font-size: 24px; line-height: 1.2; }
    p { color: var(--text-muted); font-size: 13.5px; margin-top: 2px; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    @media (max-width: 560px) { h1 { font-size: 20px; } .ic { width: 42px; height: 42px; } .actions { width: 100%; } .actions ::ng-deep .btn { flex: 1; } }
  `],
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly icon = input<string>('dashboard');
}
