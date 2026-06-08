import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useSettings } from "@/hooks/useSettings";
import { Users, Bed, Maximize } from "lucide-react";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms & Suites — Aurelia Hotel" },
      { name: "description", content: "Browse rooms and suites at Aurelia Hotel. From classic comfort to the Presidential Suite." },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const settings = useSettings();
  const { data: rooms, isLoading } = useQuery({
    queryKey: ["rooms", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").eq("is_active", true).order("price_per_night");
      return data ?? [];
    },
  });

  return (
    <div className="container-narrow py-16">
      <div className="max-w-2xl">
        <p className="eyebrow">Accommodations</p>
        <h1 className="mt-2 font-serif text-5xl">Rooms & Suites</h1>
        <p className="mt-4 text-muted-foreground">
          Every room at {settings.hotel_name} is designed for quiet repose — natural light, considered materials, attentive service.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {isLoading && <p className="text-muted-foreground">Loading rooms…</p>}
        {rooms?.map((r, idx) => (
          <div
            key={r.id}
            className={`grid gap-8 overflow-hidden rounded-lg border border-border/60 bg-card md:grid-cols-2 ${
              idx % 2 ? "md:[&>div:first-child]:order-2" : ""
            }`}
          >
            <div className="aspect-[4/3] bg-muted md:aspect-auto">
              {r.image_url && (
                <img src={r.image_url} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="flex flex-col justify-between p-8 md:p-10">
              <div>
                <h2 className="font-serif text-3xl">{r.name}</h2>
                <p className="mt-3 text-muted-foreground">{r.description}</p>
                <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2"><Bed className="h-4 w-4 text-accent" /> {r.bed_type}</span>
                  <span className="flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Up to {r.capacity} guests</span>
                  {r.size_sqm && <span className="flex items-center gap-2"><Maximize className="h-4 w-4 text-accent" /> {r.size_sqm} m²</span>}
                </div>
                {r.amenities?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {r.amenities.slice(0, 6).map((a) => (
                      <span key={a} className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-8 flex items-end justify-between">
                <div>
                  <p className="eyebrow">From</p>
                  <p className="font-serif text-3xl text-foreground">
                    {formatCurrency(r.price_per_night, settings.currency)}
                    <span className="ml-1 text-sm text-muted-foreground">/ night</span>
                  </p>
                </div>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/rooms/$id" params={{ id: r.id }}>Reserve</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
