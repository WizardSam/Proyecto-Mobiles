import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { civilDate } from './dates';
import { observedEstimate } from './observed';
import { toCents } from './money';

const pesos = (cents: number) => toCents(cents);
const day = (iso: string) => {
  const [year, month, date] = iso.split('-').map(Number);
  return civilDate(year, month, date);
};

describe('historial observado', () => {
  it('promedia solo meses calendario completos y no reemplaza la configuración', () => {
    const estimate = observedEstimate({
      today: day('2026-03-15'),
      trackingStartedOn: day('2026-01-01'),
      movements: [
        { occurredOn: day('2026-01-10'), kind: 'ingreso', amount: pesos(300), confirmed: true },
        { occurredOn: day('2026-01-20'), kind: 'gasto', amount: pesos(100), confirmed: true },
        { occurredOn: day('2026-01-21'), kind: 'gasto', amount: pesos(999), confirmed: false },
        { occurredOn: day('2026-02-05'), kind: 'gasto', amount: pesos(50), confirmed: true },
        { occurredOn: day('2026-03-01'), kind: 'ingreso', amount: pesos(999), confirmed: true },
      ],
    });
    assert.equal(estimate.completeMonths, 2);
    assert.equal(estimate.provisional, true);
    assert.equal(estimate.averageIncome, 150);
    assert.equal(estimate.averageExpenses, 75);
    assert.equal(estimate.replacesDeclared, false);
    assert.equal(estimate.blocksGoalCreation, false);
  });

  it('no usa el mes en curso aunque hoy sea su último día', () => {
    const estimate = observedEstimate({
      today: day('2026-01-31'),
      trackingStartedOn: day('2026-01-01'),
      movements: [{ occurredOn: day('2026-01-10'), kind: 'ingreso', amount: pesos(300), confirmed: true }],
    });
    assert.equal(estimate.completeMonths, 0);
    assert.equal(estimate.provisional, false);
    assert.equal(estimate.averageIncome, null);
  });

  it('cuenta octubre completo aunque no tenga movimientos si el seguimiento empezó en septiembre', () => {
    const estimate = observedEstimate({
      today: day('2026-11-01'),
      trackingStartedOn: day('2026-09-27'),
      movements: [],
    });
    assert.equal(estimate.completeMonths, 1);
    assert.equal(estimate.provisional, true);
    assert.equal(estimate.averageIncome, 0);
    assert.equal(estimate.averageExpenses, 0);
  });

  it('incluye los meses vacíos entre enero y el mes anterior a hoy', () => {
    const estimate = observedEstimate({
      today: day('2026-04-10'),
      trackingStartedOn: day('2026-01-01'),
      movements: [
        { occurredOn: day('2025-12-15'), kind: 'ingreso', amount: pesos(999), confirmed: true },
        { occurredOn: day('2026-01-20'), kind: 'ingreso', amount: pesos(300), confirmed: true },
      ],
    });
    assert.equal(estimate.completeMonths, 3);
    assert.equal(estimate.averageIncome, 100);
    assert.equal(estimate.averageExpenses, 0);
  });
});
