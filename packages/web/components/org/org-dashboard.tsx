"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Car,
  Euro,
  Star,
  Clock,
  CalendarOff,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface UpcomingBooking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string; // serialized Date
  status: string;
  vehicleClass: { name: string };
  client: { name: string };
  driver: {
    user: { name: string };
  } | null;
}

interface OverviewStats {
  activeBookings: number;
  onlineDrivers: number;
  totalDrivers: number;
  revenueToday: number;
  avgRating: number | null;
}

interface OrgDashboardProps {
  stats: OverviewStats;
  upcomingBookings: UpcomingBooking[];
}

// ─── Helpers ────────────────────────────────────────────────────

const statusVariant = (status: string) => {
  if (status === "completed") return "default" as const;
  if (status === "cancelled" || status === "timed_out")
    return "destructive" as const;
  if (status === "in_progress" || status === "driver_en_route")
    return "default" as const;
  return "secondary" as const;
};

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const shortenAddress = (address: string) => {
  return address.split(",")[0];
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// ─── Component ──────────────────────────────────────────────────

export function OrgDashboard({ stats, upcomingBookings }: OrgDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back. Here is your organization overview for today.
        </p>
      </div>

      {/* Today's Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Today&apos;s Overview
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Bookings
              </CardTitle>
              <CalendarCheck className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBookings}</div>
            </CardContent>
          </Card>

          {/* Available Drivers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Drivers
              </CardTitle>
              <Car className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.onlineDrivers}
                <span className="text-muted-foreground text-base font-normal">
                  /{stats.totalDrivers}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue Today
              </CardTitle>
              <Euro className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                EUR{" "}
                {stats.revenueToday.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </CardContent>
          </Card>

          {/* Avg Rating */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg Rating
              </CardTitle>
              <Star className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-2xl font-bold">
                <Star className="size-5 fill-yellow-400 text-yellow-400" />
                {stats.avgRating !== null ? stats.avgRating.toFixed(1) : "N/A"}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Upcoming Transfers */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">
            Upcoming Transfers
          </h2>
          <span className="text-muted-foreground text-sm">(next 4h)</span>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingBookings.map((b) => (
                  <TableRow
                    key={b.id}
                    className="transition-colors duration-300"
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatTime(b.scheduledAt)}
                    </TableCell>
                    <TableCell>{b.client.name}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="truncate text-sm">
                        {shortenAddress(b.pickupAddress)} &rarr;{" "}
                        {shortenAddress(b.dropoffAddress)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.vehicleClass.name}
                    </TableCell>
                    <TableCell>
                      {b.driver ? (
                        b.driver.user.name
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(b.status)}>
                        {formatStatus(b.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {upcomingBookings.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-12 text-center"
                    >
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <CalendarOff className="size-8" />
                        <p className="text-sm">
                          No upcoming transfers in the next 4 hours.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
