"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getOrgVehicles(orgId: string) {
  return prisma.vehicle.findMany({
    where: { orgId },
    include: { vehicleClass: true, driver: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createVehicle(data: {
  vehicleClassId: string;
  plateNumber: string;
  year?: number;
  photoUrl?: string;
}) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  const vehicle = await prisma.vehicle.create({
    data: { ...data, orgId },
  });
  revalidatePath("/org/fleet");
  return vehicle;
}

export async function updateVehicle(
  id: string,
  data: {
    vehicleClassId?: string;
    plateNumber?: string;
    year?: number;
    photoUrl?: string;
    status?: string;
  }
) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle || vehicle.orgId !== orgId) throw new Error("Vehicle not found");

  const updated = await prisma.vehicle.update({ where: { id }, data });
  revalidatePath("/org/fleet");
  return updated;
}

export async function deleteVehicle(id: string) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;

  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle || vehicle.orgId !== orgId) throw new Error("Vehicle not found");

  await prisma.vehicle.delete({ where: { id } });
  revalidatePath("/org/fleet");
}
