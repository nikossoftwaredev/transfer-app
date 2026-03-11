"use server";

import { prisma } from "@/lib/db";
import { requireRole, requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getOrganizations() {
  await requireRole("superadmin");
  return prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, vehicles: true } } },
  });
}

export async function getOrganization(id: string) {
  await requireRole("superadmin");
  return prisma.organization.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, name: true, role: true, email: true, phone: true } },
      vehicles: { include: { vehicleClass: true } },
      pricingRules: { include: { vehicleClass: true } },
      _count: { select: { bookings: true } },
    },
  });
}

export async function createOrganization(data: {
  name: string;
  contactEmail: string;
}) {
  // Anyone can submit an org application (creates as pending)
  await requireSession();
  const org = await prisma.organization.create({ data });
  revalidatePath("/admin/organizations");
  return org;
}

export async function updateOrganizationStatus(
  id: string,
  status: "verified" | "suspended"
) {
  await requireRole("superadmin");
  const org = await prisma.organization.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${id}`);
  return org;
}

export async function updateOrganization(
  id: string,
  data: { name?: string; contactEmail?: string; commissionRate?: number }
) {
  await requireRole("superadmin");
  const org = await prisma.organization.update({ where: { id }, data });
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${id}`);
  return org;
}

export async function deleteOrganization(id: string) {
  await requireRole("superadmin");
  await prisma.organization.delete({ where: { id } });
  revalidatePath("/admin/organizations");
}
