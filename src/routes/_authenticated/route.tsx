import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });

    // Force password change on first login if flagged
    if (location.pathname !== "/change-password") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.must_change_password) {
        throw redirect({ to: "/change-password" });
      }
    }

    return { user: data.user };
  },
  component: () => <Outlet />,
});
