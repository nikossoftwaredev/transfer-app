import { setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth/session";
import { getAuditLog } from "@/server_actions/admin";
import { AuditLogList } from "@/components/admin/audit-log-list";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function AuditLogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { page: pageStr } = await searchParams;
  setRequestLocale(locale);
  await requireRole("superadmin");

  const page = parseInt(pageStr || "1");
  const result = await getAuditLog({ page });

  return <AuditLogList entries={result.entries} total={result.total} pages={result.pages} currentPage={page} />;
}
