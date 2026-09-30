import { daysInMonth, civilDate, parseIsoDate, type CivilDate } from '../dates';

const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

export function shiftMonth(date: CivilDate, delta: number): CivilDate {
  if (!Number.isSafeInteger(delta)) {
    throw new Error('El cambio de mes debe ser un entero.');
  }
  const index = date.year * 12 + (date.month - 1) + delta;
  if (!Number.isSafeInteger(index)) {
    throw new Error('El mes queda fuera del calendario admitido.');
  }
  const year = Math.floor(index / 12);
  const month = index - year * 12 + 1;
  return civilDate(year, month, 1);
}

export function monthTitle(date: CivilDate): string {
  const current = civilDate(date.year, date.month, 1);
  const name = MONTHS[current.month - 1] ?? 'enero';
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${current.year}`;
}

export function longDate(iso: string): string {
  const date = parseIsoDate(iso);
  return `${date.day} de ${MONTHS[date.month - 1]} de ${date.year}`;
}

export function isInMonth(iso: string, month: CivilDate): boolean {
  const date = parseIsoDate(iso);
  return date.year === month.year && date.month === month.month;
}

export function monthBounds(date: CivilDate): { start: CivilDate; end: CivilDate } {
  return {
    start: civilDate(date.year, date.month, 1),
    end: civilDate(date.year, date.month, daysInMonth(date.year, date.month)),
  };
}

export function compareNewestFirst(
  left: { occurredOn: string; createdAt: string },
  right: { occurredOn: string; createdAt: string },
): number {
  if (left.occurredOn !== right.occurredOn) {
    return left.occurredOn < right.occurredOn ? 1 : -1;
  }
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? 1 : -1;
  }
  return 0;
}
