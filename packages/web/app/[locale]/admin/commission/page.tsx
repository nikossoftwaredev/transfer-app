import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { getMonthlyCommissionReport } from "@/lib/pricing/commission";
import { CommissionReport } from "@/components/admin/commission-report";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CommissionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const now = new Date();
  const report = await getMonthlyCommissionReport(
    now.getFullYear(),
    now.getMonth() + 1
  );

  return (
    <CommissionReport
      report={report}
      year={now.getFullYear()}
      month={now.getMonth() + 1}
    />
  );
}
