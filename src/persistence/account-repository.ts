import type { AccountKind } from '../ledger';
import type { Cents } from '../money';
import { centsFromDatabase, centsToDatabase } from './database-cents';
import { getSupabase } from './supabase-client';

export type AccountRecord = {
  id: string;
  kind: AccountKind;
  name: string;
  openingBalance: Cents;
  active: boolean;
};

type AccountRow = {
  id: string;
  kind: AccountKind;
  name: string;
  opening_balance_cents: string;
  active: boolean;
};

function mapAccount(row: AccountRow): AccountRecord {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    openingBalance: centsFromDatabase(row.opening_balance_cents, { allowNegative: true }),
    active: row.active,
  };
}

export async function loadAccounts(): Promise<AccountRecord[]> {
  const { data, error } = await getSupabase()
    .from('accounts')
    .select('id, kind, name, opening_balance_cents, active')
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error('No se pudieron leer las cuentas.');
  }
  return (data as AccountRow[] | null)?.map(mapAccount) ?? [];
}

export async function saveAccount(input: {
  id?: string;
  kind: AccountKind;
  name: string;
  openingBalance: Cents;
  active?: boolean;
}): Promise<void> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser();
  if (userError || !userData.user) {
    throw new Error('No hay una sesión activa.');
  }
  const payload = {
    user_id: userData.user.id,
    kind: input.kind,
    name: input.name.trim(),
    opening_balance_cents: centsToDatabase(input.openingBalance),
    active: input.active ?? true,
  };
  const query = input.id
    ? getSupabase().from('accounts').update(payload).eq('id', input.id)
    : getSupabase().from('accounts').insert(payload);
  const { error } = await query;
  if (error) {
    throw new Error('No se pudo guardar la cuenta.');
  }
}

export async function archiveAccount(id: string): Promise<void> {
  const { error } = await getSupabase().from('accounts').update({ active: false }).eq('id', id);
  if (error) {
    throw new Error('No se pudo archivar la cuenta.');
  }
}

export async function reactivateAccount(id: string): Promise<void> {
  const { error } = await getSupabase().from('accounts').update({ active: true }).eq('id', id);
  if (error) {
    throw new Error('No se pudo reactivar la cuenta.');
  }
}
