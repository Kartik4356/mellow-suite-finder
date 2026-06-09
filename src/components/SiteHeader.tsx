import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle2 } from "lucide-react";

function NavLink({ to, label }: { to: string; label: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`text-sm tracking-wide transition-colors hover:text-foreground ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );
}

export function SiteHeader() {
  const { user, isStaff, isAdmin, signOut } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container-narrow flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          {settings.logo_url && (
            <img src={settings.logo_url} alt={settings.hotel_name} className="h-8 w-auto" />
          )}
          <span className="font-serif text-2xl font-medium tracking-tight">{settings.hotel_name}</span>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">
            est. mmxxv
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" label="Home" />
          {!isStaff && <NavLink to="/rooms" label="Rooms" />}
          {!isStaff && <NavLink to="/about" label="About" />}
          {user && !isStaff && <NavLink to="/my-bookings" label="My Stays" />}
          {isStaff && <NavLink to="/staff" label="Front Desk" />}
          {isStaff && <NavLink to="/add-guest" label="Add Guest" />}
          {isAdmin && <NavLink to="/admin" label="Admin" />}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                <UserCircle2 className="h-4 w-4" />
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/rooms">Book a stay</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
