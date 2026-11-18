import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import {
  ConfirmacaoService, ConfiguracaoService, CorretivaService, EquipamentoService, NotificacaoService,
  OrdemServicoService, TecnicoService
} from '../../core/services';
import { Corretiva, StatusCorretiva } from '../../core/models';
import { STATUS_CORRETIVA } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { agoraISO, diferencaHoras, hoje, paraDataHoraLocal, somarDias } from '../../shared/utils/datas';
import { exportarCSV } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-corretiva',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, DecimalPipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './corretiva.component.html',
  styleUrl: './corretiva.component.css',
})
export class CorretivaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(CorretivaService);
  readonly eqSvc = inject(EquipamentoService);
  readonly tecSvc = inject(TecnicoService);
  readonly osSvc = inject(OrdemServicoService);
  readonly config = inject(ConfiguracaoService);

  readonly etapas = STATUS_CORRETIVA;

  readonly busca = signal('');
  readonly fStatus = signal('');
  readonly fPrioridade = signal('');
  readonly fEquip = signal('');

  readonly filtradas = computed(() => {
    const termo = this.busca().trim();
    return this.svc.itens()
      .filter(c => !termo || contem(c.descricaoFalha, termo) || contem(c.causa, termo) || contem(this.eqSvc.rotulo(c.equipamentoId), termo) || contem(this.tecSvc.nome(c.tecnicoId), termo))
      .filter(c => !this.fStatus() || (this.fStatus() === '__andamento' ? c.status !== 'Concluída' : c.status === this.fStatus()))
      .filter(c => !this.fPrioridade() || c.prioridade === this.fPrioridade())
      .filter(c => !this.fEquip() || c.equipamentoId === this.fEquip())
      .sort((a, b) => (a.status === 'Concluída' ? 1 : 0) - (b.status === 'Concluída' ? 1 : 0)
        || this.config.pesoPrioridade(b.prioridade) - this.config.pesoPrioridade(a.prioridade)
        || b.dataOcorrencia.localeCompare(a.dataOcorrencia));
  });

  readonly indicadores = computed(() => {
    const l = this.svc.itens();
    const concl = l.filter(c => c.status === 'Concluída' && c.dataConclusao);
    const mttr = concl.length ? concl.reduce((s, c) => s + diferencaHoras(c.dataOcorrencia, c.dataConclusao!), 0) / concl.length : 0;
    return {
      andamento: l.filter(c => c.status !== 'Concluída').length,
      aguardandoPecas: l.filter(c => c.status === 'Aguardando peças').length,
      concluidas: concl.length,
      parada: l.reduce((s, c) => s + (c.tempoParadaHoras || 0), 0),
      mttr,
    };
  });

  // Modais
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly andamentoId = signal<string | null>(null);
  readonly andamentoItem = computed(() => this.svc.obter(this.andamentoId()) ?? null);
  readonly detalheId = signal<string | null>(null);
  readonly detalhe = computed(() => this.svc.obter(this.detalheId()) ?? null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    equipamentoId: ['', Validators.required],
    descricaoFalha: ['', [Validators.required, naoVazio, Validators.minLength(5)]],
    dataOcorrencia: ['', Validators.required],
    prioridade: ['Alta', Validators.required],
    tecnicoId: [''],
    tempoParadaHoras: [0, [Validators.required, Validators.min(0)]],
    causa: [''],
    solucao: [''],
    status: ['Aberta' as StatusCorretiva, Validators.required],
    marcarEquipamento: [true],
  });

  readonly formAnd = this.fb.nonNullable.group({
    status: ['Em diagnóstico' as StatusCorretiva, Validators.required],
    nota: ['', [Validators.required, naoVazio]],
    causa: [''],
    solucao: [''],
    tempoParadaHoras: [0, [Validators.min(0)]],
    liberarEquipamento: [true],
  });

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }
  limparFiltros() { this.busca.set(''); this.fStatus.set(''); this.fPrioridade.set(''); this.fEquip.set(''); }

  /** Percentual de avanço conforme a etapa atual. */
  progresso(c: Corretiva): number {
    const mapa: Record<StatusCorretiva, number> = { 'Aberta': 10, 'Em diagnóstico': 35, 'Em reparo': 65, 'Aguardando peças': 55, 'Concluída': 100 };
    return mapa[c.status];
  }
  tomProgresso(c: Corretiva): string {
    return c.status === 'Concluída' ? '' : c.status === 'Aguardando peças' ? 'warning' : c.prioridade === this.config.prioridadeCritica() ? 'danger' : 'info';
  }
  etapaIndex(s: StatusCorretiva) { return ['Aberta', 'Em diagnóstico', 'Em reparo', 'Concluída'].indexOf(s === 'Aguardando peças' ? 'Em reparo' : s); }

  novo() {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ equipamentoId: '', descricaoFalha: '', dataOcorrencia: paraDataHoraLocal(agoraISO()), prioridade: 'Alta', tecnicoId: '', tempoParadaHoras: 0, causa: '', solucao: '', status: 'Aberta', marcarEquipamento: true });
    this.formAberto.set(true);
  }

  editar(c: Corretiva) {
    this.detalheId.set(null);
    this.editandoId.set(c.id);
    this.enviado.set(false);
    this.form.reset({
      equipamentoId: c.equipamentoId, descricaoFalha: c.descricaoFalha, dataOcorrencia: paraDataHoraLocal(c.dataOcorrencia),
      prioridade: c.prioridade, tecnicoId: c.tecnicoId ?? '', tempoParadaHoras: c.tempoParadaHoras, causa: c.causa,
      solucao: c.solucao, status: c.status, marcarEquipamento: false,
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
    const { marcarEquipamento, ...v } = this.form.getRawValue();
    const ocorrencia = new Date(v.dataOcorrencia);
    if (ocorrencia.getTime() > Date.now() + 60_000) {
      this.notif.erro('A data da ocorrência não pode estar no futuro.');
      return;
    }
    if (v.status === 'Concluída' && !v.solucao.trim()) {
      this.notif.erro('Informe a solução aplicada para concluir a corretiva.');
      return;
    }
    const dados = {
      ...v, dataOcorrencia: ocorrencia.toISOString(), tecnicoId: v.tecnicoId || null,
      tempoParadaHoras: Number(v.tempoParadaHoras) || 0, descricaoFalha: v.descricaoFalha.trim(),
      ordemServicoId: this.editandoId() ? this.svc.obter(this.editandoId())?.ordemServicoId : undefined,
    };
    const id = this.editandoId();
    if (id) {
      this.svc.atualizar(id, dados);
      this.notif.sucesso('Registro de manutenção corretiva atualizado.');
    } else {
      this.svc.criar(dados);
      if (marcarEquipamento && v.status !== 'Concluída') {
        this.eqSvc.alterarSituacao(v.equipamentoId, v.prioridade === this.config.prioridadeCritica() ? 'Crítico' : 'Em manutenção');
      }
      this.notif.sucesso(`Falha registrada para ${this.eqSvc.rotulo(v.equipamentoId)}.`, 'Corretiva aberta');
    }
    this.formAberto.set(false);
  }

  abrirAndamento(c: Corretiva) {
    this.detalheId.set(null);
    const idx = this.etapas.indexOf(c.status);
    const proximo = c.status === 'Aguardando peças' ? 'Em reparo' : this.etapas[Math.min(idx + 1, this.etapas.length - 1)];
    this.formAnd.reset({ status: proximo === 'Aguardando peças' ? 'Concluída' : proximo, nota: '', causa: c.causa, solucao: c.solucao, tempoParadaHoras: c.tempoParadaHoras, liberarEquipamento: true });
    this.andamentoId.set(c.id);
  }

  registrarAndamento() {
    const c = this.andamentoItem();
    if (!c) return;
    if (this.formAnd.invalid) {
      this.formAnd.markAllAsTouched();
      this.notif.erro('Descreva o andamento (nota obrigatória).');
      return;
    }
    const v = this.formAnd.getRawValue();
    if (v.status === 'Concluída' && (!v.causa.trim() || !v.solucao.trim())) {
      this.notif.erro('Para concluir, informe a causa identificada e a solução aplicada.');
      return;
    }
    this.svc.registrarAndamento(c.id, v.status, v.nota.trim(), {
      causa: v.causa.trim(), solucao: v.solucao.trim(), tempoParadaHoras: Number(v.tempoParadaHoras) || 0,
    });
    if (v.status === 'Concluída' && v.liberarEquipamento) {
      this.eqSvc.atualizar(c.equipamentoId, { situacao: 'Em operação', ultimaManutencao: hoje() });
    }
    this.notif.sucesso(`Andamento registrado: ${v.status}.`);
    this.andamentoId.set(null);
  }

  gerarOS(c: Corretiva) {
    if (c.ordemServicoId && this.osSvc.obter(c.ordemServicoId)) {
      this.router.navigate(['/ordens-servico'], { queryParams: { ver: c.ordemServicoId } });
      return;
    }
    const horas = this.config.prioridade(c.prioridade)?.prazoHoras ?? 72;
    const os = this.osSvc.criar({
      equipamentoId: c.equipamentoId, tipo: 'Corretiva', descricao: c.descricaoFalha, tecnicoId: c.tecnicoId,
      prioridade: c.prioridade, prazo: somarDias(hoje(), Math.max(1, Math.ceil(horas / 24))),
    }, 'Gerada a partir do registro de manutenção corretiva.');
    this.svc.vincularOS(c.id, os.id);
    this.notif.sucesso(`${os.numero} gerada e vinculada à corretiva.`, 'Ordem de serviço criada');
  }

  async excluir(c: Corretiva) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir registro corretivo', mensagem: `Excluir a corretiva "${c.descricaoFalha}" (${this.eqSvc.rotulo(c.equipamentoId)})?`,
      textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(c.id);
    this.detalheId.set(null);
    this.notif.sucesso('Registro corretivo excluído.');
  }

  numeroOS(id?: string) { return id ? this.osSvc.obter(id)?.numero ?? '' : ''; }

  exportar() {
    exportarCSV('manutencao-corretiva.csv',
      ['Equipamento', 'Falha', 'Ocorrência', 'Prioridade', 'Técnico', 'Tempo de parada (h)', 'Causa', 'Solução', 'Status', 'OS'],
      this.filtradas().map(c => [this.eqSvc.rotulo(c.equipamentoId), c.descricaoFalha, new Date(c.dataOcorrencia).toLocaleString('pt-BR'), c.prioridade, this.tecSvc.nome(c.tecnicoId), c.tempoParadaHoras, c.causa, c.solucao, c.status, this.numeroOS(c.ordemServicoId)]));
    this.notif.info(`${this.filtradas().length} registro(s) exportado(s).`, 'Exportação concluída');
  }
}
