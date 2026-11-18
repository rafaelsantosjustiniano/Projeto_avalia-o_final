import { Injectable } from '@angular/core';

/**
 * Camada ÚNICA de acesso ao armazenamento local.
 *
 * Nenhum componente ou serviço de domínio acessa `localStorage` diretamente:
 * todos passam por aqui. Na integração futura com a API REST + MySQL,
 * basta substituir os serviços de domínio por chamadas HTTP (HttpClient)
 * mantendo as mesmas assinaturas públicas.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefixo = 'industria360:';
  readonly versao = 1;

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

  /** Chaves do sistema (sem o prefixo). */
  chaves(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefixo))
        .map(k => k.slice(this.prefixo.length));
    } catch {
      return [];
    }
  }

  /** Remove todos os dados do INDUSTRIA360 (mantém a sessão se solicitado). */
  limparTudo(manter: string[] = []): void {
    this.chaves().filter(k => !manter.includes(k)).forEach(k => this.remove(k));
  }

  /** Exporta todos os dados para backup. */
  exportarTudo(): Record<string, unknown> {
    const out: Record<string, unknown> = { _sistema: 'INDUSTRIA360', _versao: this.versao, _exportadoEm: new Date().toISOString() };
    this.chaves().filter(k => k !== 'sessao').forEach(k => (out[k] = this.get(k)));
    return out;
  }

  /** Importa um backup gerado por exportarTudo(). */
  importarTudo(dados: Record<string, unknown>): void {
    if (dados['_sistema'] !== 'INDUSTRIA360') throw new Error('Arquivo de backup inválido.');
    Object.entries(dados)
      .filter(([k]) => !k.startsWith('_') && k !== 'sessao')
      .forEach(([k, v]) => this.set(k, v));
  }

  /** Tamanho aproximado ocupado (em KB). */
  tamanhoKB(): number {
    return Math.round(
      this.chaves().reduce((acc, k) => acc + (localStorage.getItem(this.prefixo + k)?.length ?? 0), 0) / 1024 * 10
    ) / 10;
  }
}
