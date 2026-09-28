import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { civilDate, formatIsoDate } from './dates';
import {
  confirmAdjustment,
  confirmContribution,
  confirmDisbursement,
  confirmSkip,
  createGoal,
  deferAdjustment,
  GoalError,
  milestoneViews,
  simulateDisbursement,
  simulateIncreaseContributions,
  simulateMoveDeadline,
  simulateReduceTarget,
  simulateSkip,
  type Goal,
  type Milestone,
} from './goals';
import { MoneyError, toCents, type Cents } from './money';

const pesos = (cents: number) => toCents(cents);
const day = (iso: string) => {
  const [year, month, date] = iso.split('-').map(Number);
  return civilDate(year, month, date);
};
const iso = (goalDate: { year: number; month: number; day: number }) => formatIsoDate(goalDate);

function expectInvariants(goal: Goal): void {
  const contributions = goal.contributions.reduce((total, item) => total + item.amount, 0);
  const immediate = goal.immediateContributions.reduce((total, item) => total + item.amount, 0);
  const utilized = goal.disbursements.reduce((total, item) => total + item.amount, 0);
  const reserve = goal.openingSavings + contributions + immediate - utilized;
  const progress = reserve + utilized;
  const pending = Math.max(0, goal.target - progress);
  assert.equal(goal.state.reserve, reserve);
  assert.equal(goal.state.utilized, utilized);
  assert.equal(goal.state.progress, progress);
  assert.equal(goal.state.pending, pending);
  assert.ok(goal.state.reserve >= 0);
  assert.ok(goal.state.reserve <= goal.state.progress);
}

function weeklyGoal(target: number, deadline = '2026-10-11'): Goal {
  return createGoal({
    id: 'meta',
    name: 'Prueba',
    target: pesos(target),
    openingSavings: pesos(0),
    frequency: { kind: 'semanal', weekday: 'domingo' },
    from: day('2026-09-27'),
    deadline: day(deadline),
  });
}

describe('metas sencillas', () => {
  it('divide el pendiente en partes exactas', () => {
    const goal = weeklyGoal(300);
    assert.deepEqual(
      goal.schedule.map((entry) => entry.amount),
      [100, 100, 100],
    );
    assert.equal(goal.feasible, true);
    expectInvariants(goal);
  });

  it('entrega los centavos sobrantes a las fechas más próximas', () => {
    const goal = weeklyGoal(100);
    assert.deepEqual(
      goal.schedule.map((entry) => [iso(entry.date), entry.amount]),
      [
        ['2026-09-27', 34],
        ['2026-10-04', 33],
        ['2026-10-11', 33],
      ],
    );
  });

  it('incluye la fecha límite cuando coincide con la frecuencia', () => {
    const goal = createGoal({
      id: 'quincena',
      name: 'Cierre',
      target: pesos(100),
      openingSavings: pesos(0),
      frequency: { kind: 'quincena-calendario' },
      from: day('2026-09-30'),
      deadline: day('2026-09-30'),
    });
    assert.deepEqual(
      goal.schedule.map((entry) => iso(entry.date)),
      ['2026-09-30'],
    );
    assert.equal(goal.schedule[0]?.amount, 100);
  });

  it('explica una meta inviable sin lanzar un error cuando no hay fechas', () => {
    const goal = createGoal({
      id: 'sin-fechas',
      name: 'Sin lunes',
      target: pesos(100),
      openingSavings: pesos(0),
      frequency: { kind: 'semanal', weekday: 'lunes' },
      from: day('2026-09-30'),
      deadline: day('2026-09-30'),
    });
    assert.equal(goal.feasible, false);
    assert.equal(goal.schedule.length, 0);
    assert.match(goal.reason ?? '', /No hay fechas/);
    expectInvariants(goal);
  });
});

