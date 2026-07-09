-- Vitrin: "Altın Kullanıcı Adı" liderlik tablosunda herkese görünmeli.
-- get_leaderboard artık üyenin isim rengini (preferences.nameColor) de döndürür.
-- Dönüş tipi değiştiği için fonksiyon önce düşürülür.

drop function if exists get_leaderboard(date);

create or replace function get_leaderboard(p_date date)
returns table (
  id uuid,
  name text,
  name_color text,
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
         p.preferences->>'nameColor',
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
