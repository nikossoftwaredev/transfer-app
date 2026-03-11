import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrganizationsList } from "@/components/admin/organizations-list";
import type { BasePageProps } from "@/types/page-props";

export default async function OrganizationsPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, vehicles: true } } },
  });

  return <OrganizationsList organizations={organizations} />;
}
