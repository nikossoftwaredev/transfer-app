import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { OrgSidebar } from "@/components/org/org-sidebar";
import type { BaseLayoutProps } from "@/types/page-props";

export default async function OrgLayout({ params, children }: BaseLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("orgadmin");

  return (
    <div className="flex h-svh max-h-svh overflow-hidden">
      <OrgSidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
