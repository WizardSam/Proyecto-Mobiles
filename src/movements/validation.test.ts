import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { civilDate } from '../dates';
import { compareNewestFirst, isInMonth, monthBounds, monthTitle, shiftMonth } from './period';
import {
  flushPendingDeletion,
  getPendingDeletionSnapshot,
  startPendingDeletion,
  undoPendingDeletion,
  UNDO_WINDOW_MS,
} from './pending-deletion';
import {
  categoryName,
  categoryNameKey,
  movementNote,
  sameKindCategory,
  selectableAccounts,
  validateMovementInput,
} from './validation';

test('rechaza una cantidad de cero', () => {
  assert.throws(() => validateMovementInput(validInput({ amount: '$0.00' })), /mayor que cero/);
  assert.throws(() => validateMovementInput(validInput({ amount: '0' })), /mayor que cero/);
});

test('rechaza una cantidad negativa o ilegible', () => {
  assert.throws(() => validateMovementInput(validInput({ amount: '-$10' })), /negativa/);
  assert.throws(() => validateMovementInput(validInput({ amount: 'diez' })), /no es válida/);
});

test('acepta una cantidad positiva de hoy o de un día pasado y rechaza una fecha futura', () => {
  const today = civilDate(2026, 9, 28);
  const movement = validateMovementInput(validInput({ amount: '$1,250.50', date: '2026-09-28' }), today);
  assert.equal(movement.amount, 125050);
  assert.equal(movement.occurredOn, '2026-09-28');
  assert.equal(movement.note, null);
  assert.equal(validateMovementInput(validInput({ date: '2026-09-01' }), today).occurredOn, '2026-09-01');
  assert.throws(
    () => validateMovementInput(validInput({ date: '2026-09-29' }), today),
    /fecha futura/,
  );
  assert.throws(
    () => validateMovementInput(validInput({ date: '2027-01-02' }), today),
    /fecha futura/,
  );
});

test('la nota vacía se guarda nula y la larga se rechaza', () => {
  assert.equal(movementNote('   '), null);
  assert.equal(movementNote('  taxi  '), 'taxi');
  assert.equal(validateMovementInput(validInput({ note: '  café  ' })).note, 'café');
  assert.throws(() => movementNote('a'.repeat(281)), /280/);
  assert.equal(movementNote('a'.repeat(280))?.length, 280);
});

test('exige categoría, cuenta y fecha civil', () => {
  assert.throws(() => validateMovementInput(validInput({ categoryId: ' ' })), /categoría/);
  assert.throws(() => validateMovementInput(validInput({ accountId: '' })), /cuenta/);
  assert.throws(() => validateMovementInput(validInput({ date: '30/09/2026' })), /AAAA-MM-DD/);
});

test('el nombre de categoría ignora espacios y mayúsculas', () => {
  assert.equal(categoryName('  Comida '), 'Comida');
  assert.throws(() => categoryName('   '), /nombre/);
  assert.equal(categoryNameKey('  COMIDA '), categoryNameKey('comida'));
});

test('una categoría archivada solo sigue disponible si ya es la del movimiento', () => {
  const categories = [
    { id: 'activa', kind: 'gasto' as const, archivedAt: null },
    { id: 'archivada', kind: 'gasto' as const, archivedAt: '2026-09-01' },
    { id: 'ingreso', kind: 'ingreso' as const, archivedAt: null },
  ];
  assert.deepEqual(
    sameKindCategory(categories, 'gasto', null).map((item) => item.id),
    ['activa'],
  );
  assert.deepEqual(
    sameKindCategory(categories, 'gasto', 'archivada').map((item) => item.id),
    ['activa', 'archivada'],
  );
});

