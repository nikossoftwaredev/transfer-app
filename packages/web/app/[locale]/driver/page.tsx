import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DriverDashboard } from "@/components/driver/driver-dashboard";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DriverPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("driver");
  const driverId = session.user.driverId;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const driver = await prisma.driver.findUnique({
    where: { id: driverId! },
    include: {
      user: { select: { name: true, phone: true, image: true } },
      vehicle: {
        include: { vehicleClass: { select: { id: true, name: true } } },
      },
    },
  });

  // Completed trips today
  const completedToday = await prisma.booking.findMany({
    where: {
      driverId: driverId!,
      status: "completed",
      updatedAt: { gte: todayStart },
    },
    select: {
      actualFare: true,
      acceptedFare: true,
    },
  });

  const completedCount = completedToday.length;
  const todayEarnings = completedToday.reduce(
    (sum, b) => sum + (b.actualFare ?? b.acceptedFare ?? 0),
    0
  );

  // Average rating
  const ratingAgg = await prisma.rating.aggregate({
    where: { driverId: driverId! },
    _avg: { stars: true },
    _count: { stars: true },
  });

  // Hours online today (from trips that started today)
  const tripsToday = await prisma.trip.findMany({
    where: {
      driverId: driverId!,
      startedAt: { gte: todayStart },
    },
    select: { startedAt: true, endedAt: true },
  });

  let hoursOnline = 0;
  const now = new Date();
  for (const trip of tripsToday) {
    const end = trip.endedAt ?? now;
    hoursOnline += (end.getTime() - trip.startedAt.getTime()) / 3600000;
  }

  // Upcoming transfers: pending bookings matching driver's vehicle class
  const vehicleClassId = driver?.vehicle?.vehicleClassId;
  const upcomingBookings = vehicleClassId
    ? await prisma.booking.findMany({
        where: {
          status: "pending",
          vehicleClassId,
          timeoutAt: { gt: new Date() },
        },
        include: {
          vehicleClass: { select: { name: true } },
          client: { select: { name: true } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 10,
      })
    : [];

  // Active bookings assigned to this driver
  const activeBookings = await prisma.booking.findMany({
    where: {
      driverId: driverId!,
      status: {
        in: [
          "driver_assigned",
          "driver_en_route",
          "waiting_at_pickup",
          "in_progress",
        ],
      },
    },
    include: {
      vehicleClass: { select: { name: true } },
      client: { select: { name: true, phone: true } },
      trip: true,
    },
    orderBy: { scheduledAt: "asc" },
  });

  return (
    <DriverDashboard
      driver={driver!}
      completedCount={completedCount}
      todayEarnings={todayEarnings}
      averageRating={ratingAgg._avg.stars}
      ratingCount={ratingAgg._count.stars}
      hoursOnline={Math.round(hoursOnline * 10) / 10}
      upcomingBookings={upcomingBookings}
      activeBookings={activeBookings}
    />
  );
}
