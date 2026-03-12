import { getServerSession } from "next-auth";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { DriverLoginForm } from "@/components/auth/driver-login-form";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "@/lib/i18n/navigation";

interface Props {
  params: Promise<{ locale: string }>;
}

const DriverLoginPage = async ({ params }: Props) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getServerSession(authOptions);
  if (session?.user?.role === "driver") {
    redirect({ href: "/driver", locale });
  }

  const t = await getTranslations("Auth.driverLogin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <DriverLoginForm
        translations={{
          title: t("title"),
          subtitle: t("subtitle"),
          phoneLabel: t("phoneLabel"),
          phonePlaceholder: t("phonePlaceholder"),
          pinLabel: t("pinLabel"),
          pinPlaceholder: t("pinPlaceholder"),
          signInButton: t("signInButton"),
          backLink: t("backLink"),
          errorInvalid: t("errorInvalid"),
          errorGeneric: t("errorGeneric"),
        }}
      />
    </div>
  );
};

export default DriverLoginPage;
