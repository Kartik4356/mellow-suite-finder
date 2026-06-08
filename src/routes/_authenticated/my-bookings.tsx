import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/my-bookings")({
  head: () => ({ meta: [{ title: "My Stays — Aurelia Hotel" }] }),
  component: MyBookings,
});

const statusColor: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-accent/30 text-accent-foreground",
  checked_in: "bg-primary text-primary-foreground",
  checked_out: "bg-secondary text-secondary-foreground",
  cancelled: "bg-destructive/15 text-destructive",
};

function MyBookings() {
  const { user } = useAuth();
  const settings = useSettings();
  const qc = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["my_bookings", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*, rooms(name, image_url)")
        .eq("user_id", user!.id)
        .order("check_in", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const cancel = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Booking cancelled."); qc.invalidateQueries({ queryKey: ["my_bookings"] }); }
  };

  return (
    <div className="container-narrow py-12">
      <p className="eyebrow">Guest portal</p>
      <h1 className="mt-2 font-serif text-5xl">My Stays</h1>

      <div className="mt-10 space-y-4">
        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {bookings?.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-12 text-center">
            <p className="font-serif text-2xl">No stays yet</p>
            <p className="mt-2 text-sm text-muted-foreground">When you book a room, it'll appear here.</p>
            <Button asChild className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/rooms">Browse rooms</Link>
            </Button>
          </div>
        )}
        {bookings?.map((b: any) => {
          const nights = nightsBetween(b.check_in, b.check_out);
          return (
            <div key={b.id} className="grid gap-4 rounded-lg border border-border bg-card p-5 md:grid-cols-[140px_1fr_auto] md:items-center">
              <div className="aspect-[4/3] overflow-hidden rounded bg-muted">
                {b.rooms?.image_url && <img src={b.rooms.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-xl">{b.rooms?.name}</h3>
                  <Badge className={statusColor[b.status]}>{b.status.replace("_", " ")}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(b.check_in)} → {formatDate(b.check_out)} · {nights} night{nights === 1 ? "" : "s"} · {b.guests} guest{b.guests === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm">Total <span className="font-medium">{formatCurrency(b.total_price, settings.currency)}</span></p>
              </div>
              <div className="flex gap-2">
                {(b.status === "pending" || b.status === "confirmed") && (
                  <Button variant="outline" size="sm" onClick={() => cancel(b.id)}>Cancel</Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
