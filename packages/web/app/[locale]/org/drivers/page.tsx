import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DriversManagement } from "@/components/org/drivers-management";
import type { BasePageProps } from "@/types/page-props";

export default async function DriversPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId!;

  const [drivers, vehicles] = await Promise.all([
    prisma.user.findMany({
      where: { orgId, role: "driver" },
      include: {
        driver: {
          include: { vehicle: { include: { vehicleClass: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({
      where: { orgId },
      include: { vehicleClass: true },
    }),
  ]);

  return <DriversManagement drivers={drivers} vehicles={vehicles} />;
}
