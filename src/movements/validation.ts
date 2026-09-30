import { compareCivilDates, formatIsoDate, parseIsoDate, todayInTimeZone, type CivilDate } from '../dates';
import { MoneyError, parsePesos, type Cents } from '../money';

export const NOTE_LIMIT = 280;

export type MovementKindInput = 'ingreso' | 'gasto';

export type MovementInput = {
  kind: MovementKindInput;
  amount: string;
  categoryId: string;
  accountId: string;
  date: string;
  note: string;
};

export type ValidMovement = {
  kind: MovementKindInput;
  amount: Cents;
  categoryId: string;
  accountId: string;
  occurredOn: string;
  note: string | null;
};

export function movementNote(input: string): string | null {
  const note = input.trim();
  if (note.length === 0) {
    return null;
  }
  if (note.length > NOTE_LIMIT) {
    throw new Error('La nota puede tener hasta 280 caracteres.');
  }
  return note;
}

export function categoryName(input: string): string {
  const name = input.trim();
  if (name.length === 0) {
    throw new Error('La categoría necesita un nombre.');
  }
  return name;
}

export function categoryNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function validateMovementInput(input: MovementInput, today: CivilDate = todayInTimeZone()): ValidMovement {
  let amount: Cents;
  try {
    amount = parsePesos(input.amount);
  } catch (error) {
    if (error instanceof MoneyError && error.code === 'negative') {
      throw new Error('La cantidad no puede ser negativa.');
    }
    if (error instanceof MoneyError && error.code === 'unsafe') {
      throw new Error('La cantidad queda fuera del rango seguro.');
    }
    throw new Error('La cantidad en pesos no es válida.');
  }
  if (amount === 0) {
    throw new Error('La cantidad debe ser mayor que cero.');
  }
  if (input.kind !== 'ingreso' && input.kind !== 'gasto') {
    throw new Error('El movimiento solo puede ser ingreso o gasto.');
  }
  if (input.categoryId.trim().length === 0) {
    throw new Error('Elige una categoría.');
  }
  if (input.accountId.trim().length === 0) {
    throw new Error('Elige una cuenta.');
  }
  let occurredOn: string;
  try {
    const occurred = parseIsoDate(input.date.trim());
    if (compareCivilDates(occurred, today) > 0) {
      throw new Error('Un movimiento confirmado no puede tener fecha futura.');
    }
    occurredOn = formatIsoDate(occurred);
  } catch (error) {
    if (error instanceof Error && error.message.includes('fecha futura')) {
      throw error;
    }
    throw new Error('La fecha debe usar el formato AAAA-MM-DD.');
  }
  return {
    kind: input.kind,
    amount,
    categoryId: input.categoryId.trim(),
    accountId: input.accountId.trim(),
    occurredOn,
    note: movementNote(input.note),
  };
}

export function sameKindCategory<T extends { id: string; kind: MovementKindInput; archivedAt: string | null }>(
  categories: readonly T[],
  kind: MovementKindInput,
  currentId: string | null,
): T[] {
  return categories.filter(
    (category) => category.kind === kind && (category.archivedAt === null || category.id === currentId),
  );
}

export function selectableAccounts<T extends { id: string; active: boolean }>(
  accounts: readonly T[],
  currentId: string | null,
): T[] {
  return accounts.filter((account) => account.active || account.id === currentId);
}
