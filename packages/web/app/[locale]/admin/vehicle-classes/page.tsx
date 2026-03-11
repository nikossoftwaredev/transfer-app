import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { VehicleClassesList } from "@/components/admin/vehicle-classes-list";
import type { BasePageProps } from "@/types/page-props";

export default async function VehicleClassesPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const vehicleClasses = await prisma.vehicleClass.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { vehicles: true, bookings: true } } },
  });

  return <VehicleClassesList vehicleClasses={vehicleClasses} />;
}
