import { inject, Signal, signal } from '@angular/core';
import { Entidade } from '../models';
import { ApiService, RecursoApi } from './api.service';
import { gerarId } from '../../shared/utils/codigos';

/**
 * Classe base para serviços de domínio com persistência no banco (via API).
 *
 * - Mantém a coleção em um `signal`, de modo que tabelas, indicadores e
 *   gráficos são atualizados automaticamente após qualquer alteração.
 * - Os dados iniciais vêm da carga feita pelo ApiService ao abrir o site.
 * - Toda alteração é enviada para a API (PUT/DELETE em /api/<recurso>/<id>).
 */
export abstract class BaseCrudService<T extends Entidade> {
  protected readonly api = inject(ApiService);
  protected readonly _itens = signal<T[]>([]);
  readonly itens: Signal<T[]> = this._itens.asReadonly();

  protected constructor(
    protected readonly recurso: RecursoApi,
    private readonly prefixoId: string,
  ) {
    this._itens.set([...((this.api.inicial(recurso) as T[] | undefined) ?? [])]);
  }

  obter(id: string | null | undefined): T | undefined {
    if (!id) return undefined;
    return this._itens().find(i => i.id === id);
  }

  protected inserir(dados: Omit<T, 'id'>): T {
    const item = { ...dados, id: gerarId(this.prefixoId) } as T;
    this._itens.update(lista => [item, ...lista]);
    this.salvarNoBanco(item);
    return item;
  }

  protected substituir(id: string, alteracoes: Partial<T>): T | undefined {
    let atualizado: T | undefined;
    this._itens.update(lista => lista.map(i => {
      if (i.id !== id) return i;
      atualizado = { ...i, ...alteracoes, id };
      return atualizado;
    }));
    if (atualizado) this.salvarNoBanco(atualizado);
    return atualizado;
  }

  excluir(id: string): void {
    this._itens.update(lista => lista.filter(i => i.id !== id));
    this.api.remover(this.recurso, id);
  }

  protected salvarNoBanco(item: T): void {
    this.api.salvar(this.recurso, item);
  }
}
