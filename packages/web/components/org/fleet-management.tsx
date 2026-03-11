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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/server_actions/vehicles";
import { toast } from "sonner";

interface Vehicle {
  id: string;
  plateNumber: string;
  year: number | null;
  status: string;
  vehicleClass: { id: string; name: string };
  driver: { user: { name: string } } | null;
}

interface VehicleClassOption {
  id: string;
  name: string;
  capacity: number;
}

interface FleetManagementProps {
  vehicles: Vehicle[];
  vehicleClasses: VehicleClassOption[];
}

const EMPTY_FORM = {
  vehicleClassId: "",
  plateNumber: "",
  year: "",
};

export const FleetManagement = ({
  vehicles,
  vehicleClasses,
}: FleetManagementProps) => {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setForm({
      vehicleClassId: v.vehicleClass.id,
      plateNumber: v.plateNumber,
      year: v.year?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.vehicleClassId || !form.plateNumber) {
      toast.error("Vehicle class and plate are required");
      return;
    }
    startTransition(async () => {
      try {
        const year = form.year ? parseInt(form.year) : undefined;
        if (editingId) {
          await updateVehicle(editingId, {
            vehicleClassId: form.vehicleClassId,
            plateNumber: form.plateNumber,
            year,
          });
          toast.success("Vehicle updated");
        } else {
          await createVehicle({
            vehicleClassId: form.vehicleClassId,
            plateNumber: form.plateNumber,
            year,
          });
          toast.success("Vehicle added");
        }
        setDialogOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save vehicle"
        );
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteVehicle(id);
        toast.success("Vehicle removed");
      } catch {
        toast.error("Failed to delete vehicle");
      }
    });
  };

  const handleStatusChange = (id: string, status: string) => {
    startTransition(async () => {
      try {
        await updateVehicle(id, { status });
        toast.success("Status updated");
      } catch {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet</h1>
          <p className="text-muted-foreground">
            Register vehicles and manage your fleet.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Vehicle
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Plate</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.id}>
              <TableCell className="font-medium">{v.plateNumber}</TableCell>
              <TableCell>{v.vehicleClass.name}</TableCell>
              <TableCell>{v.year || "—"}</TableCell>
              <TableCell>
                <Select
                  value={v.status}
                  onValueChange={(val) => handleStatusChange(v.id, val)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_trip">On Trip</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>{v.driver?.user.name || "Unassigned"}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(v)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => handleDelete(v.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {vehicles.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground py-8"
              >
                No vehicles registered yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Vehicle" : "Add Vehicle"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Vehicle Class</Label>
              <Select
                value={form.vehicleClassId}
                onValueChange={(val) =>
                  setForm({ ...form, vehicleClassId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleClasses.map((vc) => (
                    <SelectItem key={vc.id} value={vc.id}>
                      {vc.name} ({vc.capacity} pax)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plate Number</Label>
              <Input
                value={form.plateNumber}
                onChange={(e) =>
                  setForm({ ...form, plateNumber: e.target.value })
                }
                placeholder="ABC-1234"
              />
            </div>
            <div>
              <Label>Year</Label>
              <Input
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                placeholder="2024"
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
                "Add"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
