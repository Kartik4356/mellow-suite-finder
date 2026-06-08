import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, nightsBetween } from "@/lib/format";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bed, Users, Maximize, Check } from "lucide-react";

export const Route = createFileRoute("/rooms/$id")({
  component: RoomDetail,
});

function RoomDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState(2);
  const [name, setName] = useState(user?.user_metadata?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const total = nights * Number(room?.price_per_night ?? 0);

  const handleBook = async () => {
    if (!user) {
      toast.info("Please sign in to complete your booking.");
      navigate({ to: "/auth", search: { redirect: `/rooms/${id}` } });
      return;
    }
    if (nights < 1) return toast.error("Check-out must be after check-in.");
    if (room && guests > room.capacity) return toast.error(`Maximum ${room.capacity} guests for this room.`);
    setSubmitting(true);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      room_id: id,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      total_price: total,
      guest_name: name || user.email!,
      guest_email: email || user.email!,
      notes: notes || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation requested. We'll confirm shortly.");
    navigate({ to: "/my-bookings" });
  };

  if (isLoading) return <div className="container-narrow py-16 text-muted-foreground">Loading…</div>;
  if (!room) return (
    <div className="container-narrow py-16">
      <p className="font-serif text-3xl">Room not found.</p>
      <Link to="/rooms" className="mt-3 inline-block text-primary underline">Back to rooms</Link>
    </div>
  );

  return (
    <div className="container-narrow py-12">
      <Link to="/rooms" className="text-sm text-muted-foreground hover:text-foreground">← All rooms</Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-lg">
            {room.image_url && (
              <img src={room.image_url} alt={room.name} className="aspect-[4/3] w-full object-cover" />
            )}
          </div>
          <p className="eyebrow mt-8">Accommodation</p>
          <h1 className="mt-2 font-serif text-5xl">{room.name}</h1>
          <div className="mt-4 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><Bed className="h-4 w-4 text-accent" /> {room.bed_type}</span>
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Up to {room.capacity} guests</span>
            {room.size_sqm && <span className="flex items-center gap-2"><Maximize className="h-4 w-4 text-accent" /> {room.size_sqm} m²</span>}
          </div>
          <p className="mt-6 leading-relaxed text-foreground/80">{room.description}</p>

          {room.amenities?.length > 0 && (
            <>
              <h3 className="mt-10 font-serif text-2xl">In your room</h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {room.amenities.map((a) => (
                  <li key={a} className="flex items-center gap-2 text-sm text-foreground/80">
                    <Check className="h-4 w-4 text-accent" /> {a}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Booking panel */}
        <aside className="h-fit rounded-lg border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">From</p>
              <p className="font-serif text-3xl">
                {formatCurrency(room.price_per_night, settings.currency)}
                <span className="ml-1 text-sm text-muted-foreground">/ night</span>
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Check-in</Label>
                <Input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Check-out</Label>
                <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Guests</Label>
              <Input type="number" min={1} max={room.capacity} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrival time, preferences…" />
            </div>

            <div className="border-t border-border pt-4 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{nights} night{nights === 1 ? "" : "s"}</span>
                <span>{formatCurrency(total, settings.currency)}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="font-serif text-lg">Total</span>
                <span className="font-serif text-2xl">{formatCurrency(total, settings.currency)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
              onClick={handleBook}
              disabled={submitting || nights < 1}
            >
              {submitting ? "Reserving…" : user ? "Confirm reservation" : "Sign in to reserve"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">Payment collected at check-in · Free cancellation 48h before arrival</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
