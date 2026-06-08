import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const ROLES = ["guest", "employee", "admin"] as const;

function AdminUsers() {
  const qc = useQueryClient();
  const { user: me } = useAuth();

  const { data } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      const byUser = new Map<string, string[]>();
      (roles.data ?? []).forEach((r: any) => {
        const list = byUser.get(r.user_id) ?? [];
        list.push(r.role); byUser.set(r.user_id, list);
      });
      return (profiles.data ?? []).map((p: any) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });

  const toggleRole = async (userId: string, role: string, has: boolean) => {
    if (has) {
      if (userId === me?.id && role === "admin") {
        return toast.error("You can't remove your own admin role.");
      }
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Roles updated.");
    qc.invalidateQueries({ queryKey: ["admin_users"] });
  };

  return (
    <div>
      <h2 className="font-serif text-2xl">Users & Roles</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Promote guests to Employees (front-desk access) or Administrators (full control).
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left">
            <tr>
              <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Roles</th><th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((u: any) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{u.full_name ?? "—"}</td>
                <td className="p-3 text-muted-foreground">{u.email}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">none</span>}
                    {u.roles.map((r: string) => <Badge key={r} variant="secondary">{r}</Badge>)}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      return (
                        <Button
                          key={r}
                          size="sm"
                          variant={has ? "default" : "outline"}
                          className={has ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                          onClick={() => toggleRole(u.id, r, has)}
                        >
                          {has ? `− ${r}` : `+ ${r}`}
                        </Button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
