import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import {
  ChamadoService, ConfirmacaoService, ConfiguracaoService, EquipamentoService, NotificacaoService,
  OrdemServicoService, TecnicoService
} from '../../core/services';
import { OrdemServico, StatusOS, TipoManutencao } from '../../core/models';
import { STATUS_OS, TIPOS_MANUTENCAO } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { hoje, somarDias } from '../../shared/utils/datas';
import { exportarCSV } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ordens-servico.component.html',
  styleUrl: './ordens-servico.component.css',
})
export class OrdensServicoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(OrdemServicoService);
  readonly eqSvc = inject(EquipamentoService);
  readonly tecSvc = inject(TecnicoService);
  readonly chSvc = inject(ChamadoService);
  readonly config = inject(ConfiguracaoService);

  /** Parâmetros de URL: ?novo=<equipamentoId> abre o formulário; ?status= filtra. */
  readonly novoParam = input<string | undefined>(undefined, { alias: 'novo' });
  readonly statusParam = input<string | undefined>(undefined, { alias: 'status' });
  readonly verParam = input<string | undefined>(undefined, { alias: 'ver' });

  readonly statusLista = STATUS_OS;
  readonly tipos = TIPOS_MANUTENCAO;
  readonly hoje = hoje();

  // Filtros
  readonly busca = signal('');
  readonly fStatus = signal('');
  readonly fPrioridade = signal('');
  readonly fTipo = signal('');
  readonly fTecnico = signal('');

  readonly filtradas = computed(() => {
    const termo = this.busca().trim();
    return this.svc.itens()
      .filter(o => !termo || contem(o.numero, termo) || contem(o.descricao, termo) || contem(this.eqSvc.rotulo(o.equipamentoId), termo) || contem(this.tecSvc.nome(o.tecnicoId), termo))
      .filter(o => !this.fStatus() || (this.fStatus() === '__ativas' ? this.svc.estaAtiva(o) : o.status === this.fStatus()))
      .filter(o => !this.fPrioridade() || o.prioridade === this.fPrioridade())
      .filter(o => !this.fTipo() || o.tipo === this.fTipo())
      .filter(o => !this.fTecnico() || (this.fTecnico() === '__sem' ? !o.tecnicoId : o.tecnicoId === this.fTecnico()))
      .sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
  });

  readonly resumo = computed(() => {
    const l = this.svc.itens();
    const n = (s: StatusOS) => l.filter(o => o.status === s).length;
    return [
      { rotulo: 'Em aberto', valor: l.filter(o => this.svc.estaAtiva(o)).length, filtro: '__ativas', tom: 'info' },
      { rotulo: 'Em execução', valor: n('Em execução'), filtro: 'Em execução', tom: 'orange' },
      { rotulo: 'Aguardando peças', valor: n('Aguardando peças'), filtro: 'Aguardando peças', tom: 'purple' },
      { rotulo: 'Atrasadas', valor: n('Atrasada'), filtro: 'Atrasada', tom: 'danger' },
      { rotulo: 'Concluídas', valor: n('Concluída'), filtro: 'Concluída', tom: 'success' },
    ];
  });

  // Modais
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly detalheId = signal<string | null>(null);
  readonly detalhe = computed(() => this.svc.obter(this.detalheId()) ?? null);
  readonly statusOS = signal<OrdemServico | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    equipamentoId: ['', Validators.required],
    tipo: ['Corretiva' as TipoManutencao, Validators.required],
    descricao: ['', [Validators.required, naoVazio, Validators.minLength(5)]],
    tecnicoId: [''],
    prioridade: ['Média', Validators.required],
    prazo: ['', Validators.required],
    status: ['Aberta' as StatusOS, Validators.required],
    observacao: [''],
  });

  readonly formStatus = this.fb.nonNullable.group({
    status: ['Aberta' as StatusOS, Validators.required],
    observacao: [''],
  });

  constructor() {
    // Sugere o prazo conforme o SLA da prioridade (apenas em novas OS)
    this.form.controls.prioridade.valueChanges.pipe(takeUntilDestroyed()).subscribe(p => {
      if (!this.editandoId()) this.form.controls.prazo.setValue(this.prazoSugerido(p));
    });
  }

  ngOnInit(): void {
    const s = this.statusParam();
    if (s) this.fStatus.set(s);
    const eq = this.novoParam();
    if (eq) {
      this.novo(eq);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
    const ver = this.verParam();
    if (ver && this.svc.obter(ver)) this.detalheId.set(ver);
  }

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }

  limparFiltros() {
    this.busca.set(''); this.fStatus.set(''); this.fPrioridade.set(''); this.fTipo.set(''); this.fTecnico.set('');
  }

  prazoSugerido(prioridade: string): string {
    const horas = this.config.prioridade(prioridade)?.prazoHoras ?? 72;
    return somarDias(hoje(), Math.max(1, Math.ceil(horas / 24)));
  }

  vencida(o: OrdemServico) { return this.svc.prazoVencido(o); }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------
  novo(equipamentoId = '') {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ equipamentoId, tipo: 'Corretiva', prioridade: 'Média', prazo: this.prazoSugerido('Média'), status: 'Aberta', tecnicoId: '', descricao: '', observacao: '' });
    this.formAberto.set(true);
  }

  editar(o: OrdemServico) {
    this.detalheId.set(null);
    this.editandoId.set(o.id);
    this.enviado.set(false);
    this.form.reset({
      equipamentoId: o.equipamentoId, tipo: o.tipo, descricao: o.descricao, tecnicoId: o.tecnicoId ?? '',
      prioridade: o.prioridade, prazo: o.prazo, status: o.status, observacao: '',
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
    const { observacao, ...v } = this.form.getRawValue();
    const dados = { ...v, descricao: v.descricao.trim(), tecnicoId: v.tecnicoId || null };
    const id = this.editandoId();
    if (id) {
      const os = this.svc.atualizar(id, dados, observacao.trim() || undefined);
      this.notif.sucesso(`${os?.numero} atualizada. Alterações registradas no histórico.`);
    } else {
      if (dados.prazo < hoje()) {
        this.notif.erro('O prazo de conclusão não pode ser anterior à data de abertura.', 'Prazo inválido');
        return;
      }
      const os = this.svc.criar(dados, observacao.trim() || undefined);
      this.notif.sucesso(`Ordem de serviço ${os.numero} criada.`);
    }
    this.formAberto.set(false);
  }

  abrirStatus(o: OrdemServico) {
    this.formStatus.reset({ status: o.status, observacao: '' });
    this.statusOS.set(o);
  }

  salvarStatus() {
    const o = this.statusOS();
    if (!o) return;
    const { status, observacao } = this.formStatus.getRawValue();
    if (status === o.status && !observacao.trim()) {
      this.notif.aviso('Selecione um novo status ou registre uma observação.');
      return;
    }
    this.svc.alterarStatus(o.id, status, observacao.trim() || undefined);
    this.notif.sucesso(status !== o.status ? `${o.numero}: ${o.status} → ${status}.` : `Observação registrada em ${o.numero}.`, 'Histórico atualizado');
    this.statusOS.set(null);
  }

  /** Atalho: avança para o próximo status lógico. */
  iniciar(o: OrdemServico) {
    if (!o.tecnicoId) {
      this.notif.aviso('Atribua um técnico antes de iniciar a execução.');
      this.editar(o);
      return;
    }
    this.svc.alterarStatus(o.id, 'Em execução');
    this.tecSvc.alterarSituacao(o.tecnicoId, 'Em atendimento');
    this.notif.sucesso(`${o.numero} em execução.`);
  }

  async concluir(o: OrdemServico) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Concluir ordem de serviço',
      mensagem: `Confirmar a conclusão da ${o.numero}?${o.chamadoId ? '\nO chamado de origem será marcado como resolvido.' : ''}`,
      textoConfirmar: 'Concluir',
    });
    if (!ok) return;
    this.svc.alterarStatus(o.id, 'Concluída', 'Serviço concluído.');
    // Libera o técnico se não houver outra OS em execução com ele
    if (o.tecnicoId && !this.svc.itens().some(x => x.tecnicoId === o.tecnicoId && x.status === 'Em execução')) {
      this.tecSvc.alterarSituacao(o.tecnicoId, 'Disponível');
    }
    this.notif.sucesso(`${o.numero} concluída.`);
  }

  async excluir(o: OrdemServico) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir ordem de serviço',
      mensagem: `Deseja excluir a ${o.numero}? O histórico desta OS também será removido.\nDica: para manter o registro, altere o status para "Cancelada".`,
      textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(o.id);
    this.detalheId.set(null);
    this.notif.sucesso(`${o.numero} excluída.`);
  }

  protocoloChamado(id?: string) {
    return id ? this.chSvc.obter(id)?.protocolo ?? 'Chamado removido' : '';
  }

  exportar() {
    exportarCSV('ordens-servico.csv',
      ['Número', 'Equipamento', 'Tipo', 'Descrição', 'Técnico', 'Prioridade', 'Abertura', 'Prazo', 'Status', 'Conclusão'],
      this.filtradas().map(o => [o.numero, this.eqSvc.rotulo(o.equipamentoId), o.tipo, o.descricao, this.tecSvc.nome(o.tecnicoId), o.prioridade,
        new Date(o.dataAbertura).toLocaleString('pt-BR'), o.prazo, o.status, o.dataConclusao ? new Date(o.dataConclusao).toLocaleString('pt-BR') : '']));
    this.notif.info(`${this.filtradas().length} OS exportada(s).`, 'Exportação concluída');
  }
}
