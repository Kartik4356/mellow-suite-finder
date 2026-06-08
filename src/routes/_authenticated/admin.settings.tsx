import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

const PLANS = [
  { id: "starter", name: "Starter", price: "$49/mo", features: ["Up to 20 rooms", "Email support", "Basic analytics"] },
  { id: "professional", name: "Professional", price: "$149/mo", features: ["Up to 100 rooms", "Priority support", "Advanced analytics", "Channel sync"] },
  { id: "enterprise", name: "Enterprise", price: "Contact us", features: ["Unlimited rooms", "Dedicated manager", "Custom integrations", "SLA"] },
];

const PALETTES = [
  { name: "Bronze & Gold", primary: "#8b6f47", accent: "#c9a86a" },
  { name: "Charcoal & Brass", primary: "#3d3a36", accent: "#b8924b" },
  { name: "Ocean & Pearl", primary: "#2f5a6e", accent: "#d4c2a8" },
  { name: "Sage & Cream", primary: "#5c7561", accent: "#d8c9a6" },
  { name: "Rose & Copper", primary: "#8a4b4b", accent: "#c98e6a" },
];

function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", "global").maybeSingle();
      return data;
    },
  });

  const { data: roomsList } = useQuery({
    queryKey: ["admin_rooms_summary"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("id,name,is_active");
      return data ?? [];
    },
  });

  const roomTypes = (() => {
    const map = new Map<string, { total: number; active: number }>();
    for (const r of roomsList ?? []) {
      const cur = map.get(r.name) ?? { total: 0, active: 0 };
      cur.total += 1;
      if (r.is_active) cur.active += 1;
      map.set(r.name, cur);
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  })();
  const totalRooms = roomsList?.length ?? 0;

  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (settings) setForm(settings); }, [settings]);

  const save = async (patch: Record<string, any>) => {
    const { error } = await supabase.from("app_settings").update(patch as any).eq("id", "global");
    if (error) return toast.error(error.message);
    toast.success("Settings saved.");
    qc.invalidateQueries({ queryKey: ["app_settings"] });
  };

  if (!form) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-10">
      {/* Branding */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Branding</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><Label>Hotel name</Label><Input value={form.hotel_name} onChange={(e) => setForm({ ...form, hotel_name: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
          <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
        </div>
        <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => save({ hotel_name: form.hotel_name, tagline: form.tagline, currency: form.currency })}>
          Save branding
        </Button>
      </section>

      {/* Theme */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Theme palette</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose the accent colors guests see throughout the site.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTES.map((p) => {
            const active = form.theme_primary === p.primary;
            return (
              <button
                key={p.name}
                onClick={() => { setForm({ ...form, theme_primary: p.primary, theme_accent: p.accent }); save({ theme_primary: p.primary, theme_accent: p.accent }); }}
                className={`flex items-center justify-between rounded-lg border p-4 text-left transition-all ${active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.primary} · {p.accent}</p>
                </div>
                <div className="flex gap-1">
                  <span className="h-8 w-8 rounded-full border" style={{ background: p.primary }} />
                  <span className="h-8 w-8 rounded-full border" style={{ background: p.accent }} />
                  {active && <Check className="ml-2 self-center h-5 w-5 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Subscription */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl">Subscription plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Choose the plan that fits your property. Billing is mocked in this preview.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {PLANS.map((p) => {
            const active = form.subscription_plan === p.id;
            return (
              <div key={p.id} className={`rounded-lg border p-5 ${active ? "border-primary bg-secondary/40" : "border-border"}`}>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-xl">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.price}</p>
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> {f}</li>)}
                </ul>
                <Button
                  className={`mt-4 w-full ${active ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                  variant={active ? "outline" : "default"}
                  disabled={active}
                  onClick={() => { setForm({ ...form, subscription_plan: p.id }); save({ subscription_plan: p.id }); }}
                >
                  {active ? "Current plan" : "Switch to " + p.name}
                </Button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
