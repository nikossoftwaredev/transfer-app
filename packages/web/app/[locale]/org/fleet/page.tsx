import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { FleetManagement } from "@/components/org/fleet-management";
import type { BasePageProps } from "@/types/page-props";

export default async function FleetPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId!;

  const [vehicles, vehicleClasses] = await Promise.all([
    prisma.vehicle.findMany({
      where: { orgId },
      include: { vehicleClass: true, driver: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicleClass.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <FleetManagement vehicles={vehicles} vehicleClasses={vehicleClasses} />
  );
}
