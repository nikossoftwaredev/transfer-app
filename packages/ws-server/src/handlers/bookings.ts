import type { Server } from "socket.io";

interface NewBookingPayload {
  bookingId: string;
  vehicleClassId: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: string;
  passengerCount: number;
  estimatedFareMin: number | null;
  estimatedFareMax: number | null;
  estimatedDistanceKm: number | null;
  vehicleClassName: string;
  clientName: string;
}

interface BookingAcceptedPayload {
  bookingId: string;
  vehicleClassId: string;
  driverId: string;
  driverName: string;
  plate: string;
  vehicleClassName: string;
}

interface BookingRemovedPayload {
  bookingId: string;
  vehicleClassId: string;
}

export function setupBookingEmitter(io: Server) {
  return {
    emitNewBooking(data: NewBookingPayload) {
      io.to(`booking:drivers:${data.vehicleClassId}`).emit("booking:new", {
        bookingId: data.bookingId,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        scheduledAt: data.scheduledAt,
        passengerCount: data.passengerCount,
        estimatedFareMin: data.estimatedFareMin,
        estimatedFareMax: data.estimatedFareMax,
        estimatedDistanceKm: data.estimatedDistanceKm,
        vehicleClassName: data.vehicleClassName,
        clientName: data.clientName,
      });
    },

    emitBookingAccepted(data: BookingAcceptedPayload) {
      io.to(`booking:${data.bookingId}`).emit("booking:accepted", {
        bookingId: data.bookingId,
        driverId: data.driverId,
        driverName: data.driverName,
        plate: data.plate,
        vehicleClassName: data.vehicleClassName,
      });
      io.to(`booking:drivers:${data.vehicleClassId}`).emit("booking:removed", {
        bookingId: data.bookingId,
      });
    },

    emitBookingTimedOut(bookingId: string) {
      io.to(`booking:${bookingId}`).emit("booking:timed_out", { bookingId });
    },

    emitBookingCancelled(data: BookingRemovedPayload) {
      io.to(`booking:drivers:${data.vehicleClassId}`).emit("booking:removed", {
        bookingId: data.bookingId,
      });
      io.to(`booking:${data.bookingId}`).emit("booking:cancelled", {
        bookingId: data.bookingId,
      });
    },
  };
}
