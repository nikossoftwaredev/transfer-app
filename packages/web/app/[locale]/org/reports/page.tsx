import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrgReports } from "@/components/org/org-reports";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OrgReportsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [tripsToday, tripsMonth, revenueMonth, driverPerformance] =
    await Promise.all([
      prisma.booking.count({
        where: { orgId, status: "completed", updatedAt: { gte: todayStart } },
      }),
      prisma.booking.count({
        where: { orgId, status: "completed", updatedAt: { gte: monthStart } },
      }),
      prisma.booking.aggregate({
        where: { orgId, status: "completed", updatedAt: { gte: monthStart } },
        _sum: { actualFare: true },
      }),
      prisma.driver.findMany({
        where: { user: { orgId } },
        include: {
          user: { select: { name: true } },
          _count: {
            select: {
              bookings: {
                where: { status: "completed", updatedAt: { gte: monthStart } },
              },
            },
          },
          ratings: {
            where: { createdAt: { gte: monthStart } },
            select: { stars: true },
          },
        },
      }),
    ]);

  return (
    <OrgReports
      tripsToday={tripsToday}
      tripsMonth={tripsMonth}
      revenueMonth={revenueMonth._sum.actualFare || 0}
      drivers={driverPerformance.map((d) => ({
        name: d.user.name,
        tripCount: d._count.bookings,
        avgRating:
          d.ratings.length > 0
            ? Math.round(
                (d.ratings.reduce((s, r) => s + r.stars, 0) /
                  d.ratings.length) *
                  10
              ) / 10
            : null,
      }))}
    />
  );
}
