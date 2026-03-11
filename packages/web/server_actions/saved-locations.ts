"use server";

import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getSavedLocations() {
  const session = await requireSession();
  return prisma.savedLocation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSavedLocation(input: {
  label: string;
  address: string;
  lat: number;
  lng: number;
}) {
  const session = await requireSession();

  const location = await prisma.savedLocation.create({
    data: {
      userId: session.user.id,
      label: input.label,
      address: input.address,
      lat: input.lat,
      lng: input.lng,
    },
  });

  revalidatePath("/account/locations");
  return location;
}

export async function deleteSavedLocation(id: string) {
  const session = await requireSession();

  await prisma.savedLocation.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/account/locations");
}
