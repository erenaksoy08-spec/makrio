-- Yemek araması v2 — bulanık (trigram) eşleşme yerine katı kelime-önek mantığı.
--
-- Kurallar:
--   * Sorgu ve isimler Türkçe karakter duyarsız katlanır (ç→c, ğ→g, ı→i, ...).
--   * Sorgudaki HER kelime, ismin (veya markanın) bir kelimesinin başlangıcı
--     ya da tamamı olmalı. Uydurma benzerlik yok: "kako" hiçbir kelimenin
--     başlangıcı değilse sonuç BOŞ döner ("kakaolu" artık gelmez).
--   * Sıralama: birebir isim > sorguyla başlayan isim > tam kelime eşleşmesi
--     ("kakao" kelimesi, "kakaolu" önekinden üstün — Dr. Oetker Kakao,
--     kakaolu ürünlerin üstüne çıkar) > kullanıcının kendi yemekleri >
--     eşleşmenin isimde daha önde olması > doğrulanmış ürün > kısa isim.

create or replace function public.tr_fold(t text)
returns text
language sql immutable parallel safe
as $$
  select lower(translate(coalesce(t, ''), 'ÇĞİIÖŞÜçğıöşüÂÎÛâîû', 'CGIIOSUcgiosuAIUaiu'))
$$;

drop function if exists public.search_foods(text);

create function public.search_foods(p_query text)
returns setof public.foods
language plpgsql stable
as $$
declare
  q text := regexp_replace(public.tr_fold(btrim(coalesce(p_query, ''))), '\s+', ' ', 'g');
  toks text[];
begin
  -- 2 harften kısa parçalar elenir; geriye parça kalmazsa arama yapılmaz.
  select array_agg(t2)
    into toks
  from (
    select regexp_replace(t, '[^a-z0-9]', '', 'g') as t2
    from unnest(string_to_array(q, ' ')) t
  ) x
  where length(t2) >= 2;

  if toks is null then
    return;
  end if;

  return query
  select f.*
  from public.foods f
  cross join lateral (
    select public.tr_fold(f.name_tr || ' ' || coalesce(f.brand, '')) as n
  ) nn
  cross join lateral (
    select array_remove(regexp_split_to_array(nn.n, '[^a-z0-9]+'), '') as words
  ) ww
  where not exists (
    -- her sorgu kelimesi en az bir isim kelimesinin öneki/tamamı olmalı
    select 1
    from unnest(toks) t
    where not exists (
      select 1 from unnest(ww.words) w where w = t or w like t || '%'
    )
  )
  order by
    (nn.n = q) desc,
    (nn.n like q || '%') desc,
    (select count(*) from unnest(toks) t where t = any (ww.words)) desc,
    (f.created_by = auth.uid()) desc nulls last,
    (
      select min(ord)
      from unnest(ww.words) with ordinality u (w, ord)
      where w = toks[1] or w like toks[1] || '%'
    ) asc nulls last,
    f.is_verified desc,
    length(f.name_tr) asc,
    f.name_tr asc
  limit 30;
end;
$$;

grant execute on function public.search_foods(text) to authenticated;
