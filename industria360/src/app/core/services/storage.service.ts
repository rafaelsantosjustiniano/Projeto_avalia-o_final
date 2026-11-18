import { Injectable } from '@angular/core';

/**
 * Armazenamento local do navegador (localStorage).
 * Usado apenas para a sessão do usuário logado — todos os cadastros
 * ficam no banco de dados MySQL, acessado pela API (ver ApiService).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefixo = 'industria360:';

  get<T>(chave: string): T | null {
    try {
      const raw = localStorage.getItem(this.prefixo + chave);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(chave: string, valor: T): void {
    try {
      localStorage.setItem(this.prefixo + chave, JSON.stringify(valor));
    } catch (e) {
      console.error('[INDUSTRIA360] Falha ao gravar no armazenamento local', e);
    }
  }

  remove(chave: string): void {
    try { localStorage.removeItem(this.prefixo + chave); } catch { /* indisponível */ }
  }
}
