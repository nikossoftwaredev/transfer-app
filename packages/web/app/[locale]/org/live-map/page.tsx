import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { LiveMap } from "@/components/maps/live-map";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OrgLiveMapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("orgadmin");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fleet Map</h1>
        <p className="text-muted-foreground">
          Live positions of your organization's drivers.
        </p>
      </div>
      <LiveMap variant="org" className="h-[calc(100vh-200px)] w-full rounded-lg" />
    </div>
  );
}
