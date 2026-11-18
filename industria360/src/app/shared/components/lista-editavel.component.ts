import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon.component';

/** Editor de lista simples (adicionar/remover itens), usado em Configurações. */
@Component({
  selector: 'app-lista-editavel',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="le">
      <form class="add" (ngSubmit)="adicionar()">
        <input class="input" [placeholder]="placeholder()" [ngModel]="novo()" (ngModelChange)="novo.set($event); erro.set('')" name="novo" maxlength="60" />
        <button type="submit" class="btn btn-primary"><app-icon name="mais" [size]="16" /> Adicionar</button>
      </form>
      @if (erro()) { <span class="error-msg">{{ erro() }}</span> }
      <ul class="items">
        @for (item of itens(); track item; let i = $index) {
          <li>
            <span class="idx mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
            <span class="txt">{{ item }}</span>
            <button type="button" class="icon-btn danger" title="Remover" (click)="remover(item)"><app-icon name="fechar" [size]="15" /></button>
          </li>
        } @empty { <li class="muted">Nenhum item cadastrado.</li> }
      </ul>
    </div>
  `,
  styles: [`
    .add { display: flex; gap: 10px; }
    .add .input { flex: 1; }
    .error-msg { margin-top: 6px; }
    .items { list-style: none; padding: 0; margin: 14px 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
    li { display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 12px; border-radius: 8px; background: var(--surface-2); border: 1px solid var(--border); animation: fadeUp .2s ease; }
    .idx { color: var(--text-muted); font-size: 11px; }
    .txt { flex: 1; font-weight: 500; font-size: 13.5px; }
    li.muted { padding: 10px 12px; }
    @media (max-width: 560px) { .add { flex-direction: column; } }
  `],
})
export class ListaEditavelComponent {
  readonly itens = input.required<string[]>();
  readonly placeholder = input('Novo item…');
  readonly alterou = output<{ itens: string[]; acao: 'adicionado' | 'removido'; item: string }>();
  readonly novo = signal('');
  readonly erro = signal('');

  adicionar() {
    const v = this.novo().trim();
    if (!v) { this.erro.set('Informe um nome.'); return; }
    if (this.itens().some(i => i.toLowerCase() === v.toLowerCase())) { this.erro.set('Item já cadastrado.'); return; }
    this.alterou.emit({ itens: [...this.itens(), v], acao: 'adicionado', item: v });
    this.novo.set('');
  }

  remover(item: string) {
    this.alterou.emit({ itens: this.itens().filter(i => i !== item), acao: 'removido', item });
  }
}
