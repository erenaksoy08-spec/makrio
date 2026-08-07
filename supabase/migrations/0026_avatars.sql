-- Profil fotoğrafı: avatars bucket'ı + profiles.avatar_url + lig RPC'lerine avatar alanı.
-- Dosya yolu her zaman <user_id>/<dosya>: klasör sahibi dışında kimse yazamaz.

alter table profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
   set public = excluded.public,
       file_size_limit = excluded.file_size_limit,
       allowed_mime_types = excluded.allowed_mime_types;

-- Okuma herkese açık (avatar zaten arkadaşlara gösteriliyor), yazma yalnız sahibine.
drop policy if exists "avatars_read" on storage.objects;
create policy "avatars_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Avatar adresi yalnızca kendi depolama klasörünü gösterebilir: dışarıdan bir URL
-- verilseydi arkadaşların IP'si o sunucuya sızardı.
create or replace function set_avatar_url(p_url text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  prefix text := 'https://ytbglwjrgkefuxhlgcaa.supabase.co/storage/v1/object/public/avatars/' || auth.uid()::text || '/';
begin
  if p_url is not null and p_url not like prefix || '%' then
    return jsonb_build_object('ok', false, 'reason', 'invalid_url');
  end if;
  update profiles set avatar_url = p_url where id = auth.uid();
  return jsonb_build_object('ok', true, 'avatar_url', p_url);
end;
$$;

grant execute on function set_avatar_url(text) to authenticated;

-- Liderlik tablosu: çıktı kolonu eklendiği için önce düşürülmeli.
drop function if exists get_leaderboard(date);
create function get_leaderboard(p_date date)
returns table (
  id uuid, name text, name_color text, avatar_url text,
  current_streak integer, longest_streak integer, last_log_date date,
  calories numeric, protein_g numeric, carbs_g numeric, fat_g numeric, water_ml numeric,
  goal_calories numeric, goal_protein_g numeric, goal_carbs_g numeric, goal_fat_g numeric, goal_water_ml numeric
)
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
  select p.id,
         p.name,
         p.preferences->>'nameColor',
         p.avatar_url,
         p.current_streak,
         p.longest_streak,
         p.last_log_date,
         coalesce(fl.calories, 0),
         coalesce(fl.protein_g, 0),
         coalesce(fl.carbs_g, 0),
         coalesce(fl.fat_g, 0),
         coalesce(wl.water_ml, 0),
         g.calories,
         g.protein_g,
         g.carbs_g,
         g.fat_g,
         g.water_ml
    from members m
    join profiles p on p.id = m.uid
    left join lateral (
      select sum(calories) as calories, sum(protein_g) as protein_g,
             sum(carbs_g) as carbs_g, sum(fat_g) as fat_g
        from food_logs where user_id = m.uid and date = p_date
    ) fl on true
    left join lateral (
      select sum(amount_ml) as water_ml
        from water_logs where user_id = m.uid and date = p_date
    ) wl on true
    left join lateral (
      select calories, protein_g, carbs_g, fat_g, water_ml
        from user_goals where user_id = m.uid
       order by updated_at desc limit 1
    ) g on true;
$$;

grant execute on function get_leaderboard(date) to authenticated;

create or replace function get_friend_requests()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'name', p.name, 'avatar_url', p.avatar_url, 'created_at', f.created_at) order by f.created_at desc)
        from friendships f
        join profiles p on p.id = f.requester_id
       where f.addressee_id = auth.uid() and f.status = 'pending'
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'name', p.name, 'avatar_url', p.avatar_url, 'created_at', f.created_at) order by f.created_at desc)
        from friendships f
        join profiles p on p.id = f.addressee_id
       where f.requester_id = auth.uid() and f.status = 'pending'
    ), '[]'::jsonb)
  );
$$;

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
               'author_avatar', p.avatar_url,
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

  perform notify_league(p_target, auth.uid(), 'comment', left(clean, 80));

  return jsonb_build_object(
    'ok', true,
    'comment', jsonb_build_object(
      'id', new_id,
      'author_id', auth.uid(),
      'author_name', (select name from profiles where id = auth.uid()),
      'author_color', (select preferences->>'nameColor' from profiles where id = auth.uid()),
      'author_avatar', (select avatar_url from profiles where id = auth.uid()),
      'body', clean,
      'created_at', new_at,
      'mine', true,
      'can_delete', true
    )
  );
end;
$$;

create or replace function get_league_notifications()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce((
    select jsonb_agg(jsonb_build_object(
             'id', n.id,
             'kind', n.kind,
             'preview', n.preview,
             'actor_name', p.name,
             'actor_color', p.preferences->>'nameColor',
             'actor_avatar', p.avatar_url,
             'created_at', n.created_at,
             'unread', n.read_at is null
           ) order by n.created_at desc)
      from (
        select * from league_notifications
         where recipient_id = auth.uid()
         order by created_at desc
         limit 30
      ) n
      join profiles p on p.id = n.actor_id
  ), '[]'::jsonb);
$$;
