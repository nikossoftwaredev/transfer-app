"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Car } from "lucide-react";
import {
  createVehicleClass,
  updateVehicleClass,
  deleteVehicleClass,
} from "@/server_actions/vehicle-classes";
import { toast } from "sonner";

interface VehicleClass {
  id: string;
  name: string;
  tags: string[];
  capacity: number;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
  _count: { vehicles: number; bookings: number };
}

interface VehicleClassesListProps {
  vehicleClasses: VehicleClass[];
}

const EMPTY_FORM = {
  name: "",
  tags: "",
  capacity: 3,
  description: "",
  sortOrder: 0,
};

export const VehicleClassesList = ({
  vehicleClasses,
}: VehicleClassesListProps) => {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (vc: VehicleClass) => {
    setEditingId(vc.id);
    setForm({
      name: vc.name,
      tags: vc.tags.join(", "),
      capacity: vc.capacity,
      description: vc.description || "",
      sortOrder: vc.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateVehicleClass(editingId, {
            name: form.name,
            tags,
            capacity: form.capacity,
            description: form.description || undefined,
            sortOrder: form.sortOrder,
          });
          toast.success("Vehicle class updated");
        } else {
          await createVehicleClass({
            name: form.name,
            tags,
            capacity: form.capacity,
            description: form.description || undefined,
            sortOrder: form.sortOrder,
          });
          toast.success("Vehicle class created");
        }
        setDialogOpen(false);
      } catch {
        toast.error("Failed to save vehicle class");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteVehicleClass(id);
        toast.success("Vehicle class deleted");
      } catch {
        toast.error("Cannot delete — may have linked vehicles");
      }
    });
  };

  const handleToggleActive = (id: string, active: boolean) => {
    startTransition(async () => {
      try {
        await updateVehicleClass(id, { active });
        toast.success(active ? "Activated" : "Deactivated");
      } catch {
        toast.error("Failed to update");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Classes</h1>
          <p className="text-muted-foreground">
            Manage the platform vehicle class catalog.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Class
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>
              <Car className="inline size-4" /> Vehicles
            </TableHead>
            <TableHead>Bookings</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicleClasses.map((vc) => (
            <TableRow key={vc.id}>
              <TableCell>{vc.sortOrder}</TableCell>
              <TableCell className="font-medium">{vc.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {vc.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{vc.capacity}</TableCell>
              <TableCell>{vc._count.vehicles}</TableCell>
              <TableCell>{vc._count.bookings}</TableCell>
              <TableCell>
                <Switch
                  checked={vc.active}
                  onCheckedChange={(checked) =>
                    handleToggleActive(vc.id, checked)
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(vc)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(vc.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Vehicle Class" : "New Vehicle Class"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Mercedes E Class"
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Business Class, VIP, Premium"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacity</Label>
                <Input
                  type="number"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="BMW 5 Series, Cadillac XTS or similar"
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingId ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
