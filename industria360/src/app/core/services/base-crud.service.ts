import { inject, Signal, signal } from '@angular/core';
import { Entidade } from '../models';
import { StorageService } from './storage.service';
import { gerarId } from '../../shared/utils/codigos';

/**
 * Classe base para serviços de domínio com persistência local.
 *
 * - Mantém a coleção em um `signal`, de modo que tabelas, indicadores e
 *   gráficos são atualizados automaticamente após qualquer alteração.
 * - Na primeira execução carrega os dados de demonstração (seed).
 * - Toda alteração é salva automaticamente no armazenamento local.
 *
 * Para migrar para a API REST: trocar `carregar()`/`persistir()` e os
 * métodos de escrita por chamadas HttpClient (GET/POST/PUT/DELETE).
 */
export abstract class BaseCrudService<T extends Entidade> {
  protected readonly storage = inject(StorageService);
  protected readonly _itens = signal<T[]>([]);
  readonly itens: Signal<T[]> = this._itens.asReadonly();

  protected constructor(
    protected readonly chave: string,
    private readonly prefixoId: string,
    seed: () => T[]
  ) {
    const salvos = this.storage.get<T[]>(chave);
    if (Array.isArray(salvos)) {
      this._itens.set(salvos);
    } else {
      this._itens.set(seed());
      this.persistir();
    }
  }

  obter(id: string | null | undefined): T | undefined {
    if (!id) return undefined;
    return this._itens().find(i => i.id === id);
  }

  protected inserir(dados: Omit<T, 'id'>): T {
    const item = { ...dados, id: gerarId(this.prefixoId) } as T;
    this._itens.update(lista => [item, ...lista]);
    this.persistir();
    return item;
  }

  protected substituir(id: string, alteracoes: Partial<T>): T | undefined {
    let atualizado: T | undefined;
    this._itens.update(lista => lista.map(i => {
      if (i.id !== id) return i;
      atualizado = { ...i, ...alteracoes, id };
      return atualizado;
    }));
    this.persistir();
    return atualizado;
  }

  excluir(id: string): void {
    this._itens.update(lista => lista.filter(i => i.id !== id));
    this.persistir();
  }

  protected persistir(): void {
    this.storage.set(this.chave, this._itens());
  }
}
