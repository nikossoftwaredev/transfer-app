"use client";

import { useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  MapPin,
  Navigation,
  Clock,
  Star,
  Euro,
  Car,
  Users,
  Phone,
  Loader2,
  CheckCircle,
  ArrowRight,
  CalendarClock,
  CircleDot,
} from "lucide-react";
import { toggleAvailability } from "@/server_actions/trips";
import { acceptBooking } from "@/server_actions/bookings";
import { updateTripStatus } from "@/server_actions/trips";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";
import { cn } from "@/lib/general/utils";

// --- Types ---

interface UpcomingBooking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: Date;
  passengerCount: number;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  estimatedDistanceKm: number | null;
  vehicleClass: { name: string };
  client: { name: string };
}

interface ActiveBooking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: Date;
  passengerCount: number;
  status: string;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  vehicleClass: { name: string };
  client: { name: string; phone: string | null };
  trip: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    waitingStartedAt: Date | null;
    waitingEndedAt: Date | null;
  } | null;
}

interface DriverDashboardProps {
  driver: {
    id: string;
    availability: string;
    user: { name: string; phone: string | null; image: string | null };
    vehicle: {
      plateNumber: string;
      vehicleClass: { id: string; name: string };
    } | null;
  };
  completedCount: number;
  todayEarnings: number;
  averageRating: number | null;
  ratingCount: number;
  hoursOnline: number;
  upcomingBookings: UpcomingBooking[];
  activeBookings: ActiveBooking[];
}

// --- Status helpers ---

const STATUS_LABELS: Record<string, string> = {
  driver_assigned: "Assigned",
  driver_en_route: "En Route",
  waiting_at_pickup: "Waiting",
  in_progress: "In Progress",
};

const NEXT_STATUS: Record<
  string,
  {
    status:
      | "driver_en_route"
      | "waiting_at_pickup"
      | "in_progress"
      | "completed";
    label: string;
  }
> = {
  driver_assigned: { status: "driver_en_route", label: "Start Route" },
  driver_en_route: { status: "waiting_at_pickup", label: "Arrived" },
  waiting_at_pickup: { status: "in_progress", label: "Start Trip" },
  in_progress: { status: "completed", label: "Complete" },
};

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFare(min: number | null, max: number | null) {
  if (!min && !max) return "—";
  if (min && max && min !== max)
    return `€${min.toFixed(0)}–${max.toFixed(0)}`;
  return `€${(min ?? max ?? 0).toFixed(0)}`;
}

// --- Component ---