describe('hitos', () => {
  const milestones: Milestone[] = [
    { id: 'actividades', name: 'Actividades', planned: pesos(8_000), due: day('2027-05-30') },
    { id: 'vuelos', name: 'Vuelos', planned: pesos(12_000), due: day('2027-01-15') },
    { id: 'hotel', name: 'Hotel', planned: pesos(10_000), due: day('2027-04-01') },
  ];

  function cancun(): Goal {
    return createGoal({
      id: 'cancun',
      name: 'Viaje a Cancún',
      target: pesos(30_000),
      openingSavings: pesos(5_000),
      frequency: { kind: 'mensual', day: 15 },
      from: day('2026-10-01'),
      deadline: day('2027-05-30'),
      milestones,
    });
  }

  it('ordena los hitos y asigna cantidades distintas por etapa', () => {
    const goal = cancun();
    assert.deepEqual(
      goal.milestones.map((milestone) => milestone.id),
      ['vuelos', 'hotel', 'actividades'],
    );
    const byStage = (id: string) => goal.schedule.filter((entry) => entry.milestoneId === id).map((entry) => entry.amount);
    assert.deepEqual(byStage('vuelos'), [1_750, 1_750, 1_750, 1_750]);
    assert.deepEqual(byStage('hotel'), [5_000, 5_000]);
    assert.deepEqual(byStage('actividades'), [4_000, 4_000]);
    assert.equal(
      goal.schedule.reduce((total, entry) => total + entry.amount, 0),
      goal.state.pending,
    );
    expectInvariants(goal);
  });

  it('acumula varios desembolsos del mismo hito', () => {
    const goal = createGoal({
      id: 'hito',
      name: 'Un hito',
      target: pesos(1_000),
      openingSavings: pesos(1_000),
      frequency: { kind: 'semanal', weekday: 'domingo' },
      from: day('2026-09-27'),
      deadline: day('2026-10-11'),
      milestones: [{ id: 'unico', name: 'Único', planned: pesos(1_000), due: day('2026-10-11') }],
    });
    const first = confirmDisbursement(goal, {
      id: 'd1',
      milestoneId: 'unico',
      amount: pesos(400),
      available: pesos(1_000),
      occurredOn: day('2026-10-04'),
    });
    const second = confirmDisbursement(first.goal, {
      id: 'd2',
      milestoneId: 'unico',
      amount: pesos(300),
      available: pesos(1_000),
      occurredOn: day('2026-10-11'),
    });
    assert.equal(milestoneViews(second.goal)[0]?.used, 700);
    assert.equal(milestoneViews(second.goal)[0]?.pending, 300);
    assert.equal(second.goal.state.reserve, 300);
    expectInvariants(first.goal);
    expectInvariants(second.goal);
  });
});

