import { inject, Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { exportarJSON } from '../../shared/utils/exportacao';
import { hoje } from '../../shared/utils/datas';

/** Administração dos dados do banco: backup, restauração e limpeza total. */
@Injectable({ providedIn: 'root' })
export class DadosService {
  private readonly api = inject(ApiService);

  async exportarBackup(): Promise<void> {
    exportarJSON(`industria360-backup-${hoje()}.json`, await this.api.baixarBackup());
  }

  /** Substitui todos os dados do banco pelo conteúdo do arquivo e recarrega o site. */
  async importarBackup(arquivo: File): Promise<void> {
    let dados: unknown;
    try {
      dados = JSON.parse(await arquivo.text());
    } catch {
      throw new Error('O arquivo não é um JSON válido.');
    }
    await this.api.importarBackup(dados);
    window.location.reload();
  }

  /** Apaga todos os registros e configurações (os usuários são mantidos) e recarrega o site. */
  async apagarTudo(): Promise<void> {
    await this.api.apagarTudo();
    window.location.reload();
  }
}
