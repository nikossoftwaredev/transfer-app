"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

/**
 * Create a rating for a completed booking.
 */
export async function createRating(input: {
  bookingId: string;
  stars: number;
  comment?: string;
}) {
  const session = await requireSession();
  const clientId = session.user.id;

  // Verify booking belongs to this client and is completed
  const booking = await prisma.booking.findFirst({
    where: {
      id: input.bookingId,
      clientId,
      status: "completed",
    },
    select: { driverId: true },
  });

  if (!booking || !booking.driverId) {
    throw new Error("Booking not found or not eligible for rating");
  }

  // Check if already rated
  const existing = await prisma.rating.findUnique({
    where: { bookingId: input.bookingId },
  });
  if (existing) throw new Error("Already rated");

  const rating = await prisma.rating.create({
    data: {
      bookingId: input.bookingId,
      clientId,
      driverId: booking.driverId,
      stars: Math.min(5, Math.max(1, input.stars)),
      comment: input.comment || null,
    },
  });

  revalidatePath("/account");
  return rating;
}

/**
 * Get driver's average rating.
 */
export async function getDriverRating(driverId: string) {
  const result = await prisma.rating.aggregate({
    where: { driverId },
    _avg: { stars: true },
    _count: true,
  });

  return {
    average: result._avg.stars ? Math.round(result._avg.stars * 10) / 10 : null,
    count: result._count,
  };
}
