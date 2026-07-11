-- Arama sıralama düzeltmesi: "sorguyla başlayan isim" anahtarı harf bazında
-- çalıştığı için "Kakaolu ..." isimleri (kakao ile başlıyor sayılıp) tam kelime
-- eşleşmesinin ("Dr. Oetker Kakao") üstüne çıkıyordu. Tam kelime eşleşmesi artık
-- en güçlü ikinci anahtar; harf-önek anahtarı kaldırıldı (pozisyon anahtarı
-- "Kakao (toz)" gibi isimleri zaten öne alır).

create or replace function public.search_foods(p_query text)
returns setof public.foods
language plpgsql stable
as $$
declare
  q text := regexp_replace(public.tr_fold(btrim(coalesce(p_query, ''))), '\s+', ' ', 'g');
  toks text[];
begin
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
    select btrim(public.tr_fold(f.name_tr || ' ' || coalesce(f.brand, ''))) as n
  ) nn
  cross join lateral (
    select array_remove(regexp_split_to_array(nn.n, '[^a-z0-9]+'), '') as words
  ) ww
  where not exists (
    select 1
    from unnest(toks) t
    where not exists (
      select 1 from unnest(ww.words) w where w = t or w like t || '%'
    )
  )
  order by
    (btrim(public.tr_fold(f.name_tr)) = q) desc,                            -- birebir ürün adı
    (select count(*) from unnest(toks) t where t = any (ww.words)) desc,    -- tam kelime eşleşmesi
    (f.created_by = auth.uid()) desc nulls last,                            -- kendi yemeklerin
    (
      select min(ord)
      from unnest(ww.words) with ordinality u (w, ord)
      where w = toks[1] or w like toks[1] || '%'
    ) asc nulls last,                                                        -- eşleşme ne kadar önde
    f.is_verified desc,
    length(f.name_tr) asc,
    f.name_tr asc
  limit 30;
end;
$$;

grant execute on function public.search_foods(text) to authenticated;
