import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BadgeComponent, EmptyStateComponent, IconComponent, ModalComponent, PageHeaderComponent } from '../../shared/components';
import {
  ConfirmacaoService, ConfiguracaoService, EquipamentoService, EstoqueService, NotificacaoService, OrdemServicoService
} from '../../core/services';
import { NivelEstoque, Peca, TipoMovimentacao } from '../../core/models';
import { UNIDADES } from '../../core/constants/opcoes';
import { campoInvalido, mensagemErro, naoVazio, unico } from '../../shared/utils/formulario';
import { contem } from '../../shared/utils/codigos';
import { exportarCSV } from '../../shared/utils/exportacao';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, DatePipe, DecimalPipe, PageHeaderComponent, BadgeComponent, IconComponent, ModalComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estoque.component.html',
  styleUrl: './estoque.component.css',
})
export class EstoqueComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  readonly svc = inject(EstoqueService);
  readonly osSvc = inject(OrdemServicoService);
  readonly eqSvc = inject(EquipamentoService);
  readonly config = inject(ConfiguracaoService);

  readonly unidades = UNIDADES;
  readonly niveis: NivelEstoque[] = ['Normal', 'Baixo', 'Zerado'];

  readonly busca = signal('');
  readonly fCategoria = signal('');
  readonly fNivel = signal('');
  readonly fFornecedor = signal('');

  readonly fornecedores = computed(() => [...new Set(this.svc.itens().map(p => p.fornecedor))].sort());

  readonly filtradas = computed(() => {
    const termo = this.busca().trim();
    return this.svc.itens()
      .filter(p => !termo || contem(p.nome, termo) || contem(p.codigo, termo) || contem(p.fornecedor, termo) || contem(p.localizacao, termo))
      .filter(p => !this.fCategoria() || p.categoria === this.fCategoria())
      .filter(p => !this.fNivel() || this.svc.nivel(p) === this.fNivel())
      .filter(p => !this.fFornecedor() || p.fornecedor === this.fFornecedor())
      .sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  readonly resumo = computed(() => this.niveis.map(n => ({ n, qtd: this.svc.itens().filter(p => this.svc.nivel(p) === n).length })));

  readonly osAtivas = computed(() => this.osSvc.itens().filter(o => this.osSvc.estaAtiva(o)));

  // Modais
  readonly formAberto = signal(false);
  readonly editandoId = signal<string | null>(null);
  readonly movId = signal<string | null>(null);
  readonly movPeca = computed(() => this.svc.obter(this.movId()) ?? null);
  readonly histId = signal<string | null>(null);
  readonly histPeca = computed(() => this.svc.obter(this.histId()) ?? null);
  readonly enviado = signal(false);

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, naoVazio, unico(() => this.svc.codigos(this.editandoId() ?? undefined))]],
    nome: ['', [Validators.required, naoVazio]],
    categoria: ['', Validators.required],
    quantidade: [0, [Validators.required, Validators.min(0)]],
    estoqueMinimo: [1, [Validators.required, Validators.min(0)]],
    unidade: ['un', Validators.required],
    localizacao: ['', [Validators.required, naoVazio]],
    fornecedor: ['', [Validators.required, naoVazio]],
  });

  readonly formMov = this.fb.nonNullable.group({
    tipo: ['Entrada' as TipoMovimentacao, Validators.required],
    quantidade: [1, [Validators.required, Validators.min(0.01)]],
    motivo: ['', [Validators.required, naoVazio]],
    ordemServico: [''],
  });

  inv(c: string) { return campoInvalido(this.form, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.form, c); }
  limparFiltros() { this.busca.set(''); this.fCategoria.set(''); this.fNivel.set(''); this.fFornecedor.set(''); }

  nivel(p: Peca) { return this.svc.nivel(p); }

  /** Percentual do saldo em relação ao dobro do mínimo (para a barra visual). */
  percentual(p: Peca): number {
    const ref = Math.max(p.estoqueMinimo * 2, 1);
    return Math.min(100, Math.round((p.quantidade / ref) * 100));
  }
  tomBarra(p: Peca) { const n = this.nivel(p); return n === 'Zerado' ? 'danger' : n === 'Baixo' ? 'warning' : ''; }

  novo() {
    this.editandoId.set(null);
    this.enviado.set(false);
    this.form.reset({ codigo: this.svc.proximoCodigo(), nome: '', categoria: '', quantidade: 0, estoqueMinimo: 1, unidade: 'un', localizacao: '', fornecedor: '' });
    this.formAberto.set(true);
  }

  editar(p: Peca) {
    this.histId.set(null);
    this.editandoId.set(p.id);
    this.enviado.set(false);
    const { id, movimentacoes, ...dados } = p;
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
    const dados = { ...v, codigo: v.codigo.trim().toUpperCase(), nome: v.nome.trim(), quantidade: Number(v.quantidade), estoqueMinimo: Number(v.estoqueMinimo) };
    const id = this.editandoId();
    if (id) {
      this.svc.atualizar(id, dados);
      this.notif.sucesso(`Peça ${dados.codigo} atualizada.`);
    } else {
      this.svc.criar(dados);
      this.notif.sucesso(`Peça ${dados.codigo} cadastrada.`);
    }
    this.avisarNivel(dados);
    this.formAberto.set(false);
  }

  async excluir(p: Peca) {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Excluir peça', mensagem: `Excluir "${p.codigo} · ${p.nome}" e todo o seu histórico de movimentações?`,
      textoConfirmar: 'Excluir', perigo: true,
    });
    if (!ok) return;
    this.svc.excluir(p.id);
    this.histId.set(null);
    this.notif.sucesso(`Peça ${p.codigo} excluída.`);
  }

  abrirMov(p: Peca, tipo: TipoMovimentacao) {
    this.histId.set(null);
    this.formMov.reset({ tipo, quantidade: 1, motivo: tipo === 'Entrada' ? 'Recebimento de fornecedor' : 'Consumo em manutenção', ordemServico: '' });
    this.movId.set(p.id);
  }

  movimentar() {
    const p = this.movPeca();
    if (!p) return;
    if (this.formMov.invalid) {
      this.formMov.markAllAsTouched();
      this.notif.erro('Informe quantidade e motivo da movimentação.');
      return;
    }
    const v = this.formMov.getRawValue();
    const erro = this.svc.movimentar(p.id, v.tipo, Number(v.quantidade), v.motivo.trim(), v.ordemServico || undefined);
    if (erro) {
      this.notif.erro(erro, 'Movimentação não realizada');
      return;
    }
    const atual = this.svc.obter(p.id)!;
    this.notif.sucesso(`${v.tipo} de ${v.quantidade} ${p.unidade} · saldo atual: ${atual.quantidade} ${p.unidade}.`, 'Estoque movimentado');
    this.avisarNivel(atual);
    this.movId.set(null);
  }

  private avisarNivel(p: Pick<Peca, 'quantidade' | 'estoqueMinimo' | 'nome'>) {
    const n = this.svc.nivel(p);
    if (n === 'Zerado') this.notif.aviso(`${p.nome} está com estoque zerado.`, 'Estoque zerado');
    else if (n === 'Baixo') this.notif.aviso(`${p.nome} está abaixo do estoque mínimo.`, 'Estoque baixo');
  }

  exportar() {
    exportarCSV('estoque-pecas.csv',
      ['Código', 'Peça', 'Categoria', 'Quantidade', 'Estoque mínimo', 'Unidade', 'Localização', 'Fornecedor', 'Nível'],
      this.filtradas().map(p => [p.codigo, p.nome, p.categoria, p.quantidade, p.estoqueMinimo, p.unidade, p.localizacao, p.fornecedor, this.nivel(p)]));
    this.notif.info(`${this.filtradas().length} peça(s) exportada(s).`, 'Exportação concluída');
  }
}
