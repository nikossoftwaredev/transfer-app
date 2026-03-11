import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DriverDashboard } from "@/components/driver/driver-dashboard";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DriverPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("driver");
  const driverId = session.user.driverId;

  const driver = await prisma.driver.findUnique({
    where: { id: driverId! },
    include: {
      user: { select: { name: true, phone: true, image: true } },
      vehicle: {
        include: { vehicleClass: { select: { name: true } } },
      },
    },
  });

  const activeTrips = await prisma.booking.count({
    where: {
      driverId: driverId!,
      status: { in: ["driver_assigned", "driver_en_route", "waiting_at_pickup", "in_progress"] },
    },
  });

  const completedToday = await prisma.booking.count({
    where: {
      driverId: driverId!,
      status: "completed",
      updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  return (
    <DriverDashboard
      driver={driver!}
      activeTrips={activeTrips}
      completedToday={completedToday}
    />
  );
}
