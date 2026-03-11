"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Check } from "lucide-react";
import { cn } from "@/lib/general/utils";
import { useBookingStore } from "@/lib/stores/booking-store";

export const VehicleSelector = () => {
  const vehicleClasses = useBookingStore((s) => s.vehicleClasses);
  const selectedClassId = useBookingStore((s) => s.selectedClassId);
  const setSelectedClass = useBookingStore((s) => s.setSelectedClass);

  if (vehicleClasses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No vehicle classes available for this route.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Select Vehicle
      </h3>
      <div className="grid gap-3">
        {vehicleClasses.map((vc) => (
          <Card
            key={vc.id}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-md",
              selectedClassId === vc.id
                ? "ring-2 ring-primary border-primary"
                : "hover:border-primary/50"
            )}
            onClick={() => setSelectedClass(vc.id)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{vc.name}</span>
                  {selectedClassId === vc.id && (
                    <Check className="size-4 text-primary" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <Users className="size-3" />
                  <span>Up to {vc.capacity} passengers</span>
                </div>
                {vc.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {vc.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right">
                {vc.fareRange ? (
                  <div>
                    <div className="text-lg font-bold">
                      {vc.fareRange.min === vc.fareRange.max
                        ? `€${vc.fareRange.min.toFixed(2)}`
                        : `€${vc.fareRange.min.toFixed(2)} – €${vc.fareRange.max.toFixed(2)}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      estimated fare
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Price unavailable
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