test('una cuenta archivada solo sigue disponible si ya es la del movimiento', () => {
  const accounts = [
    { id: 'viva', active: true },
    { id: 'archivada', active: false },
  ];
  assert.deepEqual(
    selectableAccounts(accounts, null).map((item) => item.id),
    ['viva'],
  );
  assert.deepEqual(
    selectableAccounts(accounts, 'archivada').map((item) => item.id),
    ['viva', 'archivada'],
  );
});

test('el mes civil avanza, retrocede y nombra el periodo', () => {
  const september = civilDate(2026, 9, 28);
  assert.equal(monthTitle(shiftMonth(september, -1)), 'Agosto 2026');
  assert.equal(monthTitle(shiftMonth(september, 1)), 'Octubre 2026');
  assert.equal(isInMonth('2026-09-01', september), true);
  assert.equal(isInMonth('2026-10-01', september), false);
  const bounds = monthBounds(civilDate(2024, 2, 10));
  assert.equal(bounds.end.day, 29);
});

test('la lista va de la fecha más reciente a la más antigua', () => {
  const rows = [
    { occurredOn: '2026-09-01', createdAt: '2026-09-01T10:00:00Z' },
    { occurredOn: '2026-09-02', createdAt: '2026-09-02T10:00:00Z' },
    { occurredOn: '2026-09-02', createdAt: '2026-09-02T11:00:00Z' },
  ];
  const ordered = [...rows].sort(compareNewestFirst);
  assert.deepEqual(
    ordered.map((item) => item.createdAt),
    ['2026-09-02T11:00:00Z', '2026-09-02T10:00:00Z', '2026-09-01T10:00:00Z'],
  );
});

test('deshacer dentro de los 5 segundos no borra y salir sí confirma', async () => {
  enableUndoTimers();
  const committed: string[] = [];
  const commit = async (id: string) => {
    committed.push(id);
  };
  startPendingDeletion('mov-1', commit);
  assert.equal(getPendingDeletionSnapshot().id, 'mov-1');
  undoPendingDeletion();
  mock.timers.tick(UNDO_WINDOW_MS);
  assert.deepEqual(committed, []);
  assert.equal(getPendingDeletionSnapshot().id, null);

  startPendingDeletion('mov-2', commit);
  flushPendingDeletion(commit);
  await Promise.resolve();
  assert.deepEqual(committed, ['mov-2']);
  mock.timers.reset();
});

test('al eliminar otro movimiento se confirma el anterior', async () => {
  enableUndoTimers();
  const committed: string[] = [];
  const commit = async (id: string) => {
    committed.push(id);
  };
  startPendingDeletion('primero', commit);
  startPendingDeletion('segundo', commit);
  await Promise.resolve();
  assert.deepEqual(committed, ['primero']);
  assert.equal(getPendingDeletionSnapshot().id, 'segundo');
  undoPendingDeletion();
  mock.timers.reset();
});

test('al cumplirse el plazo la fila sigue oculta hasta que el borrado termina', async () => {
  enableUndoTimers();
  let release = () => {};
  let opened = false;
  const commit = () =>
    new Promise<void>((resolve) => {
      release = () => resolve();
      opened = true;
    });
  startPendingDeletion('mov-3', commit);
  mock.timers.tick(UNDO_WINDOW_MS);
  const waiting = getPendingDeletionSnapshot();
  assert.equal(waiting.id, 'mov-3');
  assert.equal(waiting.undoable, false);
  assert.equal(opened, true);
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(getPendingDeletionSnapshot().id, null);
  mock.timers.reset();
});

function enableUndoTimers(): void {
  // Node 24 rechaza clearTimeout dentro de apis. Simular setTimeout basta para que clearTimeout lo cancele.
  mock.timers.enable({ apis: ['setTimeout'] });
}

function validInput(patch: Partial<Parameters<typeof validateMovementInput>[0]>) {
  return {
    kind: 'gasto' as const,
    amount: '$10',
    categoryId: 'comida',
    accountId: 'debito',
    date: '2026-09-28',
    note: '',
    ...patch,
  };
}
