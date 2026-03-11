"use server";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function getOrgDrivers(orgId: string) {
  const session = await requireRole(["orgadmin", "superadmin"]);
  // Org admins can only see their own org's drivers
  if (session.user.role === "orgadmin" && session.user.orgId !== orgId) {
    throw new Error("Forbidden");
  }

  return prisma.user.findMany({
    where: { orgId, role: "driver" },
    include: {
      driver: {
        include: { vehicle: { include: { vehicleClass: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function inviteDriver(data: {
  name: string;
  phone: string;
  licenseNo: string;
}) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  // Check org is verified
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org || org.status !== "verified") {
    throw new Error("Organization must be verified to invite drivers");
  }

  // Check phone not already taken
  const existing = await prisma.user.findUnique({
    where: { phone: data.phone },
  });
  if (existing) throw new Error("Phone number already registered");

  // Create user + driver in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: data.name,
        phone: data.phone,
        role: "driver",
        orgId,
      },
    });
    await tx.driver.create({
      data: {
        userId: newUser.id,
        licenseNo: data.licenseNo,
        inviteStatus: "pending",
      },
    });
    return newUser;
  });

  // TODO: Send SMS invite via Twilio (Task 7.2)
  revalidatePath("/org/drivers");
  return user;
}

export async function acceptDriverInvite(data: {
  phone: string;
  pin: string;
}) {
  // Find the driver user by phone
  const user = await prisma.user.findUnique({
    where: { phone: data.phone },
    include: { driver: true },
  });

  if (!user || !user.driver || user.driver.inviteStatus !== "pending") {
    throw new Error("Invalid invite");
  }

  // Hash PIN and update
  const pinHash = await hash(data.pin, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { pinHash },
    }),
    prisma.driver.update({
      where: { id: user.driver.id },
      data: { inviteStatus: "accepted" },
    }),
  ]);

  return { success: true };
}

export async function removeDriver(driverId: string) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true },
  });

  if (!driver || driver.user.orgId !== orgId) {
    throw new Error("Driver not found");
  }

  // Remove driver record (keep user record)
  await prisma.$transaction([
    prisma.driver.delete({ where: { id: driverId } }),
    prisma.user.update({
      where: { id: driver.userId },
      data: { role: "client", orgId: null },
    }),
  ]);

  revalidatePath("/org/drivers");
}

export async function assignVehicleToDriver(
  driverId: string,
  vehicleId: string | null
) {
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { user: true },
  });

  if (!driver || driver.user.orgId !== orgId) {
    throw new Error("Driver not found");
  }

  await prisma.driver.update({
    where: { id: driverId },
    data: { vehicleId },
  });

  revalidatePath("/org/drivers");
}
