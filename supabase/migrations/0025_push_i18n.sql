-- Push metinleri alıcının diline göre kurulur (profiles.preferences->>'language').
-- Dil yoksa Türkçe düşer — mevcut kullanıcılar için davranış değişmez.

create or replace function push_lang(p_user uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
           when (select preferences->>'language' from profiles where id = p_user) = 'en' then 'en'
           else 'tr'
         end;
$$;

-- Bildirim başlığı/gövdesi tek yerde kurulur (test edilebilsin diye ayrı).
create or replace function league_push_text(p_recipient uuid, p_actor uuid, p_kind text, p_preview text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with v as (
    select push_lang(p_recipient) as lang,
           (select nullif(trim(name), '') from profiles where id = p_actor) as raw_name
  ), n as (
    select lang, coalesce(raw_name, case when lang = 'en' then 'A friend' else 'Arkadaşın' end) as actor
      from v
  )
  select jsonb_build_object(
           'title', case when p_kind = 'like' then '❤️ ' else '💬 ' end || actor,
           'body', case
             when p_kind = 'like' and lang = 'en' then actor || ' liked your progress today.'
             when p_kind = 'like'                 then actor || ' bugünkü ilerlemeni beğendi.'
             when lang = 'en'                     then actor || ' commented: ' || coalesce(p_preview, '')
             else                                      actor || ' yorum yaptı: ' || coalesce(p_preview, '')
           end
         )
    from n;
$$;

create or replace function notify_league(p_recipient uuid, p_actor uuid, p_kind text, p_preview text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  txt jsonb;
begin
  if p_recipient = p_actor then
    return;
  end if;

  insert into league_notifications (recipient_id, actor_id, kind, preview)
  values (p_recipient, p_actor, p_kind, p_preview);

  txt := league_push_text(p_recipient, p_actor, p_kind, p_preview);

  begin
    perform net.http_post(
      url := 'https://ytbglwjrgkefuxhlgcaa.supabase.co/functions/v1/league-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select value from app_secrets where name = 'anon_key'),
        'x-cron-secret', (select value from app_secrets where name = 'cron_secret')
      ),
      body := jsonb_build_object(
        'recipient_id', p_recipient,
        'title', txt->>'title',
        'body', txt->>'body',
        'url', '/lig'
      )
    );
  exception when others then
    null; -- push gönderilemedi diye beğeni/yorum kaybolmasın
  end;
end;
$$;
