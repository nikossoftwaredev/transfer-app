"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Clock,
  Check,
  Loader2,
  Phone,
  CreditCard,
  Banknote,
  Star,
  ArrowLeft,
  ChevronDown,
  TrendingUp,
  Moon,
} from "lucide-react";
import { acceptBooking } from "@/server_actions/bookings";
import { updateTripStatus, confirmPayment } from "@/server_actions/trips";
import { toast } from "sonner";

interface Booking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  stops: unknown;
  scheduledAt: Date;
  status: string;
  estimatedDistanceKm: number | null;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  actualFare: number | null;
  acceptedFare: number | null;
  actualDistanceKm: number | null;
  passengerCount: number;
  luggageCount: number;
  paymentMethod: string | null;
  vehicleClass: { name: string };
  client: { name: string; phone?: string | null };
  trip?: {
    startedAt: Date;
    endedAt: Date | null;
    waitingStartedAt: Date | null;
    waitingEndedAt: Date | null;
    waitingMinutes: number | null;
    paymentConfirmed: boolean;
  } | null;
  rating?: { stars: number } | null;
}

interface CompletedDateGroup {
  dateKey: string; // YYYY-MM-DD
  trips: Booking[];
}

interface DriverTripsProps {
  availableRides: Booking[];
  myTrips: Booking[];
  completedByDate: CompletedDateGroup[];
  weeklyTotals: {
    tripCount: number;
    earnings: number;
    avgRating: number;
  };
}

const STATUS_LABELS: Record<string, string> = {
  driver_assigned: "Assigned",
  driver_en_route: "En Route",
  waiting_at_pickup: "Waiting",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  driver_assigned: "secondary",
  driver_en_route: "default",
  waiting_at_pickup: "outline",
  in_progress: "default",
  completed: "secondary",
};

