import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logotipo INDUSTRIA360: engrenagem central envolvida por um arco de 360°
 * com seta (ciclo contínuo de manutenção / visão completa da operação).
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="logo" [class.vertical]="vertical()">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 64 64" aria-label="INDUSTRIA360">
        <defs>
          <linearGradient id="i360-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#FBBF24"/><stop offset="1" stop-color="#F59E0B"/>
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="15" fill="#0B1625" stroke="rgba(245,158,11,.35)"/>
        <g fill="none" stroke-linecap="round">
          <circle cx="32" cy="32" r="21" stroke="url(#i360-g)" stroke-width="4.5" stroke-dasharray="110 22" transform="rotate(-60 32 32)"/>
          <path d="M50.5 22.5l3-6.5-7 1.2" stroke="#F59E0B" stroke-width="4.5" stroke-linejoin="round"/>
        </g>
        <g fill="#FFFFFF">
          <circle cx="32" cy="32" r="9"/>
          <rect x="29" y="16.5" width="6" height="7" rx="1.5"/><rect x="29" y="40.5" width="6" height="7" rx="1.5"/>
          <rect x="16.5" y="29" width="7" height="6" rx="1.5"/><rect x="40.5" y="29" width="7" height="6" rx="1.5"/>
          <rect x="20.2" y="20.2" width="6" height="6" rx="1.5" transform="rotate(45 23.2 23.2)"/>
          <rect x="37.8" y="37.8" width="6" height="6" rx="1.5" transform="rotate(45 40.8 40.8)"/>
          <rect x="37.8" y="20.2" width="6" height="6" rx="1.5" transform="rotate(45 40.8 23.2)"/>
          <rect x="20.2" y="37.8" width="6" height="6" rx="1.5" transform="rotate(45 23.2 40.8)"/>
        </g>
        <circle cx="32" cy="32" r="4" fill="#0B1625"/>
      </svg>
      @if (showText()) {
        <div class="text">
          <span class="name">INDUSTRIA<b>360</b></span>
          <span class="tagline">Gestão Industrial Inteligente</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo.vertical { flex-direction: column; text-align: center; gap: 14px; }
    svg { flex: none; filter: drop-shadow(0 4px 12px rgba(245,158,11,.18)); }
    .text { display: flex; flex-direction: column; line-height: 1.15; min-width: 0; }
    .name { font-weight: 800; font-size: 18px; letter-spacing: .04em; color: var(--logo-text, #fff); white-space: nowrap; }
    .name b { color: #F59E0B; font-weight: 800; }
    .tagline { font-size: 9px; letter-spacing: .07em; text-transform: uppercase; color: var(--logo-muted, #8DA2BB); font-weight: 600; white-space: nowrap; }
    .vertical .name { font-size: 28px; }
    .vertical .tagline { font-size: 12px; }
  `],
})
export class LogoComponent {
  readonly size = input<number>(40);
  readonly showText = input<boolean>(true);
  readonly vertical = input<boolean>(false);
}
