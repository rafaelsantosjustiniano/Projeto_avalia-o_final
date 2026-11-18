import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../models';
import { StorageService } from './storage.service';

/**
 * Autenticação SIMULADA para o MVP (sem back-end).
 * As credenciais de demonstração são exibidas na tela de login.
 * Futuro: substituir por autenticação JWT via API REST.
 */
const USUARIOS_DEMO: (Usuario & { senha: string })[] = [
  { nome: 'Supervisor de Manutenção', login: 'admin', senha: 'admin123', perfil: 'Administrador' },
  { nome: 'Planejador de Manutenção', login: 'planejador', senha: 'plan123', perfil: 'Planejamento' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);
  private readonly _usuario = signal<Usuario | null>(this.storage.get<Usuario>('sessao'));

  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly credenciaisDemo = USUARIOS_DEMO.map(u => ({ login: u.login, senha: u.senha, perfil: u.perfil }));

  /** Nome do usuário logado, usado como "responsável" nos históricos. */
  nomeResponsavel(): string {
    return this._usuario()?.nome ?? 'Usuário';
  }

  entrar(login: string, senha: string): boolean {
    const u = USUARIOS_DEMO.find(x => x.login === login.trim().toLowerCase() && x.senha === senha);
    if (!u) return false;
    const usuario: Usuario = { nome: u.nome, login: u.login, perfil: u.perfil };
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
