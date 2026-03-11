"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { useBookingStore } from "@/lib/stores/booking-store";
import { cancelBooking, getBooking } from "@/server_actions/bookings";
import { toast } from "sonner";

export const FindingDriver = () => {
  const bookingId = useBookingStore((s) => s.bookingId);
  const reset = useBookingStore((s) => s.reset);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [status, setStatus] = useState<string>("pending");
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    plate: string;
    vehicleClass: string;
  } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (status !== "pending") return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setStatus("timed_out");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Poll for booking status changes
  useEffect(() => {
    if (!bookingId || status !== "pending") return;

    const pollInterval = setInterval(async () => {
      try {
        const booking = await getBooking(bookingId);
        if (booking.status === "driver_assigned") {
          setStatus("driver_assigned");
          setDriverInfo({
            name: booking.driver?.user.name || "Driver",
            plate: booking.driver?.vehicle?.plateNumber || "",
            vehicleClass:
              booking.driver?.vehicle?.vehicleClass.name || "",
          });
        } else if (
          booking.status === "timed_out" ||
          booking.status === "cancelled"
        ) {
          setStatus(booking.status);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [bookingId, status]);

  const handleCancel = async () => {
    if (!bookingId) return;
    try {
      await cancelBooking(bookingId);
      toast.success("Booking cancelled");
      reset();
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (status === "driver_assigned" && driverInfo) {
    return (
      <Card>
        <CardContent className="text-center py-12 space-y-4">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold">Driver Found!</h2>
          <div className="space-y-2 text-lg">
            <p className="font-semibold">{driverInfo.name}</p>
            <p className="text-muted-foreground">
              {driverInfo.vehicleClass} — {driverInfo.plate}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Your driver is on the way.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === "timed_out") {
    return (
      <Card>
        <CardContent className="text-center py-12 space-y-4">
          <div className="size-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
            <span className="text-3xl">⏱</span>
          </div>
          <h2 className="text-2xl font-bold">No Driver Available</h2>
          <p className="text-muted-foreground">
            Unfortunately no driver was available for your ride. Please try
            again.
          </p>
          <Button onClick={reset} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="text-center py-12 space-y-6">
        <Loader2 className="size-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-bold">Finding your driver...</h2>
        <p className="text-muted-foreground">
          We&apos;re looking for the nearest available driver.
        </p>
        <div className="text-4xl font-mono font-bold tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </div>
        <Button variant="outline" onClick={handleCancel}>
          <X className="size-4" />
          Cancel Booking
        </Button>
      </CardContent>
    </Card>
  );
};
