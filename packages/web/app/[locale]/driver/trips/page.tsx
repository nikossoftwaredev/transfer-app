import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { DriverTrips } from "@/components/driver/driver-trips";
import {
  getAvailableRides,
  getDriverTrips,
  getCompletedTripsHistory,
} from "@/server_actions/trips";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function DriverTripsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("driver");

  const [availableRides, myTrips, completedHistory] = await Promise.all([
    getAvailableRides(),
    getDriverTrips(),
    getCompletedTripsHistory(),
  ]);

  // Compute weekly totals from completed history
  const weeklyTripCount = completedHistory.length;
  const weeklyEarnings = completedHistory.reduce((sum, t) => {
    return sum + (t.actualFare ?? t.acceptedFare ?? 0);
  }, 0);
  const ratingsThisWeek = completedHistory
    .filter((t) => t.rating)
    .map((t) => t.rating!.stars);
  const weeklyAvgRating =
    ratingsThisWeek.length > 0
      ? ratingsThisWeek.reduce((a, b) => a + b, 0) / ratingsThisWeek.length
      : 0;

  // Group completed history by date string (YYYY-MM-DD)
  const groupedByDate: Record<
    string,
    typeof completedHistory
  > = {};
  for (const trip of completedHistory) {
    const dateKey = new Date(trip.scheduledAt).toISOString().split("T")[0];
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
    groupedByDate[dateKey].push(trip);
  }

  // Sort date keys descending
  const sortedDateKeys = Object.keys(groupedByDate).sort(
    (a, b) => b.localeCompare(a)
  );

  const completedByDate = sortedDateKeys.map((dateKey) => ({
    dateKey,
    trips: groupedByDate[dateKey],
  }));

  return (
    <DriverTrips
      availableRides={availableRides}
      myTrips={myTrips}
      completedByDate={completedByDate}
      weeklyTotals={{
        tripCount: weeklyTripCount,
        earnings: weeklyEarnings,
        avgRating: weeklyAvgRating,
      }}
    />
  );
}
