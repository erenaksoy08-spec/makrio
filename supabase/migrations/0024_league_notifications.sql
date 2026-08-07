-- Lig bildirimleri: beğeni ve yorum geldiğinde hem uygulama içi kayıt
-- hem web push (league-notify edge function, pg_net ile asenkron).
-- Push metinleri sunucuda Türkçe — sabah bildirimiyle aynı yaklaşım.

create table if not exists league_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references profiles(id) on delete cascade,
  actor_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('like', 'comment')),
  preview text,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists league_notifications_recipient_idx
  on league_notifications (recipient_id, created_at desc);
alter table league_notifications enable row level security;
-- Politika yok: erişim yalnızca definer RPC'lerden.

-- Edge function çağrısı için anon anahtarı (istemcide de açık — sır değil).
insert into app_secrets (name, value)
values ('anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0Ymdsd2pyZ2tlZnV4aGxnY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNzY1OTgsImV4cCI6MjA5Njc1MjU5OH0.YdxQ1h-p7XLa9MQlA_-N8a_28AKpvp9H7CYpNzLnBeU')
on conflict (name) do update set value = excluded.value;

-- Ortak yardımcı: kayıt düş + push'u kuyruğa at. Push hatası ana işlemi bozmaz
-- (pg_net zaten asenkron; header/secret eksikse sessiz geç).
create or replace function notify_league(p_recipient uuid, p_actor uuid, p_kind text, p_preview text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  v_title text;
  v_body text;
begin
  if p_recipient = p_actor then
    return;
  end if;

  insert into league_notifications (recipient_id, actor_id, kind, preview)
  values (p_recipient, p_actor, p_kind, p_preview);

  select coalesce(name, 'Arkadaşın') into actor_name from profiles where id = p_actor;
  if p_kind = 'like' then
    v_title := '❤️ ' || actor_name;
    v_body := actor_name || ' bugünkü ilerlemeni beğendi.';
  else
    v_title := '💬 ' || actor_name;
    v_body := actor_name || ' yorum yaptı: ' || coalesce(p_preview, '');
  end if;

  begin
    perform net.http_post(
      url := 'https://ytbglwjrgkefuxhlgcaa.supabase.co/functions/v1/league-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select value from app_secrets where name = 'anon_key'),
        'x-cron-secret', (select value from app_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object('recipient_id', p_recipient, 'title', v_title, 'body', v_body, 'url', '/lig')
    );
  exception when others then
    null; -- push gönderilemedi diye beğeni/yorum kaybolmasın
  end;
end;
$$;

-- Beğeni: yalnızca kalp AÇILINCA ve 24 saatte bir (aç-kapa spam'i bildirime dönmesin).
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
    if not exists (
      select 1 from league_notifications
       where recipient_id = p_target and actor_id = auth.uid()
         and kind = 'like' and created_at > now() - interval '24 hours'
    ) then
      perform notify_league(p_target, auth.uid(), 'like', null);
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'liked', not removed,
    'count', (select count(*) from league_likes where target_id = p_target)
  );
end;
$$;

-- Yorum: her yorumda bildirim (kendi duvarına yazınca yok — notify_league eler).
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
      'body', clean,
      'created_at', new_at,
      'mine', true,
      'can_delete', true
    )
  );
end;
$$;

-- Bildirim listesi (son 30) + okunmamış sayısı + okundu işaretleme.
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

grant execute on function get_league_notifications() to authenticated;

create or replace function get_unread_league_count()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int from league_notifications
   where recipient_id = auth.uid() and read_at is null;
$$;

grant execute on function get_unread_league_count() to authenticated;

create or replace function mark_league_notifications_read()
returns void
language sql
security definer
set search_path = public
as $$
  update league_notifications
     set read_at = now()
   where recipient_id = auth.uid() and read_at is null;
$$;

grant execute on function mark_league_notifications_read() to authenticated;
