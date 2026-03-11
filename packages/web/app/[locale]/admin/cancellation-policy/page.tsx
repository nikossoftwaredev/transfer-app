import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { getCancellationPolicy } from "@/server_actions/admin";
import { CancellationPolicyForm } from "@/components/admin/cancellation-policy-form";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function CancellationPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const policy = await getCancellationPolicy();

  return (
    <CancellationPolicyForm
      policy={
        policy || {
          freeWindowMinutes: 120,
          lateCancelFeePercent: 50,
          noShowFeePercent: 100,
        }
      }
    />
  );
}
