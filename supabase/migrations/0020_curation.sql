-- Veritabanı kürasyonu — 3 parça:
--  1) Topluluk kayıtları artık HERKESE görünür (rozetle ayrılır). Eski policy
--     doğrulanmamış kayıtları sadece sahibine gösteriyordu; bu, taranan
--     barkodların ve topluluk eklemelerinin paylaşılmasını engelliyordu.
--  2) food_flags: basit işaretleme/moderasyon temeli (yanlış değer, mükerrer...).
--     Tam admin paneli yok; ileride service role ile okunup elenebilir.
--  3) similar_foods: yeni manuel kayıt öncesi bulanık (trigram) benzerlik
--     kontrolü — mükerrer girişleri baştan engellemek için.

-- 1) Select policy: herkes her kaydı arayabilir; güven ayrımı is_verified
--    rozetiyle arayüzde gösterilir. (pg_trgm zaten kurulu.)
drop policy if exists "foods_select_public" on public.foods;

create policy "foods_select_public"
on public.foods
for select
to anon, authenticated
using (true);

-- 2) İşaretleme tablosu — kullanıcı başına yemek başına 1 bildirim.
create table if not exists public.food_flags (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('wrong_values', 'duplicate', 'inappropriate', 'other')),
  note text,
  created_at timestamptz not null default now(),
  unique (food_id, user_id)
);

alter table public.food_flags enable row level security;

drop policy if exists "food_flags_insert_own" on public.food_flags;
create policy "food_flags_insert_own"
on public.food_flags
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "food_flags_select_own" on public.food_flags;
create policy "food_flags_select_own"
on public.food_flags
for select
to authenticated
using (user_id = auth.uid());

grant insert, select on public.food_flags to authenticated;

-- 3) Bulanık benzerlik: tr_fold'lanmış isim üzerinde trigram.
--    0.45 eşiği "mercimek corbasi" ~ "Mercimek Çorbası" gibi yazım
--    varyantlarını yakalar, alakasız isimleri getirmez.
create index if not exists foods_name_trgm_idx
  on public.foods
  using gin (public.tr_fold(name_tr) gin_trgm_ops);

create or replace function public.similar_foods(p_name text)
returns setof public.foods
language sql stable
as $$
  select f.*
  from public.foods f
  where similarity(public.tr_fold(f.name_tr), public.tr_fold(p_name)) > 0.45
  order by
    similarity(public.tr_fold(f.name_tr), public.tr_fold(p_name)) desc,
    f.is_verified desc,
    length(f.name_tr) asc
  limit 5
$$;

grant execute on function public.similar_foods(text) to authenticated;
