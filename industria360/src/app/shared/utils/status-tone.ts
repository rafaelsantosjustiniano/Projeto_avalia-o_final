import { normalizar } from './codigos';

/** Tons visuais disponíveis para badges (ver styles.css). */
export type Tone = 'success' | 'info' | 'warning' | 'orange' | 'danger' | 'neutral' | 'purple';

/**
 * Mapa central de cores dos estados do sistema.
 * Chaves normalizadas (sem acento, minúsculas).
 */
const MAPA: Record<string, Tone> = {
  // Equipamentos
  'disponivel': 'success',
  'em operacao': 'info',
  'em manutencao': 'orange',
  'inativo': 'neutral',
  'critico': 'danger',
  // Ordens de serviço
  'aberta': 'info',
  'aguardando atendimento': 'warning',
  'em execucao': 'orange',
  'aguardando pecas': 'purple',
  'concluida': 'success',
  'concluido': 'success',
  'cancelada': 'neutral',
  'atrasada': 'danger',
  'atrasado': 'danger',
  'pendente': 'warning',
  // Chamados
  'aberto': 'info',
  'em analise': 'warning',
  'convertido em os': 'purple',
  'resolvido': 'success',
  'cancelado': 'neutral',
  // Preventiva
  'em dia': 'success',
  'proxima do vencimento': 'warning',
  'suspensa': 'neutral',
  'ativo': 'success',
  'suspenso': 'neutral',
  // Corretiva
  'em diagnostico': 'warning',
  'em reparo': 'orange',
  // Técnicos
  'em atendimento': 'orange',
  'indisponivel': 'neutral',
  // Estoque
  'normal': 'success',
  'baixo': 'warning',
  'zerado': 'danger',
  // Prioridades
  'baixa': 'success',
  'media': 'warning',
  'alta': 'orange',
  'critica': 'danger',
  // Movimentação
  'entrada': 'success',
  'saida': 'orange',
  // Sugestões (status "Em análise" já está acima, em Chamados)
  'nova': 'info',
  'resolvida': 'success',
  'descartada': 'neutral',
  'erro / problema': 'danger',
  'sugestao de melhoria': 'purple',
  'elogio': 'success',
  'duvida': 'info',
};

export function toneDe(valor: string | null | undefined): Tone | null {
  return MAPA[normalizar(valor)] ?? null;
}

/** Cores (hex) equivalentes aos tons, usadas nos gráficos. */
export const CORES_TONE: Record<Tone, string> = {
  success: '#16A34A',
  info: '#3B82F6',
  warning: '#EAB308',
  orange: '#F59E0B',
  danger: '#DC2626',
  neutral: '#64748B',
  purple: '#8B5CF6',
};

export function corDe(valor: string, padrao = '#64748B'): string {
  const t = toneDe(valor);
  return t ? CORES_TONE[t] : padrao;
}
