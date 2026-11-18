/** Exporta dados tabulares para CSV (separador ';' e BOM para Excel pt-BR). */
export function exportarCSV(nomeArquivo: string, cabecalho: string[], linhas: (string | number | null | undefined)[][]): void {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const conteudo = [cabecalho, ...linhas].map(l => l.map(esc).join(';')).join('\r\n');
  baixarArquivo(nomeArquivo, '﻿' + conteudo, 'text/csv;charset=utf-8');
}

export function exportarJSON(nomeArquivo: string, dados: unknown): void {
  baixarArquivo(nomeArquivo, JSON.stringify(dados, null, 2), 'application/json');
}

export function baixarArquivo(nome: string, conteudo: string, tipo: string): void {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
