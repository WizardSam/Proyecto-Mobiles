import type { MovementKindInput } from '../movements/validation';
import { categoryName } from '../movements/validation';
import { getSupabase } from './supabase-client';

export type CategoryRecord = {
  id: string;
  name: string;
  kind: MovementKindInput;
  archivedAt: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  kind: MovementKindInput;
  archived_at: string | null;
};

function mapCategory(row: CategoryRow): CategoryRecord {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    archivedAt: row.archived_at,
  };
}

function categoryError(error: { code?: string; message?: string }, fallback: string): Error {
  if (error.code === '23505') {
    return new Error('Ya tienes una categoría con ese nombre.');
  }
  if (error.code === '23503') {
    return new Error('No se puede borrar porque conserva historial.');
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

export async function loadCategories(): Promise<CategoryRecord[]> {
  const { data, error } = await getSupabase()
    .from('categories')
    .select('id, name, kind, archived_at')
    .order('name', { ascending: true });
  if (error) {
    throw new Error('No se pudieron leer las categorías.');
  }
  return (data as CategoryRow[] | null)?.map(mapCategory) ?? [];
}

export async function loadCategoryUsage(): Promise<Map<string, number>> {
  const tables = ['movements', 'budgets', 'recurring_commitments'] as const;
  const usage = new Map<string, number>();
  for (const table of tables) {
    const { data, error } = await getSupabase().from(table).select('category_id');
    if (error) {
      throw new Error('No se pudo revisar el historial de la categoría.');
    }
    for (const row of (data ?? []) as { category_id: string | null }[]) {
      if (!row.category_id) {
        continue;
      }
      usage.set(row.category_id, (usage.get(row.category_id) ?? 0) + 1);
    }
  }
  return usage;
}

export async function createCategory(kind: MovementKindInput, name: string): Promise<CategoryRecord> {
  const userId = await currentUserId();
  const { data, error } = await getSupabase()
    .from('categories')
    .insert({ user_id: userId, kind, name: categoryName(name) })
    .select('id, name, kind, archived_at')
    .single();
  if (error || !data) {
    throw categoryError(error ?? {}, 'No se pudo crear la categoría.');
  }
  return mapCategory(data as CategoryRow);
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const { error } = await getSupabase().from('categories').update({ name: categoryName(name) }).eq('id', id);
  if (error) {
    throw categoryError(error, 'No se pudo renombrar la categoría.');
  }
}

export async function archiveCategory(id: string): Promise<void> {
  const { error } = await getSupabase()
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  if (error) {
    throw new Error('No se pudo archivar la categoría.');
  }
}

export async function restoreCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from('categories').update({ archived_at: null }).eq('id', id);
  if (error) {
    throw new Error('No se pudo reactivar la categoría.');
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await getSupabase().from('categories').delete().eq('id', id);
  if (error) {
    throw categoryError(error, 'No se pudo eliminar la categoría.');
  }
}
