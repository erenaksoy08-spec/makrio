-- Streak koruma (freeze) sistemi.
-- Kazanılan koruma sayısı longest_streak kilometre taşlarından türetilir:
--   21g=1, 75g=1, 90g=1, 120g=1, 180g=3, 240g=2, 300g=2, 365g=4
-- Harcanan koruma sayısı preferences.streakFreezesUsed içinde tutulur.
-- Bir koruma harcanınca current_streak, en yüksek seriye (longest_streak) geri
-- yüklenir. profiles RLS UPDATE'e kapalı olduğu için bu iş security definer
-- RPC ile yapılır (kullanıcı sadece bu kontrollü işlemi çağırabilir).

create or replace function use_streak_freeze()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p        record;
  peak     int;
  earned   int;
  used     int;
  avail    int;
  restore_to int;
begin
  select current_streak, longest_streak, coalesce(preferences, '{}'::jsonb) as preferences
    into p
    from profiles
   where id = auth.uid();

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;

  -- Kazanım en yüksek seriden (peak) hesaplanır; uygulamayla birebir aynı.
  peak := greatest(coalesce(p.current_streak, 0), coalesce(p.longest_streak, 0));

  earned := (case when peak >= 21  then 1 else 0 end)
          + (case when peak >= 75  then 1 else 0 end)
          + (case when peak >= 90  then 1 else 0 end)
          + (case when peak >= 120 then 1 else 0 end)
          + (case when peak >= 180 then 3 else 0 end)
          + (case when peak >= 240 then 2 else 0 end)
          + (case when peak >= 300 then 2 else 0 end)
          + (case when peak >= 365 then 4 else 0 end);

  used  := coalesce((p.preferences->>'streakFreezesUsed')::int, 0);
  avail := earned - used;

  if avail <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_freeze');
  end if;

  restore_to := peak;

  update profiles
     set current_streak = restore_to,
         preferences = coalesce(preferences, '{}'::jsonb)
                       || jsonb_build_object('streakFreezesUsed', used + 1)
   where id = auth.uid();

  return jsonb_build_object('ok', true, 'restored', restore_to, 'used', used + 1, 'available', avail - 1);
end;
$$;

grant execute on function use_streak_freeze() to authenticated;
