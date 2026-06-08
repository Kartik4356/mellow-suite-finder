import { createFileRoute } from "@tanstack/react-router";

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
  return (
    <div className="container-narrow max-w-3xl py-20">
      <p className="eyebrow">Our story</p>
      <h1 className="mt-2 font-serif text-5xl">A house, not a brand.</h1>
      <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/85">
        <p>
          Aurelia began as a single restored townhouse — a quiet experiment in what hospitality could feel like when stripped of excess.
          Today, our rooms still carry that intent: hand-finished, generously proportioned, and arranged for repose.
        </p>
        <p>
          We believe luxury is not loudness. It is the soft click of a brass key, breakfast served at the hour you ask, and a room
          remembered. Our staff are trained to anticipate, not to perform.
        </p>
        <p>
          Whether you stay a single night or a quiet week, we hope to make Aurelia feel like the house of a generous friend — one who
          has thought, in advance, of everything.
        </p>
      </div>
      <div className="gold-rule mt-16 w-24" />
    </div>
  );
}
