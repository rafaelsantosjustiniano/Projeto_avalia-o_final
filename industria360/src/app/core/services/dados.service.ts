import { inject, Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { exportarJSON } from '../../shared/utils/exportacao';
import { hoje } from '../../shared/utils/datas';

/** Administração dos dados locais: backup, restauração e reset da demonstração. */
@Injectable({ providedIn: 'root' })
export class DadosService {
  private readonly storage = inject(StorageService);

  exportarBackup() {
    exportarJSON(`industria360-backup-${hoje()}.json`, this.storage.exportarTudo());
  }

  async importarBackup(arquivo: File): Promise<void> {
    const texto = await arquivo.text();
    const dados = JSON.parse(texto) as Record<string, unknown>;
    this.storage.importarTudo(dados);
    window.location.reload();
  }

  /** Apaga os dados e recarrega os dados de demonstração originais. */
  restaurarDemonstracao() {
    this.storage.limparTudo(['sessao']);
    window.location.reload();
  }

  tamanhoKB(): number {
    return this.storage.tamanhoKB();
  }
}
