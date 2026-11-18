import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../models';
import { StorageService } from './storage.service';
import { ApiService } from './api.service';

/** Perfil com acesso total (ex.: gerenciar sugestões). */
export const PERFIL_ADMIN = 'Administrador';

/**
 * Autenticação: usuário e senha são conferidos pela API na tabela `usuarios`
 * (senhas guardadas com hash bcrypt). A sessão fica salva neste navegador.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly _usuario = signal<Usuario | null>(this.storage.get<Usuario>('sessao'));

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly ehAdmin = computed(() => this._usuario()?.perfil === PERFIL_ADMIN);

  /** Nome do usuário logado, usado como "responsável" nos históricos. */
  nomeResponsavel(): string {
    return this._usuario()?.nome ?? 'Usuário';
  }

  /** true = acesso liberado; false = usuário/senha inválidos. Lança erro se a API estiver fora do ar. */
  async entrar(login: string, senha: string): Promise<boolean> {
    const usuario = await this.api.login(login.trim().toLowerCase(), senha);
    if (!usuario) return false;
    this._usuario.set(usuario);
    this.storage.set('sessao', usuario);
    return true;
  }

  sair() {
    this._usuario.set(null);
    this.storage.remove('sessao');
    this.router.navigate(['/login']);
  }
}