export const DriverDashboard = ({
  driver,
  completedCount,
  todayEarnings,
  averageRating,
  ratingCount,
  hoursOnline,
  upcomingBookings,
  activeBookings,
}: DriverDashboardProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isOnline = driver.availability === "online";
  const socketRef = useSocket();

  // WebSocket: register for booking events when online
  useEffect(() => {
    if (!isOnline) return;
    const socket = socketRef.current;
    if (!socket) return;

    const vehicleClassId = driver.vehicle?.vehicleClass.id;
    if (!vehicleClassId) return;

    // Register to receive bookings for this vehicle class
    socket.emit("driver:register", { vehicleClassId });

    const handleNewBooking = () => {
      // Refresh server data to pick up the new booking
      router.refresh();
    };

    const handleBookingRemoved = () => {
      // Refresh to remove accepted/cancelled bookings from list
      router.refresh();
    };

    socket.on("booking:new", handleNewBooking);
    socket.on("booking:removed", handleBookingRemoved);

    return () => {
      socket.off("booking:new", handleNewBooking);
      socket.off("booking:removed", handleBookingRemoved);
    };
  }, [isOnline, socketRef, driver.vehicle?.vehicleClass.id, router]);

  // Fallback polling every 10s when online (WebSocket is primary)
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      router.refresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [isOnline, router]);

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      try {
        await toggleAvailability(checked);
        toast.success(checked ? "You are now online" : "You are now offline");
      } catch {
        toast.error("Failed to update availability");
      }
    });
  };

  const handleAccept = (bookingId: string) => {
    startTransition(async () => {
      try {
        await acceptBooking(bookingId);
        toast.success("Ride accepted!");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to accept ride"
        );
      }
    });
  };

  const handleStatusUpdate = (
    bookingId: string,
    newStatus:
      | "driver_en_route"
      | "waiting_at_pickup"
      | "in_progress"
      | "completed"
  ) => {
    startTransition(async () => {
      try {
        await updateTripStatus(bookingId, newStatus);
        toast.success("Status updated");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Failed to update status"
        );
      }
    });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header: Welcome + Online Toggle */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {driver.user.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            {driver.vehicle
              ? `${driver.vehicle.vehicleClass.name} — ${driver.vehicle.plateNumber}`
              : "No vehicle assigned"}
          </p>
        </div>

        {/* Online/Offline Toggle */}
        <div
          className={cn(
            "flex items-center justify-between rounded-xl p-4 transition-colors duration-300",
            isOnline
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-muted/50 border border-border"
          )}
        >
          <div className="flex items-center gap-3">
            <CircleDot
              className={cn(
                "size-5 transition-colors duration-300",
                isOnline ? "text-green-500" : "text-muted-foreground"
              )}
            />
            <div>
              <p className="font-semibold">
                {isOnline ? "Online" : "Offline"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isOnline
                  ? "You are receiving ride requests"
                  : "Toggle to start receiving rides"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            )}
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggle}
              disabled={isPending}
              className={cn(
                "h-7 w-12",
                isOnline &&
                  "data-[state=checked]:bg-green-500"
              )}
            />
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Today&apos;s Summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Navigation className="size-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-xs text-muted-foreground">Trips</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
                <Euro className="size-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  €{todayEarnings.toFixed(0)}
                </p>
                <p className="text-xs text-muted-foreground">Earnings</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <Star className="size-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {averageRating ? averageRating.toFixed(1) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Rating{ratingCount > 0 ? ` (${ratingCount})` : ""}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Clock className="size-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{hoursOnline}h</p>
                <p className="text-xs text-muted-foreground">Hours</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Trips */}
      {activeBookings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Active Trips
          </h2>
          <div className="space-y-3">
            {activeBookings.map((booking) => {
              const next = NEXT_STATUS[booking.status];
              return (
                <Card key={booking.id} className="border-primary/30">
                  <CardContent className="space-y-3 p-4">
                    {/* Status badge + time */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="default"
                        className="bg-primary/10 text-primary"
                      >
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(booking.scheduledAt)}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-green-500" />
                        <p className="text-sm leading-tight">
                          {booking.pickupAddress}
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-red-500" />
                        <p className="text-sm leading-tight">
                          {booking.dropoffAddress}
                        </p>
                      </div>
                    </div>

                    {/* Client info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="size-4" />
                        <span>{booking.passengerCount} pax</span>
                        <span className="text-muted-foreground/50">|</span>
                        <span>{booking.client.name}</span>
                      </div>
                      {booking.client.phone && (
                        <a
                          href={`tel:${booking.client.phone}`}
                          className="flex items-center gap-1 text-primary"
                        >
                          <Phone className="size-4" />
                          <span className="text-xs">Call</span>
                        </a>
                      )}
                    </div>

                    {/* Status progression button */}
                    {next && (
                      <Button
                        onClick={() =>
                          handleStatusUpdate(booking.id, next.status)
                        }
                        disabled={isPending}
                        className="w-full"
                        size="lg"
                      >
                        {isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <>
                            <ArrowRight className="mr-2 size-4" />
                            {next.label}
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming Transfers */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Upcoming Transfers
        </h2>

        {upcomingBookings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <CalendarClock className="mb-3 size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">
                No upcoming transfers
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                {isOnline
                  ? "New ride requests will appear here"
                  : "Go online to receive ride requests"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="space-y-3 p-4">
                  {/* Time + vehicle class */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {formatTime(booking.scheduledAt)}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {booking.vehicleClass.name}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-green-500" />
                      <p className="text-sm leading-tight">
                        {booking.pickupAddress}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-red-500" />
                      <p className="text-sm leading-tight">
                        {booking.dropoffAddress}
                      </p>
                    </div>
                  </div>

                  {/* Details row */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Car className="size-4" />
                      <span>{booking.vehicleClass.name}</span>
                    </div>
                    <span className="text-muted-foreground/50">|</span>
                    <div className="flex items-center gap-1">
                      <Users className="size-4" />
                      <span>{booking.passengerCount} pax</span>
                    </div>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="font-medium text-foreground">
                      {formatFare(
                        booking.estimatedFareMin,
                        booking.estimatedFareMax
                      )}
                    </span>
                  </div>

                  {/* Client */}
                  <p className="text-sm text-muted-foreground">
                    Client: {booking.client.name}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAccept(booking.id)}
                      disabled={isPending}
                      className="flex-1"
                      size="sm"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="mr-1.5 size-4" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