describe('desembolsos y reserva', () => {
  function funded(opening: number, target = 5_000): Goal {
    return createGoal({
      id: 'fondo',
      name: 'Fondo',
      target: pesos(target),
      openingSavings: pesos(opening),
      frequency: { kind: 'semanal', weekday: 'domingo' },
      from: day('2026-09-27'),
      deadline: day('2026-10-18'),
      milestones: [{ id: 'pago', name: 'Pago', planned: pesos(target), due: day('2026-10-18') }],
    });
  }

  it('cubre un desembolso completo con la reserva y no vuelve a reducir el disponible', () => {
    const goal = funded(500, 1_000);
    const before = JSON.stringify(goal);
    const simulation = simulateDisbursement(goal, {
      milestoneId: 'pago',
      amount: pesos(200),
      available: pesos(800),
    });
    assert.equal(JSON.stringify(goal), before);
    assert.equal(simulation.requiresResolution, false);
    assert.equal(simulation.increaseMilestone.coveredByReserve, 200);
    assert.equal(simulation.increaseMilestone.immediateContribution, 0);
    assert.equal(simulation.increaseMilestone.projectedAvailable, 800);
    assert.equal(simulation.increaseMilestone.warning, null);

    const confirmed = confirmDisbursement(goal, {
      id: 'd1',
      milestoneId: 'pago',
      amount: pesos(200),
      available: pesos(800),
      occurredOn: day('2026-10-04'),
    });
    assert.equal(confirmed.goal.version, 2);
    assert.equal(confirmed.balanceDelta, -200);
    assert.equal(confirmed.reserveDelta, -200);
    assert.equal(confirmed.availableDelta, 0);
    assert.equal(confirmed.goal.state.reserve, 300);
    expectInvariants(confirmed.goal);
  });

  it('crea una aportación inmediata cuando el desembolso supera la reserva', () => {
    const goal = funded(200);
    const simulation = simulateDisbursement(goal, {
      milestoneId: 'pago',
      amount: pesos(500),
      available: pesos(1_000),
    });
    assert.equal(simulation.increaseMilestone.coveredByReserve, 200);
    assert.equal(simulation.increaseMilestone.immediateContribution, 300);
    assert.equal(simulation.increaseMilestone.requiresAvailableAuthorization, true);
    assert.throws(
      () =>
        confirmDisbursement(goal, {
          id: 'd1',
          milestoneId: 'pago',
          amount: pesos(500),
          available: pesos(1_000),
          occurredOn: day('2026-10-04'),
        }),
      (error: unknown) => error instanceof GoalError && error.code === 'authorization',
    );

    const confirmed = confirmDisbursement(goal, {
      id: 'd1',
      milestoneId: 'pago',
      amount: pesos(500),
      available: pesos(1_000),
      authorizeAvailable: true,
      occurredOn: day('2026-10-04'),
    });
    assert.equal(confirmed.immediateContribution, 300);
    assert.equal(confirmed.goal.immediateContributions[0]?.amount, 300);
    assert.equal(iso(confirmed.goal.immediateContributions[0].occurredOn), '2026-10-04');
    assert.equal(iso(confirmed.goal.disbursements[0].occurredOn), '2026-10-04');
    assert.equal(confirmed.goal.immediateContributions[0]?.disbursementId, 'd1');
    assert.equal(confirmed.goal.state.reserve, 0);
    assert.equal(confirmed.goal.state.utilized, 500);
    assert.equal(confirmed.goal.state.progress, 500);
    expectInvariants(confirmed.goal);
  });

  it('advierte cuando el disponible proyectado queda negativo y permite registrar el pago', () => {
    const goal = funded(200);
    const simulation = simulateDisbursement(goal, {
      milestoneId: 'pago',
      amount: pesos(500),
      available: pesos(100),
    });
    assert.equal(simulation.increaseMilestone.projectedAvailable, -200);
    assert.match(simulation.increaseMilestone.warning ?? '', /negativo/);
    const confirmed = confirmDisbursement(goal, {
      id: 'd1',
      milestoneId: 'pago',
      amount: pesos(500),
      available: pesos(100),
      authorizeAvailable: true,
      occurredOn: day('2026-10-04'),
    });
    assert.equal(confirmed.projectedAvailable, -200);
    assert.equal(confirmed.goal.state.reserve, 0);
    expectInvariants(confirmed.goal);
  });

  it('resuelve un pago mayor que el pendiente del hito de las dos formas', () => {
    const goal = funded(1_000, 1_000);
    const simulation = simulateDisbursement(goal, {
      milestoneId: 'pago',
      amount: pesos(1_500),
      available: pesos(2_000),
    });
    assert.equal(simulation.requiresResolution, true);
    assert.equal(simulation.increaseMilestone.immediateContribution, 500);
    assert.equal(simulation.splitExcess.linkedAmount, 1_000);
    assert.equal(simulation.splitExcess.ordinaryExpense, 500);
    assert.equal(simulation.splitExcess.projectedAvailable, 1_500);
    assert.throws(
      () =>
        confirmDisbursement(goal, {
          id: 'd1',
          milestoneId: 'pago',
          amount: pesos(1_500),
          available: pesos(2_000),
          authorizeAvailable: true,
          occurredOn: day('2026-10-04'),
        }),
      (error: unknown) => error instanceof GoalError && error.code === 'resolution',
    );

    const increased = confirmDisbursement(goal, {
      id: 'aumentar',
      milestoneId: 'pago',
      amount: pesos(1_500),
      available: pesos(2_000),
      resolution: 'aumentar-hito',
      authorizeAvailable: true,
      occurredOn: day('2026-10-04'),
    });
    assert.equal(increased.goal.target, 1_500);
    assert.equal(increased.goal.milestones[0]?.planned, 1_500);
    assert.equal(increased.goal.disbursements[0]?.amount, 1_500);
    assert.equal(increased.ordinaryExpense, 0);
    assert.equal(increased.goal.state.reserve, 0);
    expectInvariants(increased.goal);

    const split = confirmDisbursement(goal, {
      id: 'separar',
      milestoneId: 'pago',
      amount: pesos(1_500),
      available: pesos(2_000),
      resolution: 'separar-excedente',
      occurredOn: day('2026-10-04'),
    });
    assert.equal(split.goal.target, 1_000);
    assert.equal(split.goal.disbursements[0]?.amount, 1_000);
    assert.equal(split.ordinaryExpense, 500);
    assert.equal(split.goal.state.reserve, 0);
    expectInvariants(split.goal);
  });

  it('registra una aportación sin convertirla en gasto', () => {
    const goal = weeklyGoal(300);
    const updated = confirmContribution(goal, {
      id: 'a1',
      amount: pesos(100),
      occurredOn: day('2026-09-27'),
    });
    assert.equal(updated.state.reserve, 100);
    assert.equal(updated.state.utilized, 0);
    assert.equal(updated.state.pending, 200);
    assert.equal(updated.schedule.some((entry) => iso(entry.date) === '2026-09-27'), false);
    expectInvariants(updated);
  });
});

