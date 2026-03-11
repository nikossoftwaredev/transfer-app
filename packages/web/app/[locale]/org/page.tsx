import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import type { BasePageProps } from "@/types/page-props";

export default async function OrgDashboard({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");

  return (
    <div>
      <h1 className="text-2xl font-bold">Organization Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Welcome back. Manage your fleet, drivers, and pricing from here.
      </p>
    </div>
  );
}
