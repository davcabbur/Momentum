-- Tabla del ranking global (Big 3 por DOTS). Aplícala una vez en el SQL Editor de Supabase.
-- Lectura pública para usuarios autenticados; cada usuario solo escribe/borra su propia fila.

create table if not exists public.leaderboard (
  user_id uuid primary key references auth.users (id) on delete cascade,
  alias text not null,
  sex text,
  bodyweight_kg real,
  squat_1rm real,
  bench_1rm real,
  dead_1rm real,
  dots real not null default 0,
  tier text,
  updated_at timestamptz not null default now()
);

alter table public.leaderboard enable row level security;

-- Ranking visible para cualquier usuario autenticado (solo alias + cifras, nunca el correo).
create policy "leaderboard_read" on public.leaderboard
  for select to authenticated using (true);

-- Cada usuario solo puede crear/actualizar/borrar SU fila.
create policy "leaderboard_insert_own" on public.leaderboard
  for insert to authenticated with check (auth.uid() = user_id);
create policy "leaderboard_update_own" on public.leaderboard
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "leaderboard_delete_own" on public.leaderboard
  for delete to authenticated using (auth.uid() = user_id);
