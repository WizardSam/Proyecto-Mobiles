import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  addDays,
  allocateCentsToDates,
  civilDate,
  contributionDates,
  DateError,
  daysInMonth,
  differenceInDays,
  formatIsoDate,
  isDateAvailable,
  isLeapYear,
  MEXICO_CITY_TIME_ZONE,
  parseIsoDate,
  todayInTimeZone,
  weekdayOf,
} from './dates';
import { parsePesos } from './money';

const iso = (value: string) => parseIsoDate(value);

describe('fechas civiles', () => {
  it('conserva el día civil sin convertirlo a UTC local', () => {
    const date = parseIsoDate('2026-09-27');
    assert.deepEqual(date, civilDate(2026, 9, 27));
    assert.equal(formatIsoDate(date), '2026-09-27');
    assert.equal(weekdayOf(date), 'domingo');
    assert.equal(weekdayOf(iso('2024-01-01')), 'lunes');
  });

  it('reconoce febrero, años bisiestos y meses de 30 y 31 días', () => {
    assert.equal(isLeapYear(2024), true);
    assert.equal(isLeapYear(2000), true);
    assert.equal(isLeapYear(1900), false);
    assert.equal(isLeapYear(2023), false);
    assert.equal(daysInMonth(2024, 2), 29);
    assert.equal(daysInMonth(2023, 2), 28);
    assert.equal(daysInMonth(2026, 4), 30);
    assert.equal(daysInMonth(2026, 1), 31);
    assert.deepEqual(civilDate(2024, 2, 29), { year: 2024, month: 2, day: 29 });
    assert.throws(() => civilDate(2023, 2, 29), DateError);
    assert.throws(() => civilDate(2026, 4, 31), DateError);
    assert.deepEqual(addDays(iso('2024-02-28'), 1), iso('2024-02-29'));
    assert.deepEqual(addDays(iso('2024-02-29'), 1), iso('2024-03-01'));
    assert.deepEqual(addDays(iso('2023-02-28'), 1), iso('2023-03-01'));
    assert.deepEqual(addDays(iso('2026-01-31'), 1), iso('2026-02-01'));
    assert.deepEqual(addDays(iso('2026-04-30'), 1), iso('2026-05-01'));
    assert.equal(differenceInDays(iso('2024-03-01'), iso('2024-02-28')), 2);
  });

  it('conserva el calendario gregoriano proléptico entre los años 1 y 9999', () => {
    assert.deepEqual(addDays(civilDate(99, 12, 31), 1), civilDate(100, 1, 1));
    assert.equal(formatIsoDate(addDays(civilDate(99, 12, 31), 1)), '0100-01-01');
    assert.equal(differenceInDays(civilDate(100, 1, 1), civilDate(99, 12, 31)), 1);
    assert.equal(weekdayOf(civilDate(1, 1, 1)), 'lunes');
    assert.throws(() => addDays(civilDate(1, 1, 1), -1), DateError);
    assert.throws(() => addDays(civilDate(9999, 12, 31), 1), DateError);
  });

  it('trata el día de hoy como disponible hasta que termina en Ciudad de México', () => {
    const beforeMidnight = new Date('2026-09-28T05:59:00.000Z');
    const atMidnight = new Date('2026-09-28T06:00:00.000Z');
    const today = todayInTimeZone(MEXICO_CITY_TIME_ZONE, beforeMidnight);
    const tomorrow = todayInTimeZone(MEXICO_CITY_TIME_ZONE, atMidnight);
    assert.deepEqual(today, iso('2026-09-27'));
    assert.deepEqual(tomorrow, iso('2026-09-28'));
    assert.equal(isDateAvailable(today, today), true);
    assert.equal(isDateAvailable(iso('2026-09-26'), today), false);
    assert.equal(isDateAvailable(tomorrow, today), true);
  });
});

