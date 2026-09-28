import { getSupabase, supabasePublishableHeaders } from './supabase-client';

export async function deleteOwnAccount(password: string, confirmation: string): Promise<void> {
  const { url, key } = supabasePublishableHeaders();
  const { data, error } = await getSupabase().auth.getSession();
  if (error || !data.session) {
    throw new Error('No hay una sesión activa.');
  }

  const response = await fetch(`${url}/functions/v1/delete-account`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      apikey: key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, confirmation }),
  });
  const body = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
  if (!response.ok || !body?.ok) {
    throw new Error(body?.error ?? 'No se pudo borrar la cuenta.');
  }
  await getSupabase().auth.signOut();
}
