import type { MovementKindInput } from '../movements/validation';
import type { Cents } from '../money';
import { centsFromDatabase, centsToDatabase } from './database-cents';
import { updateLastAccount } from './profile-repository';
import { getSupabase } from './supabase-client';

export type MovementRecord = {
  id: string;
  accountId: string;
  categoryId: string;
  kind: MovementKindInput;
  amount: Cents;
  status: 'confirmado' | 'pendiente';
  occurredOn: string;
  note: string | null;
  goalDisbursementId: string | null;
  createdAt: string;
};

type MovementRow = {
  id: string;
  account_id: string;
  category_id: string;
  kind: MovementKindInput;
  amount_cents: string | number;
  status: 'confirmado' | 'pendiente';
  occurred_on: string;
  note: string | null;
  goal_disbursement_id: string | null;
  created_at: string;
};

export type MovementWrite = {
  kind: MovementKindInput;
  amount: Cents;
  categoryId: string;
  accountId: string;
  occurredOn: string;
  note: string | null;
};

function mapMovement(row: MovementRow): MovementRecord {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    kind: row.kind,
    amount: centsFromDatabase(row.amount_cents),
    status: row.status,
    occurredOn: row.occurred_on,
    note: row.note,
    goalDisbursementId: row.goal_disbursement_id,
    createdAt: row.created_at,
  };
}

function movementError(error: { code?: string; message?: string }, fallback: string): Error {
  const message = error.message ?? '';
  if (message.includes('pertenece a una meta')) {
    return new Error('Este gasto pertenece a una meta. Se corrige desde la meta.');
  }
  if (message.includes('fecha futura')) {
    return new Error('Un movimiento confirmado no puede tener fecha futura.');
  }
  if (error.code === '23514') {
    return new Error('Esos datos no cumplen las reglas de un movimiento.');
  }
  if (error.code === '23503') {
    return new Error('No se puede usar esa cuenta o esa categoría.');
  }
  return new Error(fallback);
}

async function currentUserId(): Promise<string> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) {
    throw new Error('No hay una sesión activa.');
  }
  return data.user.id;
}

export async function loadMovements(): Promise<MovementRecord[]> {
  const { data, error } = await getSupabase()
    .from('movements')
    .select(
      'id, account_id, category_id, kind, amount_cents, status, occurred_on, note, goal_disbursement_id, created_at',
    )
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    throw new Error('No se pudieron leer los movimientos.');
  }
  return (data as MovementRow[] | null)?.map(mapMovement) ?? [];
}

export async function createMovement(input: MovementWrite): Promise<void> {
  const userId = await currentUserId();
  const { error } = await getSupabase().from('movements').insert({
    user_id: userId,
    account_id: input.accountId,
    category_id: input.categoryId,
    kind: input.kind,
    amount_cents: centsToDatabase(input.amount),
    status: 'confirmado',
    occurred_on: input.occurredOn,
    note: input.note,
  });
  if (error) {
    throw movementError(error, 'No se pudo guardar el movimiento.');
  }
}

export async function updateMovement(id: string, input: MovementWrite): Promise<void> {
  const { error } = await getSupabase()
    .from('movements')
    .update({
      account_id: input.accountId,
      category_id: input.categoryId,
      kind: input.kind,
      amount_cents: centsToDatabase(input.amount),
      occurred_on: input.occurredOn,
      note: input.note,
    })
    .eq('id', id);
  if (error) {
    throw movementError(error, 'No se pudo corregir el movimiento.');
  }
}

export async function deleteMovement(id: string): Promise<void> {
  const { error } = await getSupabase().from('movements').delete().eq('id', id);
  if (error) {
    throw movementError(error, 'No se pudo eliminar el movimiento.');
  }
}

export async function rememberAccount(accountId: string): Promise<void> {
  await updateLastAccount(accountId);
}