function formatDateHeader(dateKey: string): string {
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  const date = new Date(dateKey + "T12:00:00"); // noon to avoid timezone issues

  if (dateKey === todayKey) {
    return `TODAY - ${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
  }
  if (dateKey === yesterdayKey) {
    return `YESTERDAY - ${date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
  }
  return date
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();
}

function shortenAddress(address: string): string {
  // Take first part before the first comma
  const parts = address.split(",");
  const first = parts[0].trim();
  return first.length > 25 ? first.slice(0, 22) + "..." : first;
}

function isNightTrip(scheduledAt: Date): boolean {
  const hour = new Date(scheduledAt).getHours();
  return hour >= 22 || hour < 6;
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3 ${
            i < stars
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

export const DriverTrips = ({
  availableRides,
  myTrips,
  completedByDate,
  weeklyTotals,
}: DriverTripsProps) => {
  const [isPending, startTransition] = useTransition();

  const handleAccept = (bookingId: string) => {
    startTransition(async () => {
      try {
        await acceptBooking(bookingId);
        toast.success("Ride accepted!");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to accept ride"
        );
      }
    });
  };

  const handleStatusUpdate = (
    bookingId: string,
    status:
      | "driver_en_route"
      | "waiting_at_pickup"
      | "in_progress"
      | "completed"
  ) => {
    startTransition(async () => {
      try {
        await updateTripStatus(bookingId, status);
        toast.success("Status updated");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update status"
        );
      }
    });
  };

  const handlePayment = (bookingId: string, method: "cash" | "pos") => {
    startTransition(async () => {
      try {
        await confirmPayment(bookingId, method);
        toast.success("Payment confirmed");
      } catch {
        toast.error("Failed to confirm payment");
      }
    });
  };

  const getNextAction = (booking: Booking) => {
    switch (booking.status) {
      case "driver_assigned":
        return {
          label: "Start Trip",
          action: () => handleStatusUpdate(booking.id, "driver_en_route"),
        };
      case "driver_en_route":
        return {
          label: "Arrived at Pickup",
          action: () =>
            handleStatusUpdate(booking.id, "waiting_at_pickup"),
        };
      case "waiting_at_pickup":
        return {
          label: "Passenger Picked Up",
          action: () => handleStatusUpdate(booking.id, "in_progress"),
        };
      case "in_progress":
        return {
          label: "Complete Trip",
          action: () => handleStatusUpdate(booking.id, "completed"),
        };
      default:
        return null;
    }
  };

  const activeTrips = myTrips.filter((t) => t.status !== "completed");

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-2xl font-bold">My Trips</h1>
        </div>
        <div className="flex items-center gap-2 pl-11">
          <Badge variant="outline" className="gap-1 text-xs">
            This Week
            <ChevronDown className="size-3" />
          </Badge>
        </div>
      </div>

      {/* Available rides */}
      {availableRides.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Available Rides</h2>
          {availableRides.map((ride) => (
            <Card key={ride.id} className="border-primary/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-3 text-green-600" />
                      <span>{ride.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="size-3 text-red-600" />
                      <span>{ride.dropoffAddress}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span>{ride.vehicleClass.name}</span>
                      <span>{ride.estimatedDistanceKm}km</span>
                      <span>{ride.passengerCount} pax</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAccept(ride.id)}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="size-4" />
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

      {/* Active trips */}
      {activeTrips.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Active Trips</h2>
          {activeTrips.map((trip) => {
            const nextAction = getNextAction(trip);
            return (
              <Card key={trip.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={STATUS_COLORS[trip.status]}>
                      {STATUS_LABELS[trip.status] || trip.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(trip.scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="size-3 text-green-600" />
                      <span>{trip.pickupAddress}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Navigation className="size-3 text-red-600" />
                      <span>{trip.dropoffAddress}</span>
                    </div>
                  </div>

                  {trip.client.phone && (
                    <a
                      href={`tel:${trip.client.phone}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Phone className="size-3" />
                      Call {trip.client.name}
                    </a>
                  )}

                  {/* Waiting timer */}
                  {trip.status === "waiting_at_pickup" &&
                    trip.trip?.waitingStartedAt && (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <Clock className="size-3" />
                        <span>
                          Waiting since{" "}
                          {new Date(
                            trip.trip.waitingStartedAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                  {/* Navigate button */}
                  {(trip.status === "driver_en_route" ||
                    trip.status === "in_progress") && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        trip.status === "driver_en_route"
                          ? trip.pickupAddress
                          : trip.dropoffAddress
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Navigation className="size-3" />
                      Navigate
                    </a>
                  )}

                  {nextAction && (
                    <Button
                      onClick={nextAction.action}
                      disabled={isPending}
                      className="w-full"
                    >
                      {isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        nextAction.label
                      )}
                    </Button>
                  )}

                  {/* Payment confirmation for completed trips */}
                  {trip.status === "completed" &&
                    !trip.trip?.paymentConfirmed && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePayment(trip.id, "cash")}
                          disabled={isPending}
                        >
                          <Banknote className="size-4" />
                          Cash
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePayment(trip.id, "pos")}
                          disabled={isPending}
                        >
                          <CreditCard className="size-4" />
                          POS
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed trips grouped by date */}
      {completedByDate.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Trip History
          </h2>

          {completedByDate.map(({ dateKey, trips }) => (
            <div key={dateKey} className="space-y-2">
              {/* Date header */}
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  {formatDateHeader(dateKey)}
                </h3>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Trip cards for this date */}
              {trips.map((trip) => {
                const fare = trip.actualFare ?? trip.acceptedFare ?? 0;
                const distance =
                  trip.actualDistanceKm ?? trip.estimatedDistanceKm;
                const night = isNightTrip(trip.scheduledAt);

                return (
                  <Card
                    key={trip.id}
                    className="transition-colors duration-300 hover:bg-muted/50"
                  >
                    <CardContent className="p-3">
                      {/* Top row: time + route */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold tabular-nums min-w-13">
                          {new Date(trip.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
                          <span className="truncate">
                            {shortenAddress(trip.pickupAddress)}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            →
                          </span>
                          <span className="truncate">
                            {shortenAddress(trip.dropoffAddress)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom row: fare, rating, distance */}
                      <div className="flex items-center gap-3 mt-1.5 pl-13">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          EUR {fare.toFixed(0)}
                        </span>
                        {night && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 gap-0.5 text-orange-600 border-orange-300"
                          >
                            <Moon className="size-2.5" />
                            night
                          </Badge>
                        )}
                        <div className="h-3 w-px bg-border" />
                        {trip.rating ? (
                          <StarRating stars={trip.rating.stars} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No rating
                          </span>
                        )}
                        {distance != null && (
                          <>
                            <div className="h-3 w-px bg-border" />
                            <span className="text-xs text-muted-foreground">
                              {distance.toFixed(0)} km
                            </span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Weekly totals summary bar */}
      {weeklyTotals.tripCount > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider">
                Weekly Total
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-2xl font-bold">
                  {weeklyTotals.tripCount}
                </div>
                <div className="text-xs text-muted-foreground">trips</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  EUR {weeklyTotals.earnings.toFixed(0)}
                </div>
                <div className="text-xs text-muted-foreground">earnings</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1">
                  <Star className="size-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-2xl font-bold">
                    {weeklyTotals.avgRating > 0
                      ? weeklyTotals.avgRating.toFixed(1)
                      : "-"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">avg rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {availableRides.length === 0 &&
        myTrips.length === 0 &&
        completedByDate.length === 0 && (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              No trips yet. Go online to start receiving ride requests.
            </CardContent>
          </Card>
        )}
    </div>
  );
};
