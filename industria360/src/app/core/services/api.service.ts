import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import {
  Chamado, Configuracao, Corretiva, Entidade, Equipamento, OrdemServico, Peca,
  Preventiva, Sugestao, Tecnico, Usuario
} from '../models';
import { NotificacaoService } from './notificacao.service';

/** Recursos (tabelas) disponíveis na API. */
export interface DadosSistema {
  configuracao: Configuracao;
  equipamentos: Equipamento[];
  tecnicos: Tecnico[];
  'ordens-servico': OrdemServico[];
  chamados: Chamado[];
  preventivas: Preventiva[];
  corretivas: Corretiva[];
  pecas: Peca[];
  sugestoes: Sugestao[];
}

export type RecursoApi = Exclude<keyof DadosSistema, 'configuracao'>;

/**
 * Comunicação com a API REST (Node.js + Express + MySQL).
 *
 * - Na inicialização do site, todos os dados são carregados de uma vez (`carregar`).
 * - As gravações são enviadas em FILA, uma de cada vez e na ordem em que
 *   aconteceram (ex.: o chamado é gravado antes da OS que aponta para ele).
 *   A tela é atualizada na hora; se o banco recusar, o usuário é avisado.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly notif = inject(NotificacaoService);
  private readonly base = '/api';

  private dados: Partial<DadosSistema> = {};
  private fila: Promise<unknown> = Promise.resolve();

  readonly status = signal<'carregando' | 'ok' | 'offline'>('carregando');
  readonly erroConexao = signal('');
  /** Quantidade de gravações ainda não confirmadas pelo banco. */
  readonly pendentes = signal(0);

  constructor() {
    // Avisa antes de fechar a aba se ainda houver algo sendo gravado
    window.addEventListener('beforeunload', ev => {
      if (this.pendentes() > 0) ev.preventDefault();
    });
  }

  /** Carga inicial (executada antes de o site abrir — ver app.config.ts). */
  async carregar(): Promise<void> {
    try {
      this.dados = await firstValueFrom(this.http.get<DadosSistema>(`${this.base}/dados`));
      this.status.set('ok');
    } catch (e) {
      this.status.set('offline');
      this.erroConexao.set(this.mensagem(e));
    }
  }

  inicial<K extends keyof DadosSistema>(chave: K): DadosSistema[K] | undefined {
    return this.dados[chave];
  }

  // ------------------------------------------------------------------
  // Gravações em fila
  // ------------------------------------------------------------------
  salvar<T extends Entidade>(recurso: RecursoApi, item: T): void {
    this.enfileirar(() => this.http.put(`${this.base}/${recurso}/${encodeURIComponent(item.id)}`, item));
  }

  remover(recurso: RecursoApi, id: string): void {
    this.enfileirar(() => this.http.delete(`${this.base}/${recurso}/${encodeURIComponent(id)}`));
  }

  salvarConfiguracao(config: Configuracao): void {
    this.enfileirar(() => this.http.put(`${this.base}/configuracao`, config));
  }

  /** Aguarda todas as gravações pendentes terminarem. */
  aguardarFila(): Promise<unknown> {
    return this.fila;
  }

  private enfileirar(requisicao: () => Observable<unknown>): void {
    this.pendentes.update(n => n + 1);
    this.fila = this.fila
      .then(() => firstValueFrom(requisicao()))
      .catch(e => this.notif.erro(
        `${this.mensagem(e)} Recarregue a página (F5) para ver os dados que estão no banco.`,
        'Não foi possível salvar'
      ))
      .finally(() => this.pendentes.update(n => n - 1));
  }

  // ------------------------------------------------------------------
  // Chamadas diretas
  // ------------------------------------------------------------------
  /** Retorna o usuário, ou null se login/senha estiverem errados. */
  async login(login: string, senha: string): Promise<Usuario | null> {
    try {
      return await firstValueFrom(this.http.post<Usuario>(`${this.base}/auth/login`, { login, senha }));
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return null;
      throw new Error(this.mensagem(e));
    }
  }

  async baixarBackup(): Promise<unknown> {
    await this.aguardarFila();
    return firstValueFrom(this.http.get(`${this.base}/backup`));
  }

  async importarBackup(dados: unknown): Promise<void> {
    await this.aguardarFila();
    try {
      await firstValueFrom(this.http.post(`${this.base}/backup`, dados));
    } catch (e) {
      throw new Error(this.mensagem(e));
    }
  }

  async apagarTudo(): Promise<void> {
    await this.aguardarFila();
    try {
      await firstValueFrom(this.http.delete(`${this.base}/dados`));
    } catch (e) {
      throw new Error(this.mensagem(e));
    }
  }

  /** Mensagem amigável a partir de um erro HTTP. */
  private mensagem(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      if (e.status === 0 || e.status === 504) return 'Servidor (API) fora do ar.';
      const erro = (e.error as { erro?: string } | null)?.erro;
      if (erro) return erro;
      if (e.status === 404) return 'API não encontrada.';
      return `Erro ${e.status} no servidor.`;
    }
    return e instanceof Error ? e.message : 'Erro desconhecido.';
  }
}
