import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import {
  ConfirmacaoService, ConfiguracaoService, EquipamentoService, NotificacaoService, OrdemServicoService,
  PreventivaService, TecnicoService
} from '../../core/services';
import { Frequencia, Preventiva, SituacaoPlano, StatusPreventiva } from '../../core/models';
import { FREQUENCIAS, TIPOS_PREVENTIVA } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { hoje, somarDias } from '../../shared/utils/datas';
import { exportarCSV } from '../../shared/utils/exportacao';

interface LinhaPreventiva extends Preventiva {
  status: StatusPreventiva;
  dias: number;
}

@Component({
  selector: 'app-preventiva',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './preventiva.component.html',
  styleUrl: './preventiva.component.css',
})
export class PreventivaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(PreventivaService);
  readonly eqSvc = inject(EquipamentoService);
  readonly tecSvc = inject(TecnicoService);
  readonly osSvc = inject(OrdemServicoService);
  readonly config = inject(ConfiguracaoService);

  readonly frequencias = FREQUENCIAS;
  readonly tiposPrev = TIPOS_PREVENTIVA;
  readonly statusLista: StatusPreventiva[] = ['Em dia', 'Próxima do vencimento', 'Atrasada', 'Suspensa'];

  readonly busca = signal('');
  readonly fStatus = signal('');
  readonly fFrequencia = signal('');
  readonly fTecnico = signal('');

  readonly linhas = computed<LinhaPreventiva[]>(() =>
    this.svc.itens().map(p => ({ ...p, status: this.svc.status(p), dias: this.svc.diasParaVencer(p) }))
  );

  readonly filtradas = computed(() => {
    const termo = this.busca().trim();
    return this.linhas()
      .filter(p => !termo || contem(this.eqSvc.rotulo(p.equipamentoId), termo) || contem(p.tipoManutencao, termo) || contem(this.tecSvc.nome(p.tecnicoId), termo))
      .filter(p => !this.fStatus() || p.status === this.fStatus())
      .filter(p => !this.fFrequencia() || p.frequencia === this.fFrequencia())
      .filter(p => !this.fTecnico() || p.tecnicoId === this.fTecnico())
      .sort((a, b) => (a.situacao === b.situacao ? 0 : a.situacao === 'Suspenso' ? 1 : -1) || a.proximaManutencao.localeCompare(b.proximaManutencao));
  });

  readonly resumo = computed(() => this.statusLista.map(s => ({ s, n: this.linhas().filter(p => p.status === s).length })));

  // Modais
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly executando = signal<LinhaPreventiva | null>(null);
  readonly detalheId = signal<string | null>(null);
  readonly detalhe = computed(() => this.linhas().find(l => l.id === this.detalheId()) ?? null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    equipamentoId: ['', Validators.required],
    tipoManutencao: ['', Validators.required],
    dataProgramada: ['', Validators.required],
    tecnicoId: ['', Validators.required],
    frequencia: ['Mensal' as Frequencia, Validators.required],
    ultimaManutencao: [''],
    situacao: ['Ativo' as SituacaoPlano, Validators.required],
    observacoes: [''],
  });

  readonly formExec = this.fb.nonNullable.group({
    data: [hoje(), Validators.required],
    observacao: [''],
  });

  /** Pré-visualização da próxima data enquanto o usuário preenche o formulário. */
  private readonly valores = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  readonly proximaPrevista = computed(() => {
    const v = this.valores();
    if (!v.dataProgramada || !v.frequencia) return '';
    return this.svc.calcularProxima(v.dataProgramada, v.ultimaManutencao || null, v.frequencia);
  });

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }
  limparFiltros() { this.busca.set(''); this.fStatus.set(''); this.fFrequencia.set(''); this.fTecnico.set(''); }

  textoDias(p: LinhaPreventiva): string {
    if (p.status === 'Suspensa') return 'Plano suspenso';
    if (p.dias === 0) return 'Vence hoje';
    if (p.dias < 0) return `${Math.abs(p.dias)} dia(s) em atraso`;
    return `em ${p.dias} dia(s)`;
  }

  novo() {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ equipamentoId: '', tipoManutencao: '', dataProgramada: somarDias(hoje(), 7), tecnicoId: '', frequencia: 'Mensal', ultimaManutencao: '', situacao: 'Ativo', observacoes: '' });
    this.formAberto.set(true);
  }

  editar(p: Preventiva) {
    this.detalheId.set(null);
    this.editandoId.set(p.id);
    this.enviado.set(false);
    this.form.reset({
      equipamentoId: p.equipamentoId, tipoManutencao: p.tipoManutencao, dataProgramada: p.dataProgramada,
      tecnicoId: p.tecnicoId ?? '', frequencia: p.frequencia, ultimaManutencao: p.ultimaManutencao ?? '',
      situacao: p.situacao, observacoes: p.observacoes,
    });
    this.formAberto.set(true);
  }

  salvar() {
    this.enviado.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notif.erro('Verifique os campos obrigatórios destacados.', 'Formulário incompleto');
      return;
    }
    const v = this.form.getRawValue();
    const dados = { ...v, tecnicoId: v.tecnicoId || null, ultimaManutencao: v.ultimaManutencao || null };
    const id = this.editandoId();
    if (id) {
      this.svc.atualizar(id, dados);
      this.notif.sucesso('Programação preventiva atualizada.');
    } else {
      this.svc.criar(dados);
      this.notif.sucesso(`Preventiva programada para ${this.eqSvc.rotulo(dados.equipamentoId)}.`);
    }
    this.formAberto.set(false);
  }

  async excluir(p: Preventiva) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir programação',
      mensagem: `Excluir o plano "${p.tipoManutencao}" de ${this.eqSvc.rotulo(p.equipamentoId)}?`,
      textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(p.id);
    this.detalheId.set(null);
    this.notif.sucesso('Programação excluída.');
  }

  abrirExecucao(p: LinhaPreventiva) {
    this.detalheId.set(null);
    this.formExec.reset({ data: hoje(), observacao: '' });
    this.executando.set(p);
  }

  registrarExecucao() {
    const p = this.executando();
    if (!p) return;
    const { data, observacao } = this.formExec.getRawValue();
    if (!data) { this.notif.erro('Informe a data de execução.'); return; }
    if (data > hoje()) { this.notif.erro('A data de execução não pode estar no futuro.'); return; }
    this.svc.registrarExecucao(p.id, data, observacao.trim() || undefined);
    const nova = this.svc.obter(p.id);
    this.notif.sucesso(`Execução registrada. Próxima manutenção: ${nova?.proximaManutencao.split('-').reverse().join('/')}.`, 'Preventiva executada');
    this.executando.set(null);
  }

  async alternarSituacao(p: Preventiva) {
    const nova: SituacaoPlano = p.situacao === 'Ativo' ? 'Suspenso' : 'Ativo';
    this.svc.atualizar(p.id, {
      equipamentoId: p.equipamentoId, tipoManutencao: p.tipoManutencao, dataProgramada: p.dataProgramada,
      tecnicoId: p.tecnicoId, frequencia: p.frequencia, ultimaManutencao: p.ultimaManutencao,
      observacoes: p.observacoes, situacao: nova,
    });
    this.notif.info(`Plano ${nova === 'Ativo' ? 'reativado' : 'suspenso'}.`);
  }

  gerarOS(p: LinhaPreventiva) {
    const jaExiste = this.osSvc.itens().some(o => o.equipamentoId === p.equipamentoId && o.tipo === 'Preventiva' && this.osSvc.estaAtiva(o) && o.descricao.includes(p.tipoManutencao));
    if (jaExiste) {
      this.notif.aviso('Já existe uma OS preventiva em aberto para este plano.');
      return;
    }
    const os = this.osSvc.criar({
      equipamentoId: p.equipamentoId, tipo: 'Preventiva', tecnicoId: p.tecnicoId,
      descricao: `${p.tipoManutencao} – plano preventivo ${p.frequencia.toLowerCase()}. ${p.observacoes}`.trim(),
      prioridade: p.status === 'Atrasada' ? 'Alta' : 'Média',
      prazo: p.proximaManutencao < hoje() ? somarDias(hoje(), 2) : p.proximaManutencao,
    }, 'Gerada a partir da programação preventiva.');
    this.notif.sucesso(`${os.numero} criada para a preventiva.`, 'Ordem de serviço gerada');
  }

  exportar() {
    exportarCSV('manutencao-preventiva.csv',
      ['Equipamento', 'Tipo', 'Data programada', 'Responsável', 'Frequência', 'Última', 'Próxima', 'Status'],
      this.filtradas().map(p => [this.eqSvc.rotulo(p.equipamentoId), p.tipoManutencao, p.dataProgramada, this.tecSvc.nome(p.tecnicoId), p.frequencia, p.ultimaManutencao ?? '', p.proximaManutencao, p.status]));
    this.notif.info(`${this.filtradas().length} programação(ões) exportada(s).`, 'Exportação concluída');
  }
}
