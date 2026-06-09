import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Aurelia Hotel" }] }),
  component: AdminLayout,
});

const tabs = [
  { to: "/admin", label: "Overview", exact: true },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/users", label: "Users & Roles" },
  { to: "/admin/photos", label: "Photos" },
  { to: "/admin/settings", label: "Settings" },
];

function AdminLayout() {
  const { isAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return <div className="container-narrow py-16 text-muted-foreground">Loading…</div>;
  if (!isAdmin) return (
    <div className="container-narrow py-16">
      <p className="font-serif text-3xl">Administrators only</p>
      <p className="mt-2 text-muted-foreground">Ask an existing admin to grant you access.</p>
      <Link to="/" className="mt-4 inline-block text-primary underline">Return home</Link>
    </div>
  );

  return (
    <div className="container-narrow py-12">
      <p className="eyebrow">Administration</p>
      <h1 className="mt-2 font-serif text-5xl">Admin</h1>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => {
          const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
