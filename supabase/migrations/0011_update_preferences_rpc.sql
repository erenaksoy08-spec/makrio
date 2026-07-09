-- profiles has no RLS UPDATE policy (intentionally — current_streak etc. are
-- server-controlled). Expose a narrow RPC so users can only ever touch the
-- preferences blob, not other columns, while still bypassing RLS via
-- security definer.
create or replace function update_preferences(p_preferences jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set preferences = p_preferences where id = auth.uid();
$$;

grant execute on function update_preferences(jsonb) to authenticated;
