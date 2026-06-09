import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/photos")({
  component: AdminPhotos,
});

interface ExtraImage { id?: string; label?: string; url: string }

function AdminPhotos() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["app_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("*").eq("id", "global").maybeSingle();
      return data;
    },
  });

  const [hero, setHero] = useState("");
  const [about, setAbout] = useState("");
  const [logo, setLogo] = useState("");
  const [extras, setExtras] = useState<ExtraImage[]>([]);

  useEffect(() => {
    if (data) {
      setHero((data as any).hero_image_url ?? "");
      setAbout((data as any).about_image_url ?? "");
      setLogo((data as any).logo_url ?? "");
      setExtras(((data as any).extra_images ?? []) as ExtraImage[]);
    }
  }, [data]);

  const save = async () => {
    const { error } = await supabase.from("app_settings").update({
      hero_image_url: hero || null,
      about_image_url: about || null,
      logo_url: logo || null,
      extra_images: extras as any,
    }).eq("id", "global");
    if (error) return toast.error(error.message);
    toast.success("Photos saved.");
    qc.invalidateQueries({ queryKey: ["app_settings"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl">Website photos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Replace the imagery shown across the site. Paste a public image URL for each section.
        </p>
      </div>

      <section className="space-y-6 rounded-lg border border-border bg-card p-6">
        <PhotoField label="Logo (optional)" hint="Small logo shown in the header." url={logo} onChange={setLogo} />
        <PhotoField label="Homepage hero" hint="Large background image on the homepage." url={hero} onChange={setHero} />
        <PhotoField label="About page" hint="Image displayed on the About page." url={about} onChange={setAbout} />
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl">Gallery images</h3>
            <p className="mt-1 text-sm text-muted-foreground">Extra images you can reuse across the site.</p>
          </div>
          <Button variant="outline" onClick={() => setExtras([...extras, { label: "", url: "" }])}>
            <Plus className="mr-2 h-4 w-4" /> Add image
          </Button>
        </div>
        <div className="mt-4 space-y-3">
          {extras.length === 0 && <p className="text-sm text-muted-foreground">No gallery images yet.</p>}
          {extras.map((img, i) => (
            <div key={i} className="grid gap-3 rounded-md border border-border p-3 sm:grid-cols-[1fr_2fr_auto]">
              <Input placeholder="Label" value={img.label ?? ""} onChange={(e) => {
                const copy = [...extras]; copy[i] = { ...copy[i], label: e.target.value }; setExtras(copy);
              }} />
              <Input placeholder="https://…" value={img.url} onChange={(e) => {
                const copy = [...extras]; copy[i] = { ...copy[i], url: e.target.value }; setExtras(copy);
              }} />
              <Button variant="ghost" size="sm" onClick={() => setExtras(extras.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              {img.url && (
                <div className="sm:col-span-3">
                  <img src={img.url} alt={img.label ?? ""} className="h-24 rounded border border-border object-cover" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">Save all photos</Button>
    </div>
  );
}

function PhotoField({ label, hint, url, onChange }: { label: string; hint?: string; url: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <Input value={url} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
      {url && <img src={url} alt={label} className="mt-3 h-32 w-full max-w-md rounded border border-border object-cover" />}
    </div>
  );
}
