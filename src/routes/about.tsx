import { createFileRoute } from "@tanstack/react-router";
import { useSettings } from "@/hooks/useSettings";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Aurelia Hotel" },
      { name: "description", content: "Our story: a quiet retreat shaped by craft, hospitality, and an enduring sense of place." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const settings = useSettings();
  return (
    <div className="container-narrow max-w-3xl py-20">
      <p className="eyebrow">Our story</p>
      <h1 className="mt-2 font-serif text-5xl">A house, not a brand.</h1>
      {settings.about_image_url && (
        <img
          src={settings.about_image_url}
          alt="About the hotel"
          className="mt-8 aspect-[16/9] w-full rounded-lg border border-border object-cover"
        />
      )}
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/85">
        <p>
          {settings.hotel_name} began as a single restored townhouse — a quiet experiment in what hospitality could feel like when stripped of excess.
          Today, our rooms still carry that intent: hand-finished, generously proportioned, and arranged for repose.
        </p>
        <p>
          We believe luxury is not loudness. It is the soft click of a brass key, breakfast served at the hour you ask, and a room
          remembered. Our staff are trained to anticipate, not to perform.
        </p>
        <p>
          Whether you stay a single night or a quiet week, we hope to make {settings.hotel_name} feel like the house of a generous friend — one who
          has thought, in advance, of everything.
        </p>
      </div>
      <div className="gold-rule mt-16 w-24" />
    </div>
  );
}
