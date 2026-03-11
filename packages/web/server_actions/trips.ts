"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { sendPush } from "@/lib/notifications/push";

/**
 * Get pending bookings available for a driver to accept.
 */
export async function getAvailableRides() {
  const session = await requireRole("driver");
  const driverId = session.user.driverId;
  if (!driverId) throw new Error("Not a driver");

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      vehicle: { select: { vehicleClassId: true } },
    },
  });

  if (!driver?.vehicle) return [];

  return prisma.booking.findMany({
    where: {
      status: "pending",
      vehicleClassId: driver.vehicle.vehicleClassId,
      timeoutAt: { gt: new Date() },
    },
    include: {
      vehicleClass: { select: { name: true } },
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get driver's accepted/active trips.
 */
export async function getDriverTrips() {
  const session = await requireRole("driver");
  const driverId = session.user.driverId;
  if (!driverId) throw new Error("Not a driver");

  return prisma.booking.findMany({
    where: {
      driverId,
      status: {
        in: [
          "driver_assigned",
          "driver_en_route",
          "waiting_at_pickup",
          "in_progress",
          "completed",
        ],
      },
    },
    include: {
      vehicleClass: { select: { name: true } },
      client: { select: { name: true, phone: true } },
      trip: true,
    },
    orderBy: { scheduledAt: "desc" },
    take: 50,
  });
}

/**
 * Update booking status through the trip lifecycle.
 */
export async function updateTripStatus(
  bookingId: string,
  newStatus:
    | "driver_en_route"
    | "waiting_at_pickup"
    | "in_progress"
    | "completed"
) {
  const session = await requireRole("driver");
  const driverId = session.user.driverId;
  if (!driverId) throw new Error("Not a driver");

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    driver_assigned: ["driver_en_route"],
    driver_en_route: ["waiting_at_pickup"],
    waiting_at_pickup: ["in_progress"],
    in_progress: ["completed"],
  };

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, driverId },
    select: { status: true, clientId: true },
  });

  if (!booking) throw new Error("Booking not found");

  const allowed = validTransitions[booking.status];
  if (!allowed?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${booking.status} to ${newStatus}`);
  }

  // Handle trip record creation/updates based on status
  if (newStatus === "driver_en_route") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      }),
      prisma.trip.upsert({
        where: { bookingId },
        create: {
          bookingId,
          driverId,
          startedAt: new Date(),
        },
        update: {},
      }),
    ]);

    await sendPush({
      userId: booking.clientId,
      title: "Driver En Route",
      body: "Your driver is on the way to pick you up.",
      data: { type: "driver_en_route", bookingId },
    });
  } else if (newStatus === "waiting_at_pickup") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      }),
      prisma.trip.update({
        where: { bookingId },
        data: { waitingStartedAt: new Date() },
      }),
    ]);

    await sendPush({
      userId: booking.clientId,
      title: "Driver Arrived",
      body: "Your driver has arrived at the pickup location.",
      data: { type: "waiting_at_pickup", bookingId },
    });
  } else if (newStatus === "in_progress") {
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      }),
      prisma.trip.update({
        where: { bookingId },
        data: { waitingEndedAt: new Date() },
      }),
    ]);
  } else if (newStatus === "completed") {
    // Calculate waiting minutes
    const trip = await prisma.trip.findUnique({
      where: { bookingId },
    });

    let waitingMinutes = 0;
    if (trip?.waitingStartedAt && trip?.waitingEndedAt) {
      waitingMinutes = Math.ceil(
        (trip.waitingEndedAt.getTime() - trip.waitingStartedAt.getTime()) /
          60000
      );
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: newStatus },
      }),
      prisma.trip.update({
        where: { bookingId },
        data: {
          endedAt: new Date(),
          waitingMinutes,
        },
      }),
    ]);

    await sendPush({
      userId: booking.clientId,
      title: "Trip Completed",
      body: "Your trip has been completed. Thank you for riding with us!",
      data: { type: "completed", bookingId },
    });
  }

  revalidatePath("/driver/trips");
  return { success: true };
}

/**
 * Confirm payment method for a completed trip.
 */
export async function confirmPayment(
  bookingId: string,
  method: "cash" | "pos"
) {
  const session = await requireRole("driver");
  const driverId = session.user.driverId;
  if (!driverId) throw new Error("Not a driver");

  await prisma.booking.update({
    where: { id: bookingId, driverId },
    data: {
      paymentMethod: method,
    },
  });

  // Update trip paymentConfirmed
  await prisma.trip.update({
    where: { bookingId },
    data: { paymentConfirmed: true },
  });

  revalidatePath("/driver/trips");
  return { success: true };
}

/**
 * Toggle driver availability.
 */
export async function toggleAvailability(online: boolean) {
  const session = await requireRole("driver");
  const driverId = session.user.driverId;
  if (!driverId) throw new Error("Not a driver");

  await prisma.driver.update({
    where: { id: driverId },
    data: { availability: online ? "online" : "offline" },
  });

  revalidatePath("/driver");
  return { success: true };
}
