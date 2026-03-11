"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Car, Building2, Phone } from "lucide-react";

interface DriverProfileProps {
  driver: {
    id: string;
    licenseNo: string;
    availability: string;
    inviteStatus: string;
    user: {
      name: string;
      phone: string | null;
      image: string | null;
      org: { name: string } | null;
    };
    vehicle: {
      plateNumber: string;
      year: number | null;
      vehicleClass: { name: string };
    } | null;
  };
}

export const DriverProfile = ({ driver }: DriverProfileProps) => {
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Personal Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{driver.user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{driver.user.phone || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">License</span>
            <span className="font-medium">{driver.licenseNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={driver.availability === "online" ? "default" : "secondary"}>
              {driver.availability}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {driver.user.org && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" />
              Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="font-medium">{driver.user.org.name}</span>
          </CardContent>
        </Card>
      )}

      {driver.vehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="size-5" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class</span>
              <span className="font-medium">
                {driver.vehicle.vehicleClass.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plate</span>
              <span className="font-medium">{driver.vehicle.plateNumber}</span>
            </div>
            {driver.vehicle.year && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{driver.vehicle.year}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
