import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency, nightsBetween } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/add-guest")({
  head: () => ({ meta: [{ title: "Add Guest — Aurelia Hotel" }] }),
  component: AddGuestPage,
});

function AddGuestPage() {
  const { isStaff, loading, user } = useAuth();
  const settings = useSettings();
  const qc = useQueryClient();
  const navigate = useNavigate();

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
      <Link to="/" className="mt-4 inline-block text-primary underline">Return home</Link>
    </div>
  );

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
    qc.invalidateQueries({ queryKey: ["all_bookings"] });
    navigate({ to: "/staff" });
  };

  return (
    <div className="container-narrow py-12">
      <p className="eyebrow">Front Desk</p>
      <h1 className="mt-2 font-serif text-5xl">Add guest</h1>
      <p className="mt-2 text-muted-foreground">Create a reservation on behalf of a walk-in or phone guest.</p>

      <section className="mt-8 rounded-lg border border-border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="mt-5 flex gap-2">
          <Button onClick={submitBooking}>Save booking</Button>
          <Button variant="ghost" asChild><Link to="/staff">Cancel</Link></Button>
        </div>
      </section>
    </div>
  );
}
