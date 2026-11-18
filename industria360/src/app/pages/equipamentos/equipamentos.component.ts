import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent
} from '../../shared/components';
import {
  ConfirmacaoService, ConfiguracaoService, CorretivaService, EquipamentoService, NotificacaoService,
  OrdemServicoService, PreventivaService, TecnicoService
} from '../../core/services';
import { Equipamento, SituacaoEquipamento } from '../../core/models';
import { SITUACOES_EQUIPAMENTO } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio, unico } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { diferencaDias, hoje } from '../../shared/utils/datas';
import { exportarCSV } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-equipamentos',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './equipamentos.component.html',
  styleUrl: './equipamentos.component.css',
})
export class EquipamentosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(EquipamentoService);
  readonly config = inject(ConfiguracaoService);
  readonly osSvc = inject(OrdemServicoService);
  private readonly prevSvc = inject(PreventivaService);
  private readonly corrSvc = inject(CorretivaService);
  readonly tecSvc = inject(TecnicoService);

  /** Filtro inicial vindo da URL (ex.: link dos cards do dashboard). */
  readonly situacao = input<string>();

  readonly situacoes = SITUACOES_EQUIPAMENTO;

  // Filtros
  readonly busca = signal('');
  readonly fCategoria = signal('');
  readonly fSetor = signal('');
  readonly fSituacao = signal('');

  readonly filtrados = computed(() => {
    const termo = this.busca().trim();
    return this.svc.itens()
      .filter(e => !termo || contem(e.nome, termo) || contem(e.codigo, termo) || contem(e.numeroSerie, termo) || contem(e.fabricante, termo))
      .filter(e => !this.fCategoria() || e.categoria === this.fCategoria())
      .filter(e => !this.fSetor() || e.setor === this.fSetor())
      .filter(e => !this.fSituacao() || e.situacao === this.fSituacao())
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly contagem = computed(() => {
    const m = this.svc.porSituacao();
    return this.situacoes.map(s => ({ s, n: m[s] }));
  });

  // Estado de modais
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly detalhe = signal<Equipamento | null>(null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, naoVazio, unico(() => this.svc.codigos(this.editandoId() ?? undefined))]],
    nome: ['', [Validators.required, naoVazio, Validators.maxLength(120)]],
    categoria: ['', Validators.required],
    fabricante: ['', [Validators.required, naoVazio]],
    modelo: ['', [Validators.required, naoVazio]],
    numeroSerie: ['', [Validators.required, naoVazio]],
    setor: ['', Validators.required],
    localizacao: ['', [Validators.required, naoVazio]],
    dataAquisicao: ['', Validators.required],
    ultimaManutencao: [''],
    proximaManutencao: [''],
    situacao: ['Disponível' as SituacaoEquipamento, Validators.required],
    descricao: [''],
  });

  ngOnInit(): void {
    const s = this.situacao();
    if (s && (this.situacoes as string[]).includes(s)) this.fSituacao.set(s);
  }

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }

  limparFiltros() {
    this.busca.set(''); this.fCategoria.set(''); this.fSetor.set(''); this.fSituacao.set('');
  }

  // ------------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------------
  novo() {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ codigo: this.svc.proximoCodigo(), situacao: 'Disponível', dataAquisicao: hoje() });
    this.formAberto.set(true);
  }

  editar(e: Equipamento) {
    this.detalhe.set(null);
    this.editandoId.set(e.id);
    this.enviado.set(false);
    const { id, criadoEm, ...dados } = e;
    this.form.reset(dados);
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
    if (v.ultimaManutencao && v.proximaManutencao && v.proximaManutencao < v.ultimaManutencao) {
      this.notif.erro('A próxima manutenção deve ser posterior à última manutenção.', 'Datas inconsistentes');
      return;
    }
    const dados = { ...v, codigo: v.codigo.trim().toUpperCase(), nome: v.nome.trim() };
    const id = this.editandoId();
    if (id) {
      this.svc.atualizar(id, dados);
      this.notif.sucesso(`Equipamento ${dados.codigo} atualizado.`);
    } else {
      this.svc.criar(dados);
      this.notif.sucesso(`Equipamento ${dados.codigo} cadastrado.`);
    }
    this.formAberto.set(false);
  }

  async excluir(e: Equipamento) {
    const osAtivas = this.osSvc.itens().filter(o => o.equipamentoId === e.id && this.osSvc.estaAtiva(o)).length;
    if (osAtivas) {
      this.notif.aviso(`${e.codigo} possui ${osAtivas} ordem(ns) de serviço em aberto. Conclua ou cancele antes de excluir.`, 'Exclusão bloqueada');
      return;
    }
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir equipamento',
      mensagem: `Deseja realmente excluir "${e.codigo} · ${e.nome}"?\nO histórico de OS e manutenções relacionadas permanecerá registrado.`,
      textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(e.id);
    this.detalhe.set(null);
    this.notif.sucesso(`Equipamento ${e.codigo} excluído.`);
  }

  // ------------------------------------------------------------------
  // Detalhes / apoio
  // ------------------------------------------------------------------
  readonly historico = computed(() => {
    const e = this.detalhe();
    if (!e) return { os: [], preventivas: [], corretivas: [] };
    return {
      os: this.osSvc.itens().filter(o => o.equipamentoId === e.id).sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura)),
      preventivas: this.prevSvc.itens().filter(p => p.equipamentoId === e.id).map(p => ({ ...p, status: this.prevSvc.status(p) })),
      corretivas: this.corrSvc.itens().filter(c => c.equipamentoId === e.id),
    };
  });

  /** Situação da próxima manutenção para destaque visual na tabela. */
  alertaManutencao(e: Equipamento): 'danger' | 'warning' | null {
    if (!e.proximaManutencao || e.situacao === 'Inativo') return null;
    const d = diferencaDias(hoje(), e.proximaManutencao);
    if (d < 0) return 'danger';
    if (d <= this.config.config().diasAlertaPreventiva) return 'warning';
    return null;
  }

  abrirOS(e: Equipamento) {
    this.router.navigate(['/ordens-servico'], { queryParams: { novo: e.id } });
  }

  exportar() {
    exportarCSV('equipamentos.csv',
      ['Código', 'Nome', 'Categoria', 'Fabricante', 'Modelo', 'Nº de série', 'Setor', 'Localização', 'Aquisição', 'Última manutenção', 'Próxima manutenção', 'Situação', 'Descrição'],
      this.filtrados().map(e => [e.codigo, e.nome, e.categoria, e.fabricante, e.modelo, e.numeroSerie, e.setor, e.localizacao, e.dataAquisicao, e.ultimaManutencao, e.proximaManutencao, e.situacao, e.descricao]));
    this.notif.info(`${this.filtrados().length} registro(s) exportado(s) para CSV.`, 'Exportação concluída');
  }
}
