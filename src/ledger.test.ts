import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { civilDate } from './dates';
import {
  assessViability,
  evaluateBudget,
  LedgerError,
  summarizeBalances,
  type Budget,
  type LedgerAccount,
  type LedgerMovement,
} from './ledger';
import { MoneyError, toCents, type Cents } from './money';

const pesos = (cents: number) => toCents(cents);
const day = (iso: string) => {
  const [year, month, date] = iso.split('-').map(Number);
  return civilDate(year, month, date);
};

const september = { start: day('2026-09-01'), end: day('2026-09-30') };

function account(partial: LedgerAccount): LedgerAccount {
  return partial;
}

function movement(partial: LedgerMovement): LedgerMovement {
  return partial;
}

describe('saldos', () => {
  const accounts: LedgerAccount[] = [
    account({ id: 'efectivo', kind: 'efectivo', openingBalance: pesos(1_000_000), active: true }),
    account({ id: 'debito', kind: 'debito', openingBalance: pesos(500_000), active: true }),
    account({ id: 'ahorro', kind: 'ahorro', openingBalance: pesos(800_000), active: false }),
  ];

  const movements: LedgerMovement[] = [
    movement({
      id: 'ingreso-efectivo',
      accountId: 'efectivo',
      kind: 'ingreso',
      amount: pesos(200_000),
      status: 'confirmado',
      occurredOn: day('2026-09-01'),
    }),
    movement({
      id: 'gasto-efectivo',
      accountId: 'efectivo',
      kind: 'gasto',
      amount: pesos(50_000),
      status: 'confirmado',
      occurredOn: day('2026-09-30'),
      categoryId: 'comida',
    }),
    movement({
      id: 'gasto-anterior',
      accountId: 'efectivo',
      kind: 'gasto',
      amount: pesos(70_000),
      status: 'confirmado',
      occurredOn: day('2026-08-31'),
      categoryId: 'comida',
    }),
    movement({
      id: 'gasto-debito',
      accountId: 'debito',
      kind: 'gasto',
      amount: pesos(100_000),
      status: 'confirmado',
      occurredOn: day('2026-09-15'),
      categoryId: 'transporte',
    }),
    movement({
      id: 'pendiente',
      accountId: 'debito',
      kind: 'gasto',
      amount: pesos(999_900),
      status: 'pendiente',
      occurredOn: day('2026-09-15'),
      categoryId: 'comida',
    }),
    movement({
      id: 'aportacion',
      accountId: 'efectivo',
      kind: 'aportacion',
      amount: pesos(300_000),
      status: 'confirmado',
      occurredOn: day('2026-09-15'),
    }),
    movement({
      id: 'ingreso-ahorro',
      accountId: 'ahorro',
      kind: 'ingreso',
      amount: pesos(50_000),
      status: 'confirmado',
      occurredOn: day('2026-09-10'),
    }),
    movement({
      id: 'gasto-posterior',
      accountId: 'debito',
      kind: 'gasto',
      amount: pesos(20_000),
      status: 'confirmado',
      occurredOn: day('2026-10-01'),
      categoryId: 'transporte',
    }),
  ];

  it('suma cuentas activas, separa los flujos y descuenta la reserva una sola vez', () => {
    const summary = summarizeBalances({
      accounts,
      movements,
      period: september,
      reserved: pesos(2_000_000),
    });

    assert.deepEqual(
      summary.accounts.map((item) => [item.accountId, item.balance]),
      [
        ['efectivo', 1_080_000],
        ['debito', 380_000],
        ['ahorro', 850_000],
      ],
    );
    assert.equal(summary.totalBalance, 1_460_000);
    assert.equal(summary.reserved, 2_000_000);
    assert.equal(summary.available, -540_000);
    assert.equal(summary.income, 250_000);
    assert.equal(summary.expenses, 150_000);
    assert.equal(summary.contributions, 300_000);
  });

  it('conserva en los flujos del periodo los movimientos confirmados de una cuenta inactiva', () => {
    const summary = summarizeBalances({
      accounts: [
        account({ id: 'efectivo', kind: 'efectivo', openingBalance: pesos(100_000), active: true }),
        account({ id: 'ahorro', kind: 'ahorro', openingBalance: pesos(500_000), active: false }),
      ],
      movements: [
        movement({
          id: 'ingreso-inactivo',
          accountId: 'ahorro',
          kind: 'ingreso',
          amount: pesos(10_000),
          status: 'confirmado',
          occurredOn: day('2026-09-10'),
        }),
        movement({
          id: 'gasto-inactivo',
          accountId: 'ahorro',
          kind: 'gasto',
          amount: pesos(4_000),
          status: 'confirmado',
          occurredOn: day('2026-09-12'),
          categoryId: 'comida',
        }),
        movement({
          id: 'aportacion-inactiva',
          accountId: 'ahorro',
          kind: 'aportacion',
          amount: pesos(7_000),
          status: 'confirmado',
          occurredOn: day('2026-09-14'),
        }),
        movement({
          id: 'pendiente-inactivo',
          accountId: 'ahorro',
          kind: 'gasto',
          amount: pesos(99_000),
          status: 'pendiente',
          occurredOn: day('2026-09-16'),
          categoryId: 'comida',
        }),
      ],
      period: september,
      reserved: pesos(0),
    });

    const inactive = summary.accounts.find((item) => item.accountId === 'ahorro');
    assert.equal(inactive?.balance, 506_000);
    assert.equal(summary.income, 10_000);
    assert.equal(summary.expenses, 4_000);
    assert.equal(summary.contributions, 7_000);
    assert.equal(summary.totalBalance, 100_000);
    assert.equal(summary.available, 100_000);
  });
});

