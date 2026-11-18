import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import {
  ConfirmacaoService, ConfiguracaoService, CorretivaService, EquipamentoService, NotificacaoService,
  OrdemServicoService, PreventivaService, TecnicoService
} from '../../core/services';
import { SituacaoTecnico, Tecnico } from '../../core/models';
import { SITUACOES_TECNICO } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio, unico } from '../../shared/utils/formulario';
import { contem, iniciais } from '../../shared/utils/codigos';
import { exportarCSV } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-tecnicos',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tecnicos.component.html',
  styleUrl: './tecnicos.component.css',
})
export class TecnicosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(TecnicoService);
  private readonly osSvc = inject(OrdemServicoService);
  private readonly prevSvc = inject(PreventivaService);
  private readonly corrSvc = inject(CorretivaService);
  readonly eqSvc = inject(EquipamentoService);
  readonly config = inject(ConfiguracaoService);

  readonly situacoes = SITUACOES_TECNICO;
  readonly iniciais = iniciais;

  readonly busca = signal('');
  readonly fEspecialidade = signal('');
  readonly fSetor = signal('');
  readonly fSituacao = signal('');
  readonly visao = signal<'cards' | 'tabela'>('cards');

  /** Técnicos com indicadores de carga de trabalho. */
  readonly lista = computed(() => {
    const os = this.osSvc.itens();
    return this.svc.ordenados().map(t => ({
      ...t,
      osAtivas: os.filter(o => o.tecnicoId === t.id && this.osSvc.estaAtiva(o)).length,
      osConcluidas: os.filter(o => o.tecnicoId === t.id && o.status === 'Concluída').length,
      preventivas: this.prevSvc.itens().filter(p => p.tecnicoId === t.id && p.situacao === 'Ativo').length,
      corretivas: this.corrSvc.itens().filter(c => c.tecnicoId === t.id && c.status !== 'Concluída').length,
    }));
  });

  readonly filtrados = computed(() => {
    const termo = this.busca().trim();
    return this.lista()
      .filter(t => !termo || contem(t.nome, termo) || contem(t.matricula, termo) || contem(t.email, termo) || contem(t.especialidade, termo))
      .filter(t => !this.fEspecialidade() || t.especialidade === this.fEspecialidade())
      .filter(t => !this.fSetor() || t.setor === this.fSetor())
      .filter(t => !this.fSituacao() || t.situacao === this.fSituacao());
  });

  readonly resumo = computed(() => this.situacoes.map(s => ({ s, n: this.svc.itens().filter(t => t.situacao === s).length })));

  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, naoVazio, Validators.minLength(3)]],
    matricula: ['', [Validators.required, naoVazio, unico(() => this.svc.matriculas(this.editandoId() ?? undefined))]],
    especialidade: ['', Validators.required],
    setor: ['', Validators.required],
    telefone: ['', [Validators.required, Validators.pattern(/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/)]],
    email: ['', [Validators.required, Validators.email]],
    situacao: ['Disponível' as SituacaoTecnico, Validators.required],
  });

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) {
    if (c === 'telefone' && this.form.get(c)?.errors?.['pattern']) return 'Use o formato (21) 99999-9999.';
    return mensagemErro(this.form, c);
  }
  limparFiltros() { this.busca.set(''); this.fEspecialidade.set(''); this.fSetor.set(''); this.fSituacao.set(''); }

  /** Máscara simples de telefone durante a digitação. */
  formatarTelefone() {
    const d = this.form.controls.telefone.value.replace(/\D/g, '').slice(0, 11);
    let f = d;
    if (d.length > 2) f = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length > 7) f = `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
    this.form.controls.telefone.setValue(f, { emitEvent: false });
  }

  novo() {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ nome: '', matricula: this.svc.proximaMatricula(), especialidade: '', setor: '', telefone: '', email: '', situacao: 'Disponível' });
    this.formAberto.set(true);
  }

  editar(t: Tecnico) {
    this.editandoId.set(t.id);
    this.enviado.set(false);
    this.form.reset({ nome: t.nome, matricula: t.matricula, especialidade: t.especialidade, setor: t.setor, telefone: t.telefone, email: t.email, situacao: t.situacao });
    this.formAberto.set(true);
  }

  salvar() {
    this.enviado.set(true);
    this.form.updateValueAndValidity();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notif.erro('Verifique os campos obrigatórios destacados.', 'Formulário incompleto');
      return;
    }
    const v = this.form.getRawValue();
    const dados = { ...v, nome: v.nome.trim(), matricula: v.matricula.trim().toUpperCase(), email: v.email.trim().toLowerCase() };
    const id = this.editandoId();
    if (id) {
      this.svc.atualizar(id, dados);
      this.notif.sucesso(`Dados de ${dados.nome} atualizados.`);
    } else {
      this.svc.criar(dados);
      this.notif.sucesso(`${dados.nome} cadastrado(a) na equipe.`);
    }
    this.formAberto.set(false);
  }

  alterarSituacao(t: Tecnico, s: string) {
    this.svc.alterarSituacao(t.id, s as SituacaoTecnico);
    this.notif.info(`${t.nome}: ${s}.`, 'Situação atualizada');
  }

  async excluir(t: Tecnico & { osAtivas: number }) {
    if (t.osAtivas) {
      this.notif.aviso(`${t.nome} possui ${t.osAtivas} OS em aberto. Reatribua as ordens antes de excluir.`, 'Exclusão bloqueada');
      return;
    }
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir técnico', mensagem: `Excluir ${t.nome} (${t.matricula}) da equipe?`, textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(t.id);
    this.notif.sucesso(`${t.nome} removido(a) da equipe.`);
  }

  verOS() { this.router.navigate(['/ordens-servico']); }

  exportar() {
    exportarCSV('tecnicos.csv', ['Nome', 'Matrícula', 'Especialidade', 'Setor', 'Telefone', 'E-mail', 'Situação', 'OS em aberto', 'OS concluídas'],
      this.filtrados().map(t => [t.nome, t.matricula, t.especialidade, t.setor, t.telefone, t.email, t.situacao, t.osAtivas, t.osConcluidas]));
    this.notif.info(`${this.filtrados().length} técnico(s) exportado(s).`, 'Exportação concluída');
  }
}
