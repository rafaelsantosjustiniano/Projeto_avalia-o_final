import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon.component';
import { Tone } from '../utils/status-tone';

/** Card de indicador (KPI) com ícone, valor e legenda. */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="kpi" [class]="'kpi tone-' + tone()" [routerLink]="link()" [queryParams]="query()" [class.clickable]="!!link()">
      <div class="top">
        <span class="label">{{ label() }}</span>
        <span class="ic"><app-icon [name]="icon()" [size]="18" /></span>
      </div>
      <div class="value">{{ value() }}<small>{{ unit() }}</small></div>
      @if (hint()) { <div class="hint">{{ hint() }}</div> }
      <span class="bar"></span>
    </a>
  `,
  styles: [`
    .kpi { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 16px 18px; border-radius: var(--radius-lg);
      background: var(--surface); border: 1px solid var(--border); box-shadow: var(--shadow-sm); color: var(--text); overflow: hidden;
      transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease; animation: fadeUp .4s ease both; }
    .kpi.clickable:hover { transform: translateY(-2px); border-color: var(--border-strong); box-shadow: var(--shadow); }
    .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .label { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; line-height: 1.3; }
    .ic { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; flex: none; color: var(--c); background: color-mix(in srgb, var(--c) 15%, transparent); }
    .value { font-size: 30px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
    .value small { font-size: 14px; color: var(--text-muted); font-weight: 600; margin-left: 4px; }
    .hint { font-size: 12px; color: var(--text-muted); }
    .bar { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--c); }
    .tone-success { --c: #16A34A; } .tone-info { --c: #3B82F6; } .tone-warning { --c: #EAB308; } .tone-orange { --c: #F59E0B; }
    .tone-danger { --c: #DC2626; } .tone-neutral { --c: #64748B; } .tone-purple { --c: #8B5CF6; }
    @media (max-width: 560px) { .kpi { padding: 12px 14px; } .value { font-size: 24px; } .ic { width: 30px; height: 30px; } }
  `],
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input<string>('');
  readonly icon = input<string>('atividade');
  readonly tone = input<Tone>('info');
  readonly hint = input<string>('');
  readonly link = input<string | null>(null);
  readonly query = input<Record<string, string> | null>(null);
}