describe('presupuestos', () => {
  const accounts: LedgerAccount[] = [
    account({ id: 'debito', kind: 'debito', openingBalance: pesos(0), active: true }),
    account({ id: 'ahorro', kind: 'ahorro', openingBalance: pesos(0), active: false }),
  ];

  function expense(id: string, amount: number, categoryId: string, occurredOn: string, accountId = 'debito'): LedgerMovement {
    return movement({
      id,
      accountId,
      kind: 'gasto',
      amount: pesos(amount),
      status: 'confirmado',
      occurredOn: day(occurredOn),
      categoryId,
    });
  }

  function evaluation(used: number, limit = 1_000_000) {
    return evaluateBudget(
      {
        id: 'comida',
        categoryId: 'comida',
        period: september,
        limit: pesos(limit),
      },
      [expense('gasto', used, 'comida', '2026-09-15')],
      accounts,
    );
  }

  it('incluye los extremos del periodo y solo la categoría del presupuesto', () => {
    const budget: Budget = {
      id: 'comida',
      categoryId: 'comida',
      period: september,
      limit: pesos(1_000_000),
    };
    const result = evaluateBudget(
      budget,
      [
        expense('inicio', 10_000, 'comida', '2026-09-01'),
        expense('fin', 20_000, 'comida', '2026-09-30'),
        expense('antes', 40_000, 'comida', '2026-08-31'),
        expense('despues', 80_000, 'comida', '2026-10-01'),
        expense('otra', 160_000, 'transporte', '2026-09-15'),
        expense('inactiva', 5_000, 'comida', '2026-09-15', 'ahorro'),
        movement({
          id: 'pendiente',
          accountId: 'debito',
          kind: 'gasto',
          amount: pesos(70_000),
          status: 'pendiente',
          occurredOn: day('2026-09-15'),
          categoryId: 'comida',
        }),
      ],
      accounts,
    );

    assert.equal(result.used, 35_000);
    assert.equal(result.remaining, 965_000);
    assert.equal(result.status, 'normal');
  });

  it('distingue normal, próximo, alcanzado y excedido por centavos', () => {
    assert.equal(evaluation(799_900).status, 'normal');
    assert.equal(evaluation(800_000).status, 'proximo');
    assert.equal(evaluation(999_900).status, 'proximo');
    assert.equal(evaluation(1_000_000).status, 'alcanzado');
    assert.equal(evaluation(1_000_000).remaining, 0);

    const exceeded = evaluation(1_250_000);
    assert.equal(exceeded.status, 'excedido');
    assert.equal(exceeded.remaining, -250_000);
  });
});

