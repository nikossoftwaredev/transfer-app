"use server";

import { prisma } from "@/lib/db";

/**
 * Calculate commission for a completed trip.
 */
export function calculateCommission(
  actualFare: number,
  commissionRate: number
): number {
  return Math.round(actualFare * commissionRate * 100) / 100;
}

/**
 * Get monthly revenue and commission report per organization.
 */
export async function getMonthlyCommissionReport(
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const orgs = await prisma.organization.findMany({
    where: { status: "verified" },
    select: {
      id: true,
      name: true,
      commissionRate: true,
      bookings: {
        where: {
          status: "completed",
          updatedAt: { gte: startDate, lt: endDate },
        },
        select: {
          actualFare: true,
        },
      },
    },
  });

  return orgs.map((org) => {
    const totalRevenue = org.bookings.reduce(
      (sum, b) => sum + (b.actualFare || 0),
      0
    );
    const commission = calculateCommission(totalRevenue, org.commissionRate);
    const tripCount = org.bookings.length;

    return {
      orgId: org.id,
      orgName: org.name,
      commissionRate: org.commissionRate,
      tripCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      commission,
      netRevenue: Math.round((totalRevenue - commission) * 100) / 100,
    };
  });
}

/**
 * Export commission report as CSV string.
 */
export async function exportCommissionCSV(year: number, month: number) {
  const report = await getMonthlyCommissionReport(year, month);
  const header =
    "Organization,Trips,Revenue (€),Commission Rate,Commission (€),Net Revenue (€)";
  const rows = report.map(
    (r) =>
      `"${r.orgName}",${r.tripCount},${r.totalRevenue},${(r.commissionRate * 100).toFixed(0)}%,${r.commission},${r.netRevenue}`
  );
  return [header, ...rows].join("\n");
}
