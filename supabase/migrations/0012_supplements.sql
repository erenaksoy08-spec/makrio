-- Takviye (supplement) takibi.
-- İki tablo: kullanıcının takviye listesi (supplements) ve günlük alım kayıtları
-- (supplement_logs). Kullanıcı listesinden hangi takviyeyi o gün aldığını işaretler.

create table if not exists public.supplements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  dose text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.supplements enable row level security;

grant select, insert, update, delete on public.supplements to authenticated;

drop policy if exists "supplements_select_own" on public.supplements;
create policy "supplements_select_own" on public.supplements
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "supplements_insert_own" on public.supplements;
create policy "supplements_insert_own" on public.supplements
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "supplements_update_own" on public.supplements;
create policy "supplements_update_own" on public.supplements
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "supplements_delete_own" on public.supplements;
create policy "supplements_delete_own" on public.supplements
  for delete to authenticated using (user_id = auth.uid());

create table if not exists public.supplement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  supplement_id uuid not null references public.supplements (id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, supplement_id, date)
);

alter table public.supplement_logs enable row level security;

grant select, insert, delete on public.supplement_logs to authenticated;

create index if not exists supplement_logs_user_date_idx
  on public.supplement_logs (user_id, date);

drop policy if exists "supplement_logs_select_own" on public.supplement_logs;
create policy "supplement_logs_select_own" on public.supplement_logs
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "supplement_logs_insert_own" on public.supplement_logs;
create policy "supplement_logs_insert_own" on public.supplement_logs
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "supplement_logs_delete_own" on public.supplement_logs;
create policy "supplement_logs_delete_own" on public.supplement_logs
  for delete to authenticated using (user_id = auth.uid());
