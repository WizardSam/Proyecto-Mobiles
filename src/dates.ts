import { distributeCents, toCents, type Cents } from './money';

export const MEXICO_CITY_TIME_ZONE = 'America/Mexico_City';

export type CivilDate = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

export type Weekday =
  | 'domingo'
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado';

export type ContributionFrequency =
  | { readonly kind: 'semanal'; readonly weekday: Weekday }
  | { readonly kind: 'quincena-calendario' }
  | { readonly kind: 'cada-14-dias'; readonly firstDate: CivilDate }
  | { readonly kind: 'mensual'; readonly day: number };

export type DateErrorCode = 'invalid' | 'range';

export class DateError extends Error {
  readonly code: DateErrorCode;

  constructor(code: DateErrorCode, message: string) {
    super(message);
    this.name = 'DateError';
    this.code = code;
  }
}

const WEEKDAYS: readonly Weekday[] = [
  'domingo',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new DateError('invalid', 'El mes no es válido.');
  }
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function civilDate(year: number, month: number, day: number): CivilDate {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new DateError('invalid', 'El año queda fuera del calendario admitido.');
  }
  const limit = daysInMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > limit) {
    throw new DateError('invalid', 'La fecha civil no existe.');
  }
  return { year, month, day };
}

export function parseIsoDate(value: string): CivilDate {
  const match = ISO_DATE.exec(value);
  if (!match) {
    throw new DateError('invalid', 'La fecha debe usar el formato AAAA-MM-DD.');
  }
  return civilDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function formatIsoDate(date: CivilDate): string {
  const validated = assertCivilDate(date);
  const month = String(validated.month).padStart(2, '0');
  const day = String(validated.day).padStart(2, '0');
  return `${validated.year.toString().padStart(4, '0')}-${month}-${day}`;
}

export function compareCivilDates(left: CivilDate, right: CivilDate): -1 | 0 | 1 {
  const a = formatIsoDate(left);
  const b = formatIsoDate(right);
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const current = assertCivilDate(date);
  if (!Number.isSafeInteger(days)) {
    throw new DateError('invalid', 'Los días que se suman deben ser un entero.');
  }
  const serial = daysFromCivil(current.year, current.month, current.day) + days;
  if (!Number.isSafeInteger(serial)) {
    throw new DateError('range', 'La fecha queda fuera del calendario admitido.');
  }
  return civilFromDays(serial);
}

export function differenceInDays(later: CivilDate, earlier: CivilDate): number {
  const end = assertCivilDate(later);
  const start = assertCivilDate(earlier);
  return daysFromCivil(end.year, end.month, end.day) - daysFromCivil(start.year, start.month, start.day);
}

export function weekdayOf(date: CivilDate): Weekday {
  const current = assertCivilDate(date);
  const serial = daysFromCivil(current.year, current.month, current.day);
  const weekday = ((serial + 4) % 7 + 7) % 7;
  return WEEKDAYS[weekday];
}

export function todayInTimeZone(timeZone = MEXICO_CITY_TIME_ZONE, now = new Date()): CivilDate {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
  } catch {
    throw new DateError('invalid', 'La zona horaria no es válida.');
  }

  const year = Number(part(parts, 'year'));
  const month = Number(part(parts, 'month'));
  const day = Number(part(parts, 'day'));
  return civilDate(year, month, day);
}

/** Una fecha de hoy sigue disponible hasta que termina ese día civil. */
export function isDateAvailable(date: CivilDate, today: CivilDate): boolean {
  return compareCivilDates(date, today) >= 0;
}

export function contributionDates(input: {
  from: CivilDate;
  deadline: CivilDate;
  frequency: ContributionFrequency;
}): CivilDate[] {
  const from = assertCivilDate(input.from);
  const deadline = assertCivilDate(input.deadline);
  if (compareCivilDates(deadline, from) < 0) {
    throw new DateError('range', 'La fecha límite es anterior al inicio.');
  }

  switch (input.frequency.kind) {
    case 'semanal':
      return weeklyDates(from, deadline, input.frequency.weekday);
    case 'quincena-calendario':
      return fortnightDates(from, deadline);
    case 'cada-14-dias':
      return everyFourteenDays(from, deadline, assertCivilDate(input.frequency.firstDate));
    case 'mensual':
      return monthlyDates(from, deadline, input.frequency.day);
    default: {
      const unknown: never = input.frequency;
      throw new DateError('invalid', `La frecuencia no es válida: ${String(unknown)}`);
    }
  }
}