describe('aportaciones omitidas y reajustes', () => {
  function route(): Goal {
    return weeklyGoal(400, '2026-10-18');
  }

  it('redistribuye el pendiente al omitir una aportación', () => {
    const goal = route();
    const before = JSON.stringify(goal);
    const simulation = simulateSkip(goal, day('2026-09-27'));
    assert.equal(JSON.stringify(goal), before);
    assert.deepEqual(
      simulation.schedule.map((entry) => entry.amount),
      [134, 133, 133],
    );
    const confirmed = confirmSkip(goal, day('2026-09-27'));
    assert.equal(confirmed.version, 2);
    assert.equal(confirmed.history.length, 1);
    assert.equal(confirmed.state.reserve, 0);
    assert.deepEqual(
      confirmed.schedule.map((entry) => entry.amount),
      [134, 133, 133],
    );
    expectInvariants(confirmed);
  });

  it('marca inviable una omisión que deja el pendiente sin fechas', () => {
    const goal = createGoal({
      id: 'unica',
      name: 'Única',
      target: pesos(100),
      openingSavings: pesos(0),
      frequency: { kind: 'quincena-calendario' },
      from: day('2026-09-30'),
      deadline: day('2026-09-30'),
    });
    const confirmed = confirmSkip(goal, day('2026-09-30'));
    assert.equal(confirmed.feasible, false);
    assert.match(confirmed.reason ?? '', /No hay fechas/);
    assert.equal(confirmed.state.pending, 100);
    expectInvariants(confirmed);
  });

  it('simula las tres alternativas y solo confirmar crea una versión', () => {
    const goal = route();
    const omitDate = day('2026-09-27');
    const increase = simulateIncreaseContributions(goal, { omitDate });
    const move = simulateMoveDeadline(goal, { omitDate });
    const reduce = simulateReduceTarget(goal, { omitDate });
    assert.equal(goal.version, 1);
    assert.deepEqual(
      increase.schedule.map((entry) => entry.amount),
      [134, 133, 133],
    );
    assert.equal(increase.deadline.day, 18);
    assert.equal(iso(move.deadline), '2026-10-25');
    assert.deepEqual(
      move.schedule.map((entry) => entry.amount),
      [100, 100, 100, 100],
    );
    assert.equal(reduce.target, 300);
    assert.deepEqual(
      reduce.schedule.map((entry) => entry.amount),
      [100, 100, 100],
    );

    const confirmed = confirmAdjustment(goal, { kind: 'mover', omitDate });
    assert.equal(confirmed.version, 2);
    assert.equal(iso(confirmed.deadline), '2026-10-25');
    assert.equal(deferAdjustment(goal), goal);
    expectInvariants(confirmed);
  });
});

