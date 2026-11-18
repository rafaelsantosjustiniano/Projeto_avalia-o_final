import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent, ListaEditavelComponent, PageHeaderComponent } from '../../shared/components';
import {
  ChamadoService, ConfirmacaoService, ConfiguracaoService, CorretivaService, DadosService, EquipamentoService,
  EstoqueService, NotificacaoService, OrdemServicoService, PreventivaService, TecnicoService
} from '../../core/services';
import { Configuracao, PrioridadeConfig } from '../../core/models';
import { campoInvalido, mensagemErro, naoVazio } from '../../shared/utils/formulario';

type Aba = 'empresa' | 'setores' | 'categorias' | 'prioridades' | 'sistema' | 'dados';
type ListaConfig = 'setores' | 'categoriasEquipamento' | 'categoriasChamado' | 'categoriasPeca' | 'especialidades';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, PageHeaderComponent, IconComponent, ListaEditavelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './configuracoes.component.html',
  styleUrl: './configuracoes.component.css',
})
export class ConfiguracoesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly notif = inject(NotificacaoService);
  private readonly confirmacao = inject(ConfirmacaoService);
  private readonly dados = inject(DadosService);
  readonly config = inject(ConfiguracaoService);
  private readonly eqSvc = inject(EquipamentoService);
  private readonly osSvc = inject(OrdemServicoService);
  private readonly chSvc = inject(ChamadoService);
  private readonly prevSvc = inject(PreventivaService);
  private readonly corrSvc = inject(CorretivaService);
  private readonly estSvc = inject(EstoqueService);
  private readonly tecSvc = inject(TecnicoService);

  readonly aba = signal<Aba>('empresa');
  readonly abas: { id: Aba; rotulo: string; icone: string }[] = [
    { id: 'empresa', rotulo: 'Empresa e unidade', icone: 'fabrica' },
    { id: 'setores', rotulo: 'Setores', icone: 'camadas' },
    { id: 'categorias', rotulo: 'Categorias', icone: 'filtro' },
    { id: 'prioridades', rotulo: 'Prioridades', icone: 'alerta' },
    { id: 'sistema', rotulo: 'Configurações gerais', icone: 'config' },
    { id: 'dados', rotulo: 'Dados e backup', icone: 'arquivo' },
  ];

  readonly enviado = signal(false);

  readonly formEmpresa = this.fb.nonNullable.group({
    empresa: [this.config.config().empresa, [Validators.required, naoVazio]],
    unidade: [this.config.config().unidade, [Validators.required, naoVazio]],
    cnpj: [this.config.config().cnpj],
    endereco: [this.config.config().endereco],
  });

  readonly formSistema = this.fb.nonNullable.group({
    tema: [this.config.config().tema],
    diasAlertaPreventiva: [this.config.config().diasAlertaPreventiva, [Validators.required, Validators.min(1), Validators.max(90)]],
    atrasoAutomaticoOS: [this.config.config().atrasoAutomaticoOS],
    exibirAvisoDemo: [this.config.config().exibirAvisoDemo],
    horasOperacaoDia: [this.config.config().horasOperacaoDia, [Validators.required, Validators.min(1), Validators.max(24)]],
  });

  /** Cópia editável das prioridades (salva somente ao confirmar). */
  readonly prioridades = signal<PrioridadeConfig[]>(this.clonarPrioridades());

  readonly estatisticas = computed(() => [
    { rotulo: 'Equipamentos', n: this.eqSvc.itens().length, icone: 'equipamento' },
    { rotulo: 'Ordens de serviço', n: this.osSvc.itens().length, icone: 'os' },
    { rotulo: 'Chamados', n: this.chSvc.itens().length, icone: 'chamado' },
    { rotulo: 'Planos preventivos', n: this.prevSvc.itens().length, icone: 'calendario' },
    { rotulo: 'Corretivas', n: this.corrSvc.itens().length, icone: 'ferramenta' },
    { rotulo: 'Peças', n: this.estSvc.itens().length, icone: 'estoque' },
    { rotulo: 'Técnicos', n: this.tecSvc.itens().length, icone: 'equipe' },
  ]);
  readonly tamanho = signal(this.dados.tamanhoKB());

  inv(c: string) { return campoInvalido(this.formEmpresa, c, this.enviado()); }
  erro(c: string) { return mensagemErro(this.formEmpresa, c); }

  salvarEmpresa() {
    this.enviado.set(true);
    if (this.formEmpresa.invalid) {
      this.formEmpresa.markAllAsTouched();
      this.notif.erro('Nome da empresa e da unidade são obrigatórios.');
      return;
    }
    const v = this.formEmpresa.getRawValue();
    this.config.atualizar({ empresa: v.empresa.trim(), unidade: v.unidade.trim(), cnpj: v.cnpj.trim(), endereco: v.endereco.trim() });
    this.notif.sucesso('Dados da empresa e unidade salvos.');
  }

  /** Atualiza listas auxiliares (setores, categorias, especialidades). */
  atualizarLista(campo: ListaConfig, ev: { itens: string[]; acao: string; item: string }) {
    this.config.atualizar({ [campo]: ev.itens } as Partial<Configuracao>);
    this.tamanho.set(this.dados.tamanhoKB());
    if (ev.acao === 'removido') {
      this.notif.info(`"${ev.item}" removido. Registros existentes mantêm o valor anterior.`, 'Item removido');
    } else {
      this.notif.sucesso(`"${ev.item}" adicionado.`);
    }
  }

  // ------------------------------------------------------------------
  // Prioridades
  // ------------------------------------------------------------------
  private clonarPrioridades() { return this.config.config().prioridades.map(p => ({ ...p })); }

  adicionarPrioridade() {
    this.prioridades.update(l => [...l, { nome: '', cor: '#3B82F6', prazoHoras: 48 }]);
  }
  editarPrioridade(i: number, campo: keyof PrioridadeConfig, valor: string) {
    this.prioridades.update(l => l.map((p, idx) => idx === i ? { ...p, [campo]: campo === 'prazoHoras' ? Number(valor) : valor } : p));
  }
  removerPrioridade(i: number) {
    this.prioridades.update(l => l.filter((_, idx) => idx !== i));
  }
  mover(i: number, d: -1 | 1) {
    this.prioridades.update(l => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c;
    });
  }
  salvarPrioridades() {
    const l = this.prioridades().map(p => ({ ...p, nome: p.nome.trim() }));
    if (l.length < 2) { this.notif.erro('Cadastre ao menos duas prioridades.'); return; }
    if (l.some(p => !p.nome)) { this.notif.erro('Todas as prioridades precisam de um nome.'); return; }
    if (new Set(l.map(p => p.nome.toLowerCase())).size !== l.length) { this.notif.erro('Existem prioridades com nomes repetidos.'); return; }
    if (l.some(p => !(p.prazoHoras > 0))) { this.notif.erro('O prazo (SLA) deve ser maior que zero.'); return; }
    this.config.atualizar({ prioridades: l });
    this.prioridades.set(this.clonarPrioridades());
    this.notif.sucesso('Prioridades salvas. A última da lista é considerada crítica.');
  }
  descartarPrioridades() { this.prioridades.set(this.clonarPrioridades()); }

  // ------------------------------------------------------------------
  // Sistema e dados
  // ------------------------------------------------------------------
  salvarSistema() {
    if (this.formSistema.invalid) {
      this.formSistema.markAllAsTouched();
      this.notif.erro('Verifique os valores informados (alerta: 1–90 dias; operação: 1–24 h/dia).');
      return;
    }
    const v = this.formSistema.getRawValue();
    this.config.atualizar({ ...v, diasAlertaPreventiva: Number(v.diasAlertaPreventiva), horasOperacaoDia: Number(v.horasOperacaoDia) });
    if (v.atrasoAutomaticoOS) {
      const n = this.osSvc.verificarAtrasos();
      if (n) this.notif.aviso(`${n} OS marcada(s) como atrasada(s).`);
    }
    this.notif.sucesso('Configurações gerais salvas.');
  }

  exportarBackup() {
    this.dados.exportarBackup();
    this.notif.sucesso('Backup gerado. Guarde o arquivo JSON em local seguro.');
  }

  async importarBackup(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo) return;
    const ok = await this.confirmacao.confirmar({
      titulo: 'Importar backup', mensagem: `Os dados atuais serão substituídos pelo conteúdo de "${arquivo.name}". Continuar?`,
      textoConfirmar: 'Importar', perigo: true,
    });
    if (!ok) return;
    try {
      await this.dados.importarBackup(arquivo);
    } catch (e) {
      this.notif.erro(e instanceof Error ? e.message : 'Arquivo inválido.', 'Falha na importação');
    }
  }

  async restaurarDemo() {
    const ok = await this.confirmacao.confirmar({
      titulo: 'Restaurar dados de demonstração',
      mensagem: 'Todos os registros cadastrados neste navegador serão apagados e os dados de demonstração originais serão recarregados.\nEsta ação não pode ser desfeita.',
      textoConfirmar: 'Restaurar', perigo: true,
    });
    if (ok) this.dados.restaurarDemonstracao();
  }
}
