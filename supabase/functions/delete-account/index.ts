// Edge Function: borra por completo la cuenta del usuario que la invoca.
//
// Despliegue (una sola vez, con la CLI de Supabase):
//   supabase functions deploy delete-account
// La service_role NUNCA va en la app; vive solo aquí, en el servidor.
//
// La app la llama con `supabase.functions.invoke('delete-account')`, que adjunta
// automáticamente el JWT del usuario en la cabecera Authorization.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    if (!token) return json({ error: 'Falta el token de autorización.' }, 401);

    // Cliente admin (service_role): puede identificar al usuario y borrarlo.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user) return json({ error: 'No autorizado.' }, 401);
    const userId = data.user.id;

    // 1) Borrar los datos del usuario (su copia en la nube).
    await admin.from('user_snapshot').delete().eq('user_id', userId);

    // 2) Borrar el propio usuario de Auth.
    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) return json({ error: delErr.message }, 500);

    return json({ ok: true }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
