import { setRequestLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { getMyBookings } from "@/server_actions/bookings";
import { TripHistory } from "@/components/account/trip-history";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSession();

  const bookings = await getMyBookings();

  return <TripHistory bookings={bookings} />;
}
