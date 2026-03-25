import {
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from 'date-fns';
import { FilterDate } from '@/modules//movements/interfaces';

// ─── Rangos de fecha ───────────────────────────────────────────────────────────
// No usamos date-fns-tz porque el campo es @db.Date (fecha pura sin hora).
// Las comparaciones de rango con fechas UTC son consistentes.

export function getMonthRange(date = new Date()): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getYearRange(date = new Date()): { start: Date; end: Date } {
  return { start: startOfYear(date), end: endOfYear(date) };
}

export function getLastDaysRange(days: number): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfDay(subDays(now, days)),
    end: startOfDay(now),
  };
}

export function getLastMonthsRange(months: number): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfMonth(subMonths(now, months)),
    end: endOfMonth(now),
  };
}

export function getYesterdayDate(date: Date): Date {
  return subDays(date, 1);
}

// ─── Builder de filtro de fecha para Prisma ────────────────────────────────────

export function buildDateFilter(
  filterDate?: FilterDate,
  from?: string,
  to?: string,
): { gte: Date; lte: Date } | undefined {
  if (from || to) {
    return {
      gte: new Date(from!),
      lte: new Date(to!),
    };
  }

  if (!filterDate || filterDate === 'all') return undefined;

  const builders: Record<string, () => { start: Date; end: Date }> = {
    sevenDays: () => getLastDaysRange(7),
    month: () => getMonthRange(),
    quarter: () => getLastMonthsRange(2),
    year: () => getYearRange(),
  };

  const range = builders[filterDate]?.();
  if (!range) return undefined;

  return { gte: range.start, lte: range.end };
}
