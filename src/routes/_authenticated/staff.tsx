import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, formatDate, nightsBetween } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({ meta: [{ title: "Front Desk — Aurelia Hotel" }] }),
  component: StaffPage,
});

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"] as const;

function StaffPage() {
  const { isStaff, loading, user } = useAuth();
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

  const [form, setForm] = useState({
    room_id: "",
    guest_name: "",
    guest_email: "",
    check_in: "",
    check_out: "",
    guests: 1,
    notes: "",
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
  const totalRooms = rooms?.length ?? 0;
  const vacantRooms = Math.max(0, totalRooms - occupiedRoomIds.size);

  const submitBooking = async () => {
    if (!form.room_id || !form.guest_name || !form.guest_email || !form.check_in || !form.check_out) {
      toast.error("Please fill all required fields."); return;
    }
    const nights = nightsBetween(form.check_in, form.check_out);
    if (nights < 1) { toast.error("Check-out must be after check-in."); return; }
    const room = rooms?.find((r: any) => r.id === form.room_id);
    if (!room) { toast.error("Select a room."); return; }
    const total_price = Number(room.price_per_night) * nights;
    const { error } = await supabase.from("bookings").insert({
      user_id: user!.id,
      room_id: form.room_id,
      guest_name: form.guest_name,
      guest_email: form.guest_email,
      check_in: form.check_in,
      check_out: form.check_out,
      guests: form.guests,
      notes: form.notes || null,
      total_price,
      status: "confirmed",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Guest booking added.");
    setForm({ room_id: "", guest_name: "", guest_email: "", check_in: "", check_out: "", guests: 1, notes: "" });
    qc.invalidateQueries({ queryKey: ["all_bookings"] });
  };

  return (
    <div className="container-narrow py-12">
      <p className="eyebrow">Operations</p>
      <h1 className="mt-2 font-serif text-5xl">Front Desk</h1>
      <p className="mt-2 text-muted-foreground">Manage reservations, check-ins, and check-outs.</p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="eyebrow">Vacant rooms</p>
          <p className="mt-1 font-serif text-3xl">{vacantRooms}<span className="text-base text-muted-foreground">/{totalRooms}</span></p>
        </div>
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border border-border bg-card p-4">
            <p className="eyebrow">{s.replace("_", " ")}</p>
            <p className="mt-1 font-serif text-3xl">{counts[s] ?? 0}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Add guest details</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create a reservation on behalf of a walk-in or phone guest.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Guest name</Label>
            <Input value={form.guest_name} onChange={(e) => setForm({ ...form, guest_name: e.target.value })} />
          </div>
          <div>
            <Label>Guest email</Label>
            <Input type="email" value={form.guest_email} onChange={(e) => setForm({ ...form, guest_email: e.target.value })} />
          </div>
          <div>
            <Label>Room</Label>
            <Select value={form.room_id} onValueChange={(v) => setForm({ ...form, room_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
              <SelectContent>
                {rooms?.map((r: any) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} — {formatCurrency(r.price_per_night, settings.currency)}/night
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Guests</Label>
            <Input type="number" min={1} value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Check-in</Label>
            <Input type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} />
          </div>
          <div>
            <Label>Check-out</Label>
            <Input type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <Button className="mt-5" onClick={submitBooking}>Save booking</Button>
      </section>

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
