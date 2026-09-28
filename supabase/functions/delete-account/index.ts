import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function json(body: { error?: string; ok?: boolean }, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return json({ error: 'Falta la sesión.' }, 401)
  }

  let password = ''
  let confirmation = ''
  try {
    const body = (await request.json()) as { password?: unknown; confirmation?: unknown }
    password = typeof body.password === 'string' ? body.password : ''
    confirmation = typeof body.confirmation === 'string' ? body.confirmation : ''
  } catch {
    return json({ error: 'La solicitud no es válida.' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')
  const secretKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !publishableKey || !secretKey) {
    return json({ error: 'El servidor no está configurado.' }, 500)
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  const user = userData.user
  if (userError || !user?.email) {
    return json({ error: 'La sesión no es válida.' }, 401)
  }

  const verifier = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signInData, error: signInError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password,
  })
  if (signInError || signInData.user?.id !== user.id) {
    return json({ error: 'La contraseña no coincide.' }, 401)
  }

  if (confirmation !== 'ELIMINAR') {
    return json({ error: 'Escribe ELIMINAR para confirmar.' }, 400)
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    return json({ error: 'No se pudo borrar la cuenta.' }, 500)
  }

  return json({ ok: true }, 200)
})
