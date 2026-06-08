
create or replace function public.touch_updated_at()
returns trigger language plpgsql
security invoker
set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

-- Trigger-only function: not meant to be called via API
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- has_role is intentionally callable by authenticated users (used in RLS policies); not by anon
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
