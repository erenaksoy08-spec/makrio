-- Önce mevcut policy'leri kontrol et (foods tablosunda RLS açık ama
-- anon/authenticated için SELECT policy'si yok ya da hatalı görünüyor)
select policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'foods';

-- foods bir besin katalog tablosu, hassas veri içermiyor.
-- Hem anon hem authenticated kullanıcılar besin arayabilmeli.
alter table public.foods enable row level security;

drop policy if exists "foods_select_public" on public.foods;

create policy "foods_select_public"
on public.foods
for select
to anon, authenticated
using (true);
