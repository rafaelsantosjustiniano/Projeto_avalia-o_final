import { computed, Injectable } from '@angular/core';
import { SituacaoTecnico, Tecnico } from '../models';
import { BaseCrudService } from './base-crud.service';
import { seedTecnicos } from '../data/seed-data';
import { proximoSequencial } from '../../shared/utils/codigos';

export type TecnicoDados = Omit<Tecnico, 'id'>;

/** Cadastro de técnicos e equipe. Futuro: /api/tecnicos */
@Injectable({ providedIn: 'root' })
export class TecnicoService extends BaseCrudService<Tecnico> {
  constructor() {
    super('tecnicos', 'tec', seedTecnicos);
  }

  readonly ordenados = computed(() => [...this._itens()].sort((a, b) => a.nome.localeCompare(b.nome)));

  proximaMatricula(): string {
    return proximoSequencial(this._itens().map(t => t.matricula), 'TEC-', 4);
  }

  matriculas(excetoId?: string): string[] {
    return this._itens().filter(t => t.id !== excetoId).map(t => t.matricula);
  }

  criar(dados: TecnicoDados): Tecnico {
    return this.inserir(dados);
  }

  atualizar(id: string, dados: Partial<TecnicoDados>) {
    return this.substituir(id, dados);
  }

  alterarSituacao(id: string, situacao: SituacaoTecnico) {
    this.substituir(id, { situacao });
  }

  nome(id: string | null | undefined): string {
    if (!id) return 'Não atribuído';
    return this.obter(id)?.nome ?? 'Técnico removido';
  }
}
