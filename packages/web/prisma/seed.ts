import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── Vehicle Classes ─────────────────────────────────────────
  const vehicleClasses = [
    {
      name: "Mercedes E Class",
      tags: ["Business Class"],
      capacity: 3,
      description: "BMW 5 Series, Cadillac XTS or similar",
      sortOrder: 1,
    },
    {
      name: "Mercedes S Class",
      tags: ["Business Class", "VIP", "Premium"],
      capacity: 3,
      description: "BMW 7, Audi A8, Cadillac Escalade or similar",
      sortOrder: 2,
    },
    {
      name: "Mercedes Vito",
      tags: ["Family Friendly", "Group Travel"],
      capacity: 7,
      description: "Ford Custom, Chevrolet Suburban or similar",
      sortOrder: 3,
    },
    {
      name: "Mercedes V Class",
      tags: ["Family Friendly", "Group Travel", "Premium"],
      capacity: 6,
      description: "Cadillac Escalade or similar",
      sortOrder: 4,
    },
    {
      name: "Mercedes Sprinter",
      tags: ["Group Travel", "Large Groups"],
      capacity: 16,
      description: "Ford Transit or similar",
      sortOrder: 5,
    },
  ];

  for (const vc of vehicleClasses) {
    await prisma.vehicleClass.upsert({
      where: { name: vc.name },
      update: vc,
      create: vc,
    });
    console.log(`  Vehicle class: ${vc.name}`);
  }

  // ─── Default Cancellation Policy ─────────────────────────────
  const existingPolicy = await prisma.cancellationPolicy.findFirst();
  if (!existingPolicy) {
    await prisma.cancellationPolicy.create({
      data: {
        freeWindowMinutes: 120, // 2 hours before pickup
        lateCancelFeePercent: 0.5, // 50% of estimated fare
        noShowFeePercent: 1.0, // 100% of estimated fare
      },
    });
    console.log("  Cancellation policy: created default");
  } else {
    console.log("  Cancellation policy: already exists");
  }

  // ─── Super Admin User ────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || "admin@transfergr.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "superadmin" },
    create: {
      email: adminEmail,
      name: "Super Admin",
      role: "superadmin",
    },
  });
  console.log(`  Super admin: ${adminEmail}`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
