import { inject, Injectable } from '@angular/core';
import { NivelEstoque, Peca, TipoMovimentacao } from '../models';
import { BaseCrudService } from './base-crud.service';
import { seedPecas } from '../data/seed-data';
import { proximoSequencial } from '../../shared/utils/codigos';
import { agoraISO } from '../../shared/utils/datas';
import { AuthService } from './auth.service';

export type PecaDados = Omit<Peca, 'id' | 'movimentacoes'>;

/** Controle de estoque de peças e movimentações. Futuro: /api/pecas e /api/pecas/{id}/movimentacoes */
@Injectable({ providedIn: 'root' })
export class EstoqueService extends BaseCrudService<Peca> {
  private readonly auth = inject(AuthService);

  constructor() {
    super('pecas', 'pc', seedPecas);
  }

  proximoCodigo(): string {
    return proximoSequencial(this._itens().map(p => p.codigo), 'PC-');
  }

  codigos(excetoId?: string): string[] {
    return this._itens().filter(p => p.id !== excetoId).map(p => p.codigo);
  }

  /** Normal (verde), Baixo (amarelo) ou Zerado (vermelho). */
  nivel(p: Pick<Peca, 'quantidade' | 'estoqueMinimo'>): NivelEstoque {
    if (p.quantidade <= 0) return 'Zerado';
    if (p.quantidade <= p.estoqueMinimo) return 'Baixo';
    return 'Normal';
  }

  criar(dados: PecaDados): Peca {
    return this.inserir({
      ...dados,
      movimentacoes: dados.quantidade > 0
        ? [{ data: agoraISO(), tipo: 'Entrada', quantidade: dados.quantidade, saldo: dados.quantidade, motivo: 'Cadastro inicial', responsavel: this.auth.nomeResponsavel() }]
        : [],
    });
  }

  atualizar(id: string, dados: PecaDados) {
    const atual = this.obter(id);
    if (!atual) return undefined;
    const movimentacoes = [...atual.movimentacoes];
    const diff = dados.quantidade - atual.quantidade;
    if (diff !== 0) {
      movimentacoes.unshift({
        data: agoraISO(), tipo: diff > 0 ? 'Entrada' : 'Saída', quantidade: Math.abs(diff),
        saldo: dados.quantidade, motivo: 'Ajuste de inventário (edição)', responsavel: this.auth.nomeResponsavel()
      });
    }
    return this.substituir(id, { ...dados, movimentacoes });
  }

  /** Movimenta o estoque. Retorna mensagem de erro ou null em caso de sucesso. */
  movimentar(id: string, tipo: TipoMovimentacao, quantidade: number, motivo: string, ordemServico?: string): string | null {
    const p = this.obter(id);
    if (!p) return 'Peça não encontrada.';
    if (!(quantidade > 0)) return 'Informe uma quantidade maior que zero.';
    if (tipo === 'Saída' && quantidade > p.quantidade) {
      return `Saldo insuficiente. Disponível: ${p.quantidade} ${p.unidade}.`;
    }
    const saldo = tipo === 'Entrada' ? p.quantidade + quantidade : p.quantidade - quantidade;
    this.substituir(id, {
      quantidade: saldo,
      movimentacoes: [{ data: agoraISO(), tipo, quantidade, saldo, motivo, responsavel: this.auth.nomeResponsavel(), ordemServico }, ...p.movimentacoes],
    });
    return null;
  }
}
