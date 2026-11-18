import { effect, inject, Injectable, signal } from '@angular/core';
import { Configuracao, PrioridadeConfig } from '../models';
import { ApiService } from './api.service';
import { configuracaoPadrao } from '../data/padroes';

/** Configurações gerais da empresa/unidade e cadastros auxiliares. Banco: /api/configuracao */
@Injectable({ providedIn: 'root' })
export class ConfiguracaoService {
  private readonly api = inject(ApiService);
  private readonly _config = signal<Configuracao>({ ...configuracaoPadrao(), ...(this.api.inicial('configuracao') ?? {}) });

  readonly config = this._config.asReadonly();

  constructor() {
    // Aplica o tema sempre que a configuração mudar
    effect(() => document.documentElement.setAttribute('data-theme', this._config().tema));
  }

  atualizar(alteracoes: Partial<Configuracao>) {
    this._config.update(c => ({ ...c, ...alteracoes }));
    this.api.salvarConfiguracao(this._config());
  }

  alternarTema() {
    this.atualizar({ tema: this._config().tema === 'dark' ? 'light' : 'dark' });
  }

  nomesPrioridades(): string[] {
    return this._config().prioridades.map(p => p.nome);
  }

  prioridade(nome: string): PrioridadeConfig | undefined {
    return this._config().prioridades.find(p => p.nome === nome);
  }

  /** Peso para ordenação (quanto maior, mais urgente). */
  pesoPrioridade(nome: string): number {
    const idx = this._config().prioridades.findIndex(p => p.nome === nome);
    return idx < 0 ? 0 : idx + 1;
  }

  /** Prioridade considerada crítica (a de maior peso). */
  prioridadeCritica(): string {
    const l = this._config().prioridades;
    return l.length ? l[l.length - 1].nome : 'Crítica';
  }
}
