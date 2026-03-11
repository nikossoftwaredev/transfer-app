import { setRequestLocale } from "next-intl/server";
import { DriverSidebar } from "@/components/driver/driver-sidebar";

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function DriverLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen">
      <DriverSidebar />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
