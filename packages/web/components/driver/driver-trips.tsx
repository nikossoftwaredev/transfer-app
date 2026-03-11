"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

interface DriverTripsProps {
  availableRides: Booking[];
  myTrips: Booking[];
}

const STATUS_LABELS: Record<string, string> = {
  driver_assigned: "Assigned",
  driver_en_route: "En Route",
  waiting_at_pickup: "Waiting",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  driver_assigned: "secondary",
  driver_en_route: "default",
  waiting_at_pickup: "outline",
  in_progress: "default",
  completed: "secondary",
};

export const DriverTrips = ({
  availableRides,
  myTrips,
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
    status: "driver_en_route" | "waiting_at_pickup" | "in_progress" | "completed"
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
          action: () => handleStatusUpdate(booking.id, "waiting_at_pickup"),
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

  const activeTrips = myTrips.filter(
    (t) => t.status !== "completed"
  );
  const completedTrips = myTrips.filter(
    (t) => t.status === "completed"
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trips</h1>

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
                        <span>Waiting since {new Date(trip.trip.waitingStartedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
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

      {/* Completed trips */}
      {completedTrips.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-muted-foreground">
            Completed ({completedTrips.length})
          </h2>
          {completedTrips.slice(0, 10).map((trip) => (
            <Card key={trip.id} className="opacity-70">
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">
                      {trip.pickupAddress.split(",")[0]}
                    </span>
                    <span className="text-muted-foreground"> → </span>
                    <span className="font-medium">
                      {trip.dropoffAddress.split(",")[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {trip.paymentMethod && (
                      <Badge variant="outline">{trip.paymentMethod}</Badge>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(trip.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {availableRides.length === 0 && myTrips.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No trips yet. Go online to start receiving ride requests.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
