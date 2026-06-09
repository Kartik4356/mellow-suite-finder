import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/change-password")({
  head: () => ({ meta: [{ title: "Change password — Aurelia Hotel" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const { user, mustChangePassword, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setLoading(false); return toast.error(error.message); }
    if (user) {
      await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
    }
    await refreshProfile();
    setLoading(false);
    toast.success("Password updated.");
    navigate({ to: "/" });
  };

  return (
    <div className="container-narrow flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <p className="eyebrow">Account security</p>
        <h1 className="mt-2 font-serif text-3xl">{mustChangePassword ? "Set a new password" : "Change password"}</h1>
        {mustChangePassword && (
          <p className="mt-2 text-sm text-muted-foreground">
            For security, please choose a new password before continuing.
          </p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label>New password</Label>
            <Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input type="password" required minLength={8} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {loading ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