describe('entradas de metas', () => {
  it('rechaza hitos duplicados, fechas invertidas, hitos desconocidos y cantidades fuera de rango', () => {
    const base = {
      id: 'meta',
      name: 'Meta',
      target: pesos(100),
      openingSavings: pesos(0),
      frequency: { kind: 'semanal' as const, weekday: 'domingo' as const },
      from: day('2026-09-27'),
      deadline: day('2026-10-11'),
    };
    assert.throws(
      () =>
        createGoal({
          ...base,
          milestones: [
            { id: 'a', name: 'A', planned: pesos(40), due: day('2026-10-11') },
            { id: 'a', name: 'B', planned: pesos(40), due: day('2026-10-11') },
          ],
        }),
      (error: unknown) => error instanceof GoalError && error.code === 'duplicate',
    );
    assert.throws(
      () => createGoal({ ...base, deadline: day('2026-09-01') }),
      (error: unknown) => error instanceof GoalError && error.code === 'range',
    );
    assert.throws(() => createGoal({ ...base, target: -1 as Cents }), MoneyError);
    assert.throws(() => createGoal({ ...base, target: (Number.MAX_SAFE_INTEGER + 1) as Cents }), MoneyError);
    const goal = createGoal(base);
    assert.throws(
      () => simulateDisbursement(goal, { milestoneId: 'no-existe', amount: pesos(10), available: pesos(0) }),
      (error: unknown) => error instanceof GoalError && error.code === 'not-found',
    );
  });
});

