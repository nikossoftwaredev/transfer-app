"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  XCircle,
  Building2,
  Users,
  Car,
  DollarSign,
} from "lucide-react";
import { updateOrganizationStatus } from "@/server_actions/organizations";
import { toast } from "sonner";

interface OrgUser {
  id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
}

interface OrgVehicle {
  id: string;
  plateNumber: string;
  year: number | null;
  status: string;
  vehicleClass: { name: string };
}

interface OrgPricingRule {
  id: string;
  minimumFare: number;
  ratePerKm: number;
  nightMultiplier: number;
  extraStopFee: number;
  vehicleClass: { name: string };
}

interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  status: string;
  commissionRate: number;
  createdAt: Date;
  users: OrgUser[];
  vehicles: OrgVehicle[];
  pricingRules: OrgPricingRule[];
  _count: { bookings: number };
}

interface OrganizationDetailProps {
  org: Organization;
}

export const OrganizationDetail = ({ org }: OrganizationDetailProps) => {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (status: "verified" | "suspended") => {
    startTransition(async () => {
      try {
        await updateOrganizationStatus(org.id, status);
        toast.success(
          `Organization ${status === "verified" ? "approved" : "suspended"}`
        );
      } catch {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="size-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">{org.name}</h1>
            <p className="text-muted-foreground">{org.contactEmail}</p>
          </div>
          <Badge
            variant={
              org.status === "verified"
                ? "default"
                : org.status === "suspended"
                  ? "destructive"
                  : "secondary"
            }
          >
            {org.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          {org.status !== "verified" && (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleStatusChange("verified")}
            >
              <CheckCircle className="size-4" />
              Approve
            </Button>
          )}
          {org.status !== "suspended" && (
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() => handleStatusChange("suspended")}
            >
              <XCircle className="size-4" />
              Suspend
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Users className="inline size-4" /> Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{org.users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <Car className="inline size-4" /> Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{org.vehicles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              <DollarSign className="inline size-4" /> Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {(org.commissionRate * 100).toFixed(0)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{org._count.bookings}</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.email || "—"}</TableCell>
                  <TableCell>{user.phone || "—"}</TableCell>
                </TableRow>
              ))}
              {org.users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No users
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    {vehicle.plateNumber}
                  </TableCell>
                  <TableCell>{vehicle.vehicleClass.name}</TableCell>
                  <TableCell>{vehicle.year || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{vehicle.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
              {org.vehicles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No vehicles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pricing Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Class</TableHead>
                <TableHead>Min Fare</TableHead>
                <TableHead>Rate/km</TableHead>
                <TableHead>Night ×</TableHead>
                <TableHead>Extra Stop</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {org.pricingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.vehicleClass.name}
                  </TableCell>
                  <TableCell>€{rule.minimumFare.toFixed(2)}</TableCell>
                  <TableCell>€{rule.ratePerKm.toFixed(2)}</TableCell>
                  <TableCell>{rule.nightMultiplier}×</TableCell>
                  <TableCell>€{rule.extraStopFee.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {org.pricingRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No pricing rules configured
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
