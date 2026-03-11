"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getVehicleClasses() {
  return prisma.vehicleClass.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createVehicleClass(data: {
  name: string;
  tags: string[];
  capacity: number;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}) {
  await requireRole("superadmin");
  const vc = await prisma.vehicleClass.create({ data });
  revalidatePath("/admin/vehicle-classes");
  return vc;
}

export async function updateVehicleClass(
  id: string,
  data: {
    name?: string;
    tags?: string[];
    capacity?: number;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    active?: boolean;
  }
) {
  await requireRole("superadmin");
  const vc = await prisma.vehicleClass.update({ where: { id }, data });
  revalidatePath("/admin/vehicle-classes");
  return vc;
}

export async function deleteVehicleClass(id: string) {
  await requireRole("superadmin");
  await prisma.vehicleClass.delete({ where: { id } });
  revalidatePath("/admin/vehicle-classes");
}
