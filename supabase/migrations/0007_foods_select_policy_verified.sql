-- foods_select_public policy'sini daralt: herkes doğrulanmış (is_verified=true)
-- kayıtları görebilir, kullanıcılar ayrıca kendi eklediği doğrulanmamış kayıtları görebilir.
drop policy if exists "foods_select_public" on public.foods;

create policy "foods_select_public"
on public.foods
for select
to anon, authenticated
using (is_verified = true or auth.uid() = created_by);
