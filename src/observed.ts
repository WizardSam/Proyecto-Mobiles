import { civilDate, compareCivilDates, daysInMonth, type CivilDate } from './dates';
import { addCents, toCents, type Cents } from './money';

export type ObservedMovement = {
  readonly occurredOn: CivilDate;
  readonly kind: 'ingreso' | 'gasto' | 'aportacion';
  readonly amount: Cents;
  readonly confirmed: boolean;
};

export type ObservedEstimate = {
  readonly completeMonths: number;
  readonly provisional: boolean;
  readonly averageIncome: Cents | null;
  readonly averageExpenses: Cents | null;
  readonly replacesDeclared: false;
  readonly blocksGoalCreation: false;
};

export function observedEstimate(input: {
  today: CivilDate;
  trackingStartedOn: CivilDate;
  movements: readonly ObservedMovement[];
}): ObservedEstimate {
  const today = civilDate(input.today.year, input.today.month, input.today.day);
  const trackingStartedOn = civilDate(
    input.trackingStartedOn.year,
    input.trackingStartedOn.month,
    input.trackingStartedOn.day,
  );
  const months = completeMonths(trackingStartedOn, today);
  if (months.length === 0) {
    return emptyEstimate();
  }

  const totals = new Map<string, { income: Cents; expenses: Cents }>();
  for (const month of months) {
    totals.set(monthKey(month.year, month.month), { income: toCents(0), expenses: toCents(0) });
  }
  for (const movement of input.movements) {
    if (!movement.confirmed || (movement.kind !== 'ingreso' && movement.kind !== 'gasto')) {
      continue;
    }
    const date = civilDate(movement.occurredOn.year, movement.occurredOn.month, movement.occurredOn.day);
    if (compareCivilDates(date, trackingStartedOn) < 0) {
      continue;
    }
    const bucket = totals.get(monthKey(date.year, date.month));
    if (!bucket) {
      continue;
    }
    if (movement.kind === 'ingreso') {
      bucket.income = addCents(bucket.income, toCents(movement.amount));
    } else {
      bucket.expenses = addCents(bucket.expenses, toCents(movement.amount));
    }
  }

  const income = [...totals.values()].reduce((total, item) => addCents(total, item.income), toCents(0));
  const expenses = [...totals.values()].reduce((total, item) => addCents(total, item.expenses), toCents(0));
  return {
    completeMonths: months.length,
    provisional: true,
    averageIncome: quotient(income, months.length),
    averageExpenses: quotient(expenses, months.length),
    replacesDeclared: false,
    blocksGoalCreation: false,
  };
}

function completeMonths(trackingStartedOn: CivilDate, today: CivilDate): { year: number; month: number }[] {
  const first = firstCompleteMonth(trackingStartedOn);
  const last = previousMonth(today);
  if (!first || !last || compareMonths(first, last) > 0) {
    return [];
  }
  const months: { year: number; month: number }[] = [];
  let year = first.year;
  let month = first.month;
  while (year < last.year || (year === last.year && month <= last.month)) {
    const lastDay = civilDate(year, month, daysInMonth(year, month));
    if (compareCivilDates(lastDay, today) < 0) {
      months.push({ year, month });
    }
    month += 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
  }
  return months;
}

function firstCompleteMonth(start: CivilDate): { year: number; month: number } {
  if (start.day === 1) {
    return { year: start.year, month: start.month };
  }
  return start.month === 12 ? { year: start.year + 1, month: 1 } : { year: start.year, month: start.month + 1 };
}

function previousMonth(today: CivilDate): { year: number; month: number } | null {
  if (today.year === 1 && today.month === 1) {
    return null;
  }
  return today.month === 1 ? { year: today.year - 1, month: 12 } : { year: today.year, month: today.month - 1 };
}

function compareMonths(left: { year: number; month: number }, right: { year: number; month: number }): number {
  return left.year - right.year || left.month - right.month;
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function quotient(total: Cents, count: number): Cents {
  return toCents(Math.trunc(total / count));
}

function emptyEstimate(): ObservedEstimate {
  return {
    completeMonths: 0,
    provisional: false,
    averageIncome: null,
    averageExpenses: null,
    replacesDeclared: false,
    blocksGoalCreation: false,
  };
}
