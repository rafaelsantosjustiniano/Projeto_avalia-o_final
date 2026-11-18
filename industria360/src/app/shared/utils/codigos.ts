/**
 * Geração automática de códigos e protocolos sequenciais.
 * Ex.: proximoCodigo(['EQ-0001','EQ-0007'], 'EQ-') => 'EQ-0008'
 */
export function proximoSequencial(codigos: string[], prefixo: string, digitos = 4): string {
  const max = codigos
    .filter(c => c?.startsWith(prefixo))
    .map(c => parseInt(c.slice(prefixo.length).replace(/\D/g, ''), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefixo}${String(max + 1).padStart(digitos, '0')}`;
}

/** Identificador interno único (não exibido ao usuário). */
export function gerarId(prefixo: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefixo}-${Date.now().toString(36)}${rand}`;
}

/** Iniciais para avatar. */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

/** Normaliza texto para busca (sem acentos, minúsculo). */
export function normalizar(texto: string | null | undefined): string {
  return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function contem(texto: string | null | undefined, termo: string): boolean {
  return normalizar(texto).includes(normalizar(termo));
}
