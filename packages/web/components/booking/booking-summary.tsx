"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Navigation,
  Clock,
  Route,
  Users,
  Luggage,
} from "lucide-react";
import { useBookingStore } from "@/lib/stores/booking-store";

export const BookingSummary = () => {
  const pickupAddress = useBookingStore((s) => s.pickupAddress);
  const dropoffAddress = useBookingStore((s) => s.dropoffAddress);
  const stops = useBookingStore((s) => s.stops);
  const route = useBookingStore((s) => s.route);
  const selectedClassId = useBookingStore((s) => s.selectedClassId);
  const vehicleClasses = useBookingStore((s) => s.vehicleClasses);
  const passengerCount = useBookingStore((s) => s.passengerCount);
  const luggageCount = useBookingStore((s) => s.luggageCount);
  const scheduledAt = useBookingStore((s) => s.scheduledAt);

  const selectedClass = vehicleClasses.find((vc) => vc.id === selectedClassId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Trip Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {pickupAddress && (
          <div className="flex items-start gap-2">
            <MapPin className="size-4 mt-0.5 text-green-600 shrink-0" />
            <div>
              <span className="text-muted-foreground text-xs">Pickup</span>
              <p className="font-medium">{pickupAddress}</p>
            </div>
          </div>
        )}

        {stops.map((stop, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="size-4 mt-0.5 shrink-0 flex items-center justify-center">
              <div className="size-2 rounded-full bg-orange-400" />
            </div>
            <div>
              <span className="text-muted-foreground text-xs">
                Stop {i + 1}
              </span>
              <p className="font-medium">{stop.address}</p>
            </div>
          </div>
        ))}

        {dropoffAddress && (
          <div className="flex items-start gap-2">
            <Navigation className="size-4 mt-0.5 text-red-600 shrink-0" />
            <div>
              <span className="text-muted-foreground text-xs">Dropoff</span>
              <p className="font-medium">{dropoffAddress}</p>
            </div>
          </div>
        )}

        {route && (
          <>
            <div className="border-t pt-3 flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Route className="size-3" />
                <span>{route.distanceKm} km</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="size-3" />
                <span>{route.durationMinutes} min</span>
              </div>
            </div>
          </>
        )}

        {selectedClass && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{selectedClass.name}</span>
                {selectedClass.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {selectedClass.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {selectedClass.fareRange && (
                <div className="text-right">
                  <div className="font-bold">
                    {selectedClass.fareRange.min === selectedClass.fareRange.max
                      ? `€${selectedClass.fareRange.min.toFixed(2)}`
                      : `€${selectedClass.fareRange.min.toFixed(2)} – €${selectedClass.fareRange.max.toFixed(2)}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-3 flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="size-3" />
            <span>{passengerCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Luggage className="size-3" />
            <span>{luggageCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>
              {scheduledAt.toLocaleDateString()}{" "}
              {scheduledAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
