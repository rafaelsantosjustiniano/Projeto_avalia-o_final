import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import {
  ChamadoService, ConfirmacaoService, ConfiguracaoService, EquipamentoService, NotificacaoService,
  OrdemServicoService, TecnicoService
} from '../../core/services';
import { Chamado, StatusChamado, TipoManutencao } from '../../core/models';
import { STATUS_CHAMADO, TIPOS_MANUTENCAO } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { hoje, somarDias } from '../../shared/utils/datas';
import { exportarCSV } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-chamados',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chamados.component.html',
  styleUrl: './chamados.component.css',
})
export class ChamadosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(ChamadoService);
  readonly eqSvc = inject(EquipamentoService);
  readonly osSvc = inject(OrdemServicoService);
  readonly tecSvc = inject(TecnicoService);
  readonly config = inject(ConfiguracaoService);

  readonly statusLista = STATUS_CHAMADO;
  readonly tipos = TIPOS_MANUTENCAO;
  readonly agora = new Date();

  // Filtros
  readonly busca = signal('');
  readonly fStatus = signal('');
  readonly fPrioridade = signal('');
  readonly fCategoria = signal('');

  readonly critica = computed(() => this.config.prioridadeCritica());

  readonly filtrados = computed(() => {
    const termo = this.busca().trim();
    return this.svc.itens()
      .filter(c => !termo || contem(c.protocolo, termo) || contem(c.solicitante, termo) || contem(c.descricao, termo) || contem(this.eqSvc.rotulo(c.equipamentoId), termo))
      .filter(c => !this.fStatus() || (this.fStatus() === '__abertos' ? this.emAberto(c) : c.status === this.fStatus()))
      .filter(c => !this.fPrioridade() || c.prioridade === this.fPrioridade())
      .filter(c => !this.fCategoria() || c.categoria === this.fCategoria())
      .sort((a, b) => {
        // Críticos em aberto primeiro, depois mais recentes
        const pa = this.ehCritico(a) ? 1 : 0, pb = this.ehCritico(b) ? 1 : 0;
        return pb - pa || b.dataHora.localeCompare(a.dataHora);
      });
  });

  readonly criticosAbertos = computed(() => this.svc.itens().filter(c => this.ehCritico(c)));

  readonly contagem = computed(() => this.statusLista.map(s => ({ s, n: this.svc.itens().filter(c => c.status === s).length })));

  // Modais
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly detalheId = signal<string | null>(null);
  readonly detalhe = computed(() => this.svc.obter(this.detalheId()) ?? null);
  readonly convertendo = signal<Chamado | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    solicitante: ['', [Validators.required, naoVazio]],
    equipamentoId: ['', Validators.required],
    setor: ['', Validators.required],
    localizacao: ['', [Validators.required, naoVazio]],
    categoria: ['', Validators.required],
    descricao: ['', [Validators.required, naoVazio, Validators.minLength(10)]],
    prioridade: ['Média', Validators.required],
  });

  readonly formOS = this.fb.nonNullable.group({
    tipo: ['Corretiva' as TipoManutencao, Validators.required],
    tecnicoId: [''],
    prioridade: ['', Validators.required],
    prazo: ['', Validators.required],
    descricao: ['', [Validators.required, naoVazio]],
  });

  constructor() {
    // Ao escolher o equipamento, preenche setor e localização automaticamente
    this.form.controls.equipamentoId.valueChanges.pipe(takeUntilDestroyed()).subscribe(id => {
      const e = this.eqSvc.obter(id);
      if (e) this.form.patchValue({ setor: e.setor, localizacao: e.localizacao }, { emitEvent: false });
    });
  }

  emAberto(c: Chamado) { return c.status === 'Aberto' || c.status === 'Em análise'; }
  ehCritico(c: Chamado) { return c.prioridade === this.critica() && this.emAberto(c); }

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }

  limparFiltros() { this.busca.set(''); this.fStatus.set(''); this.fPrioridade.set(''); this.fCategoria.set(''); }

  novo() {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ solicitante: '', equipamentoId: '', setor: '', localizacao: '', categoria: '', descricao: '', prioridade: 'Média' });
    this.formAberto.set(true);
  }

  editar(c: Chamado) {
    this.detalheId.set(null);
    this.editandoId.set(c.id);
    this.enviado.set(false);
    this.form.reset({
      solicitante: c.solicitante, equipamentoId: c.equipamentoId, setor: c.setor, localizacao: c.localizacao,
      categoria: c.categoria, descricao: c.descricao, prioridade: c.prioridade,
    }, { emitEvent: false });
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
    const dados = { ...v, solicitante: v.solicitante.trim(), descricao: v.descricao.trim() };
    const id = this.editandoId();
    if (id) {
      this.svc.atualizar(id, dados);
      this.notif.sucesso('Chamado atualizado.');
    } else {
      const c = this.svc.criar(dados);
      if (c.prioridade === this.critica()) {
        this.notif.aviso(`Chamado CRÍTICO ${c.protocolo} registrado. Equipe de manutenção deve ser acionada imediatamente.`, 'Chamado crítico');
      } else {
        this.notif.sucesso(`Chamado registrado com o protocolo ${c.protocolo}.`, 'Chamado aberto');
      }
    }
    this.formAberto.set(false);
  }

  alterarStatus(c: Chamado, status: StatusChamado) {
    this.svc.alterarStatus(c.id, status);
    this.notif.sucesso(`Chamado ${c.protocolo}: ${status}.`);
  }

  async cancelar(c: Chamado) {
    const ok = await this.confirmacao.confirmar({ titulo: 'Cancelar chamado', mensagem: `Cancelar o chamado ${c.protocolo}?`, textoConfirmar: 'Cancelar chamado', textoCancelar: 'Voltar', perigo: true });
    if (ok) this.alterarStatus(c, 'Cancelado');
  }

  async excluir(c: Chamado) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir chamado', mensagem: `Deseja excluir o chamado ${c.protocolo}?${c.ordemServicoId ? '\nA OS gerada a partir dele será mantida.' : ''}`,
      textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(c.id);
    this.detalheId.set(null);
    this.notif.sucesso(`Chamado ${c.protocolo} excluído.`);
  }

  // ------------------------------------------------------------------
  // Conversão em ordem de serviço
  // ------------------------------------------------------------------
  abrirConversao(c: Chamado) {
    this.detalheId.set(null);
    const horas = this.config.prioridade(c.prioridade)?.prazoHoras ?? 72;
    this.formOS.reset({
      tipo: 'Corretiva', tecnicoId: '', prioridade: c.prioridade,
      prazo: somarDias(hoje(), Math.max(1, Math.ceil(horas / 24))),
      descricao: `[${c.categoria}] ${c.descricao}`,
    });
    this.convertendo.set(c);
  }

  converter() {
    const c = this.convertendo();
    if (!c) return;
    if (this.formOS.invalid) {
      this.formOS.markAllAsTouched();
      this.notif.erro('Preencha os campos obrigatórios da OS.');
      return;
    }
    const v = this.formOS.getRawValue();
    const os = this.osSvc.criar(
      { equipamentoId: c.equipamentoId, tipo: v.tipo, descricao: v.descricao.trim(), tecnicoId: v.tecnicoId || null, prioridade: v.prioridade, prazo: v.prazo, chamadoId: c.id },
      `Gerada a partir do chamado ${c.protocolo} (solicitante: ${c.solicitante}).`
    );
    this.svc.vincularOS(c.id, os.id);
    this.convertendo.set(null);
    this.notif.sucesso(`Chamado ${c.protocolo} convertido na ${os.numero}.`, 'Ordem de serviço criada');
  }

  verOS(c: Chamado) {
    if (c.ordemServicoId) this.router.navigate(['/ordens-servico'], { queryParams: { ver: c.ordemServicoId } });
  }

  numeroOS(id?: string) {
    return id ? this.osSvc.obter(id)?.numero ?? 'OS removida' : '';
  }

  exportar() {
    exportarCSV('chamados.csv',
      ['Protocolo', 'Data/Hora', 'Solicitante', 'Equipamento', 'Setor', 'Localização', 'Categoria', 'Descrição', 'Prioridade', 'Status', 'OS'],
      this.filtrados().map(c => [c.protocolo, new Date(c.dataHora).toLocaleString('pt-BR'), c.solicitante, this.eqSvc.rotulo(c.equipamentoId), c.setor, c.localizacao, c.categoria, c.descricao, c.prioridade, c.status, this.numeroOS(c.ordemServicoId)]));
    this.notif.info(`${this.filtrados().length} chamado(s) exportado(s).`, 'Exportação concluída');
  }
}
