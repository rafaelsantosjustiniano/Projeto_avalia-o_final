import { computed, inject, Injectable } from '@angular/core';
import { StatusSugestao, Sugestao } from '../models';
import { BaseCrudService } from './base-crud.service';
import { AuthService } from './auth.service';
import { agoraISO } from '../../shared/utils/datas';

export type SugestaoDados = Pick<Sugestao, 'tipo' | 'modulo' | 'titulo' | 'descricao'>;

/** Sugestões e relatos de erro dos usuários. Banco: /api/sugestoes */
@Injectable({ providedIn: 'root' })
export class SugestaoService extends BaseCrudService<Sugestao> {
  private readonly auth = inject(AuthService);

  constructor() {
    super('sugestoes', 'sg');
  }

  /** Sugestões ainda não avaliadas (contador do menu para o administrador). */
  readonly novas = computed(() => this._itens().filter(s => s.status === 'Nova').length);

  /** Sugestões enviadas pelo usuário logado. */
  readonly minhas = computed(() => {
    const login = this.auth.usuario()?.login;
    return this._itens().filter(s => s.autorLogin === login);
  });

  criar(dados: SugestaoDados): Sugestao {
    const u = this.auth.usuario();
    return this.inserir({
      ...dados,
      autorNome: u?.nome ?? 'Usuário',
      autorLogin: u?.login ?? '',
      dataEnvio: agoraISO(),
      status: 'Nova',
    });
  }

  alterarStatus(id: string, status: StatusSugestao) {
    return this.substituir(id, { status });
  }

  /** Registra o retorno do administrador (fica visível para quem enviou). */
  responder(id: string, resposta: string, status: StatusSugestao) {
    const texto = resposta.trim();
    return this.substituir(id, {
      status,
      resposta: texto || undefined,
      respondidoPor: texto ? this.auth.nomeResponsavel() : undefined,
      dataResposta: texto ? agoraISO() : undefined,
    });
  }
}
