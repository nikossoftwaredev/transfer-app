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
import { CheckCircle, XCircle, Building2, Users, Car } from "lucide-react";
import { updateOrganizationStatus } from "@/server_actions/organizations";
import { toast } from "sonner";
import { Link } from "@/lib/i18n/navigation";

interface Organization {
  id: string;
  name: string;
  contactEmail: string;
  status: string;
  commissionRate: number;
  createdAt: Date;
  _count: { users: number; vehicles: number };
}

interface OrganizationsListProps {
  organizations: Organization[];
}

const statusVariant = (status: string) => {
  if (status === "verified") return "default" as const;
  if (status === "suspended") return "destructive" as const;
  return "secondary" as const;
};

export const OrganizationsList = ({
  organizations,
}: OrganizationsListProps) => {
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const handleStatusChange = (
    id: string,
    status: "verified" | "suspended"
  ) => {
    setActionId(id);
    startTransition(async () => {
      try {
        await updateOrganizationStatus(id, status);
        toast.success(
          `Organization ${status === "verified" ? "approved" : "suspended"}`
        );
      } catch {
        toast.error("Failed to update organization status");
      }
      setActionId(null);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">
            Manage transfer organizations and their verification status.
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>
              <Users className="inline size-4" /> Users
            </TableHead>
            <TableHead>
              <Car className="inline size-4" /> Vehicles
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell>
                <Link
                  href={`/admin/organizations/${org.id}`}
                  className="flex items-center gap-2 font-medium hover:underline"
                >
                  <Building2 className="size-4 text-muted-foreground" />
                  {org.name}
                </Link>
              </TableCell>
              <TableCell>{org.contactEmail}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(org.status)}>{org.status}</Badge>
              </TableCell>
              <TableCell>{(org.commissionRate * 100).toFixed(0)}%</TableCell>
              <TableCell>{org._count.users}</TableCell>
              <TableCell>{org._count.vehicles}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {org.status !== "verified" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending && actionId === org.id}
                      onClick={() => handleStatusChange(org.id, "verified")}
                    >
                      <CheckCircle className="size-4" />
                      Approve
                    </Button>
                  )}
                  {org.status !== "suspended" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending && actionId === org.id}
                      onClick={() => handleStatusChange(org.id, "suspended")}
                    >
                      <XCircle className="size-4" />
                      Suspend
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {organizations.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No organizations yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