export function allocateCentsToDates(
  total: Cents,
  dates: readonly CivilDate[],
): { date: CivilDate; amount: Cents }[] {
  const amount = toCents(total);
  if (dates.length === 0) {
    throw new DateError('invalid', 'Debe haber al menos una fecha para repartir.');
  }

  const ordered = dates.map((date, index) => ({ date: assertCivilDate(date), index }));
  ordered.sort((left, right) => compareCivilDates(left.date, right.date) || left.index - right.index);
  const shares = distributeCents(amount, ordered.length);
  return ordered.map((entry, index) => ({ date: entry.date, amount: shares[index] }));
}

function weeklyDates(from: CivilDate, deadline: CivilDate, weekday: Weekday): CivilDate[] {
  const target = WEEKDAYS.indexOf(weekday);
  if (target < 0) {
    throw new DateError('invalid', 'El día de la semana no es válido.');
  }
  const current = WEEKDAYS.indexOf(weekdayOf(from));
  const dates: CivilDate[] = [];
  let cursor = addDays(from, (target - current + 7) % 7);
  while (compareCivilDates(cursor, deadline) <= 0) {
    dates.push(cursor);
    cursor = addDays(cursor, 7);
  }
  return dates;
}

function fortnightDates(from: CivilDate, deadline: CivilDate): CivilDate[] {
  const dates: CivilDate[] = [];
  let year = from.year;
  let month = from.month;
  while (year < deadline.year || (year === deadline.year && month <= deadline.month)) {
    const candidates = [15, daysInMonth(year, month)];
    for (const day of candidates) {
      const date = civilDate(year, month, day);
      if (compareCivilDates(date, from) >= 0 && compareCivilDates(date, deadline) <= 0) {
        dates.push(date);
      }
    }
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return dates;
}

function everyFourteenDays(from: CivilDate, deadline: CivilDate, firstDate: CivilDate): CivilDate[] {
  let cursor = firstDate;
  if (compareCivilDates(cursor, from) < 0) {
    const elapsed = differenceInDays(from, firstDate);
    const steps = Math.ceil(elapsed / 14);
    cursor = addDays(firstDate, steps * 14);
  }

  const dates: CivilDate[] = [];
  while (compareCivilDates(cursor, deadline) <= 0) {
    dates.push(cursor);
    cursor = addDays(cursor, 14);
  }
  return dates;
}

function monthlyDates(from: CivilDate, deadline: CivilDate, day: number): CivilDate[] {
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    throw new DateError('invalid', 'El día mensual debe estar entre 1 y 31.');
  }

  const dates: CivilDate[] = [];
  let year = from.year;
  let month = from.month;
  while (year < deadline.year || (year === deadline.year && month <= deadline.month)) {
    const date = civilDate(year, month, Math.min(day, daysInMonth(year, month)));
    if (compareCivilDates(date, from) >= 0 && compareCivilDates(date, deadline) <= 0) {
      dates.push(date);
    }
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return dates;
}

function assertCivilDate(date: CivilDate): CivilDate {
  return civilDate(date.year, date.month, date.day);
}

/** Días desde 1970-01-01 en el calendario gregoriano proléptico. */
function daysFromCivil(year: number, month: number, day: number): number {
  const shiftedYear = month <= 2 ? year - 1 : year;
  const era = Math.trunc((shiftedYear >= 0 ? shiftedYear : shiftedYear - 399) / 400);
  const yearOfEra = shiftedYear - era * 400;
  const dayOfYear = Math.trunc((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra = yearOfEra * 365 + Math.trunc(yearOfEra / 4) - Math.trunc(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

function civilFromDays(serial: number): CivilDate {
  const shifted = serial + 719468;
  const era = Math.trunc((shifted >= 0 ? shifted : shifted - 146096) / 146097);
  const dayOfEra = shifted - era * 146097;
  const yearOfEra = Math.trunc(
    (dayOfEra - Math.trunc(dayOfEra / 1460) + Math.trunc(dayOfEra / 36524) - Math.trunc(dayOfEra / 146096)) / 365,
  );
  const year = yearOfEra + era * 400;
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.trunc(yearOfEra / 4) - Math.trunc(yearOfEra / 100));
  const monthPart = Math.trunc((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.trunc((153 * monthPart + 2) / 5) + 1;
  const month = monthPart < 10 ? monthPart + 3 : monthPart - 9;
  return civilDate(year + (month <= 2 ? 1 : 0), month, day);
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  const found = parts.find((item) => item.type === type);
  if (!found) {
    throw new DateError('invalid', 'No se pudo leer la fecha en la zona indicada.');
  }
  return found.value;
}
