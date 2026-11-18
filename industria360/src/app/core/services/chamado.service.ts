import { Injectable } from '@angular/core';
import { Chamado, StatusChamado } from '../models';
import { BaseCrudService } from './base-crud.service';
import { seedChamados } from '../data/seed-data';
import { proximoSequencial } from '../../shared/utils/codigos';
import { agoraISO, hoje } from '../../shared/utils/datas';

export type ChamadoDados = Omit<Chamado, 'id' | 'protocolo' | 'dataHora' | 'status' | 'ordemServicoId'>;

/** Abertura e acompanhamento de chamados de manutenção. Futuro: /api/chamados */
@Injectable({ providedIn: 'root' })
export class ChamadoService extends BaseCrudService<Chamado> {
  constructor() {
    super('chamados', 'ch', seedChamados);
  }

  /** Protocolo automático no formato CH-AAAAMMDD-0000 (sequencial por dia). */
  proximoProtocolo(): string {
    const prefixo = `CH-${hoje().replace(/-/g, '')}-`;
    return proximoSequencial(this._itens().map(c => c.protocolo), prefixo);
  }

  criar(dados: ChamadoDados): Chamado {
    return this.inserir({
      ...dados,
      protocolo: this.proximoProtocolo(),
      dataHora: agoraISO(),
      status: 'Aberto',
    });
  }

  atualizar(id: string, dados: Partial<Chamado>) {
    return this.substituir(id, dados);
  }

  alterarStatus(id: string, status: StatusChamado) {
    this.substituir(id, { status });
  }

  /** Vincula o chamado à OS gerada a partir dele. */
  vincularOS(id: string, ordemServicoId: string) {
    this.substituir(id, { status: 'Convertido em OS', ordemServicoId });
  }

  /** Marca como resolvido (chamado ao concluir a OS vinculada). */
  resolverPorOS(ordemServicoId: string) {
    const c = this._itens().find(x => x.ordemServicoId === ordemServicoId);
    if (c && c.status === 'Convertido em OS') this.substituir(c.id, { status: 'Resolvido' });
  }
}
