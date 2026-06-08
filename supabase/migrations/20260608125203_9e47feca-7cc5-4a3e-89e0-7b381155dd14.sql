
-- 1. Fix privilege escalation on user_roles: replace permissive ALL with restrictive writes
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "Admins insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Restrict app_settings reads to authenticated (no anon)
DROP POLICY IF EXISTS "Settings readable by everyone" ON public.app_settings;

CREATE POLICY "Settings readable by authenticated" ON public.app_settings
  FOR SELECT TO authenticated
  USING (true);

REVOKE SELECT ON public.app_settings FROM anon;

-- 3. Tighten bookings INSERT: guest_email must match user's email unless staff
DROP POLICY IF EXISTS "Anyone authenticated can create booking" ON public.bookings;

CREATE POLICY "Authenticated can create own booking" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'employee'::app_role)
      OR lower(guest_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
    )
  );

-- 4. Revoke EXECUTE on SECURITY DEFINER has_role from signed-in users.
-- RLS policies evaluate as table owner, so they keep working.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
