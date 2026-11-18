import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import { AuthService, ConfirmacaoService, NotificacaoService, SugestaoService } from '../../core/services';
import { StatusSugestao, Sugestao, TipoSugestao } from '../../core/models';
import { MODULOS_SISTEMA, STATUS_SUGESTAO, TIPOS_SUGESTAO } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { exportarCSV } from '../../shared/utils/exportacao';
import { corDe } from '../../shared/utils/status-tone';

/** Ícone e dica de cada tipo de sugestão. */
const INFO_TIPO: Record<TipoSugestao, { icone: string; dica: string }> = {
  'Erro / problema': { icone: 'alerta', dica: 'Conte o que você fez, o que esperava que acontecesse e o que aconteceu de fato.' },
  'Sugestão de melhoria': { icone: 'lampada', dica: 'Descreva a ideia e como ela ajudaria no dia a dia.' },
  'Elogio': { icone: 'estrela', dica: 'Conte o que funcionou bem para você.' },
  'Dúvida': { icone: 'info', dica: 'Explique o que não ficou claro no sistema.' },
};

@Component({
  selector: 'app-sugestoes',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sugestoes.component.html',
  styleUrl: './sugestoes.component.css',
})
export class SugestoesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly auth = inject(AuthService);
  readonly svc = inject(SugestaoService);

  readonly tipos = TIPOS_SUGESTAO;
  readonly statusLista = STATUS_SUGESTAO;
  readonly modulos = MODULOS_SISTEMA;
  readonly infoTipo = INFO_TIPO;
  readonly corDe = corDe;

  // ------------------------------------------------------------------
  // Envio
  // ------------------------------------------------------------------
  readonly enviado = signal(false);
  readonly form = this.fb.nonNullable.group({
    tipo: ['Erro / problema' as TipoSugestao, Validators.required],
    modulo: ['', Validators.required],
    titulo: ['', [Validators.required, naoVazio, Validators.minLength(5), Validators.maxLength(150)]],
    descricao: ['', [Validators.required, naoVazio, Validators.minLength(10), Validators.maxLength(2000)]],
  });
  readonly tipoSelecionado = signal<TipoSugestao>('Erro / problema');

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }

  escolherTipo(t: TipoSugestao) {
    this.form.controls.tipo.setValue(t);
    this.tipoSelecionado.set(t);
  }

  enviar() {
    this.enviado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notif.erro('Preencha os campos destacados.', 'Formulário incompleto');
      return;
    }
    const v = this.form.getRawValue();
    this.svc.criar({ tipo: v.tipo, modulo: v.modulo, titulo: v.titulo.trim(), descricao: v.descricao.trim() });
    this.notif.sucesso('Obrigado! Sua mensagem foi enviada e será analisada.', 'Sugestão enviada');
    this.enviado.set(false);
    this.form.reset({ tipo: v.tipo, modulo: '', titulo: '', descricao: '' });
  }

  // ------------------------------------------------------------------
  // Lista (administrador vê todas; demais usuários veem as próprias)
  // ------------------------------------------------------------------
  readonly busca = signal('');
  readonly fStatus = signal('');
  readonly fTipo = signal('');
  readonly fModulo = signal('');

  /** Base da lista conforme o perfil. */
  readonly base = computed(() => (this.auth.ehAdmin() ? this.svc.itens() : this.svc.minhas()));

  readonly resumo = computed(() => this.statusLista.map(s => ({ s, n: this.base().filter(x => x.status === s).length })));

  readonly filtradas = computed(() => {
    const termo = this.busca().trim();
    return this.base()
      .filter(s => !termo || contem(s.titulo, termo) || contem(s.descricao, termo) || contem(s.autorNome, termo))
      .filter(s => !this.fStatus() || s.status === this.fStatus())
      .filter(s => !this.fTipo() || s.tipo === this.fTipo())
      .filter(s => !this.fModulo() || s.modulo === this.fModulo());
  });

  readonly temFiltro = computed(() => !!(this.busca() || this.fStatus() || this.fTipo() || this.fModulo()));
  limparFiltros() { this.busca.set(''); this.fStatus.set(''); this.fTipo.set(''); this.fModulo.set(''); }

  // ------------------------------------------------------------------
  // Ações do administrador
  // ------------------------------------------------------------------
  alterarStatus(s: Sugestao, status: string) {
    this.svc.alterarStatus(s.id, status as StatusSugestao);
    this.notif.info(`"${s.titulo}" → ${status}.`, 'Status atualizado');
  }

  readonly respondendo = signal<Sugestao | null>(null);
  readonly resposta = signal('');
  readonly statusResposta = signal<StatusSugestao>('Em análise');

  abrirResposta(s: Sugestao) {
    this.respondendo.set(s);
    this.resposta.set(s.resposta ?? '');
    this.statusResposta.set(s.status === 'Nova' ? 'Em análise' : s.status);
  }

  salvarResposta() {
    const s = this.respondendo();
    if (!s) return;
    this.svc.responder(s.id, this.resposta(), this.statusResposta());
    this.notif.sucesso(this.resposta().trim() ? 'Resposta registrada. O autor verá o retorno nesta página.' : 'Status atualizado.');
    this.respondendo.set(null);
  }

  async excluir(s: Sugestao) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir sugestão', mensagem: `Excluir "${s.titulo}", enviada por ${s.autorNome}?`, textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(s.id);
    this.notif.sucesso('Sugestão excluída.');
  }

  exportar() {
    exportarCSV('sugestoes.csv', ['Data', 'Tipo', 'Página', 'Título', 'Descrição', 'Autor', 'Status', 'Resposta', 'Respondido por'],
      this.filtradas().map(s => [
        new Date(s.dataEnvio).toLocaleString('pt-BR'), s.tipo, s.modulo, s.titulo, s.descricao, s.autorNome, s.status, s.resposta, s.respondidoPor,
      ]));
    this.notif.info(`${this.filtradas().length} sugestão(ões) exportada(s).`, 'Exportação concluída');
  }
}
