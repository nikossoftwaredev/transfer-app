import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  // Protect with a secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ─── Vehicle Classes ─────────────────────────────────────────
    const vehicleClasses = [
      { name: "Mercedes E Class", tags: ["Business Class"], capacity: 3, description: "BMW 5 Series, Cadillac XTS or similar", sortOrder: 1 },
      { name: "Mercedes S Class", tags: ["Business Class", "VIP", "Premium"], capacity: 3, description: "BMW 7, Audi A8, Cadillac Escalade or similar", sortOrder: 2 },
      { name: "Mercedes Vito", tags: ["Family Friendly", "Group Travel"], capacity: 7, description: "Ford Custom, Chevrolet Suburban or similar", sortOrder: 3 },
      { name: "Mercedes V Class", tags: ["Family Friendly", "Group Travel", "Premium"], capacity: 6, description: "Cadillac Escalade or similar", sortOrder: 4 },
      { name: "Mercedes Sprinter", tags: ["Group Travel", "Large Groups"], capacity: 16, description: "Ford Transit or similar", sortOrder: 5 },
    ];

    const createdClasses = [];
    for (const vc of vehicleClasses) {
      const created = await prisma.vehicleClass.upsert({
        where: { name: vc.name },
        update: vc,
        create: vc,
      });
      createdClasses.push(created);
    }

    // ─── Cancellation Policy ─────────────────────────────────────
    const existingPolicy = await prisma.cancellationPolicy.findFirst();
    if (!existingPolicy) {
      await prisma.cancellationPolicy.create({
        data: { freeWindowMinutes: 120, lateCancelFeePercent: 0.5, noShowFeePercent: 1.0 },
      });
    }

    // ─── Super Admin ─────────────────────────────────────────────
    const adminEmail = "admin@transfergr.com";
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: "superadmin" },
      create: { email: adminEmail, name: "Super Admin", role: "superadmin" },
    });

    // ─── Demo Organization ───────────────────────────────────────
    const org = await prisma.organization.upsert({
      where: { slug: "demo-transfers" },
      update: {},
      create: {
        name: "Demo Transfers",
        slug: "demo-transfers",
        status: "verified",
        commissionRate: 0.15,
        contactEmail: "info@demotransfers.gr",
        contactPhone: "+306900000000",
      },
    });

    // ─── Pricing Rules ───────────────────────────────────────────
    const pricingData = [
      { className: "Mercedes E Class", ratePerKm: 1.2, minimumFare: 35, nightMultiplier: 1.5, airportFixedRate: 55, extraStopFee: 5 },
      { className: "Mercedes S Class", ratePerKm: 1.8, minimumFare: 55, nightMultiplier: 1.5, airportFixedRate: 85, extraStopFee: 8 },
      { className: "Mercedes Vito", ratePerKm: 1.5, minimumFare: 45, nightMultiplier: 1.5, airportFixedRate: 65, extraStopFee: 5 },
      { className: "Mercedes V Class", ratePerKm: 1.7, minimumFare: 50, nightMultiplier: 1.5, airportFixedRate: 75, extraStopFee: 7 },
      { className: "Mercedes Sprinter", ratePerKm: 2.0, minimumFare: 65, nightMultiplier: 1.5, airportFixedRate: 95, extraStopFee: 10 },
    ];

    for (const p of pricingData) {
      const vc = createdClasses.find((c) => c.name === p.className);
      if (!vc) continue;
      await prisma.pricingRule.upsert({
        where: { orgId_vehicleClassId: { orgId: org.id, vehicleClassId: vc.id } },
        update: { ratePerKm: p.ratePerKm, minimumFare: p.minimumFare, nightMultiplier: p.nightMultiplier, airportFixedRate: p.airportFixedRate, extraStopFee: p.extraStopFee },
        create: { orgId: org.id, vehicleClassId: vc.id, ratePerKm: p.ratePerKm, minimumFare: p.minimumFare, nightMultiplier: p.nightMultiplier, airportFixedRate: p.airportFixedRate, extraStopFee: p.extraStopFee },
      });
    }

    // ─── Demo Driver ─────────────────────────────────────────────
    const driverPin = await hash("1234", 10);
    const driverUser = await prisma.user.upsert({
      where: { phone: "+306911111111" },
      update: { pinHash: driverPin },
      create: { name: "Demo Driver", phone: "+306911111111", pinHash: driverPin, role: "driver", orgId: org.id },
    });

    const eClassId = createdClasses.find((c) => c.name === "Mercedes E Class")?.id;
    if (eClassId) {
      // Create a Vehicle record for the demo driver
      const vehicle = await prisma.vehicle.upsert({
        where: { plateNumber: "AAA-1234" },
        update: {},
        create: {
          orgId: org.id,
          vehicleClassId: eClassId,
          plateNumber: "AAA-1234",
          year: 2023,
          status: "available",
        },
      });

      await prisma.driver.upsert({
        where: { userId: driverUser.id },
        update: { vehicleId: vehicle.id, vehicleClassId: eClassId },
        create: {
          userId: driverUser.id,
          orgId: org.id,
          vehicleId: vehicle.id,
          vehicleClassId: eClassId,
          licensePlate: "AAA-1234",
          vehicleMake: "Mercedes-Benz",
          vehicleModel: "E 220d",
          vehicleYear: 2023,
          vehicleColor: "Black",
          isOnline: true,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
