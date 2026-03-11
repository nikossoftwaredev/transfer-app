import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PricingManagement } from "@/components/org/pricing-management";
import type { BasePageProps } from "@/types/page-props";

export default async function PricingPage({ params }: BasePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId!;

  const [pricingRules, vehicleClasses] = await Promise.all([
    prisma.pricingRule.findMany({
      where: { orgId },
      include: { vehicleClass: true },
      orderBy: { vehicleClass: { sortOrder: "asc" } },
    }),
    prisma.vehicleClass.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <PricingManagement
      pricingRules={pricingRules}
      vehicleClasses={vehicleClasses}
    />
  );
}
