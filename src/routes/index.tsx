import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useSettings } from "@/hooks/useSettings";
import heroImg from "@/assets/hero-lobby.jpg";
import { Wifi, Coffee, Sparkles, ConciergeBell } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurelia Hotel — Reserve your stay" },
      { name: "description", content: "An intimate luxury hotel. Hand-finished rooms, attentive service, easy online booking." },
      { property: "og:title", content: "Aurelia Hotel" },
      { property: "og:description", content: "Timeless luxury, modern comfort." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const settings = useSettings();
  const { data: rooms } = useQuery({
    queryKey: ["rooms", "featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("is_active", true)
        .order("price_per_night")
        .limit(3);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="Aurelia hotel lobby at sunset" width={1920} height={1080} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background" />
        </div>
        <div className="container-narrow flex min-h-[78vh] flex-col items-start justify-end pb-20 pt-32">
          <p className="eyebrow text-foreground/80">Est. MMXXV · A house of hospitality</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] text-foreground md:text-7xl">
            {settings.tagline.split(",")[0] || "Timeless luxury"},<br />
            <span className="italic text-primary">{settings.tagline.split(",")[1]?.trim() || "modern comfort"}.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Discover {settings.hotel_name} — a quiet retreat in the heart of the city, with thoughtfully designed rooms
            and effortless online reservations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/rooms">Reserve a room</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/about">Our story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="container-narrow py-20">
        <div className="gold-rule mb-16 w-24" />
        <div className="grid gap-12 md:grid-cols-4">
          {[
            { icon: ConciergeBell, title: "Concierge", text: "24-hour attendant service at your call." },
            { icon: Sparkles, title: "Suite Comfort", text: "Hand-finished interiors, Egyptian cotton." },
            { icon: Coffee, title: "Morning Service", text: "Breakfast served in-room or in salon." },
            { icon: Wifi, title: "Connected", text: "Discreet, fast, complimentary." },
          ].map((f) => (
            <div key={f.title}>
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-4 font-serif text-xl">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured rooms */}
      <section className="container-narrow pb-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">The Rooms</p>
            <h2 className="mt-2 font-serif text-4xl md:text-5xl">Choose your retreat</h2>
          </div>
          <Link to="/rooms" className="text-sm text-primary underline-offset-4 hover:underline">
            View all →
          </Link>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {rooms?.map((r) => (
            <Link
              key={r.id}
              to="/rooms/$id"
              params={{ id: r.id }}
              className="group block overflow-hidden rounded-lg border border-border/60 bg-card transition-all hover:shadow-lg"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {r.image_url && (
                  <img
                    src={r.image_url}
                    alt={r.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
              </div>
              <div className="p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl">{r.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    from <span className="font-medium text-foreground">{formatCurrency(r.price_per_night, settings.currency)}</span>/night
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
