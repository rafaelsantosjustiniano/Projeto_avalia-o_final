/**
 * Utilitários de data. Datas "simples" são armazenadas como 'YYYY-MM-DD'
 * (sem fuso) e data/hora como ISO 8601.
 */
const DIA_MS = 86_400_000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Converte Date para 'YYYY-MM-DD' no fuso local. */
export function paraDataISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Interpreta 'YYYY-MM-DD' (ou ISO completo) como Date local. */
export function lerData(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [y, m, d] = valor.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const dt = new Date(valor);
  return isNaN(dt.getTime()) ? null : dt;
}

export function hoje(): string {
  return paraDataISO(new Date());
}

export function agoraISO(): string {
  return new Date().toISOString();
}

export function somarDias(data: string, dias: number): string {
  const d = lerData(data) ?? new Date();
  d.setDate(d.getDate() + dias);
  return paraDataISO(d);
}

/** Diferença em dias inteiros (b - a), considerando apenas a data. */
export function diferencaDias(a: string, b: string): number {
  const da = lerData(a.slice(0, 10));
  const db = lerData(b.slice(0, 10));
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / DIA_MS);
}

/** Diferença em horas entre dois instantes ISO. */
export function diferencaHoras(inicio: string, fim: string): number {
  const a = lerData(inicio);
  const b = lerData(fim);
  if (!a || !b) return 0;
  return Math.max(0, (b.getTime() - a.getTime()) / 3_600_000);
}

/** Chave de mês 'YYYY-MM' para agrupamentos. */
export function chaveMes(valor: string): string {
  return valor.slice(0, 7);
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function rotuloMes(chave: string): string {
  const [y, m] = chave.split('-').map(Number);
  return `${MESES[m - 1]}/${String(y).slice(2)}`;
}

/** Retorna as chaves dos últimos N meses (inclui o mês atual), em ordem cronológica. */
export function ultimosMeses(n: number, referencia = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(referencia.getFullYear(), referencia.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  }
  return out;
}

/** Lista de meses entre duas datas (inclusive). */
export function mesesEntre(inicio: string, fim: string): string[] {
  const a = lerData(inicio);
  const b = lerData(fim);
  if (!a || !b || a > b) return [];
  const out: string[] = [];
  const d = new Date(a.getFullYear(), a.getMonth(), 1);
  while (d <= b && out.length < 60) {
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

/** Valor para <input type="datetime-local"> a partir de ISO. */
export function paraDataHoraLocal(iso: string): string {
  const d = lerData(iso) ?? new Date();
  return `${paraDataISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
