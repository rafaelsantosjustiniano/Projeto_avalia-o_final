import { inject, Injectable } from '@angular/core';
import { Corretiva, StatusCorretiva } from '../models';
import { BaseCrudService } from './base-crud.service';
import { seedCorretivas } from '../data/seed-data';
import { agoraISO } from '../../shared/utils/datas';
import { AuthService } from './auth.service';

export type CorretivaDados = Omit<Corretiva, 'id' | 'andamento' | 'dataConclusao'>;

/** Acompanhamento de manutenções corretivas (falhas). Futuro: /api/corretivas */
@Injectable({ providedIn: 'root' })
export class CorretivaService extends BaseCrudService<Corretiva> {
  private readonly auth = inject(AuthService);

  constructor() {
    super('corretivas', 'co', seedCorretivas);
  }

  criar(dados: CorretivaDados, nota = 'Falha registrada.'): Corretiva {
    return this.inserir({
      ...dados,
      dataConclusao: dados.status === 'Concluída' ? agoraISO() : undefined,
      andamento: [{ data: agoraISO(), status: dados.status, nota, responsavel: this.auth.nomeResponsavel() }],
    });
  }

  atualizar(id: string, dados: CorretivaDados) {
    const atual = this.obter(id);
    if (!atual) return undefined;
    const andamento = [...atual.andamento];
    if (dados.status !== atual.status) {
      andamento.push({ data: agoraISO(), status: dados.status, nota: 'Status alterado na edição do registro.', responsavel: this.auth.nomeResponsavel() });
    }
    return this.substituir(id, {
      ...dados, andamento,
      dataConclusao: dados.status === 'Concluída' ? (atual.dataConclusao ?? agoraISO()) : undefined,
    });
  }

  /** Registra uma nova etapa no andamento da manutenção. */
  registrarAndamento(id: string, status: StatusCorretiva, nota: string, extras: Partial<Pick<Corretiva, 'causa' | 'solucao' | 'tempoParadaHoras'>> = {}) {
    const atual = this.obter(id);
    if (!atual) return;
    this.substituir(id, {
      ...extras,
      status,
      dataConclusao: status === 'Concluída' ? agoraISO() : undefined,
      andamento: [...atual.andamento, { data: agoraISO(), status, nota, responsavel: this.auth.nomeResponsavel() }],
    });
  }

  vincularOS(id: string, ordemServicoId: string) {
    this.substituir(id, { ordemServicoId });
  }
}