describe('correcciones del motor', () => {
  it('cubre dos hitos que vencen el mismo día sin aportaciones en cero', () => {
    const goal = createGoal({
      id: 'mismo-dia',
      name: 'Mismo día',
      target: pesos(200),
      openingSavings: pesos(0),
      frequency: { kind: 'semanal', weekday: 'domingo' },
      from: day('2026-09-27'),
      deadline: day('2026-10-04'),
      milestones: [
        { id: 'b', name: 'Segundo', planned: pesos(100), due: day('2026-10-04') },
        { id: 'a', name: 'Primero', planned: pesos(100), due: day('2026-10-04') },
      ],
    });
    assert.equal(goal.feasible, true);
    assert.equal(
      goal.schedule.reduce((total, entry) => total + entry.amount, 0),
      200,
    );
    assert.equal(goal.schedule.some((entry) => entry.amount === 0), false);
    for (const milestoneId of ['a', 'b']) {
      const covered = goal.schedule
        .filter((entry) => entry.milestoneId === milestoneId)
        .reduce((total, entry) => total + entry.amount, 0);
      assert.equal(covered, 100);
    }
    expectInvariants(goal);
  });

  it('no programa centavos en cero', () => {
    const goal = weeklyGoal(1);
    assert.deepEqual(
      goal.schedule.map((entry) => entry.amount),
      [1],
    );
  });

  it('rechaza un hito fuera del inicio o de la fecha final', () => {
    const base = {
      id: 'ventana',
      name: 'Ventana',
      target: pesos(100),
      openingSavings: pesos(0),
      frequency: { kind: 'semanal' as const, weekday: 'domingo' as const },
      from: day('2026-09-27'),
      deadline: day('2026-10-04'),
    };
    assert.throws(
      () =>
        createGoal({
          ...base,
          milestones: [{ id: 'antes', name: 'Antes', planned: pesos(100), due: day('2026-09-20') }],
        }),
      GoalError,
    );
    assert.throws(
      () =>
        createGoal({
          ...base,
          milestones: [{ id: 'despues', name: 'Después', planned: pesos(100), due: day('2026-10-11') }],
        }),
      GoalError,
    );
  });

  it('impide reducir el objetivo por debajo de los hitos y confirmar esa simulación', () => {
    const goal = createGoal({
      id: 'reduccion',
      name: 'Reducción',
      target: pesos(1_000),
      openingSavings: pesos(0),
      frequency: { kind: 'semanal', weekday: 'domingo' },
      from: day('2026-09-27'),
      deadline: day('2026-10-04'),
      milestones: [{ id: 'hito', name: 'Hito', planned: pesos(1_000), due: day('2026-10-04') }],
    });
    const before = JSON.stringify(goal);
    const simulation = simulateReduceTarget(goal, { omitDate: day('2026-09-27') });
    assert.equal(JSON.stringify(goal), before);
    assert.equal(simulation.feasible, false);
    assert.match(simulation.reason ?? '', /hitos/);
    assert.equal(goal.milestones[0]?.planned, 1_000);
    assert.throws(() => confirmAdjustment(goal, { kind: 'reducir', omitDate: day('2026-09-27') }), GoalError);
    assert.equal(goal.version, 1);
  });

  it('rechaza un reajuste o una resolución desconocidos y conserva una confirmación válida', () => {
    const goal = weeklyGoal(400, '2026-10-18');
    assert.throws(() => confirmAdjustment(goal, { kind: 'otro' as 'aumentar' }), GoalError);
    const funded = createGoal({
      id: 'fondo',
      name: 'Fondo',
      target: pesos(1_000),
      openingSavings: pesos(1_000),
      frequency: { kind: 'semanal', weekday: 'domingo' },
      from: day('2026-09-27'),
      deadline: day('2026-10-18'),
      milestones: [{ id: 'pago', name: 'Pago', planned: pesos(1_000), due: day('2026-10-18') }],
    });
    assert.throws(
      () =>
        confirmDisbursement(funded, {
          id: 'd1',
          milestoneId: 'pago',
          amount: pesos(100),
          available: pesos(1_000),
          occurredOn: day('2026-10-04'),
          resolution: 'otra' as 'aumentar-hito',
        }),
      GoalError,
    );
    const before = JSON.stringify(goal);
    const move = simulateMoveDeadline(goal, { omitDate: day('2026-09-27') });
    assert.equal(JSON.stringify(goal), before);
    assert.ok(iso(move.deadline) >= '2026-10-18');
    const confirmed = confirmAdjustment(goal, { kind: 'aumentar', omitDate: day('2026-09-27') });
    assert.equal(confirmed.version, 2);
    assert.equal(confirmed.history.length, 1);
    expectInvariants(confirmed);
  });

  it('evita que el identificador de la aportación inmediata choque con uno existente', () => {
    const goal = createGoal({
      id: 'choque',
      name: 'Choque',
      target: pesos(1_000),
      openingSavings: pesos(200),
      frequency: { kind: 'semanal', weekday: 'domingo' },
      from: day('2026-09-27'),
      deadline: day('2026-10-18'),
      milestones: [{ id: 'pago', name: 'Pago', planned: pesos(1_000), due: day('2026-10-18') }],
    });
    const reserved = confirmContribution(goal, {
      id: 'd1:inmediata',
      amount: pesos(10),
      occurredOn: day('2026-09-27'),
    });
    const confirmed = confirmDisbursement(reserved, {
      id: 'd1',
      milestoneId: 'pago',
      amount: pesos(500),
      available: pesos(1_000),
      authorizeAvailable: true,
      occurredOn: day('2026-10-04'),
    });
    const immediate = confirmed.goal.immediateContributions[0];
    assert.equal(immediate?.disbursementId, 'd1');
    assert.equal(iso(immediate?.occurredOn ?? day('2026-01-01')), '2026-10-04');
    assert.notEqual(immediate?.id, 'd1:inmediata');
    assert.equal(confirmed.goal.contributions.some((item) => item.id === immediate?.id), false);
    expectInvariants(confirmed.goal);
  });
});
