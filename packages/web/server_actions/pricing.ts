"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getOrgPricingRules(orgId: string) {
  return prisma.pricingRule.findMany({
    where: { orgId },
    include: { vehicleClass: true },
    orderBy: { vehicleClass: { sortOrder: "asc" } },
  });
}

export async function upsertPricingRule(data: {
  vehicleClassId: string;
  minimumFare: number;
  ratePerKm: number;
  nightMultiplier?: number;
  airportFixedRate?: number | null;
  freeWaitingMinutes?: number;
  waitingRatePerMin?: number;
  extraStopFee?: number;
}) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  const rule = await prisma.pricingRule.upsert({
    where: {
      orgId_vehicleClassId: {
        orgId,
        vehicleClassId: data.vehicleClassId,
      },
    },
    update: data,
    create: { ...data, orgId },
  });

  revalidatePath("/org/pricing");
  return rule;
}

export async function deletePricingRule(vehicleClassId: string) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  await prisma.pricingRule.delete({
    where: {
      orgId_vehicleClassId: { orgId, vehicleClassId },
    },
  });
  revalidatePath("/org/pricing");
}
