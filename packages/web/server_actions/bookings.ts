"use server";

import { prisma } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { calculateRoute } from "@/lib/maps/routes";
import { calculateFareRange } from "@/lib/pricing/calculator";
import { sendPush, sendPushToMany } from "@/lib/notifications/push";

const BOOKING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

interface CreateBookingInput {
  vehicleClassId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  stops?: { address: string; lat: number; lng: number }[];
  scheduledAt: string;
  passengerCount?: number;
  luggageCount?: number;
  specialInstructions?: string;
}

/**
 * Get available vehicle classes with pricing for a route.
 */
export async function getAvailableVehicleClasses(input: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  stops?: { lat: number; lng: number }[];
  scheduledAt: string;
}) {
  const route = await calculateRoute({
    origin: { lat: input.pickupLat, lng: input.pickupLng },
    destination: { lat: input.dropoffLat, lng: input.dropoffLng },
    intermediates: input.stops,
  });

  // Get all active vehicle classes that have at least one verified org with pricing
  const vehicleClasses = await prisma.vehicleClass.findMany({
    where: {
      active: true,
      pricingRules: {
        some: {
          org: { status: "verified" },
        },
      },
    },
    include: {
      pricingRules: {
        where: { org: { status: "verified" } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const scheduledDate = new Date(input.scheduledAt);
  const stopsCount = input.stops?.length || 0;

  return {
    route: {
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      polyline: route.polyline,
    },
    vehicleClasses: vehicleClasses.map((vc) => {
      const fareRange = calculateFareRange(
        vc.pricingRules,
        route.distanceKm,
        stopsCount,
        scheduledDate
      );
      return {
        id: vc.id,
        name: vc.name,
        capacity: vc.capacity,
        description: vc.description,
        tags: vc.tags,
        imageUrl: vc.imageUrl,
        fareRange,
      };
    }),
  };
}

/**
 * Create a booking and broadcast to matching drivers.
 */
export async function createBooking(input: CreateBookingInput) {
  const session = await requireSession();
  const clientId = session.user.id;

  // Calculate route
  const route = await calculateRoute({
    origin: { lat: input.pickupLat, lng: input.pickupLng },
    destination: { lat: input.dropoffLat, lng: input.dropoffLng },
    intermediates: input.stops?.map((s) => ({ lat: s.lat, lng: s.lng })),
  });

  const scheduledDate = new Date(input.scheduledAt);
  const stopsCount = input.stops?.length || 0;

  // Get fare range from all verified orgs with pricing for this vehicle class
  const pricingRules = await prisma.pricingRule.findMany({
    where: {
      vehicleClassId: input.vehicleClassId,
      org: { status: "verified" },
    },
  });

  const fareRange = calculateFareRange(
    pricingRules,
    route.distanceKm,
    stopsCount,
    scheduledDate
  );

  // Create booking
  const booking = await prisma.booking.create({
    data: {
      clientId,
      vehicleClassId: input.vehicleClassId,
      pickupAddress: input.pickupAddress,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      dropoffAddress: input.dropoffAddress,
      dropoffLat: input.dropoffLat,
      dropoffLng: input.dropoffLng,
      stops: input.stops || undefined,
      scheduledAt: scheduledDate,
      passengerCount: input.passengerCount || 1,
      luggageCount: input.luggageCount || 0,
      specialInstructions: input.specialInstructions || null,
      status: "pending",
      timeoutAt: new Date(Date.now() + BOOKING_TIMEOUT_MS),
      estimatedDistanceKm: route.distanceKm,
      estimatedFareMin: fareRange?.min || null,
      estimatedFareMax: fareRange?.max || null,
    },
  });

  // Broadcast to matching drivers
  await broadcastToDrivers(booking.id, input.vehicleClassId, route.distanceKm);

  revalidatePath("/book");
  return booking;
}

/**
 * Find and notify all eligible drivers for a booking.
 */
async function broadcastToDrivers(
  bookingId: string,
  vehicleClassId: string,
  distanceKm: number
) {
  // Find all online drivers with vehicles of the requested class, from verified orgs
  const drivers = await prisma.driver.findMany({
    where: {
      availability: "online",
      inviteStatus: "accepted",
      vehicle: {
        vehicleClassId,
        status: "available",
      },
      user: {
        org: {
          status: "verified",
          pricingRules: {
            some: { vehicleClassId },
          },
        },
      },
    },
    include: {
      user: { select: { id: true, name: true, orgId: true } },
    },
  });

  if (drivers.length === 0) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      pickupAddress: true,
      dropoffAddress: true,
      scheduledAt: true,
      estimatedDistanceKm: true,
    },
  });

  if (!booking) return;

  const userIds = drivers.map((d) => d.user.id);

  await sendPushToMany(userIds, {
    title: "New Ride Request",
    body: `${booking.pickupAddress} → ${booking.dropoffAddress} (${distanceKm}km)`,
    data: { type: "new_booking", bookingId },
  });
}

/**
 * Driver accepts a booking (race-condition safe via atomic WHERE status='pending').
 */
export async function acceptBooking(bookingId: string) {
  const session = await requireRole("driver");
  const driverId = session.user.driverId;
  if (!driverId) throw new Error("Not a driver");

  // Get driver with vehicle and org info
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      user: { select: { orgId: true } },
      vehicle: { select: { id: true } },
    },
  });

  if (!driver?.vehicle) throw new Error("No vehicle assigned");
  if (!driver.user.orgId) throw new Error("No organization");

  // Atomic update: only succeeds if booking is still pending
  const updated = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: "pending",
    },
    data: {
      driverId,
      orgId: driver.user.orgId,
      vehicleId: driver.vehicle.id,
      status: "driver_assigned",
    },
  });

  if (updated.count === 0) {
    throw new Error("Ride no longer available");
  }

  // Get full booking for notifications
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: { select: { id: true, name: true } },
      driver: {
        include: {
          user: { select: { name: true, image: true } },
          vehicle: {
            select: {
              plateNumber: true,
              vehicleClass: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (booking) {
    // Notify client
    await sendPush({
      userId: booking.clientId,
      title: "Driver Assigned!",
      body: `${booking.driver?.user.name} is on the way in a ${booking.driver?.vehicle?.vehicleClass.name} (${booking.driver?.vehicle?.plateNumber})`,
      data: { type: "driver_assigned", bookingId },
    });
  }

  revalidatePath("/driver/trips");
  revalidatePath("/book");
  return { success: true };
}

/**
 * Get booking details by ID.
 */
export async function getBooking(bookingId: string) {
  const session = await requireSession();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      vehicleClass: true,
      driver: {
        include: {
          user: { select: { name: true, image: true, phone: true } },
          vehicle: {
            select: {
              plateNumber: true,
              year: true,
              vehicleClass: { select: { name: true } },
            },
          },
        },
      },
      org: { select: { name: true } },
      trip: true,
      rating: true,
    },
  });

  if (!booking) throw new Error("Booking not found");

  // Ensure the user can view this booking
  const isClient = booking.clientId === session.user.id;
  const isDriver = booking.driverId === session.user.driverId;
  const isOrgAdmin =
    session.user.role === "orgadmin" && booking.orgId === session.user.orgId;
  const isSuperAdmin = session.user.role === "superadmin";

  if (!isClient && !isDriver && !isOrgAdmin && !isSuperAdmin) {
    throw new Error("Forbidden");
  }

  return booking;
}

