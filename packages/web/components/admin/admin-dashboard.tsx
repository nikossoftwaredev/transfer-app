"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  CalendarCheck,
  Euro,
  Clock,
  FileText,
  UserPlus,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Car,
  ShieldCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Types ──────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string; // serialised Date
  user: { name: string };
}

interface RecentBooking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  scheduledAt: string;
  client: { name: string };
}

export interface AdminDashboardProps {
  orgTotal: number;
  orgPending: number;
  orgVerified: number;
  totalDrivers: number;
  onlineDrivers: number;
  bookingsToday: number;
  completedToday: number;
  revenueToday: number;
  recentAudit: AuditEntry[];
  recentBookings: RecentBooking[];
}

// ─── Helpers ────────────────────────────────────────────────────

const statusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "completed":
      return "default";
    case "cancelled":
    case "timed_out":
      return "destructive";
    case "in_progress":
    case "driver_en_route":
    case "waiting_at_pickup":
      return "secondary";
    default:
      return "outline";
  }
};

const auditIcon = (action: string) => {
  switch (action) {
    case "create":
      return <UserPlus className="size-4 text-green-500" />;
    case "delete":
      return <XCircle className="size-4 text-red-500" />;
    case "update":
      return <FileText className="size-4 text-blue-500" />;
    case "cancel":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "verify":
      return <ShieldCheck className="size-4 text-emerald-500" />;
    default:
      return <Clock className="size-4 text-muted-foreground" />;
  }
};

const formatBookingId = (id: string) =>
  `TGR-${id.slice(-4).toUpperCase()}`;

const truncate = (s: string, max = 28) =>
  s.length > max ? s.slice(0, max) + "..." : s;

// ─── Component ──────────────────────────────────────────────────

export const AdminDashboard = ({
  orgTotal,
  orgPending,
  orgVerified,
  totalDrivers,
  onlineDrivers,
  bookingsToday,
  completedToday,
  revenueToday,
  recentAudit,
  recentBookings,
}: AdminDashboardProps) => {
  const completionRate =
    bookingsToday > 0
      ? ((completedToday / bookingsToday) * 100).toFixed(0)
      : "—";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Platform Overview</h1>
        <p className="text-muted-foreground">
          Real-time snapshot of platform activity.
        </p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Organizations */}
        <Card className="transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="size-4" />
              Organizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{orgTotal}</span>
            <p className="text-sm text-muted-foreground mt-1">
              {orgPending} pending &middot; {orgVerified} verified
            </p>
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card className="transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Users className="size-4" />
              Total Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{totalDrivers}</span>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400 font-medium">
                {onlineDrivers} online
              </span>{" "}
              right now
            </p>
          </CardContent>
        </Card>

        {/* Bookings Today */}
        <Card className="transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <CalendarCheck className="size-4" />
              Bookings Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">{bookingsToday}</span>
            <p className="text-sm text-muted-foreground mt-1">
              {completionRate}% completion rate
            </p>
          </CardContent>
        </Card>

        {/* Revenue Today */}
        <Card className="transition-shadow duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Euro className="size-4" />
              Revenue Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold">
              &euro;{revenueToday.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recent activity.
              </p>
            ) : (
              <ul className="space-y-3">
                {recentAudit.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <span className="mt-0.5 shrink-0">
                      {auditIcon(entry.action)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="leading-snug">
                        <span className="font-medium">{entry.user.name}</span>{" "}
                        <span className="text-muted-foreground">
                          {entry.action}
                        </span>{" "}
                        <span>
                          {entry.entity} #{entry.entityId.slice(-6)}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(entry.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="size-5" />
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="hidden sm:table-cell">Route</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">
                      {formatBookingId(b.id)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {truncate(b.client.name, 18)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                      {truncate(b.pickupAddress, 16)} &rarr;{" "}
                      {truncate(b.dropoffAddress, 16)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(b.status)}>
                        {b.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {recentBookings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground"
                    >
                      No bookings yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
