"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Star, Loader2 } from "lucide-react";
import { createRating } from "@/server_actions/ratings";
import { toast } from "sonner";

interface Booking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: Date;
  status: string;
  estimatedDistanceKm: number | null;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  actualFare: number | null;
  paymentMethod: string | null;
  vehicleClass: { name: string };
  driver: {
    user: { name: string; image: string | null };
    vehicle: { plateNumber: string } | null;
  } | null;
  rating?: { stars: number; comment: string | null } | null;
}

interface TripHistoryProps {
  bookings: Booking[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  driver_assigned: "Driver Assigned",
  driver_en_route: "Driver En Route",
  waiting_at_pickup: "Waiting",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  timed_out: "Timed Out",
};

export const TripHistory = ({ bookings }: TripHistoryProps) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">My Trips</h1>
        <p className="text-muted-foreground">
          Your booking history and trip details.
        </p>
      </div>

      {bookings.map((booking) => (
        <TripCard key={booking.id} booking={booking} />
      ))}

      {bookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            No trips yet. Book your first ride!
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function TripCard({ booking }: { booking: Booking }) {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  const handleRate = (stars: number) => {
    setRating(stars);
    startTransition(async () => {
      try {
        await createRating({ bookingId: booking.id, stars });
        toast.success("Thank you for your rating!");
        setShowRating(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to submit rating"
        );
      }
    });
  };

  const canRate =
    booking.status === "completed" && !booking.rating && booking.driver;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant={
              booking.status === "completed"
                ? "default"
                : booking.status === "cancelled" ||
                    booking.status === "timed_out"
                  ? "destructive"
                  : "secondary"
            }
          >
            {STATUS_LABELS[booking.status] || booking.status}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(booking.scheduledAt).toLocaleDateString()}{" "}
            {new Date(booking.scheduledAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="size-3 text-green-600" />
            <span>{booking.pickupAddress}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Navigation className="size-3 text-red-600" />
            <span>{booking.dropoffAddress}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{booking.vehicleClass.name}</span>
            {booking.estimatedDistanceKm && (
              <span>{booking.estimatedDistanceKm}km</span>
            )}
          </div>
          {booking.actualFare ? (
            <span className="font-bold">€{booking.actualFare.toFixed(2)}</span>
          ) : booking.estimatedFareMin ? (
            <span className="text-muted-foreground">
              €{booking.estimatedFareMin.toFixed(2)} –{" "}
              €{booking.estimatedFareMax?.toFixed(2)}
            </span>
          ) : null}
        </div>

        {booking.driver && (
          <div className="border-t pt-2 flex items-center justify-between text-sm">
            <span>
              {booking.driver.user.name}
              {booking.driver.vehicle && ` — ${booking.driver.vehicle.plateNumber}`}
            </span>
            {booking.paymentMethod && (
              <Badge variant="outline">{booking.paymentMethod}</Badge>
            )}
          </div>
        )}

        {/* Rating display */}
        {booking.rating && (
          <div className="border-t pt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`size-4 ${
                  s <= booking.rating!.stars
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
            {booking.rating.comment && (
              <span className="text-sm text-muted-foreground ml-2">
                {booking.rating.comment}
              </span>
            )}
          </div>
        )}

        {/* Rate prompt */}
        {canRate && !showRating && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRating(true)}
            className="w-full"
          >
            <Star className="size-4" />
            Rate this trip
          </Button>
        )}

        {canRate && showRating && (
          <div className="border-t pt-2 flex items-center justify-center gap-2">
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              [1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => handleRate(s)}
                  className="p-1 hover:scale-110 transition-transform duration-300"
                >
                  <Star
                    className={`size-6 ${
                      s <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
