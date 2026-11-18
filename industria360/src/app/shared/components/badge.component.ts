import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Tone, toneDe } from '../utils/status-tone';
import { ConfiguracaoService } from '../../core/services/configuracao.service';

/**
 * Badge colorida de estado. A cor é obtida automaticamente pelo texto
 * (ver status-tone.ts) ou pela cor de prioridades personalizadas.
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="'badge badge-' + (tom() ?? 'neutral')" [style]="estiloCustom()" [attr.title]="value()">
      <span class="dot"></span>{{ value() }}
    </span>
  `,
})
export class BadgeComponent {
  private readonly config = inject(ConfiguracaoService);
  readonly value = input.required<string>();
  readonly tone = input<Tone | null>(null);

  readonly tom = computed<Tone | null>(() => this.tone() ?? toneDe(this.value()));

  /** Prioridades criadas pelo usuário usam a cor definida em Configurações. */
  readonly estiloCustom = computed(() => {
    if (this.tom()) return null;
    const p = this.config.prioridade(this.value());
    return p ? `color:${p.cor};border-color:${p.cor}66;background:${p.cor}22` : null;
  });
}
