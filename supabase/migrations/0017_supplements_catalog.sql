-- Takviye sistemi 2.0: serbest metin yerine katalogdan seçim.
-- Yeni kolonlar: catalog_id (katalog bağlantısı), take_time (opsiyonel alma
-- saati, 'HH:MM'), note (kullanıcının kalıcı günlük notu — miktar/detay).
alter table public.supplements add column if not exists catalog_id text;
alter table public.supplements add column if not exists take_time text;
alter table public.supplements add column if not exists note text;