/**
 * Get client's bookings.
 */
export async function getMyBookings() {
  const session = await requireSession();
  return prisma.booking.findMany({
    where: { clientId: session.user.id },
    include: {
      vehicleClass: true,
      driver: {
        include: {
          user: { select: { name: true, image: true } },
          vehicle: { select: { plateNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Process timed-out bookings.
 * Called by cron job or API route.
 */
export async function processTimedOutBookings() {
  const timedOut = await prisma.booking.updateMany({
    where: {
      status: "pending",
      timeoutAt: { lt: new Date() },
    },
    data: {
      status: "timed_out",
    },
  });

  if (timedOut.count > 0) {
    // Get timed out bookings for notifications
    const bookings = await prisma.booking.findMany({
      where: {
        status: "timed_out",
        updatedAt: { gte: new Date(Date.now() - 60000) }, // last minute
      },
      select: { clientId: true, id: true },
    });

    for (const booking of bookings) {
      await sendPush({
        userId: booking.clientId,
        title: "No Driver Available",
        body: "Unfortunately no driver was available. Please try again.",
        data: { type: "booking_timeout", bookingId: booking.id },
      });
    }
  }

  return timedOut.count;
}

/**
 * Cancel a booking (client only, if still pending).
 */
export async function cancelBooking(bookingId: string) {
  const session = await requireSession();

  const updated = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      clientId: session.user.id,
      status: { in: ["pending", "driver_assigned"] },
    },
    data: { status: "cancelled" },
  });

  if (updated.count === 0) {
    throw new Error("Cannot cancel this booking");
  }

  revalidatePath("/book");
  return { success: true };
}
