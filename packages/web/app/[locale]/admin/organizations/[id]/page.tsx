import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { OrganizationDetail } from "@/components/admin/organization-detail";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

export default async function OrganizationDetailPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          role: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      },
      vehicles: { include: { vehicleClass: true } },
      pricingRules: { include: { vehicleClass: true } },
      _count: { select: { bookings: true } },
    },
  });

  if (!org) notFound();

  return <OrganizationDetail org={org} />;
}
