import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DriverProfile } from "@/components/driver/driver-profile";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DriverProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("driver");
  const driverId = session.user.driverId;

  const driver = await prisma.driver.findUnique({
    where: { id: driverId! },
    include: {
      user: {
        select: {
          name: true,
          phone: true,
          image: true,
          org: { select: { name: true } },
        },
      },
      vehicle: {
        include: { vehicleClass: { select: { name: true } } },
      },
    },
  });

  if (!driver) throw new Error("Driver not found");

  return <DriverProfile driver={driver} />;
}
