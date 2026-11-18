import { computed, Injectable } from '@angular/core';
import { Equipamento, SituacaoEquipamento } from '../models';
import { BaseCrudService } from './base-crud.service';
import { proximoSequencial } from '../../shared/utils/codigos';
import { agoraISO } from '../../shared/utils/datas';

export type EquipamentoDados = Omit<Equipamento, 'id' | 'criadoEm'>;

/** Cadastro e gestão de equipamentos industriais. Futuro: /api/equipamentos */
@Injectable({ providedIn: 'root' })
export class EquipamentoService extends BaseCrudService<Equipamento> {
  constructor() {
    super('equipamentos', 'eq');
  }

  /** Contagem por situação operacional (usada no dashboard). */
  readonly porSituacao = computed(() => {
    const mapa: Record<SituacaoEquipamento, number> = {
      'Disponível': 0, 'Em operação': 0, 'Em manutenção': 0, 'Inativo': 0, 'Crítico': 0
    };
    this._itens().forEach(e => (mapa[e.situacao] = (mapa[e.situacao] ?? 0) + 1));
    return mapa;
  });

  proximoCodigo(): string {
    return proximoSequencial(this._itens().map(e => e.codigo), 'EQ-');
  }

  codigos(excetoId?: string): string[] {
    return this._itens().filter(e => e.id !== excetoId).map(e => e.codigo);
  }

  criar(dados: EquipamentoDados): Equipamento {
    return this.inserir({ ...dados, criadoEm: agoraISO() });
  }

  atualizar(id: string, dados: Partial<EquipamentoDados>): Equipamento | undefined {
    return this.substituir(id, dados);
  }

  alterarSituacao(id: string, situacao: SituacaoEquipamento) {
    this.substituir(id, { situacao });
  }

  /** Rótulo amigável "CÓDIGO · Nome". */
  rotulo(id: string | null | undefined): string {
    const e = this.obter(id);
    return e ? `${e.codigo} · ${e.nome}` : 'Equipamento removido';
  }

  nome(id: string | null | undefined): string {
    return this.obter(id)?.nome ?? 'Equipamento removido';
  }
}
