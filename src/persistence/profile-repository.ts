import type { Weekday } from '../dates';
import type { Cents } from '../money';
import { centsToDatabase, optionalCentsFromDatabase } from './database-cents';
import { getSupabase } from './supabase-client';

export type IncomeFrequency = 'semanal' | 'quincena-calendario' | 'cada-14-dias' | 'mensual';

export type ProfileRecord = {
  id: string;
  displayName: string;
  currency: 'MXN';
  timezone: 'America/Mexico_City';
  incomeFrequency: IncomeFrequency | null;
  incomeWeekday: Weekday | null;
  incomeAnchorDate: string | null;
  expectedIncome: Cents | null;
  estimatedExpense: Cents | null;
  trackingStartedOn: string | null;
  lastAccountId: string | null;
  emailConfirmed: boolean;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  currency: string;
  timezone: string;
  income_frequency: IncomeFrequency | null;
  income_weekday: Weekday | null;
  income_anchor_date: string | null;
  expected_income_cents: string | null;
  estimated_expense_cents: string | null;
  tracking_started_on: string | null;
  last_account_id: string | null;
};

function mapProfile(row: ProfileRow, emailConfirmed: boolean): ProfileRecord {
  if (row.currency !== 'MXN' || row.timezone !== 'America/Mexico_City') {
    throw new Error('El perfil guardado no corresponde al MVP.');
  }
  return {
    id: row.id,
    displayName: row.display_name ?? '',
    currency: 'MXN',
    timezone: 'America/Mexico_City',
    incomeFrequency: row.income_frequency,
    incomeWeekday: row.income_weekday,
    incomeAnchorDate: row.income_anchor_date,
    expectedIncome: optionalCentsFromDatabase(row.expected_income_cents),
    estimatedExpense: optionalCentsFromDatabase(row.estimated_expense_cents),
    trackingStartedOn: row.tracking_started_on,
    lastAccountId: row.last_account_id,
    emailConfirmed,
  };
}

export async function loadProfile(emailConfirmed: boolean): Promise<ProfileRecord | null> {
  const { data, error } = await getSupabase().from('profiles').select('*').maybeSingle();
  if (error) {
    throw new Error('No se pudo leer el perfil.');
  }
  if (!data) {
    return null;
  }
  return mapProfile(data as ProfileRow, emailConfirmed);
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser();
  if (userError || !userData.user) {
    throw new Error('No hay una sesión activa.');
  }
  const trimmed = displayName.trim();
  const { error } = await getSupabase()
    .from('profiles')
    .update({ display_name: trimmed.length > 0 ? trimmed : null })
    .eq('id', userData.user.id);
  if (error) {
    throw new Error('No se pudo guardar el nombre.');
  }
}

export async function updateFinancialProfile(input: {
  incomeFrequency: IncomeFrequency | null;
  incomeWeekday: Weekday | null;
  incomeAnchorDate: string | null;
  expectedIncome: Cents | null;
  estimatedExpense: Cents | null;
  trackingStartedOn: string | null;
  lastAccountId: string | null;
}): Promise<void> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser();
  if (userError || !userData.user) {
    throw new Error('No hay una sesión activa.');
  }
  const { error } = await getSupabase()
    .from('profiles')
    .update({
      income_frequency: input.incomeFrequency,
      income_weekday: input.incomeWeekday,
      income_anchor_date: input.incomeAnchorDate,
      expected_income_cents: input.expectedIncome === null ? null : centsToDatabase(input.expectedIncome),
      estimated_expense_cents: input.estimatedExpense === null ? null : centsToDatabase(input.estimatedExpense),
      tracking_started_on: input.trackingStartedOn,
      last_account_id: input.lastAccountId,
    })
    .eq('id', userData.user.id);
  if (error) {
    const text = error.message ?? ''
    if (
      text.includes('Confirma tu correo') ||
      text.includes('moneda') ||
      text.includes('identificador') ||
      text.includes('zona horaria')
    ) {
      throw new Error(text)
    }
    throw new Error('No se pudo guardar el perfil.')
  }
}

export async function updateLastAccount(lastAccountId: string): Promise<void> {
  const { data: userData, error: userError } = await getSupabase().auth.getUser();
  if (userError || !userData.user) {
    throw new Error('No hay una sesión activa.');
  }
  const { error } = await getSupabase()
    .from('profiles')
    .update({ last_account_id: lastAccountId })
    .eq('id', userData.user.id);
  if (error) {
    throw new Error('No se pudo recordar la última cuenta.');
  }
}
