-- Arkadaş ligi: arkadaş kodu, istek/kabul akışı ve leaderboard.
-- profiles RLS'i kapalı kaldığı için tüm okuma/yazma dar kapsamlı
-- security definer RPC'lerle yapılır; kimse başka birinin profilini
-- doğrudan okuyamaz, yalnızca kabul edilmiş arkadaşların özet verisi döner.

-- 1) Arkadaş kodu ─ paylaşılabilir, e-posta ifşa etmeyen kimlik.
alter table profiles add column if not exists friend_code text unique;

-- 2) Arkadaşlık tablosu.
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table friendships enable row level security;

-- Taraflar kendi kayıtlarını görebilir; yazma yalnızca RPC üzerinden.
drop policy if exists "friendships_select_own" on friendships;
create policy "friendships_select_own" on friendships
  for select using (auth.uid() in (requester_id, addressee_id));

-- 3) Arkadaş kodunu getir (yoksa üret). Karışan karakterler (I, L, O, 0, 1) yok.
create or replace function get_my_friend_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
begin
  select friend_code into code from profiles where id = auth.uid();
  if code is not null then
    return code;
  end if;

  loop
    select string_agg(substr(alphabet, (floor(random() * length(alphabet)))::int + 1, 1), '')
      into code
      from generate_series(1, 6);
    begin
      update profiles set friend_code = code where id = auth.uid();
      return code;
    exception when unique_violation then
      -- çakıştı, yeniden dene
    end;
  end loop;
end;
$$;

grant execute on function get_my_friend_code() to authenticated;

-- 4) Kod ile istek gönder. Karşı taraf zaten bana istek attıysa doğrudan kabul.
create or replace function send_friend_request(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  target_name text;
  existing friendships%rowtype;
begin
  select id, name into target, target_name
    from profiles
   where friend_code = upper(trim(p_code));

  if target is null then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if target = auth.uid() then
    return jsonb_build_object('ok', false, 'reason', 'self');
  end if;

  select * into existing
    from friendships
   where (requester_id = auth.uid() and addressee_id = target)
      or (requester_id = target and addressee_id = auth.uid());

  if found then
    if existing.status = 'accepted' then
      return jsonb_build_object('ok', false, 'reason', 'already_friends', 'name', target_name);
    end if;
    if existing.requester_id = auth.uid() then
      return jsonb_build_object('ok', false, 'reason', 'already_pending', 'name', target_name);
    end if;
    update friendships set status = 'accepted', responded_at = now() where id = existing.id;
    return jsonb_build_object('ok', true, 'accepted', true, 'name', target_name);
  end if;

  insert into friendships (requester_id, addressee_id) values (auth.uid(), target);
  return jsonb_build_object('ok', true, 'accepted', false, 'name', target_name);
end;
$$;

grant execute on function send_friend_request(text) to authenticated;

-- 5) Bekleyen istekleri getir (gelen + giden, isimleriyle).
create or replace function get_friend_requests()
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'incoming', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'name', p.name, 'created_at', f.created_at) order by f.created_at desc)
        from friendships f
        join profiles p on p.id = f.requester_id
       where f.addressee_id = auth.uid() and f.status = 'pending'
    ), '[]'::jsonb),
    'outgoing', coalesce((
      select jsonb_agg(jsonb_build_object('id', f.id, 'name', p.name, 'created_at', f.created_at) order by f.created_at desc)
        from friendships f
        join profiles p on p.id = f.addressee_id
       where f.requester_id = auth.uid() and f.status = 'pending'
    ), '[]'::jsonb)
  );
$$;

grant execute on function get_friend_requests() to authenticated;

-- 6) İsteğe cevap ver (yalnızca alıcı). Red = satırı sil.
create or replace function respond_friend_request(p_id uuid, p_accept boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_accept then
    update friendships
       set status = 'accepted', responded_at = now()
     where id = p_id and addressee_id = auth.uid() and status = 'pending';
  else
    delete from friendships
     where id = p_id and addressee_id = auth.uid() and status = 'pending';
  end if;
  return found;
end;
$$;

grant execute on function respond_friend_request(uuid, boolean) to authenticated;

-- 6b) Gönderilen bekleyen isteği iptal et (yalnızca gönderen).
create or replace function cancel_friend_request(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from friendships
   where id = p_id and requester_id = auth.uid() and status = 'pending';
  return found;
end;
$$;

grant execute on function cancel_friend_request(uuid) to authenticated;

-- 7) Arkadaşı çıkar (giden bekleyen isteği iptal etmek için de kullanılır).
create or replace function remove_friend(p_friend uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from friendships
   where (requester_id = auth.uid() and addressee_id = p_friend)
      or (requester_id = p_friend and addressee_id = auth.uid());
  return found;
end;
$$;

grant execute on function remove_friend(uuid) to authenticated;

-- 8) Leaderboard: ben + kabul edilmiş arkadaşlar.
-- Gün istemciden gelir (yerel saat dilimi) — food_logs.date de istemci gününü tutar.
create or replace function get_leaderboard(p_date date)
returns table (
  id uuid,
  name text,
  current_streak int,
  longest_streak int,
  last_log_date date,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  water_ml numeric,
  goal_calories numeric,
  goal_protein_g numeric,
  goal_carbs_g numeric,
  goal_fat_g numeric,
  goal_water_ml numeric
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
