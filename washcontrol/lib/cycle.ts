/**
 * Utilitários para o sistema de ciclo de cobrança.
 * O ciclo começa no dia `cycleDay` do mês selecionado
 * e vai até o dia anterior ao próximo ciclo.
 *
 * Exemplo: cycleDay=5, month=3 (março), year=2026
 *   → cycleStart = 2026-03-05
 *   → cycleEnd   = 2026-04-04 23:59:59
 */

export interface CycleDates {
  cycleStart: Date;
  cycleEnd: Date;
  /** Mês de referência (1-indexed) */
  month: number;
  year: number;
}

export function getCycleDates(year: number, month: number, cycleDay: number): CycleDates {
  const day = Math.max(1, Math.min(cycleDay, 28));

  const cycleStart = new Date(year, month - 1, day, 0, 0, 0, 0);

  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear++;
  }
  const nextCycleStart = new Date(nextYear, nextMonth - 1, day, 0, 0, 0, 0);
  const cycleEnd = new Date(nextCycleStart.getTime() - 1);

  return { cycleStart, cycleEnd, month, year };
}

/**
 * Determina em qual "mês de ciclo" o dia de hoje está.
 * Se hoje >= cycleDay → ciclo do mês atual.
 * Se hoje < cycleDay  → ciclo do mês anterior.
 */
export function getCurrentCycleMonth(today: Date, cycleDay: number): { year: number; month: number } {
  const day = Math.max(1, Math.min(cycleDay, 28));
  const todayDay = today.getDate();

  if (todayDay >= day) {
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  } else {
    const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return { year: prev.getFullYear(), month: prev.getMonth() + 1 };
  }
}

/** Navega N meses para frente/trás a partir de year/month */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  let m = month + delta;
  let y = year;
  while (m > 12) { m -= 12; y++; }
  while (m < 1)  { m += 12; y--; }
  return { year: y, month: m };
}

/** Formata "2026-03" → { year: 2026, month: 3 } */
export function parseMonthParam(param: string | undefined | null, fallbackYear: number, fallbackMonth: number): { year: number; month: number } {
  if (!param) return { year: fallbackYear, month: fallbackMonth };
  const match = param.match(/^(\d{4})-(\d{2})$/);
  if (!match) return { year: fallbackYear, month: fallbackMonth };
  const y = parseInt(match[1]);
  const m = parseInt(match[2]);
  if (m < 1 || m > 12) return { year: fallbackYear, month: fallbackMonth };
  return { year: y, month: m };
}

/** Formata { year, month } → "2026-03" */
export function toMonthParam(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}
