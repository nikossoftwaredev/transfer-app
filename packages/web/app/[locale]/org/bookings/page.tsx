import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { OrgBookings } from "@/components/org/org-bookings";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function OrgBookingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await requireRole("orgadmin");
  const orgId = session.user.orgId;
  if (!orgId) throw new Error("No organization");

  const bookings = await prisma.booking.findMany({
    where: { orgId },
    include: {
      vehicleClass: { select: { name: true } },
      client: { select: { name: true } },
      driver: {
        include: {
          user: { select: { name: true } },
          vehicle: { select: { plateNumber: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return <OrgBookings bookings={bookings} />;
}
