-- Ücretsiz plan sınırı: günde en fazla 3 yemek kaydı; Gold üyeler sınırsız.
-- İstemci her eklemeden önce bu fonksiyonu çağırır (kanonik tanım budur).
create or replace function public.can_add_food_log(p_date date)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_count int;
begin
  select subscription_status into v_status from profiles where id = auth.uid();
  if v_status in ('gold', 'active') then
    return true;
  end if;
  select count(*) into v_count from food_logs where user_id = auth.uid() and date = p_date;
  return v_count < 3;
end;
$$;

revoke all on function public.can_add_food_log(date) from public;
grant execute on function public.can_add_food_log(date) to authenticated;