describe('viabilidad', () => {
  it('informa capacidad suficiente o faltante sin bloquear la meta', () => {
    const enough = assessViability({
      expectedIncome: pesos(1_000_000),
      estimatedExpenses: pesos(700_000),
      otherGoalContributions: pesos(100_000),
      requiredContribution: pesos(200_000),
      subscriptionDetail: pesos(200_000),
    });
    assert.equal(enough.capacity, 200_000);
    assert.equal(enough.shortfall, 0);
    assert.equal(enough.sufficient, true);
    assert.equal(enough.blocksCreation, false);

    const short = assessViability({
      expectedIncome: pesos(1_000_000),
      estimatedExpenses: pesos(700_000),
      otherGoalContributions: pesos(200_000),
      requiredContribution: pesos(150_000),
      subscriptionDetail: pesos(200_000),
    });
    assert.equal(short.capacity, 100_000);
    assert.equal(short.shortfall, 50_000);
    assert.equal(short.sufficient, false);
    assert.equal(short.blocksCreation, false);
  });
});

describe('entradas del libro', () => {
  it('rechaza datos inválidos y cuentas desconocidas', () => {
    const validAccount: LedgerAccount = {
      id: 'efectivo',
      kind: 'efectivo',
      openingBalance: pesos(0),
      active: true,
    };
    const period = september;

    assert.throws(
      () =>
        summarizeBalances({
          accounts: [{ ...validAccount, kind: 'credito' as LedgerAccount['kind'] }],
          movements: [],
          period,
          reserved: pesos(0),
        }),
      (error: unknown) => error instanceof LedgerError && error.code === 'invalid',
    );
    assert.throws(
      () =>
        summarizeBalances({
          accounts: [validAccount],
          movements: [
            {
              id: 'transferencia',
              accountId: 'efectivo',
              kind: 'transferencia' as LedgerMovement['kind'],
              amount: pesos(100),
              status: 'confirmado',
              occurredOn: day('2026-09-15'),
            },
          ],
          period,
          reserved: pesos(0),
        }),
      LedgerError,
    );
    assert.throws(
      () =>
        summarizeBalances({
          accounts: [validAccount],
          movements: [
            {
              id: 'ajena',
              accountId: 'no-existe',
              kind: 'ingreso',
              amount: pesos(100),
              status: 'confirmado',
              occurredOn: day('2026-09-15'),
            },
          ],
          period,
          reserved: pesos(0),
        }),
      (error: unknown) => error instanceof LedgerError && error.code === 'unknown-account',
    );
    assert.throws(
      () =>
        summarizeBalances({
          accounts: [validAccount, validAccount],
          movements: [],
          period,
          reserved: pesos(0),
        }),
      LedgerError,
    );
    assert.throws(
      () =>
        summarizeBalances({
          accounts: [validAccount],
          movements: [],
          period: { start: day('2026-09-30'), end: day('2026-09-01') },
          reserved: pesos(0),
        }),
      (error: unknown) => error instanceof LedgerError && error.code === 'range',
    );
    assert.throws(
      () =>
        summarizeBalances({
          accounts: [validAccount],
          movements: [
            {
              id: 'negativo',
              accountId: 'efectivo',
              kind: 'gasto',
              amount: -1 as Cents,
              status: 'confirmado',
              occurredOn: day('2026-09-15'),
              categoryId: 'comida',
            },
          ],
          period,
          reserved: pesos(0),
        }),
      MoneyError,
    );
    assert.throws(
      () =>
        assessViability({
          expectedIncome: pesos(100),
          estimatedExpenses: pesos(50),
          otherGoalContributions: pesos(0),
          requiredContribution: pesos(0),
          subscriptionDetail: pesos(51),
        }),
      LedgerError,
    );
  });
});
