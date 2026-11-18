import { Injectable, signal } from '@angular/core';

export type TipoNotificacao = 'sucesso' | 'erro' | 'aviso' | 'info';

export interface Notificacao {
  id: number;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
}

/** Notificações (toasts) de sucesso, erro, aviso e informação. */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private seq = 0;
  readonly itens = signal<Notificacao[]>([]);

  sucesso(mensagem: string, titulo = 'Sucesso') { this.mostrar('sucesso', titulo, mensagem); }
  erro(mensagem: string, titulo = 'Erro') { this.mostrar('erro', titulo, mensagem, 6000); }
  aviso(mensagem: string, titulo = 'Atenção') { this.mostrar('aviso', titulo, mensagem, 5000); }
  info(mensagem: string, titulo = 'Informação') { this.mostrar('info', titulo, mensagem); }

  fechar(id: number) {
    this.itens.update(l => l.filter(n => n.id !== id));
  }

  private mostrar(tipo: TipoNotificacao, titulo: string, mensagem: string, duracao = 4000) {
    const id = ++this.seq;
    this.itens.update(l => [...l.slice(-3), { id, tipo, titulo, mensagem }]);
    setTimeout(() => this.fechar(id), duracao);
  }
}
