import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const settings = useSettings();
  const { data } = useQuery({
    queryKey: ["admin_overview"],
    queryFn: async () => {
      const [rooms, bookings, users] = await Promise.all([
        supabase.from("rooms").select("id, is_active"),
        supabase.from("bookings").select("id, total_price, status, created_at"),
        supabase.from("profiles").select("id"),
      ]);
      return {
        rooms: rooms.data ?? [],
        bookings: bookings.data ?? [],
        users: users.data ?? [],
      };
    },
  });

  const activeRooms = data?.rooms.filter((r: any) => r.is_active).length ?? 0;
  const totalRooms = data?.rooms.length ?? 0;
  const totalBookings = data?.bookings.length ?? 0;
  const totalUsers = data?.users.length ?? 0;
  const revenue = (data?.bookings ?? [])
    .filter((b: any) => b.status !== "cancelled")
    .reduce((sum: number, b: any) => sum + Number(b.total_price), 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active rooms" value={`${activeRooms} / ${totalRooms}`} />
        <Stat label="Total bookings" value={totalBookings.toString()} />
        <Stat label="Revenue (gross)" value={formatCurrency(revenue, settings.currency)} />
        <Stat label="Registered users" value={totalUsers.toString()} />
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Welcome, Administrator</h2>
        <p className="mt-2 text-muted-foreground">
          Use the tabs above to manage rooms and inventory, assign staff and admin roles, edit site photos, and adjust the house theme.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-serif text-3xl">{value}</p>
    </div>
  );
}
