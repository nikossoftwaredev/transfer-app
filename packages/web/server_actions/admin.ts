"use server";

import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

/**
 * Get cancellation policy (singleton).
 */
export async function getCancellationPolicy() {
  return prisma.cancellationPolicy.findFirst();
}

/**
 * Update cancellation policy.
 */
export async function updateCancellationPolicy(data: {
  freeWindowMinutes: number;
  lateCancelFeePercent: number;
  noShowFeePercent: number;
}) {
  await requireRole("superadmin");

  const existing = await prisma.cancellationPolicy.findFirst();
  if (existing) {
    await prisma.cancellationPolicy.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await prisma.cancellationPolicy.create({ data });
  }

  revalidatePath("/admin/cancellation-policy");
}

/**
 * Get audit log entries.
 */
export async function getAuditLog(options?: {
  page?: number;
  perPage?: number;
  userId?: string;
  action?: string;
  entity?: string;
}) {
  await requireRole("superadmin");

  const page = options?.page || 1;
  const perPage = options?.perPage || 50;

  const where: Record<string, unknown> = {};
  if (options?.userId) where.userId = options.userId;
  if (options?.action) where.action = options.action;
  if (options?.entity) where.entity = options.entity;

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { entries, total, pages: Math.ceil(total / perPage) };
}

/**
 * Create an audit log entry.
 */
export async function createAuditEntry(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, unknown>
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      metadata: details ? (details as Prisma.InputJsonValue) : undefined,
    },
  });
}

/**
 * Update commission rate for an organization.
 */
export async function updateOrgCommissionRate(
  orgId: string,
  commissionRate: number
) {
  await requireRole("superadmin");

  await prisma.organization.update({
    where: { id: orgId },
    data: { commissionRate },
  });

  revalidatePath("/admin/commission");
  revalidatePath("/admin/organizations");
}
