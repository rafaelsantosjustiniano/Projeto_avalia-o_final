import { Injectable, signal } from '@angular/core';

export interface OpcoesConfirmacao {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  perigo?: boolean;
}

interface EstadoConfirmacao extends OpcoesConfirmacao {
  resolver: (ok: boolean) => void;
}

/** Modal global de confirmação (ex.: antes de excluir). Uso: `await confirmar({...})`. */
@Injectable({ providedIn: 'root' })
export class ConfirmacaoService {
  readonly estado = signal<EstadoConfirmacao | null>(null);

  confirmar(opcoes: OpcoesConfirmacao): Promise<boolean> {
    // Encerra uma confirmação pendente, se houver
    this.estado()?.resolver(false);
    return new Promise<boolean>(resolver => this.estado.set({ ...opcoes, resolver }));
  }

  responder(ok: boolean) {
    const e = this.estado();
    this.estado.set(null);
    e?.resolver(ok);
  }
}
