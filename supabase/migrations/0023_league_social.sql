-- Arkadaş Ligi sosyal katmanı: beğeni (kalp) + yorum.
-- profiles RLS'i kapalı olduğundan tüm erişim security definer RPC'lerle;
-- yalnızca kabul edilmiş arkadaşlar birbirinin satırını görebilir/etkileşebilir.

-- 1) Beğeniler — kişi başı hedefe tek kalp, tekrar basınca geri çekilir.
create table if not exists league_likes (
  id uuid primary key default gen_random_uuid(),
  liker_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (liker_id, target_id),
  check (liker_id <> target_id)
);
create index if not exists league_likes_target_idx on league_likes (target_id);
alter table league_likes enable row level security;
-- Politika yok: erişim yalnızca aşağıdaki definer RPC'lerden.

-- 2) Yorumlar — arkadaşın lig satırına kısa not (maks 200 karakter).
create table if not exists league_comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  target_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 200),
  created_at timestamptz not null default now()
);
create index if not exists league_comments_target_idx on league_comments (target_id, created_at);
alter table league_comments enable row level security;

-- 3) Arkadaşlık kontrolü — RPC'lerin ortak bekçisi.
create or replace function are_league_friends(a uuid, b uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from friendships f
     where f.status = 'accepted'
       and ((f.requester_id = a and f.addressee_id = b)
         or (f.requester_id = b and f.addressee_id = a))
  );
$$;

-- 4) Lig üyelerinin sosyal özetleri (beğeni/yorum sayıları + benim kalbim).
create or replace function get_league_social()
returns table (target_id uuid, like_count int, liked_by_me boolean, comment_count int)
language sql
security definer
set search_path = public
as $$
  with members as (
    select auth.uid() as uid
    union
    select case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
      from friendships f
     where f.status = 'accepted' and auth.uid() in (f.requester_id, f.addressee_id)
  )
  select m.uid,
         coalesce((select count(*) from league_likes l where l.target_id = m.uid), 0)::int,
         exists (select 1 from league_likes l where l.target_id = m.uid and l.liker_id = auth.uid()),
         coalesce((select count(*) from league_comments c where c.target_id = m.uid), 0)::int
    from members m;
$$;

grant execute on function get_league_social() to authenticated;

-- 5) Kalbi aç/kapat. Kendine kalp yok; yalnızca arkadaşa.
create or replace function toggle_league_like(p_target uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  removed boolean;
begin
  if p_target = auth.uid() or not are_league_friends(auth.uid(), p_target) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;

  delete from league_likes where liker_id = auth.uid() and target_id = p_target;
  removed := found;
  if not removed then
    insert into league_likes (liker_id, target_id) values (auth.uid(), p_target);
  end if;

  return jsonb_build_object(
    'ok', true,
    'liked', not removed,
    'count', (select count(*) from league_likes where target_id = p_target)
  );
end;
$$;

grant execute on function toggle_league_like(uuid) to authenticated;

-- 6) Yorum akışı — kendi satırım veya arkadaşımın satırı.
create or replace function get_league_comments(p_target uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select case
    when p_target <> auth.uid() and not are_league_friends(auth.uid(), p_target)
      then '[]'::jsonb
    else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', c.id,
               'author_id', c.author_id,
               'author_name', p.name,
               'author_color', p.preferences->>'nameColor',
               'body', c.body,
               'created_at', c.created_at,
               'mine', c.author_id = auth.uid(),
               'can_delete', c.author_id = auth.uid() or c.target_id = auth.uid()
             ) order by c.created_at)
        from league_comments c
        join profiles p on p.id = c.author_id
       where c.target_id = p_target
    ), '[]'::jsonb)
  end;
$$;

grant execute on function get_league_comments(uuid) to authenticated;

-- 7) Yorum ekle — kendi satırına da yazılabilir (cevap gibi).
create or replace function add_league_comment(p_target uuid, p_body text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean text := trim(p_body);
  new_id uuid;
  new_at timestamptz;
begin
  if p_target <> auth.uid() and not are_league_friends(auth.uid(), p_target) then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;
  if clean is null or char_length(clean) < 1 or char_length(clean) > 200 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_body');
  end if;

  insert into league_comments (author_id, target_id, body)
  values (auth.uid(), p_target, clean)
  returning id, created_at into new_id, new_at;

  return jsonb_build_object(
    'ok', true,
    'comment', jsonb_build_object(
      'id', new_id,
      'author_id', auth.uid(),
      'author_name', (select name from profiles where id = auth.uid()),
      'author_color', (select preferences->>'nameColor' from profiles where id = auth.uid()),
      'body', clean,
      'created_at', new_at,
      'mine', true,
      'can_delete', true
    )
  );
end;
$$;

grant execute on function add_league_comment(uuid, text) to authenticated;

-- 8) Yorum sil — yazan ya da satır sahibi (kendi duvarını yönetir).
create or replace function delete_league_comment(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from league_comments
   where id = p_id and (author_id = auth.uid() or target_id = auth.uid());
  return found;
end;
$$;

grant execute on function delete_league_comment(uuid) to authenticated;
