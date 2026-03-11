import { setRequestLocale } from "next-intl/server";
import { requireSession } from "@/lib/auth/session";
import { getSavedLocations } from "@/server_actions/saved-locations";
import { SavedLocationsList } from "@/components/account/saved-locations-list";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function SavedLocationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireSession();

  const locations = await getSavedLocations();

  return <SavedLocationsList locations={locations} />;
}
