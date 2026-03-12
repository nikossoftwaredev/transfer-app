import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrgDashboard } from "@/components/org/org-dashboard";
import type { BasePageProps } from "@/types/page-props";

export default async function OrgDashboardPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const activeStatuses = [
    "pending",
    "driver_assigned",
    "driver_en_route",
    "waiting_at_pickup",
    "in_progress",
  ];

  // Fetch all data in parallel
  const [
    activeBookings,
    onlineDrivers,
    totalDrivers,
    revenueResult,
    ratingResult,
    upcomingBookings,
  ] = await Promise.all([
    // Active bookings count
    prisma.booking.count({
      where: {
        orgId,
        status: { in: activeStatuses },
      },
    }),

    // Online drivers count
    prisma.driver.count({
      where: {
        orgId,
        isOnline: true,
      },
    }),

    // Total drivers count
    prisma.driver.count({
      where: { orgId },
    }),

    // Today's revenue (sum of actualFare for completed bookings today)
    prisma.booking.aggregate({
      where: {
        orgId,
        status: "completed",
        scheduledAt: { gte: startOfDay },
        actualFare: { not: null },
      },
      _sum: { actualFare: true },
    }),

    // Average rating for this org's drivers
    prisma.rating.aggregate({
      where: {
        driver: { orgId },
      },
      _avg: { stars: true },
    }),

    // Upcoming bookings in the next 4 hours
    prisma.booking.findMany({
      where: {
        orgId,
        scheduledAt: {
          gte: now,
          lte: fourHoursFromNow,
        },
        status: { in: activeStatuses },
      },
      include: {
        vehicleClass: { select: { name: true } },
        client: { select: { name: true } },
        driver: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
  ]);

  const stats = {
    activeBookings,
    onlineDrivers,
    totalDrivers,
    revenueToday: revenueResult._sum.actualFare ?? 0,
    avgRating: ratingResult._avg.stars ?? null,
  };

  return (
    <OrgDashboard
      stats={stats}
      upcomingBookings={JSON.parse(JSON.stringify(upcomingBookings))}
    />
  );
}
