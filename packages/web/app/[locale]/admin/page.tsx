import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import type { BasePageProps } from "@/types/page-props";

export default async function AdminPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  // Start of today (UTC)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Run all queries in parallel
  const [
    orgTotal,
    orgPending,
    orgVerified,
    totalDrivers,
    onlineDrivers,
    bookingsToday,
    completedToday,
    revenueAgg,
    recentAudit,
    recentBookings,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "pending" } }),
    prisma.organization.count({ where: { status: "verified" } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { isOnline: true } }),
    prisma.booking.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: todayStart }, status: "completed" },
    }),
    prisma.booking.aggregate({
      _sum: { actualFare: true },
      where: { createdAt: { gte: todayStart }, status: "completed" },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { name: true } } },
    }),
  ]);

  const revenueToday = revenueAgg._sum.actualFare ?? 0;

  return (
    <AdminDashboard
      orgTotal={orgTotal}
      orgPending={orgPending}
      orgVerified={orgVerified}
      totalDrivers={totalDrivers}
      onlineDrivers={onlineDrivers}
      bookingsToday={bookingsToday}
      completedToday={completedToday}
      revenueToday={revenueToday}
      recentAudit={JSON.parse(JSON.stringify(recentAudit))}
      recentBookings={JSON.parse(JSON.stringify(recentBookings))}
    />
  );
}
