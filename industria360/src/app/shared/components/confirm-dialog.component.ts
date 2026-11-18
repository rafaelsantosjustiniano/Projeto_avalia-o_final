import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfirmacaoService } from '../../core/services/confirmacao.service';
import { ModalComponent } from './modal.component';
import { IconComponent } from './icon.component';

/** Renderiza o modal global de confirmação (instanciado uma vez no layout). */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (svc.estado(); as e) {
      <app-modal [title]="e.titulo" size="sm" [icon]="e.perigo ? 'alerta' : 'info'" (close)="svc.responder(false)">
        <p class="msg">{{ e.mensagem }}</p>
        <div modal-footer>
          <button type="button" class="btn" (click)="svc.responder(false)">{{ e.textoCancelar ?? 'Cancelar' }}</button>
          <button type="button" class="btn" [class.btn-danger]="e.perigo" [class.btn-primary]="!e.perigo" (click)="svc.responder(true)" autofocus>
            @if (e.perigo) { <app-icon name="excluir" [size]="16" /> }
            {{ e.textoConfirmar ?? 'Confirmar' }}
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: ['.msg{color:var(--text-soft);line-height:1.6;white-space:pre-line} [modal-footer]{display:flex;gap:10px;justify-content:flex-end;width:100%}'],
})
export class ConfirmDialogComponent {
  readonly svc = inject(ConfirmacaoService);
}
