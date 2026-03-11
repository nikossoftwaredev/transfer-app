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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Trash2, Car, Loader2 } from "lucide-react";
import {
  inviteDriver,
  removeDriver,
  assignVehicleToDriver,
} from "@/server_actions/drivers";
import { toast } from "sonner";

interface DriverUser {
  id: string;
  name: string;
  phone: string | null;
  createdAt: Date;
  driver: {
    id: string;
    licenseNo: string;
    availability: string;
    inviteStatus: string;
    vehicleId: string | null;
    vehicle: {
      id: string;
      plateNumber: string;
      vehicleClass: { name: string };
    } | null;
  } | null;
}

interface OrgVehicle {
  id: string;
  plateNumber: string;
  vehicleClass: { name: string };
}

interface DriversManagementProps {
  drivers: DriverUser[];
  vehicles: OrgVehicle[];
}

export const DriversManagement = ({
  drivers,
  vehicles,
}: DriversManagementProps) => {
  const [isPending, startTransition] = useTransition();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    phone: "",
    licenseNo: "",
  });

  const handleInvite = () => {
    if (!inviteForm.name || !inviteForm.phone || !inviteForm.licenseNo) {
      toast.error("All fields are required");
      return;
    }
    startTransition(async () => {
      try {
        await inviteDriver(inviteForm);
        toast.success("Driver invited successfully");
        setInviteOpen(false);
        setInviteForm({ name: "", phone: "", licenseNo: "" });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to invite driver"
        );
      }
    });
  };

  const handleRemove = (driverId: string) => {
    startTransition(async () => {
      try {
        await removeDriver(driverId);
        toast.success("Driver removed");
      } catch {
        toast.error("Failed to remove driver");
      }
    });
  };

  const handleAssignVehicle = (driverId: string, vehicleId: string) => {
    startTransition(async () => {
      try {
        await assignVehicleToDriver(
          driverId,
          vehicleId === "none" ? null : vehicleId
        );
        toast.success("Vehicle assigned");
      } catch {
        toast.error("Failed to assign vehicle");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Drivers</h1>
          <p className="text-muted-foreground">
            Invite drivers and manage vehicle assignments.
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="size-4" />
              Invite Driver
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a Driver</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  placeholder="Driver name"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={inviteForm.phone}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, phone: e.target.value })
                  }
                  placeholder="+30 698 123 4567"
                />
              </div>
              <div>
                <Label>License Number</Label>
                <Input
                  value={inviteForm.licenseNo}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, licenseNo: e.target.value })
                  }
                  placeholder="AB-123456"
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Send Invite"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>License</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>
              <Car className="inline size-4" /> Vehicle
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.name}</TableCell>
              <TableCell>{d.phone || "—"}</TableCell>
              <TableCell>{d.driver?.licenseNo || "—"}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    d.driver?.inviteStatus === "accepted"
                      ? "default"
                      : "secondary"
                  }
                >
                  {d.driver?.inviteStatus || "—"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {d.driver?.availability || "—"}
                </Badge>
              </TableCell>
              <TableCell>
                {d.driver && (
                  <Select
                    value={d.driver.vehicleId || "none"}
                    onValueChange={(val) =>
                      handleAssignVehicle(d.driver!.id, val)
                    }
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Assign vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No vehicle</SelectItem>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plateNumber} ({v.vehicleClass.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell>
                {d.driver && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={isPending}
                    onClick={() => handleRemove(d.driver!.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {drivers.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                No drivers yet. Invite one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
