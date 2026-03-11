"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Car, CheckCircle, Loader2 } from "lucide-react";
import { toggleAvailability } from "@/server_actions/trips";
import { toast } from "sonner";

interface DriverDashboardProps {
  driver: {
    id: string;
    availability: string;
    user: { name: string; phone: string | null; image: string | null };
    vehicle: {
      plateNumber: string;
      vehicleClass: { name: string };
    } | null;
  };
  activeTrips: number;
  completedToday: number;
}

export const DriverDashboard = ({
  driver,
  activeTrips,
  completedToday,
}: DriverDashboardProps) => {
  const [isPending, startTransition] = useTransition();
  const isOnline = driver.availability === "online";

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleAvailability(!isOnline);
        toast.success(isOnline ? "You are now offline" : "You are now online");
      } catch {
        toast.error("Failed to update availability");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {driver.user.name}</h1>
          <p className="text-muted-foreground">
            {driver.vehicle
              ? `${driver.vehicle.vehicleClass.name} — ${driver.vehicle.plateNumber}`
              : "No vehicle assigned"}
          </p>
        </div>
        <Button
          onClick={handleToggle}
          disabled={isPending}
          variant={isOnline ? "destructive" : "default"}
          size="lg"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isOnline ? (
            "Go Offline"
          ) : (
            "Go Online"
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isOnline ? "default" : "secondary"}>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Active Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <span className="text-3xl font-bold">{activeTrips}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              <span className="text-3xl font-bold">{completedToday}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Car className="size-5 text-muted-foreground" />
              <span className="font-medium">
                {driver.vehicle?.plateNumber || "None"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
