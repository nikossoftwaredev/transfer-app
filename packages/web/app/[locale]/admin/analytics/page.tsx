import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { AdminAnalytics } from "@/components/admin/admin-analytics";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const [
    tripsToday,
    tripsWeek,
    tripsMonth,
    activeDrivers,
    totalRevenue,
    cancelledCount,
    topOrgs,
  ] = await Promise.all([
    prisma.booking.count({
      where: { status: "completed", updatedAt: { gte: todayStart } },
    }),
    prisma.booking.count({
      where: { status: "completed", updatedAt: { gte: weekStart } },
    }),
    prisma.booking.count({
      where: { status: "completed", updatedAt: { gte: monthStart } },
    }),
    prisma.driver.count({ where: { availability: "online" } }),
    prisma.booking.aggregate({
      where: { status: "completed", updatedAt: { gte: monthStart } },
      _sum: { actualFare: true },
    }),
    prisma.booking.count({
      where: { status: "cancelled", updatedAt: { gte: monthStart } },
    }),
    prisma.organization.findMany({
      where: { status: "verified" },
      select: {
        id: true,
        name: true,
        commissionRate: true,
        _count: {
          select: {
            bookings: { where: { status: "completed", updatedAt: { gte: monthStart } } },
          },
        },
      },
      orderBy: { bookings: { _count: "desc" } },
      take: 10,
    }),
  ]);

  return (
    <AdminAnalytics
      tripsToday={tripsToday}
      tripsWeek={tripsWeek}
      tripsMonth={tripsMonth}
      activeDrivers={activeDrivers}
      totalRevenue={totalRevenue._sum.actualFare || 0}
      cancelledCount={cancelledCount}
      topOrgs={topOrgs.map((o) => ({
        id: o.id,
        name: o.name,
        tripCount: o._count.bookings,
        commissionRate: o.commissionRate,
      }))}
    />
  );
}
