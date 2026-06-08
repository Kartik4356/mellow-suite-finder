import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/rooms")({
  component: AdminRooms,
});

interface RoomForm {
  id?: string;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
  bed_type: string;
  size_sqm: number;
  image_url: string;
  amenities: string;
  is_active: boolean;
}

const empty: RoomForm = {
  name: "", description: "", price_per_night: 100, capacity: 2,
  bed_type: "Queen", size_sqm: 28, image_url: "", amenities: "", is_active: true,
};

function AdminRooms() {
  const settings = useSettings();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RoomForm | null>(null);
  const [open, setOpen] = useState(false);

  const { data: rooms } = useQuery({
    queryKey: ["admin_rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").order("price_per_night");
      return data ?? [];
    },
  });

  const save = async () => {
    if (!editing) return;
    const payload = {
      name: editing.name,
      description: editing.description,
      price_per_night: editing.price_per_night,
      capacity: editing.capacity,
      bed_type: editing.bed_type,
      size_sqm: editing.size_sqm || null,
      image_url: editing.image_url || null,
      amenities: editing.amenities.split(",").map((s) => s.trim()).filter(Boolean),
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from("rooms").update(payload).eq("id", editing.id)
      : await supabase.from("rooms").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Room saved.");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin_rooms"] });
    qc.invalidateQueries({ queryKey: ["rooms"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Room deleted.");
    qc.invalidateQueries({ queryKey: ["admin_rooms"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">Rooms</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing({ ...empty })} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> New room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle className="font-serif text-2xl">{editing?.id ? "Edit room" : "New room"}</DialogTitle></DialogHeader>
            {editing && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
                <div><Label>Price / night</Label><Input type="number" value={editing.price_per_night} onChange={(e) => setEditing({ ...editing, price_per_night: Number(e.target.value) })} /></div>
                <div><Label>Capacity</Label><Input type="number" value={editing.capacity} onChange={(e) => setEditing({ ...editing, capacity: Number(e.target.value) })} /></div>
                <div><Label>Bed type</Label><Input value={editing.bed_type} onChange={(e) => setEditing({ ...editing, bed_type: e.target.value })} /></div>
                <div><Label>Size (m²)</Label><Input type="number" value={editing.size_sqm} onChange={(e) => setEditing({ ...editing, size_sqm: Number(e.target.value) })} /></div>
                <div className="sm:col-span-2"><Label>Image URL</Label><Input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="/src/assets/room-classic.jpg or https://…" /></div>
                <div className="sm:col-span-2"><Label>Amenities (comma-separated)</Label><Input value={editing.amenities} onChange={(e) => setEditing({ ...editing, amenities: e.target.value })} /></div>
                <div className="flex items-center gap-3 sm:col-span-2"><Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} /><Label>Active (bookable)</Label></div>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={save} className="bg-primary text-primary-foreground hover:bg-primary/90">Save</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left">
            <tr><th className="p-3">Name</th><th className="p-3">Price</th><th className="p-3">Capacity</th><th className="p-3">Active</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rooms?.map((r: any) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3">{formatCurrency(r.price_per_night, settings.currency)}</td>
                <td className="p-3">{r.capacity}</td>
                <td className="p-3">{r.is_active ? "Yes" : "No"}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing({ ...r, amenities: (r.amenities ?? []).join(", "), size_sqm: r.size_sqm ?? 0, image_url: r.image_url ?? "" }); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
