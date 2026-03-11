"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: Date;
  status: string;
  estimatedDistanceKm: number | null;
  actualFare: number | null;
  estimatedFareMin: number | null;
  paymentMethod: string | null;
  vehicleClass: { name: string };
  client: { name: string };
  driver: {
    user: { name: string };
    vehicle: { plateNumber: string } | null;
  } | null;
}

interface OrgBookingsProps {
  bookings: Booking[];
}

const statusVariant = (status: string) => {
  if (status === "completed") return "default" as const;
  if (status === "cancelled" || status === "timed_out")
    return "destructive" as const;
  if (status === "in_progress" || status === "driver_en_route")
    return "default" as const;
  return "secondary" as const;
};

export const OrgBookings = ({ bookings }: OrgBookingsProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">
          All bookings handled by your organization.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Route</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Driver</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Fare</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="whitespace-nowrap text-sm">
                {new Date(b.scheduledAt).toLocaleDateString()}{" "}
                {new Date(b.scheduledAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell>{b.client.name}</TableCell>
              <TableCell className="max-w-xs">
                <div className="text-sm truncate">
                  {b.pickupAddress.split(",")[0]} →{" "}
                  {b.dropoffAddress.split(",")[0]}
                </div>
              </TableCell>
              <TableCell>{b.vehicleClass.name}</TableCell>
              <TableCell>
                {b.driver ? (
                  <span>
                    {b.driver.user.name}
                    {b.driver.vehicle && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({b.driver.vehicle.plateNumber})
                      </span>
                    )}
                  </span>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
              </TableCell>
              <TableCell className="font-medium">
                {b.actualFare
                  ? `€${b.actualFare.toFixed(2)}`
                  : b.estimatedFareMin
                    ? `~€${b.estimatedFareMin.toFixed(2)}`
                    : "—"}
              </TableCell>
            </TableRow>
          ))}
          {bookings.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-muted-foreground py-8"
              >
                No bookings yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