describe('fechas de aportación', () => {
  it('genera la frecuencia semanal en el día elegido', () => {
    const dates = contributionDates({
      from: iso('2026-09-27'),
      deadline: iso('2026-10-11'),
      frequency: { kind: 'semanal', weekday: 'domingo' },
    });
    assert.deepEqual(dates, [iso('2026-09-27'), iso('2026-10-04'), iso('2026-10-11')]);

    const mondays = contributionDates({
      from: iso('2026-12-28'),
      deadline: iso('2027-01-11'),
      frequency: { kind: 'semanal', weekday: 'lunes' },
    });
    assert.deepEqual(mondays, [iso('2026-12-28'), iso('2027-01-04'), iso('2027-01-11')]);
  });

  it('genera quincenas de calendario en meses de 28, 29, 30 y 31 días', () => {
    assert.deepEqual(
      contributionDates({
        from: iso('2023-02-01'),
        deadline: iso('2023-02-28'),
        frequency: { kind: 'quincena-calendario' },
      }),
      [iso('2023-02-15'), iso('2023-02-28')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2024-02-01'),
        deadline: iso('2024-02-29'),
        frequency: { kind: 'quincena-calendario' },
      }),
      [iso('2024-02-15'), iso('2024-02-29')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2026-04-01'),
        deadline: iso('2026-04-30'),
        frequency: { kind: 'quincena-calendario' },
      }),
      [iso('2026-04-15'), iso('2026-04-30')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2026-12-15'),
        deadline: iso('2027-01-15'),
        frequency: { kind: 'quincena-calendario' },
      }),
      [iso('2026-12-15'), iso('2026-12-31'), iso('2027-01-15')],
    );
  });

  it('avanza cada 14 días desde la primera fecha, también al cruzar febrero', () => {
    assert.deepEqual(
      contributionDates({
        from: iso('2024-02-15'),
        deadline: iso('2024-03-14'),
        frequency: { kind: 'cada-14-dias', firstDate: iso('2024-02-15') },
      }),
      [iso('2024-02-15'), iso('2024-02-29'), iso('2024-03-14')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2023-02-15'),
        deadline: iso('2023-03-15'),
        frequency: { kind: 'cada-14-dias', firstDate: iso('2023-02-15') },
      }),
      [iso('2023-02-15'), iso('2023-03-01'), iso('2023-03-15')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2026-09-27'),
        deadline: iso('2026-10-13'),
        frequency: { kind: 'cada-14-dias', firstDate: iso('2026-09-01') },
      }),
      [iso('2026-09-29'), iso('2026-10-13')],
    );
  });

  it('usa el mismo día mensual o el último día disponible', () => {
    assert.deepEqual(
      contributionDates({
        from: iso('2024-01-01'),
        deadline: iso('2024-04-30'),
        frequency: { kind: 'mensual', day: 31 },
      }),
      [iso('2024-01-31'), iso('2024-02-29'), iso('2024-03-31'), iso('2024-04-30')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2023-01-31'),
        deadline: iso('2023-04-30'),
        frequency: { kind: 'mensual', day: 31 },
      }),
      [iso('2023-01-31'), iso('2023-02-28'), iso('2023-03-31'), iso('2023-04-30')],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2026-01-01'),
        deadline: iso('2026-02-28'),
        frequency: { kind: 'mensual', day: 30 },
      }),
      [iso('2026-01-30'), iso('2026-02-28')],
    );
  });

  it('incluye la fecha límite cuando es hoy y coincide con la serie', () => {
    const today = iso('2026-09-27');
    assert.deepEqual(
      contributionDates({
        from: today,
        deadline: today,
        frequency: { kind: 'semanal', weekday: 'domingo' },
      }),
      [today],
    );
    assert.deepEqual(
      contributionDates({
        from: today,
        deadline: today,
        frequency: { kind: 'mensual', day: 27 },
      }),
      [today],
    );
    assert.deepEqual(
      contributionDates({
        from: today,
        deadline: today,
        frequency: { kind: 'quincena-calendario' },
      }),
      [],
    );
    assert.deepEqual(
      contributionDates({
        from: iso('2026-09-30'),
        deadline: iso('2026-09-30'),
        frequency: { kind: 'quincena-calendario' },
      }),
      [iso('2026-09-30')],
    );
    assert.throws(
      () =>
        contributionDates({
          from: iso('2026-10-01'),
          deadline: iso('2026-09-30'),
          frequency: { kind: 'quincena-calendario' },
        }),
      DateError,
    );
  });

  it('reparte los centavos sobrantes empezando por la fecha más próxima', () => {
    const allocated = allocateCentsToDates(parsePesos('$1.00'), [
      iso('2026-10-15'),
      iso('2026-09-30'),
      iso('2026-10-31'),
    ]);
    assert.deepEqual(
      allocated.map((entry) => [formatIsoDate(entry.date), entry.amount]),
      [
        ['2026-09-30', 34],
        ['2026-10-15', 33],
        ['2026-10-31', 33],
      ],
    );
  });
});
