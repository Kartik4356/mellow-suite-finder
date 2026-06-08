import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({ meta: [{ title: "Front Desk — Aurelia Hotel" }] }),
  component: StaffPage,
});

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"] as const;

function StaffPage() {
  const { isStaff, loading } = useAuth();
  const settings = useSettings();
  const qc = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["all_bookings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, rooms(name)")
        .order("check_in", { ascending: false });
      return data ?? [];
    },
    enabled: isStaff,
  });

  const { data: rooms } = useQuery({
    queryKey: ["all_rooms_staff"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").eq("is_active", true).order("name");
      return data ?? [];
    },
    enabled: isStaff,
  });

  if (loading) return <div className="container-narrow py-16 text-muted-foreground">Loading…</div>;
  if (!isStaff) return (
    <div className="container-narrow py-16">
      <p className="font-serif text-3xl">Staff only</p>
      <p className="mt-2 text-muted-foreground">This area is for hotel employees and administrators.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">Return home</Link>
    </div>
  );

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status: status as any }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Booking updated."); qc.invalidateQueries({ queryKey: ["all_bookings"] }); }
  };

  const counts = (bookings ?? []).reduce<Record<string, number>>((acc, b: any) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1; return acc;
  }, {});

  const today = new Date().toISOString().slice(0, 10);
  const occupiedRoomIds = new Set(
    (bookings ?? [])
      .filter((b: any) => (b.status === "checked_in" || b.status === "confirmed") && b.check_in <= today && b.check_out > today)
      .map((b: any) => b.room_id)
  );

  // Group rooms by type (name) with vacancy counts
  const byType = new Map<string, { total: number; vacant: number; price: number }>();
  for (const r of rooms ?? []) {
    const t = byType.get(r.name) ?? { total: 0, vacant: 0, price: Number(r.price_per_night) };
    t.total += 1;
    if (!occupiedRoomIds.has(r.id)) t.vacant += 1;
    byType.set(r.name, t);
  }
  const totalRooms = rooms?.length ?? 0;
  const totalVacant = Math.max(0, totalRooms - occupiedRoomIds.size);

  return (
    <div className="container-narrow py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="mt-2 font-serif text-5xl">Front Desk</h1>
          <p className="mt-2 text-muted-foreground">Manage reservations, check-ins, and check-outs.</p>
        </div>
        <Button asChild><Link to="/add-guest">+ Add Guest</Link></Button>
      </div>

      <div className="mt-8 rounded-lg border border-primary/40 bg-primary/5 p-5">
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">Vacant rooms by type</p>
          <p className="text-sm text-muted-foreground">{totalVacant} of {totalRooms} available</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...byType.entries()].map(([name, t]) => (
            <div key={name} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{name}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${t.vacant > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {t.vacant > 0 ? "Available" : "Full"}
                </span>
              </div>
              <p className="mt-2 font-serif text-3xl">{t.vacant}<span className="text-base text-muted-foreground">/{t.total}</span></p>
              <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(t.price, settings.currency)}/night</p>
            </div>
          ))}
          {byType.size === 0 && <p className="text-sm text-muted-foreground">No rooms configured.</p>}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border border-border bg-card p-4">
            <p className="eyebrow">{s.replace("_", " ")}</p>
            <p className="mt-1 font-serif text-3xl">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left">
            <tr>
              <th className="p-3 font-medium">Guest</th>
              <th className="p-3 font-medium">Room</th>
              <th className="p-3 font-medium">Dates</th>
              <th className="p-3 font-medium">Total</th>
              <th className="p-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-muted-foreground">Loading…</td></tr>}
            {bookings?.map((b: any) => (
              <tr key={b.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <div className="font-medium">{b.guest_name}</div>
                  <div className="text-xs text-muted-foreground">{b.guest_email}</div>
                </td>
                <td className="p-3">{b.rooms?.name}</td>
                <td className="p-3 text-muted-foreground">{formatDate(b.check_in)} → {formatDate(b.check_out)}</td>
                <td className="p-3">{formatCurrency(b.total_price, settings.currency)}</td>
                <td className="p-3">
                  <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                    <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
