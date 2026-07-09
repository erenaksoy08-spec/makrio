-- Kullanıcıların kendi özel yemeklerini ekleyebilmesi için (Özel Yemek Ekle özelliği).
-- created_by kendi id'leri olmalı ve is_verified=false ile eklenmeli (sadece sistem/admin doğrulayabilir).
grant insert on public.foods to authenticated;

drop policy if exists "foods_insert_own" on public.foods;

create policy "foods_insert_own"
on public.foods
for insert
to authenticated
with check (created_by = auth.uid() and is_verified = false);
