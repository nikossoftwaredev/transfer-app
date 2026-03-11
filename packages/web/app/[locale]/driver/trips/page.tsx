import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { DriverTrips } from "@/components/driver/driver-trips";
import { getAvailableRides, getDriverTrips } from "@/server_actions/trips";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DriverTripsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("driver");

  const [availableRides, myTrips] = await Promise.all([
    getAvailableRides(),
    getDriverTrips(),
  ]);

  return (
    <DriverTrips availableRides={availableRides} myTrips={myTrips} />
  );
}
