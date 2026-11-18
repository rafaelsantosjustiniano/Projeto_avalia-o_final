import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent, LogoComponent } from '../../shared/components';
import { AuthService, ConfiguracaoService, NotificacaoService } from '../../core/services';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly notif = inject(NotificacaoService);
  readonly auth = inject(AuthService);
  readonly config = inject(ConfiguracaoService);

  readonly erro = signal('');
  readonly enviado = signal(false);
  readonly mostrarSenha = signal(false);
  readonly ano = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    login: ['', Validators.required],
    senha: ['', Validators.required],
  });

  constructor() {
    if (this.auth.autenticado()) this.router.navigate(['/dashboard']);
  }

  preencher(login: string, senha: string) {
    this.form.setValue({ login, senha });
    this.erro.set('');
  }

  entrar() {
    this.enviado.set(true);
    this.erro.set('');
    if (this.form.invalid) {
      this.erro.set('Informe usuário e senha.');
      return;
    }
    const { login, senha } = this.form.getRawValue();
    if (this.auth.entrar(login, senha)) {
      this.notif.sucesso(`Bem-vindo(a), ${this.auth.usuario()?.nome}.`, 'Acesso autorizado');
      this.router.navigate(['/dashboard']);
    } else {
      this.erro.set('Usuário ou senha inválidos.');
    }
  }
}
