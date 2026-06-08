import { useSettings } from "@/hooks/useSettings";

export function SiteFooter() {
  const s = useSettings();
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/40">
      <div className="container-narrow flex flex-col gap-6 py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-serif text-2xl">{s.hotel_name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{s.tagline}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {s.hotel_name}. All rights reserved.</p>
          <p className="mt-1">A house of hospitality.</p>
        </div>
      </div>
    </footer>
  );
}
