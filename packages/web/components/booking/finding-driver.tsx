"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Car, Check } from "lucide-react";
import { useBookingStore } from "@/lib/stores/booking-store";
import { cancelBooking, getBooking } from "@/server_actions/bookings";
import { useSocket } from "@/hooks/use-socket";
import { toast } from "sonner";

export const FindingDriver = () => {
  const bookingId = useBookingStore((s) => s.bookingId);
  const reset = useBookingStore((s) => s.reset);
  const setDriverId = useBookingStore((s) => s.setDriverId);
  const [timeLeft, setTimeLeft] = useState(300);
  const [status, setStatus] = useState<string>("pending");
  const [driverInfo, setDriverInfo] = useState<{
    name: string;
    plate: string;
    vehicleClass: string;
  } | null>(null);

  const socketRef = useSocket();

  // Subscribe to booking room via WebSocket
  useEffect(() => {
    if (!bookingId || status !== "pending") return;
    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("subscribe:booking", bookingId);

    const handleAccepted = (data: {
      bookingId: string;
      driverId: string;
      driverName: string;
      plate: string;
      vehicleClassName: string;
    }) => {
      if (data.bookingId === bookingId) {
        setStatus("driver_assigned");
        setDriverId(data.driverId);
        setDriverInfo({
          name: data.driverName,
          plate: data.plate,
          vehicleClass: data.vehicleClassName,
        });
        // Subscribe to driver's GPS for live tracking on map
        socket.emit("subscribe:trip", data.driverId);
      }
    };

    const handleTimedOut = (data: { bookingId: string }) => {
      if (data.bookingId === bookingId) {
        setStatus("timed_out");
      }
    };

    const handleCancelled = (data: { bookingId: string }) => {
      if (data.bookingId === bookingId) {
        setStatus("cancelled");
        toast.info("Booking was cancelled");
        reset();
      }
    };

    socket.on("booking:accepted", handleAccepted);
    socket.on("booking:timed_out", handleTimedOut);
    socket.on("booking:cancelled", handleCancelled);

    return () => {
      socket.off("booking:accepted", handleAccepted);
      socket.off("booking:timed_out", handleTimedOut);
      socket.off("booking:cancelled", handleCancelled);
    };
  }, [bookingId, status, socketRef, reset, setDriverId]);

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

  // Fallback polling (reduced frequency — WebSocket is primary)
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
    }, 10000);

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
      <div className="text-center py-16 space-y-6">
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          <div className="relative size-24 rounded-full bg-emerald-400/10 border-2 border-emerald-400 flex items-center justify-center">
            <Check className="size-10 text-emerald-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Driver found</h2>
          <p className="text-white/40 mt-1">Your transfer is confirmed</p>
        </div>
        <div className="rounded-2xl bg-white/6 border border-white/10 p-5 max-w-xs mx-auto space-y-2">
          <p className="text-lg font-semibold text-white">{driverInfo.name}</p>
          <p className="text-sm text-white/50">
            {driverInfo.vehicleClass} &middot; {driverInfo.plate}
          </p>
        </div>
        <p className="text-sm text-white/30">
          Your driver is on the way
        </p>
      </div>
    );
  }

  if (status === "timed_out") {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="size-20 rounded-full bg-amber-400/10 border-2 border-amber-400/30 flex items-center justify-center mx-auto">
          <span className="text-4xl">&#9203;</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">No driver available</h2>
          <p className="text-white/40 mt-2 max-w-xs mx-auto">
            No driver was available for your ride. Please try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="px-8 h-12 rounded-2xl bg-white text-[#0a0a0f] font-semibold hover:bg-amber-400 transition-colors duration-300"
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-16 space-y-8">
      {/* Radar pulse animation */}
      <div className="relative mx-auto w-32 h-32">
        <div className="absolute inset-0 rounded-full bg-amber-400/10 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-3 rounded-full bg-amber-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "0.5s" }} />
        <div className="absolute inset-6 rounded-full bg-amber-400/10 animate-ping" style={{ animationDuration: "2s", animationDelay: "1s" }} />
        <div className="relative size-32 flex items-center justify-center">
          <div className="size-14 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center">
            <Car className="size-7 text-amber-400" />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white">
          Matching nearby drivers...
        </h2>
        <p className="text-white/40 mt-2">
          Looking for the nearest available driver
        </p>
      </div>

      {/* Countdown */}
      <div className="text-5xl font-bold text-white/90 tabular-nums tracking-wider">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>

      {/* Cancel */}
      <button
        onClick={handleCancel}
        className="inline-flex items-center gap-2 px-6 h-11 rounded-2xl border border-white/15 text-sm text-white/50 hover:text-white/80 hover:border-white/30 transition-all duration-300"
      >
        <X className="size-4" />
        Cancel
      </button>
    </div>
  );
};
