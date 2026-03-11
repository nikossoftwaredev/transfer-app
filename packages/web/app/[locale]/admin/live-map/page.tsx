import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { LiveMap } from "@/components/maps/live-map";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AdminLiveMapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Map</h1>
        <p className="text-muted-foreground">
          All active drivers across all organizations.
        </p>
      </div>
      <LiveMap variant="admin" className="h-[calc(100vh-200px)] w-full rounded-lg" />
    </div>
  );
}
